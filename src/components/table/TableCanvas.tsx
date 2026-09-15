'use client';
import { useEffect, useRef, useState } from 'react';
import { createTable, type TableState } from './scene';
import { score } from '../../game/engine';
import { DieFace } from '../Gem';
import { specialUsage } from '../../game/playerStats';
import { LABELS } from '../../game/constants';
export default function TableCanvas({ state, opponent, onSide, onChest, onPlayer }: { state: TableState; opponent: string; onSide: (side: number) => void; onChest: () => void; onPlayer: (id: string) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null), container = useRef<HTMLDivElement>(null);
  const scene = useRef<ReturnType<typeof createTable> | null>(null);
  const callbacks = useRef({ onSide, onChest }); callbacks.current = { onSide, onChest };
  const latest = useRef(state); latest.current = state;
  const [fallback, setFallback] = useState(false), [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!canvas.current) return;
    let context: ReturnType<typeof createTable> | null = null;
    try {
      context = createTable(canvas.current, (id, x, y) => {
        const node = container.current?.querySelector<HTMLElement>(`[data-anchor="${id}"]`);
        if (node && container.current) {
          const width = container.current.clientWidth, half = node.offsetWidth / 2 + 4;
          node.style.left = `${Math.max(half, Math.min(width - half, width * x / 100))}px`; node.style.top = `${y}%`;
        }
      }, side => callbacks.current.onSide(side), () => callbacks.current.onChest());
      scene.current = context; context.update(latest.current); setLoaded(true);
    } catch { setFallback(true); }
    function lost(event: Event) { event.preventDefault(); setFallback(true); }
    const element = canvas.current; element.addEventListener('webglcontextlost', lost);
    return () => { element.removeEventListener('webglcontextlost', lost); context?.dispose(); scene.current = null; };
  }, []);
  useEffect(() => { scene.current?.update(state); }, [state]);
  const revealed = ['inspect', 'result', 'poison', 'over'].includes(state.game.phase);
  const myIndex = state.game.players.findIndex(p => p.id === state.me);
  const opponentOffset = (state.game.players.findIndex(p => p.id === opponent) - myIndex + 4) % 4;
  return <div className={`table-world ${loaded ? 'world-loaded' : ''} ${fallback ? 'world-fallback' : ''}`} ref={container} data-viewer-seat={state.me} data-match-from={state.me} data-match-to={opponent} data-renderer={fallback ? 'fallback' : loaded ? 'webgl' : 'loading'}>
    {!fallback && <canvas ref={canvas} className="table-canvas" aria-label="あなたの席から見た4人の立体ゲーム卓。手前のカップと中央の宝箱をタップできます。" />}
    {fallback && <div className="flat-table"><p>軽量表示でプレイ中</p>{state.game.players.map((p, i) => <div className={`flat-seat flat-seat-${(i - myIndex + 4) % 4}`} key={p.id}>{(revealed ? state.game.selections[p.id] : p.id === state.me ? state.draft : [null, null])?.map((play, side) => <DieFace key={side} play={play} hidden={!revealed && (p.id !== state.me || state.locked.includes(p.id))} />)}</div>)}</div>}
    {fallback && state.game.phase !== 'over' && <svg className="flat-match-guide" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="自分の左と相手の右、自分の右と相手の左を結ぶライン"><path d={opponentOffset === 1 ? 'M43 74 Q49 49 82 41' : opponentOffset === 2 ? 'M43 74 C22 64 22 35 43 24' : 'M43 74 Q23 69 18 55'} /><path className="right-cup-line" d={opponentOffset === 1 ? 'M57 74 Q79 69 82 55' : opponentOffset === 2 ? 'M57 74 C78 64 78 35 57 24' : 'M57 74 Q51 49 18 41'} /></svg>}
    {state.game.players.map((p, i) => <button type="button" aria-label={`${p.name}の宝石と使用状況を見る`} onClick={() => onPlayer(p.id)} data-anchor={p.id} data-player={p.id} data-seat-offset={(i - myIndex + 4) % 4} key={p.id} className={`table-nameplate ${p.color} ${p.id === state.me ? 'my-nameplate' : ''} ${p.id === opponent ? 'rival-nameplate' : ''}`}>
      <span className="nameplate-dot" /><b>{p.name}</b><span className="nameplate-score">{score(p, state.game.phase === 'over').total}<small>pt</small></span><small className="seat-caption">{p.id === state.me ? 'あなたの席' : p.id === opponent ? '今回の対戦相手' : p.cpu ? 'CPU' : 'プレイヤー'}{state.locked.includes(p.id) && !revealed ? ' · 準備OK' : ''}</small>
      <span className="seat-usage"><small>使用</small>{specialUsage(p).map(item => <span key={item.kind} title={`${LABELS[item.kind]}：使用済み${item.used}個、残り${item.remaining}個`}><span>{item.kind === 'thief' ? '泥' : item.kind === 'poison' ? '薬' : '採'}</span><b>{item.used}</b></span>)}</span>
    </button>)}
    {state.game.phase !== 'over' && <span className="match-legend"><span><i />自分の左 ↔ 相手の右</span><span><i className="right-cup-line" />自分の右 ↔ 相手の左</span></span>}
    <button className="chest-label" data-anchor="chest" onClick={onChest} aria-label="中央の宝箱と宝石マーケットを見る"><span>共有の宝箱</span><small>サイコロ {(state.game.miningCount ?? state.game.miningBag.length)}個</small></button>
    {!loaded && !fallback && <div className="world-loading">テーブルに着いています…</div>}
  </div>;
}
