import type { GameState, Card, Player } from "../core/types";

export type MessageType = 'JOIN' | 'STATE_UPDATE' | 'ACTION' | 'CHAT' | 'AUDIO_EVENT';

export const MSG_TYPES: { [key in MessageType]: MessageType } = {
  JOIN: 'JOIN',
  STATE_UPDATE: 'STATE_UPDATE',
  ACTION: 'ACTION',
  CHAT: 'CHAT',
  AUDIO_EVENT: 'AUDIO_EVENT',
};

export interface NetworkMessage {
  type: MessageType;
  [key: string]: any;
}

export interface ChatMessage extends NetworkMessage {
  type: 'CHAT';
  sender: string;
  text: string;
  time: string;
}

export interface StateUpdateMessage extends NetworkMessage {
  type: 'STATE_UPDATE';
  state: GameState;
}

export interface ActionMessage extends NetworkMessage {
  type: 'ACTION';
  actionName: string;
  playerId: string;
  payload: any;
}

export interface AudioEventMessage extends NetworkMessage {
  type: 'AUDIO_EVENT';
  sfx: 'coin' | 'card' | 'bagsnap' | 'gavel' | 'victory' | 'ping';
}

/**
 * Builds a face-down placeholder card used to mask hidden information
 * (opponents' hands, contraband, bag contents, and the draw deck) while
 * preserving array lengths so public counts rendered by the UI stay accurate.
 */
function faceDownCard(uid: string): Card {
  return {
    uid,
    cardId: '__hidden__',
    id: '__hidden__',
    name: 'Inconnu',
    type: 'CONTRABAND',
    icon: '🂠',
    value: 0,
    fine: 0,
    deckCount: 0,
  };
}

/**
 * Sanitizes the game state for a specific player before sending it over the network.
 *
 * Sheriff & Smugglers is a bluffing game: each merchant's hand, contraband stash
 * and bag contents must stay hidden from the Sheriff and from other merchants.
 * Only the bag owner may see their own bag cards; only the deck owner (the engine)
 * knows the draw deck. Public information (stands, declared goods/counts, discard
 * piles, bribes, logs, scores) is preserved, and array lengths are kept so the UI
 * can render accurate counts without leaking card identities.
 */
export function sanitizeGameState(state: GameState, targetPlayerId: string): GameState {
  const sanitizedPlayers: Player[] = state.players.map((player): Player => {
    if (player.id === targetPlayerId) {
      // The target player sees their own private information.
      return {
        ...player,
        hand: player.hand.map((c) => ({ ...c })),
        contraband: player.contraband.map((c) => ({ ...c })),
        stand: Object.fromEntries(
          Object.entries(player.stand).map(([k, v]) => [k, v.map((c) => ({ ...c }))])
        ) as Player['stand'],
      };
    }

    // Opponent view: hide hand & contraband contents, keep stand (public) and counts.
    return {
      ...player,
      hand: player.hand.map((_, i) => faceDownCard(`hidden_hand_${player.id}_${i}`)),
      contraband: player.contraband.map((_, i) => faceDownCard(`hidden_contraband_${player.id}_${i}`)),
      stand: Object.fromEntries(
        Object.entries(player.stand).map(([k, v]) => [k, v.map((c) => ({ ...c }))])
      ) as Player['stand'],
    };
  });

  // Bags: only the owner sees their cards; others only see status / declaration / count.
  const sanitizedBags: GameState['bags'] = {};
  Object.entries(state.bags).forEach(([pid, bag]) => {
    if (pid === targetPlayerId) {
      sanitizedBags[pid] = { ...bag, cards: bag.cards.map((c) => ({ ...c })) };
    } else {
      sanitizedBags[pid] = {
        ...bag,
        cards: bag.cards.map((_, i) => faceDownCard(`hidden_bag_${pid}_${i}`)),
      };
    }
  });

  // Market states: hide other players' pending discards (private to that player).
  const sanitizedMarket: GameState['marketPlayerStates'] = {};
  Object.entries(state.marketPlayerStates).forEach(([pid, mps]) => {
    if (pid === targetPlayerId) {
      sanitizedMarket[pid] = {
        ...mps,
        pendingDiscards: mps.pendingDiscards?.map((c) => ({ ...c })),
      };
    } else {
      sanitizedMarket[pid] = { ...mps, pendingDiscards: undefined };
    }
  });

  return {
    ...state,
    // Hide the draw deck contents but keep its length for the "Pioche (N cartes)" UI.
    drawDeck: state.drawDeck.map((_, i) => faceDownCard(`hidden_deck_${i}`)),
    players: sanitizedPlayers,
    bags: sanitizedBags,
    marketPlayerStates: sanitizedMarket,
  };
}
