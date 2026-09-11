import { describe, expect, it } from 'vitest';
import { createGame } from '../game/engine';
import { publicGame } from './publicGame';

describe('採掘結果の秘密', () => {
  it('本人以外にはイベント・手持ち・記録・宝箱の中身からも色やIDを送らない', () => {
    const game = createGame(['本人', '相手'], 2); game.phase = 'result';
    const die = { id: 'private-mined-die', kind: 'emerald' as const };
    game.players[1].bag.push(die);
    game.visualEvents = [{ type: 'mining', player: 'p1', die: { ...die, value: 1 } }];
    game.logs = ['相手が採掘！ エメラルドを袋に追加。'];
    const before = structuredClone(game), other = publicGame(game, 'p0'), own = publicGame(game, 'p1');
    expect(JSON.stringify(other)).not.toContain(die.id);
    expect(other.visualEvents).toEqual([]);
    expect(other.logs).toEqual(['相手が採掘！ サイコロを1個獲得（色は本人だけに公開）。']);
    expect(other.miningBag).toEqual([]); expect(other.miningCount).toBe(game.miningBag.length);
    expect(other.players[1].bag.every(d => ['mining', 'thief', 'poison'].includes(d.kind))).toBe(true);
    expect(own.players[1].bag).toContainEqual(die);
    expect(own.visualEvents).toEqual(game.visualEvents); expect(own.logs).toEqual(game.logs);
    expect(game).toEqual(before);
  });
  it('後のターンでも相手の手持ちは秘密で、得点として獲得した宝石は公開する', () => {
    const game = createGame([], 2);
    game.players[1].bag.push({ id: 'hidden-previous-turn', kind: 'emerald' });
    game.players[1].jewels.push({ id: 'public-score', kind: 'ruby', value: 6, obtainedTurn: 1, postSellout: false });
    const view = publicGame(game, 'p0');
    expect(JSON.stringify(view)).not.toContain('hidden-previous-turn');
    expect(view.players[1].jewels).toEqual(game.players[1].jewels);
  });
});
