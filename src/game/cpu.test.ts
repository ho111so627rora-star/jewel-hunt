import { describe, expect, it } from 'vitest';
import { applyPoison, chooseCasualCpu, chooseCpu, choosePoisonTarget, createGame, nextTurn, resolveTurn, score, validateSelection } from './engine';
import type { Game, Selection } from './types';
const seeded = (initial: number) => { let seed = initial; return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; };
describe('公開情報を読むCPU', () => {
  it('相手の秘密の所持色や採掘袋の内訳を変えても判断を変えない', () => {
    const game = createGame([], 1), changed = structuredClone(game);
    changed.players.slice(1).forEach(p => p.bag.forEach(d => { if (['ruby', 'sapphire', 'emerald', 'topaz'].includes(d.kind)) d.kind = 'ruby'; }));
    changed.miningBag.forEach(d => { d.kind = 'topaz'; });
    expect(chooseCpu(changed, 'p0', seeded(32))).toEqual(chooseCpu(game, 'p0', seeded(32)));
  });
  it('違う色なら同じ6を2個出して得点を狙う', () => {
    const g = createGame([], 1); g.turn = 10;
    g.players.forEach(p => { p.bag = p.bag.filter(d => d.kind === p.color); });
    g.players[0].bag[1].kind = 'sapphire';
    g.players[1].bag = []; // No collision or theft risk for these two colors.
    const result = chooseCpu(g, 'p0', () => .5);
    expect(result.map(p => p!.value)).toEqual([6, 6]);
    expect(new Set(result.map(p => p!.kind)).size).toBe(2);
  });
  it('相手が左に宝石・右に劇薬を出す傾向なら、自分の右に泥棒を置く', () => {
    const g = createGame([], 1); g.turn = 10;
    g.players[0].bag = [g.players[0].bag.find(d => d.kind === 'thief')!, g.players[0].bag.find(d => d.kind === 'poison')!];
    g.players[0].jewels = [{ id: 'owned', kind: 'ruby', value: 6, obtainedTurn: 1, postSellout: false }];
    g.history = Array.from({ length: 5 }, () => ({ p1: [{ id: 'seen-jewel', kind: 'sapphire', value: 6 }, { id: 'seen-poison', kind: 'poison', value: 0 }] }));
    const result = chooseCpu(g, 'p0', () => .5);
    expect(result.map(p => p!.kind)).toEqual(['poison', 'thief']);
  });
  it('安全な最終ターンでは採掘せず6と5を出す', () => {
    const g = createGame([], 1); g.turn = 10;
    g.players.forEach(p => { p.bag = p.bag.filter(d => d.kind === p.color || d.kind === 'mining'); });
    const selection = chooseCpu(g, 'p0', () => .5);
    expect(selection.map(p => p!.value).sort()).toEqual([5, 6]);
  });
  it('未公開の選択を変えても同じ乱数なら同じ判断になる', () => {
    const g = createGame([], 1), modified = structuredClone(g);
    modified.selections = { p1: [{ id: 'secret', kind: 'thief', value: 0 }, { id: 'secret-2', kind: 'poison', value: 0 }] };
    expect(chooseCpu(g, 'p0', seeded(17))).toEqual(chooseCpu(modified, 'p0', seeded(17)));
  });
  it('劇薬は額面だけでなくコンプリート崩しを優先する', () => {
    const g = createGame([], 1);
    g.players[1].jewels = [
      { id: 'r6', kind: 'ruby', value: 6, obtainedTurn: 1, postSellout: false },
      { id: 'r1', kind: 'ruby', value: 1, obtainedTurn: 1, postSellout: false },
      ...(['sapphire', 'emerald', 'topaz'] as const).map(kind => ({ id: kind, kind, value: 2, obtainedTurn: 1, postSellout: false })),
    ];
    expect(choosePoisonTarget(g, 'p1', ['r6', 'topaz'])).toBe('topaz');
  });
  it('残り0個・1個でも合法手を返す', () => {
    const g = createGame([], 1); g.players[0].bag = g.players[0].bag.slice(0, 1);
    expect(() => validateSelection(g, 'p0', chooseCpu(g, 'p0', seeded(1)))).not.toThrow();
    g.players[0].bag = []; expect(chooseCpu(g, 'p0', seeded(1))).toEqual([null, null]);
  });
  it('席を交代する120試合で旧CPUとの成績を比較', () => {
    const matches = 120; let wins = 0, advancedTotal = 0, casualTotal = 0;
    for (let match = 0; match < matches; match++) {
      const random = seeded(5481 + match * 137), seat = match % 4;
      let g: Game = createGame([], 0);
      while (g.phase !== 'over') {
        const choices: Record<string, Selection> = Object.fromEntries(g.players.map((p, i) => [p.id, (i === seat ? chooseCpu : chooseCasualCpu)(g, p.id, random)]));
        g = resolveTurn(g, choices, random);
        while (g.phase === 'poison') { const task = g.poisonTasks[0]; g = applyPoison(g, task.actor, choosePoisonTarget(g, task.target, task.candidates)); }
        g = nextTurn(g);
      }
      const scores = g.players.map(p => score(p, true).total);
      advancedTotal += scores[seat]; casualTotal += scores.filter((_, i) => i !== seat).reduce((a, b) => a + b, 0) / 3;
      if (scores[seat] === Math.max(...scores)) wins++;
    }
    console.log(`CPU benchmark: ${wins}/${matches} wins including ties; mean ${advancedTotal / matches} vs ${casualTotal / matches}`);
    expect(advancedTotal).toBeGreaterThan(casualTotal * 1.1);
    expect(wins / matches).toBeGreaterThan(.4);
  }, 30000);
});
