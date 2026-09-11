'use client';
import { useEffect, useState } from 'react';
import type { Game } from '../../game/types';
import { COLORS, LABELS } from '../../game/constants';
import { Gem } from '../Gem';

export function useMiningReveal(source: Game, me: string) {
  const events = ['result', 'poison'].includes(source.phase) ? (source.visualEvents || []).filter(e => e.type === 'mining' && e.player === me) : [];
  const key = events.length ? `${source.turn}:${events.map(e => e.die.id).join(':')}` : '';
  const [progress, setProgress] = useState({ key: '', step: 2 });
  const step = !key ? 2 : progress.key === key ? progress.step : 0;
  useEffect(() => {
    if (!key) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reveal = setTimeout(() => setProgress({ key, step: 1 }), reduced ? 600 : 2400);
    const complete = setTimeout(() => setProgress({ key, step: 2 }), reduced ? 1900 : 4300 + (source.visualEvents?.length || 0) * 210);
    return () => { clearTimeout(reveal); clearTimeout(complete); };
  }, [key]);
  const ids = new Set(events.map(e => e.die.id));
  const game = step === 0 ? {
    ...source,
    players: source.players.map(p => ({ ...p, bag: p.bag.filter(d => !ids.has(d.id)) })),
    visualEvents: source.visualEvents?.filter(e => e.type !== 'mining'),
    logs: source.logs.filter(log => !log.includes('が採掘！')),
  } : source;
  return { game, events, step, active: step < 2, mixing: step === 0 };
}

export function MiningReveal({ events, game, step }: { events: NonNullable<Game['visualEvents']>; game: Game; step: number }) {
  if (step >= 2 || !events.length) return null;
  return <div className={`mining-reveal ${step === 0 ? 'mixing' : 'revealed'}`} role="status" aria-label={step === 0 ? '採掘ガチャ演出中' : '採掘結果'}>
    <span className="mining-title">{step === 0 ? '宝箱をガラガラ…何色が出る？' : 'サイコロを獲得！'}</span>
    {step === 0 ? <div className="mining-tumbler" aria-hidden="true">{COLORS.map(color => <div key={color} className={`mined-cube ${color}`}><i /><i /><i /><i /><i /></div>)}<b>?</b></div> : <div className="mining-prizes">{events.map(e => <div key={e.die.id}><div className={`mined-cube ${e.die.kind}`} aria-hidden="true"><i /><i /><i /><i /><i /></div><span>{game.players.find(p => p.id === e.player)!.name}</span><small><Gem kind={e.die.kind} />{LABELS[e.die.kind]}</small></div>)}</div>}
  </div>;
}
