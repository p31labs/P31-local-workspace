import { LeagueTier, TeamRecord, StandingsEntry, LeagueStandings, SeasonSchedule } from './types.ts';
import { Rng } from '../card/rng/mulberry32.ts';

const TIER_TEAMS: Record<LeagueTier, string[]> = {
  [LeagueTier.Rookie]: ['Bombers', 'Dukes', 'Eagles', 'Falcons', 'Giants', 'Hawks', 'Iron', 'Jets'],
  [LeagueTier.Minor]: ['Knights', 'Lions', 'Marauders', 'Nighthawks', 'Outlaws', 'Panthers', 'Quakes', 'Ravens'],
  [LeagueTier.Major]: ['Sentinels', 'Titans', 'Unicorns', 'Vanguards', 'Warriors', 'Xenith', 'Yetis', 'Zephyrs'],
  [LeagueTier.World]: ['Aces', 'Blaze', 'Crowns', 'Dynasty', 'Elite', 'Flame', 'Glory', 'Havoc'],
};

const GAMES_PER_OPPONENT = 2;
const TEAMS_PER_TIER = 8;
const PLAYOFF_TEAMS = 4;
const PROMOTE_COUNT = 2;
const RELEGATE_COUNT = 2;

function generateRoundRobinPairings(teams: string[]): [string, string][] {
  const n = teams.length;
  const fixture = [...teams];
  const pairings: [string, string][] = [];

  for (let round = 0; round < n - 1; round++) {
    for (let i = 0; i < n / 2; i++) {
      pairings.push([fixture[i], fixture[n - 1 - i]]);
    }
    fixture.splice(1, 0, fixture.pop()!);
  }

  return pairings;
}

export function generateSchedule(tier: LeagueTier, season: number, _rng: Rng): SeasonSchedule {
  const teams = TIER_TEAMS[tier];
  const firstLeg = generateRoundRobinPairings(teams);
  const secondLeg = firstLeg.map(([a, b]) => [b, a] as [string, string]);
  const allGames = [...firstLeg, ...secondLeg];

  const games = allGames.map(([away, home]) => ({
    away,
    home,
    awayScore: undefined as number | undefined,
    homeScore: undefined as number | undefined,
    played: false,
  }));

  return {
    tier,
    season,
    week: 0,
    games,
  };
}

export function calculateStandings(
  games: { away: string; home: string; awayScore: number; homeScore: number }[],
  tier: LeagueTier,
  season: number,
): LeagueStandings {
  const records = new Map<string, TeamRecord>();
  const teamNames = new Set<string>();

  for (const g of games) {
    teamNames.add(g.away);
    teamNames.add(g.home);
    if (!records.has(g.away)) records.set(g.away, { wins: 0, losses: 0, ties: 0, runsScored: 0, runsAllowed: 0 });
    if (!records.has(g.home)) records.set(g.home, { wins: 0, losses: 0, ties: 0, runsScored: 0, runsAllowed: 0 });

    const awayRec = records.get(g.away)!;
    const homeRec = records.get(g.home)!;

    awayRec.runsScored += g.awayScore;
    awayRec.runsAllowed += g.homeScore;
    homeRec.runsScored += g.homeScore;
    homeRec.runsAllowed += g.awayScore;

    if (g.awayScore > g.homeScore) {
      awayRec.wins++;
      homeRec.losses++;
    } else if (g.homeScore > g.awayScore) {
      homeRec.wins++;
      awayRec.losses++;
    } else {
      awayRec.ties++;
      homeRec.ties++;
    }
  }

  const leaderWins = Math.max(0, ...Array.from(records.values()).map(r => r.wins));

  const entries: StandingsEntry[] = Array.from(teamNames).map(name => {
    const record = records.get(name)!;
    return {
      teamName: name,
      teamId: name.toLowerCase().replace(/\s/g, ''),
      record,
      tier,
      gamesBack: leaderWins - record.wins,
    };
  });

  entries.sort((a, b) => {
    if (b.record.wins !== a.record.wins) return b.record.wins - a.record.wins;
    const diffA = a.record.runsScored - a.record.runsAllowed;
    const diffB = b.record.runsScored - b.record.runsAllowed;
    return diffB - diffA;
  });

  return { tier, season, teams: entries };
}

export function recordGameResult(
  standings: Map<string, TeamRecord>,
  awayName: string,
  homeName: string,
  awayScore: number,
  homeScore: number,
): { winner: string; loser: string } {
  if (!standings.has(awayName)) standings.set(awayName, { wins: 0, losses: 0, ties: 0, runsScored: 0, runsAllowed: 0 });
  if (!standings.has(homeName)) standings.set(homeName, { wins: 0, losses: 0, ties: 0, runsScored: 0, runsAllowed: 0 });

  const awayRec = standings.get(awayName)!;
  const homeRec = standings.get(homeName)!;

  awayRec.runsScored += awayScore;
  awayRec.runsAllowed += homeScore;
  homeRec.runsScored += homeScore;
  homeRec.runsAllowed += awayScore;

  if (awayScore > homeScore) {
    awayRec.wins++;
    homeRec.losses++;
    return { winner: awayName, loser: homeName };
  } else if (homeScore > awayScore) {
    homeRec.wins++;
    awayRec.losses++;
    return { winner: homeName, loser: awayName };
  } else {
    awayRec.ties++;
    homeRec.ties++;
    return { winner: '', loser: '' };
  }
}

export function getPromotionCandidates(standings: LeagueStandings): string[] {
  return standings.teams.slice(0, PROMOTE_COUNT).map(t => t.teamName);
}

export function getRelegationCandidates(standings: LeagueStandings): string[] {
  return standings.teams.slice(-RELEGATE_COUNT).map(t => t.teamName);
}

export interface TierTransition {
  promoted: { team: string; from: LeagueTier; to: LeagueTier }[];
  relegated: { team: string; from: LeagueTier; to: LeagueTier }[];
}

export function calculateTransitions(allStandings: Map<LeagueTier, LeagueStandings>): TierTransition {
  const tiers: LeagueTier[] = [LeagueTier.Rookie, LeagueTier.Minor, LeagueTier.Major, LeagueTier.World];
  const promoted: TierTransition['promoted'] = [];
  const relegated: TierTransition['relegated'] = [];

  for (let i = 0; i < tiers.length; i++) {
    const standings = allStandings.get(tiers[i]);
    if (!standings) continue;

    if (i < tiers.length - 1) {
      const promoTeams = getPromotionCandidates(standings);
      for (const team of promoTeams) {
        promoted.push({ team, from: tiers[i], to: tiers[i + 1] });
      }
    }

    if (i > 0) {
      const relegTeams = getRelegationCandidates(standings);
      for (const team of relegTeams) {
        relegated.push({ team, from: tiers[i], to: tiers[i - 1] });
      }
    }
  }

  return { promoted, relegated };
}

export function isSeasonComplete(games: SeasonSchedule['games']): boolean {
  return games.length > 0 && games.every(g => g.played);
}

export function getTeamNames(tier: LeagueTier): string[] {
  return TIER_TEAMS[tier];
}
