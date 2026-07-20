export type GoodType = 'LEGAL' | 'CONTRABAND';

export interface Card {
  uid: string;
  cardId: string;
  id: string;
  name: string;
  type: GoodType;
  icon: string;
  value: number;
  fine: number;
  deckCount: number;
  kingBonus?: number;
  queenBonus?: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  gold: number;
  hand: Card[];
  stand: { [cardId: string]: Card[] };
  contraband: Card[];
  isReady: boolean;
}

export type GamePhase =
  | 'LOBBY'
  | 'MARKET_DRAW'
  | 'BAG_LOADING'
  | 'DECLARATION'
  | 'INSPECTION'
  | 'ROUND_END'
  | 'GAME_OVER';

export const GAME_PHASES: { [key in GamePhase]: GamePhase } = {
  LOBBY: 'LOBBY',
  MARKET_DRAW: 'MARKET_DRAW',
  BAG_LOADING: 'BAG_LOADING',
  DECLARATION: 'DECLARATION',
  INSPECTION: 'INSPECTION',
  ROUND_END: 'ROUND_END',
  GAME_OVER: 'GAME_OVER',
};

export interface BagState {
  cards: Card[];
  declaredGood: string | null;
  declaredCount: number;
  status: 'WAITING' | 'LOADED' | 'DECLARED' | 'PASSED' | 'INSPECTED';
}

export interface MarketPlayerState {
  step: 'DISCARD' | 'DRAWING' | 'DONE';
  cardsToDraw: number;
  done: boolean;
  pendingDiscards?: Card[];
}

export interface GameLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'system' | 'warning' | 'phase' | 'sheriff' | 'action' | 'declaration' | 'bribe' | 'pass' | 'inspection-honest' | 'inspection-liar';
}

export interface WinnerScore {
  playerId: string;
  name: string;
  avatar: string;
  coins: number;
  standValue: number;
  standDetails: string[];
  contrabandValue: number;
  contrabandDetails: string[];
  counts: { [goodId: string]: number };
  kingBonuses: number;
  queenBonuses: number;
  bonusList: string[];
  totalScore: number;
}

export type DeckTheme = 'WESTERN' | 'MEDIEVAL' | 'MODERN';

export interface GameState {
  phase: GamePhase;
  players: Player[];
  sheriffIndex: number;
  roundNumber: number;
  totalRounds: number;
  drawDeck: Card[];
  discardPile1: Card[];
  discardPile2: Card[];
  bags: { [playerId: string]: BagState };
  activeBribes: { [playerId: string]: { gold: number; text: string; status: 'PENDING' | 'ACCEPTED' | 'REJECTED' } };
  marketPlayerStates: { [playerId: string]: MarketPlayerState };
  logs: GameLog[];
  winnerScores: WinnerScore[] | null;
  deckTheme: DeckTheme;
}
