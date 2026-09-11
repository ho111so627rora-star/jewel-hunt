'use client';
import { useEffect, useRef } from 'react';
import { basePath } from '../lib/api';

export function Bgm() {
  const audio = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const track = audio.current!;
    const start = () => {
      if (!document.hidden && track.paused) void track.play().catch(() => { /* Retry on the next user gesture if autoplay is blocked. */ });
    };
    const visibility = () => { if (document.hidden) track.pause(); else start(); };
    document.addEventListener('click', start);
    document.addEventListener('keydown', start);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      document.removeEventListener('click', start);
      document.removeEventListener('keydown', start);
      document.removeEventListener('visibilitychange', visibility);
      track.pause();
    };
  }, []);
  return <audio ref={audio} src={basePath + '/audio/bgm.mp3'} loop preload="none" />;
}

