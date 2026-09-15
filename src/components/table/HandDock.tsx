'use client';
import { ArrowRight, Check, LockKeyhole } from 'lucide-react';
import type { Game, Kind, Player, Selection } from '../../game/types';
import { COLORS, LABELS, isJewel } from '../../game/constants';
import { selectableValues } from '../../game/engine';
import { PieceIcon } from './PieceIcon';
export function HandDock({ game, player, draft, side, locked, busy, onDraft, onSide, onLock }: { game: Game; player: Player; draft: Selection; side: number; locked: boolean; busy: boolean; onDraft: (s: Selection) => void; onSide: (s: number) => void; onLock: () => void }) {
  const selected = draft[side];
  const count = draft.filter(Boolean).length, required = Math.min(2, player.bag.length);
  function put(kind: Kind) {
    const die = player.bag.find(d => d.kind === kind && d.id !== draft[1 - side]?.id); if (!die) return;
    const next: Selection = [...draft]; next[side] = { ...die, value: isJewel(kind) ? selectableValues(game, kind, draft[1 - side]).at(-1)! : 0 }; onDraft(next);
    if (!isJewel(kind) && side === 0 && !draft[1]) onSide(1);
  }
  const double = draft[0] && draft[1] && isJewel(draft[0].kind) && isJewel(draft[1].kind) && draft[0].kind === draft[1].kind && draft[0].value === draft[1].value;
  return <section className={`hand-dock ${locked ? 'hand-locked' : ''}`} aria-label="あなたの手元"><div className="hand-topline"><h2>{locked ? 'カップを伏せて、みんなを待とう。' : 'カップに、次の一手を。'}</h2><span>YOUR HAND · {player.bag.length}個</span></div>
    <p className="cup-facing-hint">自分の{side === 0 ? '左' : '右'}カップ ↔ 相手の{side === 0 ? '右' : '左'}カップ</p>
    <div className="hand-layout"><div className="cup-switch">{[0, 1].map(i => <button key={i} disabled={locked} aria-label={`${i === 0 ? '左' : '右'}のカップを選択`} aria-pressed={side === i} className={side === i ? 'active' : ''} onClick={() => onSide(i)}><span>{i === 0 ? 'L' : 'R'}</span><b>{draft[i] ? `${LABELS[draft[i]!.kind]}${isJewel(draft[i]!.kind) ? ` ${draft[i]!.value}` : ''}` : `${i === 0 ? '左' : '右'}のカップ`}</b>{draft[i] && <Check />}</button>)}</div>
      {!locked && <div className="physical-inventory">{([...COLORS, 'thief', 'mining', 'poison'] as Kind[]).filter(kind => player.bag.some(d => d.kind === kind)).map(kind => {
        const available = player.bag.filter(d => d.kind === kind && d.id !== draft[1 - side]?.id).length;
        return <button key={kind} disabled={!available || busy} className={selected?.kind === kind ? 'chosen' : ''} aria-label={`${LABELS[kind]} 残り${available}個`} onClick={() => put(kind)}><PieceIcon kind={kind} /><span>{kind === 'mining' ? '採掘権' : LABELS[kind]}</span><small>×{available}</small></button>;
      })}</div>}
      <button className="primary cover-cups" disabled={locked || busy || count !== required} onClick={onLock}><LockKeyhole />{locked ? '準備OK' : required === 0 ? 'パスして待つ' : 'カップを伏せる'}{!locked && <ArrowRight />}</button>
    </div>
    {!locked && <div className="hand-bottomline">{selected && isJewel(selected.kind) ? <div className="die-values"><span>上に向ける目</span>{[1, 2, 3, 4, 5, 6].map(value => <button key={value} disabled={!selectableValues(game, selected.kind as typeof COLORS[number], draft[1 - side]).includes(value)} aria-label={`${value}の目`} aria-pressed={selected.value === value} className={selected.value === value ? 'active' : ''} onClick={() => { const next: Selection = [...draft]; next[side] = { ...selected, value }; onDraft(next); if (side === 0 && !draft[1]) onSide(1); }}>{value}</button>)}</div> : <p>{selected?.kind === 'mining' ? '採掘権を使うと、中央の宝箱からサイコロが1個もらえます。' : selected?.kind === 'poison' ? '相手の泥棒を読んだら、薬瓶を忍ばせよう。' : selected?.kind === 'thief' ? '相手の宝石を奪う、泥棒のフィギュア。' : '手前のカップを選んで、手持ちの駒をタップ。'}</p>}{double && <span className="hand-warning">ゾロ目：盗まれなかった宝石は採掘場へ</span>}</div>}
    {locked && <p className="hand-secret">中身はあなただけの秘密。全員がそろうと「せーの」で公開します。</p>}
  </section>;
}
