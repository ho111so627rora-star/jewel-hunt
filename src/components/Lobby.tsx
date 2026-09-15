'use client';
import { useState } from 'react';
import { Check, Copy, Bot, UserRound, ArrowRight } from 'lucide-react';
import type { RoomView } from '../server/types';
import { COLORS, LABELS } from '../game/constants';
import { Gem } from './Gem';
export function Lobby({ room, act, busy }: { room: RoomView; act: (action: string, data?: object) => Promise<void>; busy: boolean }) {
  const [copied, setCopied] = useState(false);
  const full = room.seats.every(s => s.joined);
  const myColor = room.seats.find(s => s.id === room.me)?.color || 'ruby';
  async function copy() { try { await navigator.clipboard.writeText(room.code); setCopied(true); } catch { setCopied(false); } }
  return <main className="lobby">
    <div className="tavern-scene" aria-hidden="true"><i className="tavern-lantern lantern-a" /><i className="tavern-lantern lantern-b" /><i className="tavern-lantern lantern-c" /></div>
    <p className="lobby-caption">ファントムジェム / プレイの準備</p><h1>席についたら、始めよう。</h1><p className="muted">{room.humanCount === 1 ? 'CPUの準備はできています。好きな色を選んで始めましょう。' : '友だちにコードを伝えて、同じルームに集まろう。'}</p>
    <div className="room-ticket"><span className="ticket-seal" aria-hidden="true"><Gem kind={myColor} /></span><span>招待コード</span><strong>{room.code}</strong><button className="icon-button" onClick={copy} aria-label="招待コードをコピー">{copied ? <Check /> : <Copy />}</button></div>{copied && <p role="status" className="muted">招待コードをコピーしました</p>}
    <div className="tavern-table">
      <div className="lobby-seats">{room.seats.map(s => <div className={`lobby-seat ${s.color} ${s.joined ? '' : 'vacant'}`} key={s.id}><span className="seat-type">{s.cpu ? <Bot /> : <UserRound />}{s.cpu ? 'CPU' : s.id === room.me ? 'あなた' : '参加者'}</span><Gem kind={s.color} /><h3>{s.name}</h3><span className="seat-ready">{s.joined ? <><Check />準備OK</> : '参加待ち…'}</span></div>)}</div>
    </div>
    <div className="color-picker"><span>あなたの宝石</span>{COLORS.map(c => <button key={c} aria-label={LABELS[c]} aria-pressed={room.seats.find(s => s.id === room.me)?.color === c} disabled={busy || room.seats.some(s => s.id !== room.me && !s.cpu && s.joined && s.color === c)} onClick={() => void act('color', { color: c })}><Gem kind={c} /><span>{LABELS[c]}</span></button>)}</div>
    {room.host ? <button className="primary lobby-start" disabled={!full || busy} onClick={() => void act('start')}>{full ? '全員そろった！ ゲーム開始' : '友だちの参加を待っています'}<ArrowRight /></button> : <p className="waiting-message">ホストがゲームを開始するまでお待ちください。</p>}
  </main>;
}
