import { COLORS, LABELS } from '../../game/constants';
import { score } from '../../game/engine';
import { specialUsage } from '../../game/playerStats';
import type { Game } from '../../game/types';
import { Gem } from '../Gem';
export function PlayerIntel({ game, selected, opponent, me, onSelect }: { game: Game; selected: string; opponent: string; me: string; onSelect: (id: string) => void }) {
  const player = game.players.find(p => p.id === selected) || game.players[0];
  const points = score(player, game.phase === 'over');
  return <div className="player-intel"><div className="intel-tabs" role="tablist" aria-label="確認するプレイヤー">{game.players.map(p => <button key={p.id} role="tab" id={`intel-tab-${p.id}`} aria-controls="intel-panel" aria-selected={p.id === player.id} onClick={() => onSelect(p.id)}><Gem kind={p.color} /><span>{p.name}</span></button>)}</div>
    <section id="intel-panel" role="tabpanel" aria-labelledby={`intel-tab-${player.id}`}><div className="intel-heading"><div><span>{player.id === me ? 'あなたの席' : player.id === opponent ? '今回の対戦相手' : 'プレイヤーの公開情報'}</span><h3><Gem kind={player.color} />{player.name}</h3></div><strong>{points.total}<small>pt</small></strong></div>
      <h4>得点として持っている宝石</h4><div className="intel-jewels">{COLORS.map(color => {
        const jewels = player.jewels.filter(j => j.kind === color).sort((a, b) => b.value - a.value);
        const counts = new Map<number, number>(); jewels.forEach(j => counts.set(j.value, (counts.get(j.value) || 0) + 1));
        return <div className={`intel-color-row ${color}`} key={color}><span><Gem kind={color} />{LABELS[color]}</span><div>{counts.size ? [...counts].map(([value, count]) => <b key={value} aria-label={`${LABELS[color]} ${value}点 ${count}個`}>{value}{count > 1 && <small>×{count}</small>}</b>) : <small className="intel-none">未獲得</small>}</div><strong>{jewels.reduce((sum, j) => sum + j.value, 0)}<small>pt</small></strong></div>;
      })}</div>
      <div className="intel-bonus"><span>宝石合計 <b>{points.base}点</b></span>{player.completionBonus !== false && <span>4色ボーナス{game.phase === 'over' ? '' : '（終了時）'} <b>＋{points.bonus}点</b></span>}</div>
      <h4>特殊駒の使用状況</h4><p className="intel-note">公開済みの使用数です。不発だった駒も含みます。</p><div className="intel-specials">{specialUsage(player).map(item => <div key={item.kind} data-special={item.kind}><Gem kind={item.kind} /><b>{item.kind === 'mining' ? '採掘権' : LABELS[item.kind]}</b><span>使用済み <strong>{item.used}</strong> / {item.initial}</span><small>残り {item.remaining}個</small><div className="usage-pips" aria-hidden="true">{Array.from({ length: item.initial }, (_, i) => <i key={i} className={i < item.used ? 'spent' : ''} />)}</div></div>)}</div>
      <p className="intel-note">劇薬で失った宝石は、得点とこの一覧から除かれます。</p>
    </section></div>;
}
