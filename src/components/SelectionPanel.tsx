'use client';
import { useEffect, useState } from 'react';
import { ArrowRight, LockKeyhole, Check, Pickaxe } from 'lucide-react';
import type { Game, Kind, Play, Player, Selection } from '../game/types';
import { COLORS, LABELS, isJewel } from '../game/constants';
import { values } from '../game/engine';
import { DieFace, Gem } from './Gem';
export function SelectionPanel({ game, player, locked, busy, onLock }: { game: Game; player: Player; locked: boolean; busy: boolean; onLock: (selection: Selection) => void }) {
  const [selection, setSelection] = useState<Selection>([null, null]), [side, setSide] = useState(0);
  useEffect(() => { setSelection(game.selections[player.id] || [null, null]); setSide(0); }, [game.turn, player.id]); // Reset only on a new turn.
  const chosen = selection.filter(Boolean).length, required = Math.min(2, player.bag.length);
  function selectKind(kind: Kind) {
    const die = player.bag.find(d => d.kind === kind && d.id !== selection[1 - side]?.id);
    if (!die) return;
    const play: Play = { ...die, value: isJewel(kind) ? values(game, kind).at(-1)! : 0 };
    setSelection(s => { const next: Selection = [...s]; next[side] = play; return next; });
    if (!isJewel(kind) && side === 0 && !selection[1]) setSide(1);
  }
  const selected = selection[side];
  const double = selection[0] && selection[1] && isJewel(selection[0].kind) && isJewel(selection[1].kind) && selection[0].kind === selection[1].kind && selection[0].value === selection[1].value;
  if (locked) return <section className="locked-panel"><div className="lock-emblem"><LockKeyhole /></div><p className="eyebrow">LOCKED IN</p><h2>一手を、隠しました。</h2><p>全員の選択がそろうと、一斉公開します。</p><div className="selected-cups">{(game.selections[player.id] || selection).map((p, i) => <DieFace key={i} play={p} />)}</div></section>;
  return <section className="selection-panel"><div className="section-heading"><div><p className="eyebrow">MAKE YOUR MOVE</p><h2>2つのサイコロを選ぼう</h2></div><span>{chosen} / {required}</span></div>
    <div className="selection-slots">{[0, 1].map(i => <button className={`selection-slot ${side === i ? 'active' : ''}`} key={i} onClick={() => setSide(i)} aria-label={`${i === 0 ? '左' : '右'}のサイコロを選択`} aria-pressed={side === i}><span className="slot-label">{i === 0 ? 'LEFT' : 'RIGHT'}<small>{i === 0 ? '左の手' : '右の手'}</small></span>{selection[i] ? <DieFace play={selection[i]} /> : <div className="empty-slot"><span>＋</span><small>{player.bag.length <= i ? 'パス' : 'サイコロを選ぶ'}</small></div>}<span className="slot-check">{selection[i] ? <Check /> : null}</span></button>)}</div>
    <div className="bag-heading"><span>YOUR BAG <b>あなたの袋</b></span><small>{player.bag.length}個</small></div><div className="bag-options">{([...COLORS, 'thief', 'mining', 'poison'] as Kind[]).map(kind => {
      const count = player.bag.filter(d => d.kind === kind && d.id !== selection[1 - side]?.id).length;
      if (!player.bag.some(d => d.kind === kind)) return null;
      return <button key={kind} disabled={!count} className={`bag-option ${selected?.kind === kind ? 'active' : ''}`} onClick={() => selectKind(kind)} aria-label={`${LABELS[kind]} 残り${count}個`}><Gem kind={kind} /><span>{LABELS[kind]}</span><small>×{count}</small></button>;
    })}</div>
    {selected && isJewel(selected.kind) ? <div className="value-picker"><span>数字を選ぶ <small>数字＝得点</small></span><div>{[1, 2, 3, 4, 5, 6].map(v => <button key={v} className={selected.value === v ? 'active' : ''} disabled={!values(game, selected.kind as typeof COLORS[number]).includes(v)} onClick={() => { setSelection(s => { const next: Selection = [...s]; next[side] = { ...selected, value: v }; return next; }); if (side === 0 && !selection[1]) setSide(1); }}>{v}</button>)}</div></div> : <p className="selection-hint">{selected?.kind === 'thief' ? '相手の宝石を盗む。ただし劇薬には注意。' : selected?.kind === 'poison' ? '泥棒を撃退し、相手の獲得済み宝石を失わせる。' : selected?.kind === 'mining' ? '採掘袋から宝石を1個、あなたの袋へ。' : '左右の枠をタップしてから、袋のサイコロを選んでください。'}</p>}
    {double && <p className="double-warning">ゾロ目です！ 自分の宝石は得点になりません。</p>}
    <button className="primary lock-button" disabled={busy || chosen !== required} onClick={() => onLock(selection)}><LockKeyhole />{busy ? '確定中…' : required === 0 ? 'パスして決定' : 'この2つで決定'}<ArrowRight /></button><p className="fine-print">決定後の変更はできません。選択は公開まで秘密です。</p><div className="mining-count"><Pickaxe /> 採掘袋 <b>{game.miningBag.length}個</b><span>新しい色を手に入れるチャンス</span></div>
  </section>;
}
