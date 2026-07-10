import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useGameEngine } from '../../lib/arcade-core/useGameEngine.ts';
import { emit } from '../../lib/arcade-core/eventBus.ts';
import { GameOverlay } from './GameOverlay.tsx';
import { BashballGame } from './bashball/BashballGame.tsx';
import { Dashboard } from './bashball/Dashboard.tsx';
import { TrainingScreen } from './bashball/TrainingScreen.tsx';
import { StandingsView } from './bashball/StandingsView.tsx';
import { EliteShop } from './bashball/EliteShop.tsx';
import { useBashballSave } from './bashball/useBashballSave.ts';
import {
  LeagueTier, TeamState, Player, SkillCategory, LeagueStandings, StandingsEntry, TrainingSession, TeamRecord,
} from '../../engine/bashball/types.ts';
import { trainSkill, canTrain, shouldResetDaily, ALLOWED_SESSIONS_PER_DAY } from '../../engine/bashball/training.ts';
import { createInitialTeamState, generateRoster, generateRotation, applyTraining } from '../../engine/bashball/teamManager.ts';
import { createMulberry32 } from '../../engine/card/rng/mulberry32.ts';
import { getTeamNames } from '../../engine/bashball/league.ts';
import { getSpoonStore } from '../../lib/arcade-core/spoonStore.ts';
import { COLORS } from '../lib/arcade-core/theme.ts';

type Screen =
  | { phase: 'menu' }
  | { phase: 'dashboard' }
  | { phase: 'train' }
  | { phase: 'standings' }
  | { phase: 'game' }
  | { phase: 'shop' };

const SEASON_GAMES = 14;

function genProjectedRecord(seed: number): { wins: number; losses: number } {
  const rng = createMulberry32(seed);
  const w = Math.floor(rng() * 8 + 3);
  return { wins: w, losses: Math.max(0, SEASON_GAMES - w - Math.floor(rng() * 3)) };
}

export function BashballGameShell() {
  const engine = useGameEngine({ slug: 'bashball', title: 'Bashball', autoSave: true });
  const bashballSave = useBashballSave();

  const [screen, setScreen] = useState<Screen>({ phase: 'menu' });
  const [teamState, setTeamState] = useState<TeamState | null>(null);
  const [leagueStandings, setLeagueStandings] = useState<LeagueStandings | null>(null);
  const [gameOpponent, setGameOpponent] = useState('Cyclones');
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [recentTraining, setRecentTraining] = useState<{ playerName: string; skill: SkillCategory; gain: number }[]>([]);
  const [seasonComplete, setSeasonComplete] = useState(false);
  const initDone = useRef(false);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const spoonLevel = engine.state.spoons;

  useEffect(() => {
    if (!bashballSave.loading && bashballSave.save && !initDone.current) {
      initDone.current = true;
      const s = bashballSave.save;
      setTeamState(s.teamState);
      setLeagueStandings(s.leagueStandings);
      setGamesPlayed(s.gamesPlayed);
      if (s.gamesPlayed >= SEASON_GAMES) setSeasonComplete(true);
      setScreen({ phase: 'dashboard' });
    }
  }, [bashballSave.loading, bashballSave.save]);

  useEffect(() => {
    if (teamState && leagueStandings && initDone.current) {
      bashballSave.persist({ teamState, leagueStandings, gamesPlayed });
    }
  }, [teamState, leagueStandings, gamesPlayed, bashballSave]);

  function initTeam(name: string) {
    const seed = Date.now();
    const rng = createMulberry32(seed);
    const roster = generateRoster(name || 'Bash League', LeagueTier.Rookie, rng);
    const rotation = generateRotation(roster, rng);
    const ts = createInitialTeamState(name || 'Bash League', LeagueTier.Rookie);
    ts.roster = roster;
    ts.rotation = rotation;
    setTeamState(ts);
    const aiTeams = getTeamNames(LeagueTier.Rookie);
    const withoutUser = aiTeams.filter(t => t !== (name || 'Bash League'));
    const entries: StandingsEntry[] = withoutUser.map((t, i) => {
      const proj = genProjectedRecord(seed + i);
      return {
        teamName: t,
        teamId: t.toLowerCase().replace(/\s/g, ''),
        record: { wins: proj.wins, losses: proj.losses, ties: 0, runsScored: 0, runsAllowed: 0 },
        tier: LeagueTier.Rookie,
        gamesBack: 0,
      };
    });
    entries.unshift({
      teamName: name || 'Bash League',
      teamId: (name || 'Bash League').toLowerCase().replace(/\s/g, ''),
      record: { wins: 0, losses: 0, ties: 0, runsScored: 0, runsAllowed: 0 },
      tier: LeagueTier.Rookie,
      gamesBack: 0,
    });
    setLeagueStandings({ tier: LeagueTier.Rookie, season: 1, teams: entries });
    setGamesPlayed(0);
    setSeasonComplete(false);
    setRecentTraining([]);
    initDone.current = true;
    setScreen({ phase: 'dashboard' });
  }

  function getNextOpponent(): string {
    if (!leagueStandings || !teamState) return 'Cyclones';
    const ai = leagueStandings.teams.filter(t => t.teamName !== teamState.name);
    const idx = gamesPlayed % ai.length;
    return ai[idx]?.teamName || 'Cyclones';
  }

  function handlePlayGame() {
    if (seasonComplete) {
      startNewSeason();
      return;
    }
    const opp = getNextOpponent();
    setGameOpponent(opp);
    engine.start();
    setScreen({ phase: 'game' });
  }

  function startNewSeason() {
    if (!teamState) return;
    const newTier = teamState.tier;
    const seed = Date.now();
    const rng = createMulberry32(seed);
    const aiTeams = getTeamNames(newTier);
    const withoutUser = aiTeams.filter(t => t !== teamState.name);
    const entries: StandingsEntry[] = withoutUser.map((t, i) => {
      const proj = genProjectedRecord(seed + i);
      return {
        teamName: t, teamId: t.toLowerCase().replace(/\s/g, ''),
        record: { wins: proj.wins, losses: proj.losses, ties: 0, runsScored: 0, runsAllowed: 0 },
        tier: newTier, gamesBack: 0,
      };
    });
    entries.unshift({
      teamName: teamState.name,
      teamId: teamState.name.toLowerCase().replace(/\s/g, ''),
      record: { wins: 0, losses: 0, ties: 0, runsScored: 0, runsAllowed: 0 },
      tier: newTier, gamesBack: 0,
    });
    setLeagueStandings({ tier: newTier, season: (leagueStandings?.season ?? 0) + 1, teams: entries });
    setGamesPlayed(0);
    setSeasonComplete(false);
    setRecentTraining([]);
  }

  function handleGameResult(myScore: number, oppScore: number) {
    if (!teamState || !leagueStandings) return;
    const won = myScore > oppScore;
    const newRec = { ...teamState.record };
    newRec.runsScored += myScore;
    newRec.runsAllowed += oppScore;
    if (won) newRec.wins++;
    else newRec.losses++;

    const newTs = { ...teamState, record: newRec };
    setTeamState(newTs);

    const newGp = gamesPlayed + 1;
    setGamesPlayed(newGp);

    const newTeams = leagueStandings.teams.map(t => {
      if (t.teamName === teamState.name) return { ...t, record: newRec };
      return t;
    });
    newTeams.sort((a, b) => {
      if (b.record.wins !== a.record.wins) return b.record.wins - a.record.wins;
      const diffA = a.record.runsScored - a.record.runsAllowed;
      const diffB = b.record.runsScored - b.record.runsAllowed;
      return diffB - diffA;
    });
    const leaderWins = Math.max(0, ...newTeams.map(t => t.record.wins));
    const withGb = newTeams.map(t => ({ ...t, gamesBack: leaderWins - t.record.wins }));
    setLeagueStandings({ ...leagueStandings, teams: withGb });

    if (newGp >= SEASON_GAMES) setSeasonComplete(true);
  }

  function handleScoreChange(delta: number) {
    engine.addScore(delta);
    emit('p31:bashball:atbat', { delta });
  }

  function handleMoveMade() {
    emit('p31:bashball:atbat', {});
  }

  async function handleComplete() {
    await engine.complete();
    emit('p31:bashball:inningEnd', {});
  }

  function handleTrain(playerIndex: number, skill: SkillCategory) {
    if (!teamState) return;
    const player = teamState.roster[playerIndex];
    if (!player) return;

    let sessionsToday = teamState.sessionsToday;
    let lastDate = teamState.lastTrainingDate;
    if (shouldResetDaily(lastDate, today)) { sessionsToday = 0; lastDate = today; }

    const check = canTrain(player, skill, sessionsToday);
    if (!check.allowed) return;

    const outcome = trainSkill(player, skill, sessionsToday, teamState.eliteUnlocked);
    const updatedPlayer = applyTraining(player, outcome.stat, outcome.gain);
    const newRoster = [...teamState.roster];
    newRoster[playerIndex] = updatedPlayer;

    const session: TrainingSession = {
      playerId: player.id, playerName: player.name, skill, gain: outcome.gain, date: today,
    };

    setTeamState({
      ...teamState, roster: newRoster,
      sessionsToday: sessionsToday + 1, lastTrainingDate: lastDate,
      trainingSessions: [...teamState.trainingSessions, session],
    });
    setRecentTraining(prev => ([{ playerName: player.name, skill, gain: outcome.gain }] as const).concat(prev).slice(0, 5));
  }

  function handleElitePurchase(_itemName: string): boolean {
    if (spoonLevel < 5) return false;
    getSpoonStore().setLevel(spoonLevel - 5);
    return true;
  }

  function handleActivateTrial() {
    if (!teamState) return;
    setTeamState({ ...teamState, hasEliteTrial: true });
  }

  function handlePurchaseElite() {
    if (spoonLevel < 5 || !teamState) return;
    getSpoonStore().setLevel(spoonLevel - 5);
    setTeamState({ ...teamState, eliteUnlocked: true, hasEliteTrial: false });
  }

  function handleBackToDashboard() {
    engine.reset();
    setScreen({ phase: 'dashboard' });
  }

  const extraHud = screen.phase === 'game' ? (
    <div className="absolute top-32 left-1/2 -translate-x-1/2 z-10" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button onClick={handleBackToDashboard} style={{
        padding: '6px 14px', borderRadius: 8, border: '1px solid var(--p31-white-10)',
        background: 'var(--p31-white-4)', color: 'var(--p31-cloud-60)',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10, cursor: 'pointer',
      }}>
        ← DASHBOARD
      </button>
      <span style={{
        padding: '6px 14px', borderRadius: 8, background: 'var(--p31-rust-dim)',
        border: '1px solid var(--p31-rust-border)', color: 'var(--p31-rust)',
        fontFamily: "'Press Start 2P', cursive", fontSize: 9,
      }}>
        BASHBALL
      </span>
    </div>
  ) : null;

  const displayScore = teamState
    ? (teamState.record.wins * 100 - teamState.record.losses * 20)
    : engine.state.score;

  return (
    <GameOverlay
      gameId="bashball"
      gameTitle="Bashball"
      gameIcon="⚾"
      engineState={{ ...engine.state, score: displayScore }}
      extraHud={extraHud}
    >
      <div className="flex items-center justify-center min-h-screen pt-24 pb-24 px-4">
        {screen.phase === 'menu' && !bashballSave.save && (
          <TeamCreation onStart={initTeam} engineState={engine.state} />
        )}

        {screen.phase === 'menu' && bashballSave.save && bashballSave.loading === false && (
          <ResumeScreen
            teamName={bashballSave.save.teamState.name}
            record={bashballSave.save.teamState.record}
            gamesPlayed={bashballSave.save.gamesPlayed}
            onResume={() => {
              initDone.current = true;
              const s = bashballSave.save!;
              setTeamState(s.teamState);
              setLeagueStandings(s.leagueStandings);
              setGamesPlayed(s.gamesPlayed);
              if (s.gamesPlayed >= SEASON_GAMES) setSeasonComplete(true);
              setScreen({ phase: 'dashboard' });
            }}
            onNewGame={() => { bashballSave.clear(); initDone.current = false; }}
          />
        )}

        {screen.phase === 'dashboard' && teamState && leagueStandings && (
          <Dashboard
            teamState={teamState}
            nextGame={{ opponent: getNextOpponent(), isHome: gamesPlayed % 2 === 0 }}
            leagueStandings={leagueStandings}
            recentTrainingResults={recentTraining}
            onNavigate={(s) => {
              if (s === 'play') handlePlayGame();
              else if (s === 'train') setScreen({ phase: 'train' });
              else if (s === 'standings') setScreen({ phase: 'standings' });
              else if (s === 'shop') setScreen({ phase: 'shop' });
            }}
            seasonProgress={gamesPlayed}
            seasonTotal={SEASON_GAMES}
            seasonComplete={seasonComplete}
            tier={teamState.tier}
          />
        )}

        {screen.phase === 'train' && teamState && (
          <TrainingScreen
            roster={teamState.roster}
            sessionsToday={teamState.sessionsToday}
            maxSessions={ALLOWED_SESSIONS_PER_DAY}
            eliteUnlocked={teamState.eliteUnlocked || teamState.hasEliteTrial}
            onTrain={handleTrain}
            onBack={handleBackToDashboard}
          />
        )}

        {screen.phase === 'standings' && leagueStandings && teamState && (
          <StandingsView
            standings={leagueStandings}
            userTeamName={teamState.name}
            tier={teamState.tier}
            onBack={handleBackToDashboard}
          />
        )}

        {screen.phase === 'shop' && teamState && (
          <EliteShop
            spoons={spoonLevel}
            eliteUnlocked={teamState.eliteUnlocked}
            hasEliteTrial={teamState.hasEliteTrial}
            activeBoosts={[]}
            onPurchase={handleElitePurchase}
            onActivateTrial={handleActivateTrial}
            onUnlockElite={handlePurchaseElite}
            onBack={handleBackToDashboard}
          />
        )}

        {screen.phase === 'game' && teamState && (
          <BashballGame
            onScoreChange={handleScoreChange}
            onComplete={handleComplete}
            onMoveMade={handleMoveMade}
            spoonLevel={engine.state.spoons}
            playerTeam={teamState.roster}
            opponentName={gameOpponent}
            onGameResult={handleGameResult}
          />
        )}
      </div>
    </GameOverlay>
  );
}

function TeamCreation({ onStart, engineState }: { onStart: (name: string) => void; engineState: any }) {
  const [name, setName] = useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, maxWidth: 500, width: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⚾</div>
        <h1 style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 18, color: 'var(--p31-rust)', marginBottom: 12 }}>BASHBALL</h1>
        <p style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'var(--p31-cloud-50)', lineHeight: 1.8 }}>
          Markov chain baseball simulation<br />
          <span style={{ fontSize: 10, color: 'var(--p31-cloud-30)' }}>
            dedicated to Sebastian "Bash" — batter up, son 🧡
          </span>
        </p>
      </div>
      <div style={{ padding: '16px 24px', background: 'rgba(139,124,201,0.06)', border: '1px solid var(--p31-purple-dim)', borderRadius: 12, textAlign: 'center', width: '100%', maxWidth: 320 }}>
        <p style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--p31-cloud-40)', marginBottom: 12 }}>Name Your Team</p>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Bash League" maxLength={24}
          style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--p31-rust-border)', background: 'var(--p31-white-3)', color: 'var(--p31-cloud)', fontFamily: "'JetBrains Mono', monospace", fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }}
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onStart(name.trim()); }}
        />
      </div>
      <div style={{ padding: '12px 24px', background: 'rgba(139,124,201,0.06)', border: '1px solid var(--p31-purple-dim)', borderRadius: 12, textAlign: 'center' }}>
        <p style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--p31-cloud-40)', lineHeight: 1.8 }}>
          Spoons: {engineState.spoons}/12<br />
          Train your team. Climb the league. Win the World Series.
        </p>
      </div>
      <button onClick={() => { if (name.trim()) onStart(name.trim()); }} disabled={!name.trim()}
        style={{ padding: '16px 40px', borderRadius: 12, border: `2px solid ${name.trim() ? 'var(--p31-rust)' : 'var(--p31-white-10)'}`, background: name.trim() ? 'var(--p31-rust-dim)' : 'var(--p31-white-2)', color: name.trim() ? 'var(--p31-rust)' : 'var(--p31-cloud-20)', fontFamily: "'Press Start 2P', cursive", fontSize: 13, cursor: name.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
        onMouseEnter={e => { if (name.trim()) e.currentTarget.style.background = 'var(--p31-rust-border)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = name.trim() ? 'var(--p31-rust-dim)' : 'var(--p31-white-2)'; }}
      >
        ⚾ START SEASON
      </button>
    </div>
  );
}

function ResumeScreen({ teamName, record, gamesPlayed, onResume, onNewGame }:
  { teamName: string; record: TeamRecord; gamesPlayed: number; onResume: () => void; onNewGame: () => void }) {
  const pct = record.wins + record.losses > 0
    ? ((record.wins / (record.wins + record.losses)) * 100).toFixed(0) : '-';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, maxWidth: 400, width: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚾</div>
        <h1 style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 16, color: 'var(--p31-rust)', marginBottom: 8 }}>BASHBALL</h1>
        <p style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--p31-cloud-30)' }}>
          Save found
        </p>
      </div>
      <div style={{ padding: '16px 24px', background: 'var(--p31-white-2)', border: '1px solid var(--p31-white-6)', borderRadius: 12, textAlign: 'center', width: '100%' }}>
        <p style={{ fontSize: 16, fontFamily: "'Press Start 2P', cursive", color: 'var(--p31-cloud)', marginBottom: 8 }}>{teamName}</p>
        <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--p31-cloud-50)' }}>
          {record.wins}W - {record.losses}L — {pct}% — {gamesPlayed}/14 games
        </p>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onResume}
          style={{ padding: '14px 32px', borderRadius: 12, border: '2px solid var(--p31-rust)', background: 'var(--p31-rust-dim)', color: 'var(--p31-rust)', fontFamily: "'Press Start 2P', cursive", fontSize: 11, cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--p31-rust-border)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--p31-rust-dim)'; }}
        >
          RESUME
        </button>
        <button onClick={onNewGame}
          style={{ padding: '14px 24px', borderRadius: 12, border: '1px solid var(--p31-white-10)', background: 'transparent', color: 'var(--p31-cloud-40)', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, cursor: 'pointer' }}
        >
          NEW GAME
        </button>
      </div>
    </div>
  );
}


