import type { Color, Game } from '../game/types';
export type Session = { code: string; token: string; playerId: string };
export type RoomView = {
  code: string; humanCount: number; me: string; host: boolean;
  seats: { id: string; name: string; color: Color; cpu: boolean; joined: boolean; online: boolean }[];
  game: Game | null;
  locked: string[]; ready: string[];
  reviewed?: string[];
  selectionDeadline?: number;
  timedOut?: string[];
  revealAt?: number;
  serverNow?: number;
};
