'use client';
import { useEffect, useState } from 'react';
export function TurnClock({ deadline, serverNow }: { deadline: number; serverNow?: number }) {
  const [remaining, setRemaining] = useState(60);
  useEffect(() => {
    const received = performance.now(), baseTime = serverNow ?? Date.now();
    const update = () => setRemaining(Math.max(0, Math.min(60, Math.ceil((deadline - baseTime - (performance.now() - received)) / 1000))));
    update(); const timer = setInterval(update, 200); return () => clearInterval(timer);
  }, [deadline, serverNow]);
  return <div className={`turn-clock ${remaining <= 10 ? 'urgent' : ''}`}><span>思考時間</span><b role="timer" aria-label="選択の残り時間">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</b><small>時間切れはCPUが自動選択</small></div>;
}
