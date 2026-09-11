import { Gem } from './Gem';
import { COLORS, LABELS } from '../game/constants';
import type { Game } from '../game/types';
export function Market({ game }: { game: Game }) {
  return <section className="market"><div className="section-heading"><div><p className="eyebrow">JEWEL MARKET</p><h2>宝石マーケット</h2></div><span>空いている数字を狙おう</span></div><div className="market-rows">{COLORS.map(color => <div className={`market-row ${color}`} key={color}><div className="market-name"><Gem kind={color} /><span>{LABELS[color]}</span></div><div className="market-numbers">{game.market[color].map((owner, i) => <div key={i} className={`market-slot ${owner ? 'claimed' : ''}`} title={owner ? `${game.players.find(p => p.id === owner)?.name}が獲得済み` : `${i + 1}点：未獲得`}><b>{i + 1}</b>{owner && <span className={game.players.find(p => p.id === owner)!.color}>{game.players.findIndex(p => p.id === owner) + 1}</span>}</div>)}</div>{game.market[color].every(Boolean) && <span className="sold-label">完売 · 以後1点</span>}</div>)}</div></section>;
}
