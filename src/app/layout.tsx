import type { Metadata } from 'next';
import { Fraunces } from 'next/font/google';
import './globals.css';
const fraunces = Fraunces({ subsets: ['latin'], weight: ['400', '600', '900'], style: ['normal', 'italic'], variable: '--font-display', display: 'swap' });
export const metadata: Metadata = { title: 'ファントムジェム Phantom Gem — 宝石をめぐる10ターンの心理戦', description: '狙う、盗む、裏をかく。1〜4人とCPUで遊ぶ、スマホ対応のボードゲーム。' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ja" className={fraunces.variable}><body>{children}</body></html>; }
