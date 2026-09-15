'use client';
import { roomFetch } from '../lib/api';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { BoxCover } from './BoxCover';
import './front.css';
import type { Session } from '../server/types';
export function Home({ onSession, onRules }: { onSession: (s: Session) => void; onRules: () => void }) {
  const [count, setCount] = useState(1), [name, setName] = useState(''), [code, setCode] = useState('');
  const [mode, setMode] = useState<'standard' | 'duel'>('standard');
  const [tab, setTab] = useState('create'), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const maxHuman = mode === 'duel' ? 2 : 4;
  function selectMode(next: 'standard' | 'duel') { setMode(next); setCount(c => Math.min(c, next === 'duel' ? 2 : 4)); }
  async function submit() {
    setBusy(true); setError('');
    try {
      const response = await roomFetch('', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: tab, humanCount: count, name, code, mode }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error); onSession(result);
    } catch (e) { setError(e instanceof Error ? e.message : '接続に失敗しました'); } finally { setBusy(false); }
  }
  return <main className="home">
    <section className="hero"><div className="hero-copy"><p className="cover-kicker">カップに隠す、宝石のボードゲーム</p><h1>ファントムジェム<span>Phantom Gem</span></h1><p className="hero-description">宝石を出すか、泥棒を忍ばせるか。<br />向かいのカップを読んで、10ターン。</p></div><BoxCover /><p className="box-specs"><span>1〜4人で遊べます</span><span>1ターンの思考時間 60秒</span></p></section>
    <section className="setup-panel"><div className="panel-heading"><h2>さあ、席につこう。</h2><p>ひとりならCPUと。集まったら友だちと。</p></div>
      <div className="tabs"><button className={tab === 'create' ? 'active' : ''} onClick={() => { setTab('create'); setError(''); }}>ゲームを作る</button><button className={tab === 'join' ? 'active' : ''} onClick={() => { setTab('join'); setError(''); }}>ルームに参加</button></div>
      <form onSubmit={e => { e.preventDefault(); void submit(); }}><label className="field-label" htmlFor="hunter-name">あなたの名前<span>16文字まで</span></label><input id="hunter-name" maxLength={16} placeholder="プレイヤー" value={name} onChange={e => setName(e.target.value)} autoComplete="nickname" />
        {tab === 'create' ? <><label className="field-label">対戦モード</label><div className="player-count cols-2"><button type="button" aria-pressed={mode === 'standard'} className={mode === 'standard' ? 'selected' : ''} onClick={() => selectMode('standard')}><b>4人</b><span>通常戦</span></button><button type="button" aria-pressed={mode === 'duel'} className={mode === 'duel' ? 'selected' : ''} onClick={() => selectMode('duel')}><b>1対1</b><span>デュエル</span></button></div><div className="cpu-note"><span>{mode === 'duel' ? '1対1のデュエルでは4色ボーナスはありません' : '4人で卓を囲む通常戦です'}</span></div>
        <label className="field-label">遊ぶ人数<span>人間のプレイヤー数</span></label><div className={`player-count ${mode === 'duel' ? 'cols-2' : ''}`}>{Array.from({ length: maxHuman }, (_, i) => i + 1).map(n => <button type="button" key={n} aria-pressed={count === n} className={count === n ? 'selected' : ''} onClick={() => setCount(n)}><b>{n}</b><span>人プレイ</span></button>)}</div><div className="cpu-note"><span>{count === maxHuman ? `${maxHuman}人のプレイヤーで対戦します` : `${count}人で参加。空いた${maxHuman - count}席はCPUが入ります`}</span></div></> : <><label className="field-label" htmlFor="room-code">ルームコード</label><input className="code-input" id="room-code" maxLength={6} placeholder="ABC123" value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ''))} autoCapitalize="characters" autoComplete="off" required /></>}
        {error && <p role="alert" className="error">{error}</p>}<button className="primary start-button" disabled={busy || (tab === 'join' && code.length !== 6)}>{busy ? '接続中…' : tab === 'create' ? 'ハントを始める' : 'ルームに参加する'}<ArrowRight /></button>
      </form><p className="setup-footnote">友だちには、作成後に表示される招待コードを伝えてください。</p>
    </section>
    <section className="home-bottom"><p>初めて遊ぶ方へ。<br /><span>カップの中身と、宝石の集め方を紹介します。</span></p><button className="rules-link" onClick={onRules}>遊び方を読む <ArrowRight /></button></section>
  </main>;
}
