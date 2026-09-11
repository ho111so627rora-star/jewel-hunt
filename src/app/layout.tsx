import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'ジュエルハント everyday — 宝石をめぐる10ターンの心理戦', description: '狙う、盗む、裏をかく。1〜4人とCPUで遊ぶ、スマホ対応のボードゲーム。' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ja"><body>{children}</body></html>; }
