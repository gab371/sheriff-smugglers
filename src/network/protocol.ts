import type { GameState } from "../core/types";

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
