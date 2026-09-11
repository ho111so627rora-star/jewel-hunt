import { SPECIAL_COUNTS } from './constants';
import type { Player } from './types';
// Special pieces cannot be acquired or transferred. A public bag snapshot therefore
// tells us exactly how many have been consumed, including unsuccessful effects.
// Before reveal the server sends the previous bag, so locked choices stay private.
export function specialUsage(player: Player) {
  return (Object.keys(SPECIAL_COUNTS) as (keyof typeof SPECIAL_COUNTS)[]).map(kind => {
    const remaining = player.bag.filter(die => die.kind === kind).length;
    return { kind, initial: SPECIAL_COUNTS[kind], remaining, used: SPECIAL_COUNTS[kind] - remaining };
  });
}
