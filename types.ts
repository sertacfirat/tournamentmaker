export type Language = 'tr' | 'en';

export enum TournamentType {
  OneVsOne = '1v1',
  TwoVsTwo = '2v2',
}

export interface Player {
  id: string;
  name: string;
}

export interface MatchTeam {
  playerIds: string[]; // 1 ID for 1v1, 2 IDs for 2v2
  score: number | null;
  footballTeam: string; // The real life team chosen (e.g., "Real Madrid")
  isGhost?: boolean; // If true, stats are not recorded for these players (balancing match)
}

export interface Match {
  id: string;
  round: number;
  home: MatchTeam;
  away: MatchTeam;
  isCompleted: boolean;
  timestamp: number;
}

export interface TournamentSettings {
  name: string;
  type: TournamentType;
  hasAwayGoals: boolean;
  isDoubleRound: boolean; // True = Home & Away, False = Single Match
}

export interface Tournament {
  id: string;
  settings: TournamentSettings;
  players: Player[];
  matches: Match[];
  status: 'draft' | 'active' | 'completed';
  createdAt: number;
}

export interface StandingsRow {
  playerId: string;
  playerName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface TeamStat {
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  winRate: number;
}