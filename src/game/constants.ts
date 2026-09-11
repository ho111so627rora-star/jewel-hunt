import type { Color, Kind } from './types';
export const COLORS: Color[] = ['ruby', 'sapphire', 'emerald', 'topaz'];
export const TURNS = 10;
export const COMPLETE_BONUS = 5;
export const SPECIAL_COUNTS = { thief: 4, mining: 4, poison: 2 } as const;
export const LABELS: Record<Kind, string> = { ruby: 'ルビー', sapphire: 'サファイア', emerald: 'エメラルド', topaz: 'トパーズ', thief: '泥棒', mining: '採掘', poison: '劇薬' };
export const isJewel = (kind: Kind): kind is Color => COLORS.includes(kind as Color);
