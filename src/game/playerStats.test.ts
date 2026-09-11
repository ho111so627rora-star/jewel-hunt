import { describe, expect, it } from 'vitest';
import { createGame, resolveTurn } from './engine';
import { specialUsage } from './playerStats';
import type { Kind, Selection } from './types';
describe('公開済みの使用状況', () => {
  it('初期状態と選択確定だけでは使用数を増やさない', () => {
    const game = createGame([], 1), player = game.players[0];
    const before = specialUsage(player);
    game.selections[player.id] = [{ ...player.bag.find(d => d.kind === 'thief')!, value: 0 }, { ...player.bag.find(d => d.kind === 'poison')!, value: 0 }];
    expect(specialUsage(player)).toEqual(before);
    expect(before.map(item => item.used)).toEqual([0, 0, 0]);
  });
  it('不発の泥棒も、同じターンに使った2個分を数える', () => {
    const game = createGame([], 1);
    const selections = Object.fromEntries(game.players.map((p, index) => {
      const kind: Kind = index === 0 ? 'thief' : 'poison';
      return [p.id, p.bag.filter(d => d.kind === kind).slice(0, 2).map(d => ({ ...d, value: 0 })) as Selection];
    }));
    const resolved = resolveTurn(game, selections, () => .1);
    expect(specialUsage(resolved.players[0]).find(item => item.kind === 'thief')).toEqual({ kind: 'thief', used: 2, remaining: 2, initial: 4 });
    expect(specialUsage(resolved.players[1]).find(item => item.kind === 'poison')).toEqual({ kind: 'poison', used: 2, remaining: 0, initial: 2 });
    expect(specialUsage(game.players[0]).find(item => item.kind === 'thief')!.used).toBe(0);
  });
});
