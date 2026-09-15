import { COLORS, isJewel, TURNS } from './constants';
import { facingCup } from './cups';
import { schedule, values, selectableValues } from './engine';
import type { Color, Game, Kind, Play, Player, Selection } from './types';

type Forecast = { play: Play; probability: number }[];
function options(game: Game, player: Player, copies = 1): Play[] {
  const counts = new Map<Kind, number>();
  return player.bag.flatMap(die => {
    const count = counts.get(die.kind) || 0; counts.set(die.kind, count + 1);
    if (count >= copies) return [];
    return (isJewel(die.kind) ? values(game, die.kind) : [0]).map(value => ({ ...die, value }));
  });
}
function forecast(game: Game, player: Player, side: number): Forecast {
  const past = (game.history || []).slice(-5).flatMap(turn => turn[player.id]?.[side] ? [turn[player.id][side]!] : []);
  // Private acquired colors are unavailable to opponents, including CPUs.
  // Estimate colors from the public player color and total remaining jewel count.
  const countJewels = player.bag.filter(d => isJewel(d.kind)).length;
  const belief = { ...player, bag: [...player.bag.filter(d => !isJewel(d.kind)), ...COLORS.flatMap(kind => Array.from({ length: countJewels ? (kind === player.color ? 2 : 1) : 0 }, (_, i) => ({ id: `belief-${player.id}-${kind}-${i}`, kind })))] };
  const choices = options(game, belief);
  const weights = choices.map(play => {
    const count = belief.bag.filter(d => d.kind === play.kind).length;
    const base = isJewel(play.kind) ? 2 : play.kind === 'mining' ? (game.turn < 7 ? 1.2 : .15) : play.kind === 'thief' ? 1.3 : .55;
    const historyWeight = (2 + past.filter(p => p.kind === play.kind).length * 2) / (2 + past.length);
    const numbers = isJewel(play.kind) ? values(game, play.kind) : [0];
    const valueWeight = isJewel(play.kind) ? (play.value + 2) / numbers.reduce((sum, v) => sum + v + 2, 0) : 1;
    return Math.sqrt(count) * base * historyWeight * valueWeight;
  });
  const total = weights.reduce((sum, w) => sum + w, 0);
  return choices.map((play, i) => ({ play, probability: weights[i] / total }));
}
function lossOf(player: Player, jewel: Play) {
  const breaksComplete = new Set(player.jewels.map(j => j.kind)).size === 4 && player.jewels.filter(j => j.kind === jewel.kind).length === 1;
  return jewel.value + (breaksComplete ? 5 : 0);
}
export function choosePoisonTarget(game: Game, targetId: string, candidates: string[]): string {
  const target = game.players.find(p => p.id === targetId)!;
  return target.jewels.filter(j => candidates.includes(j.id)).sort((a, b) => lossOf(target, b) - lossOf(target, a))[0].id;
}

/** Evaluates legal pairs using public inventories and past reveals only.
 * Never reads game.selections, pendingAwards, or another CPU's locked action.
 * Forecasts are estimates, not knowledge of the opponent's next move.
 */
export function chooseCpu(game: Game, playerId: string, random: () => number): Selection {
  const player = game.players.find(p => p.id === playerId)!;
  if (!player.bag.length) return [null, null];
  const pair = schedule(game.turn).find(p => p.includes(game.players.indexOf(player)))!;
  const opponent = game.players[pair.find(i => game.players[i].id !== playerId)!];
  const forecasts = new Map(game.players.filter(p => p.id !== playerId).map(p => [p.id, [forecast(game, p, 0), forecast(game, p, 1)]]));
  const enemy = forecasts.get(opponent.id)!;
  const ownColors = new Set(player.jewels.map(j => j.kind));
  const bonusValue = (kind: Kind) => ownColors.has(kind) ? 0 : ownColors.size === 3 ? 5 : ownColors.size === 2 ? 2 : 1;
  const maxLoss = Math.max(0, ...player.jewels.map(j => lossOf(player, j)));
  const opponentLoss = Math.max(0, ...opponent.jewels.map(j => lossOf(opponent, j)));
  const rivalWeight = .55 + (game.turn >= 8 ? .2 : 0);
  function survival(play: Play, excluded?: string) {
    let probability = 1;
    for (const [id, sides] of forecasts) {
      if (id === excluded) continue;
      for (const side of sides) probability *= 1 - side.filter(f => f.play.kind === play.kind && f.play.value === play.value).reduce((s, f) => s + f.probability, 0);
    }
    return probability;
  }
  function utility(play: Play, side: number): number {
    const chances = enemy[facingCup(side)];
    if (isJewel(play.kind)) {
      const theft = chances.filter(f => f.play.kind === 'thief').reduce((s, f) => s + f.probability, 0);
      return survival(play) * ((1 - theft) * (play.value + bonusValue(play.kind)) - theft * play.value * rivalWeight);
    }
    if (play.kind === 'thief') {
      return chances.reduce((sum, f) => sum + f.probability * (isJewel(f.play.kind)
        ? survival(f.play, opponent.id) * (f.play.value * (1 + rivalWeight) + bonusValue(f.play.kind))
        : f.play.kind === 'poison' ? -maxLoss : 0), 0);
    }
    if (play.kind === 'poison') return chances.filter(f => f.play.kind === 'thief').reduce((s, f) => s + f.probability, 0) * opponentLoss * rivalWeight;
    if (game.turn === TURNS || !(game.miningCount ?? game.miningBag.length)) return 0;
    const remaining = TURNS - game.turn;
    const capacity = Math.min(1, (2 * remaining) / Math.max(1, player.bag.length - 1));
    return COLORS.reduce((sum, kind) => {
      const best = Math.max(...values(game, kind));
      return sum + (best * .63 + bonusValue(kind) * .5) * capacity;
    }, 0) / COLORS.length;
  }
  const choices = options(game, player, 2);
  const utilities = [0, 1].map(side => new Map(choices.map(play => [`${play.id}:${play.value}`, utility(play, side)])));
  let best: Selection = [choices[0], null], bestValue = -Infinity;
  for (const a of choices) for (const b of player.bag.length === 1 ? [null] : choices) {
    if (b?.id === a.id) continue;
    if (b && isJewel(a.kind) && !selectableValues(game, a.kind, b).includes(a.value)) continue;
    let total = utilities[0].get(`${a.id}:${a.value}`)! + (b ? utilities[1].get(`${b.id}:${b.value}`)! : 0);
    if (b && isJewel(a.kind) && isJewel(b.kind) && a.kind === b.kind && a.value === b.value) total = -15;
    if (b && a.kind === b.kind && !ownColors.has(a.kind) && isJewel(a.kind)) total -= bonusValue(a.kind);
    if (b?.kind === 'mining' && a.kind === 'mining') total -= 1.1; // Two future dice compete for remaining turns.
    // A small randomized utility keeps the policy exploitable neither by fixed ties nor by repeating one hand.
    total += .4 * -Math.log(-Math.log(Math.max(.00001, Math.min(.99999, random()))));
    if (total > bestValue) { bestValue = total; best = [a, b]; }
  }
  return best;
}
