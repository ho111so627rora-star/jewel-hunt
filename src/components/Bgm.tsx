'use client';
import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { basePath } from '../lib/api';

export function Bgm() {
  const audio = useRef<HTMLAudioElement>(null);
  const enabled = useRef(true);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const track = audio.current!;
    track.volume = 0.3;
    try { enabled.current = localStorage.getItem('jewel-hunt-bgm') !== 'off'; } catch { /* Optional preference. */ }
    const start = () => {
      if (enabled.current && !document.hidden && track.paused) void track.play().catch(() => { /* A later tap can retry. */ });
    };
    const gesture = (event: Event) => {
      if (event.target instanceof Element && event.target.closest('[data-bgm-toggle]')) return;
      start();
    };
    const visibility = () => { if (document.hidden) track.pause(); else start(); };
    document.addEventListener('click', gesture);
    document.addEventListener('keydown', gesture);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      document.removeEventListener('click', gesture);
      document.removeEventListener('keydown', gesture);
      document.removeEventListener('visibilitychange', visibility);
      track.pause();
    };
  }, []);
  function toggle() {
    const track = audio.current!;
    if (!track.paused) {
      enabled.current = false;
      track.pause();
    } else {
      enabled.current = true;
      void track.play().catch(() => setPlaying(false));
    }
    try { localStorage.setItem('jewel-hunt-bgm', enabled.current ? 'on' : 'off'); } catch { /* Optional preference. */ }
  }
  return <>
    <audio ref={audio} src={basePath + '/audio/bgm.mp3'} loop preload="none"
      onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setPlaying(false)} />
    <button type="button" className="icon-button" data-bgm-toggle aria-label={playing ? 'BGMをオフにする' : 'BGMをオンにする'}
      title={playing ? 'BGM オン' : 'BGM オフ'} aria-pressed={playing} onClick={toggle}>
      {playing ? <Volume2 /> : <VolumeX />}
    </button>
  </>;
}

