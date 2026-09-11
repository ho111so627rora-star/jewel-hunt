/** Indexes are local to each player: 0 = left, 1 = right. Facing cups mirror each other. */
export function facingCup(side: number): 0 | 1 { return side === 0 ? 1 : 0; }
