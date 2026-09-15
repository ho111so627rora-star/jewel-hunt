import { PieceIcon } from './table/PieceIcon';

function LeatherCup({ className }: { className: string }) {
  return <div className={`cover-cup ${className}`}><div className="cover-cup-base" /><div className="cover-cup-body"><span>PG</span></div><div className="cover-cup-rim" /></div>;
}
export function BoxCover() {
  return <div className="box-cover" aria-hidden="true">
    <div className="cover-print"><span>ファントムジェム</span><i>Phantom Gem</i></div>
    <div className="cover-felt" />
    <LeatherCup className="cup-a" /><LeatherCup className="cup-b" />
    <div className="cover-piece cover-ruby"><PieceIcon kind="ruby" /></div>
    <div className="cover-piece cover-blue"><PieceIcon kind="sapphire" /></div>
    <div className="cover-piece cover-thief"><PieceIcon kind="thief" /></div>
    <div className="cover-piece cover-poison"><PieceIcon kind="poison" /></div>
    <div className="cover-piece cover-mine"><PieceIcon kind="mining" /></div>
    <div className="cover-colophon"><span>4つの席。2つのカップ。</span><span>中身は、せーので。</span></div>
  </div>;
}
