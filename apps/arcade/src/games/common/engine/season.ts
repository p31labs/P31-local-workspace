import type { AITeam, Team } from '../types/Team.js';
import { TEAM_NAMES, TEAM_COLORS } from '../types/Team.js';

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Season {
  id: string;
  game: 'bashball' | 'gridiron' | 'strategy';
  playerTeamId: string;
  teams: AITeam[];
  schedule: GameSchedule[];
  standings: Standing[];
  currentWeek: number;
  maxWeeks: number;
  playoffBracket: PlayoffMatchup[] | null;
  champion: string | null;
  startedAt: string;
}

export interface GameSchedule {
  id: string;
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  result: GameResult | null;
}

export interface GameResult {
  homeScore: number;
  awayScore: number;
  winner: string;
  playerRuns?: number;
  playerHits?: number;
}

export interface Standing {
  teamId: string;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
}

export interface PlayoffMatchup {
  round: number;
  teamA: string;
  teamB: string;
  winner: string | null;
}

const MAX_GAMES: Record<string, number> = {
  bashball: 30,
  gridiron: 12,
  strategy: 8,
};

const TEAMS_PER_SEASON = 8;

export function createSeason(
  playerTeam: Team,
  game: 'bashball' | 'gridiron' | 'strategy',
  seed?: number,
): Season {
  const rng = mulberry32(seed ?? Date.now());
  const maxWeeks = MAX_GAMES[game];
  const usedNames = new Set<string>();
  const teams: AITeam[] = [];

  for (let i = 0; i < TEAMS_PER_SEASON - 1; i++) {
    let name: string;
    do { name = TEAM_NAMES[Math.floor(rng() * TEAM_NAMES.length)]; } while (usedNames.has(name));
    usedNames.add(name);

    const colors = TEAM_COLORS[Math.floor(rng() * TEAM_COLORS.length)];
    const difficulty = 0.4 + rng() * 0.4;
    const rosterStrength = 30 + Math.floor(rng() * 50);

    teams.push({
      id: `ai-${game}-${i}-${Date.now()}`,
      name,
      colors,
      difficulty,
      wins: 0,
      losses: 0,
      draws: 0,
      rosterStrength,
    });
  }

  const schedule = generateSchedule(playerTeam.id, teams, maxWeeks, rng);

  const allTeamIds = [playerTeam.id, ...teams.map(t => t.id)];
  const standings: Standing[] = allTeamIds.map(id => ({
    teamId: id,
    wins: 0,
    losses: 0,
    draws: 0,
    pointsFor: 0,
    pointsAgainst: 0,
  }));

  return {
    id: `season-${game}-${Date.now()}`,
    game,
    playerTeamId: playerTeam.id,
    teams,
    schedule,
    standings,
    currentWeek: 1,
    maxWeeks,
    playoffBracket: null,
    champion: null,
    startedAt: new Date().toISOString(),
  };
}

export function getWeekGames(season: Season, week: number): GameSchedule[] {
  return season.schedule.filter(g => g.week === week);
}

export function recordResult(
  season: Season,
  gameId: string,
  result: GameResult,
): Season {
  const schedule = season.schedule.map(g =>
    g.id === gameId ? { ...g, result } : g,
  );

  const standings = season.standings.map(s => {
    if (s.teamId === result.winner) {
      const winnerTeam = season.teams.find(t => t.id === s.teamId);
      if (winnerTeam) winnerTeam.wins += 1;
      return { ...s, wins: s.wins + 1, pointsFor: s.pointsFor + (s.teamId === schedule.find(g => g.id === gameId)?.homeTeamId ? result.homeScore : result.awayScore), pointsAgainst: s.pointsAgainst + (s.teamId === schedule.find(g => g.id === gameId)?.homeTeamId ? result.awayScore : result.homeScore) };
    }
    const loserId = season.schedule.find(g => g.id === gameId)!.homeTeamId === result.winner
      ? season.schedule.find(g => g.id === gameId)!.awayTeamId
      : season.schedule.find(g => g.id === gameId)!.homeTeamId;
    if (s.teamId === loserId) {
      const loserTeam = season.teams.find(t => t.id === s.teamId);
      if (loserTeam) loserTeam.losses += 1;
      return { ...s, losses: s.losses + 1, pointsFor: s.pointsFor + (s.teamId === schedule.find(g => g.id === gameId)?.awayTeamId ? result.awayScore : result.homeScore), pointsAgainst: s.pointsAgainst + (s.teamId === schedule.find(g => g.id === gameId)?.awayTeamId ? result.homeScore : result.awayScore) };
    }
    return s;
  });

  const nextWeek = season.schedule.every(g => g.week !== season.currentWeek || g.result)
    ? season.currentWeek + 1
    : season.currentWeek;

  let playoffBracket = season.playoffBracket;
  let champion = season.champion;

  if (nextWeek > season.maxWeeks && !playoffBracket) {
    playoffBracket = generatePlayoffs(standings);
  }

  return { ...season, schedule, standings, currentWeek: nextWeek, playoffBracket, champion };
}

export function resolvePlayoffMatchup(
  season: Season,
  matchup: PlayoffMatchup,
  winnerId: string,
): Season {
  const bracket = season.playoffBracket?.map(m =>
    m.teamA === matchup.teamA && m.teamB === matchup.teamB
      ? { ...m, winner: winnerId }
      : m,
  ) ?? null;

  let champion = season.champion;

  if (bracket && bracket.every(m => m.winner)) {
    const finals = bracket[bracket.length - 1];
    champion = finals.winner;
  }

  return { ...season, playoffBracket: bracket, champion };
}

export function simAIGame(home: AITeam, away: AITeam): GameResult {
  const homeAdv = 3;
  const homeScore = Math.max(0, Math.floor(home.rosterStrength * 0.15 + homeAdv + (Math.random() - 0.5) * 10));
  const awayScore = Math.max(0, Math.floor(away.rosterStrength * 0.15 + (Math.random() - 0.5) * 10));

  return {
    homeScore,
    awayScore,
    winner: homeScore > awayScore ? home.id : homeScore < awayScore ? away.id : 'draw',
  };
}

export function getTeamName(season: Season, teamId: string, playerTeamName?: string): string {
  if (teamId === season.playerTeamId) return playerTeamName ?? 'Your Team';
  return season.teams.find(t => t.id === teamId)?.name ?? 'Unknown';
}

function generateSchedule(
  playerTeamId: string,
  teams: AITeam[],
  maxWeeks: number,
  rng: () => number,
): GameSchedule[] {
  const allTeams = [playerTeamId, ...teams.map(t => t.id)];
  const schedule: GameSchedule[] = [];
  let gameId = 0;

  for (let w = 1; w <= maxWeeks; w++) {
    const shuffled = [...allTeams].sort(() => rng() - 0.5);
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      schedule.push({
        id: `game-${gameId++}`,
        week: w,
        homeTeamId: shuffled[i],
        awayTeamId: shuffled[i + 1],
        result: null,
      });
    }
  }

  return schedule;
}

function generatePlayoffs(standings: Standing[]): PlayoffMatchup[] {
  const sorted = [...standings].sort((a, b) => b.wins - a.wins);
  const top4 = sorted.slice(0, 4);

  return [
    { round: 1, teamA: top4[0].teamId, teamB: top4[3].teamId, winner: null },
    { round: 1, teamA: top4[1].teamId, teamB: top4[2].teamId, winner: null },
    { round: 2, teamA: '', teamB: '', winner: null },
  ];
}
