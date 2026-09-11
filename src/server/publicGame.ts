import { isJewel, LABELS } from '../game/constants';
import type { Game } from '../game/types';

/** Redact at the response boundary: secret draws must never reach other clients. */
export function publicGame(source: Game, viewer: string): Game {
  const game = structuredClone(source);
  game.pendingAwards = [];
  game.miningCount = game.miningBag.length;
  game.miningBag = []; // Even bag composition differences can disclose a private draw.
  game.players.forEach(p => { if (p.id !== viewer) p.bag = p.bag.filter(d => !isJewel(d.kind)); });
  const mining = (game.visualEvents || []).filter(e => e.type === 'mining');
  game.visualEvents = game.visualEvents?.filter(e => e.type !== 'mining' || e.player === viewer);
  game.logs = game.logs.filter(log => !log.includes('が採掘！'));
  if (['result', 'poison', 'over'].includes(game.phase)) {
    for (const event of mining) {
      const player = game.players.find(p => p.id === event.player)!;
      game.logs.push(player.id === viewer
        ? `${player.name}が採掘！ ${LABELS[event.die.kind]}を袋に追加。`
        : `${player.name}が採掘！ サイコロを1個獲得（色は本人だけに公開）。`);
    }
  }
  return game;
}
