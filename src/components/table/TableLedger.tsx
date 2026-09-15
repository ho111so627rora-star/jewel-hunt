import type { Game } from '../../game/types';
import { COLORS, LABELS } from '../../game/constants';
import { score } from '../../game/engine';
import { Gem, DieFace } from '../Gem';

export function TableLedger({ game, me }: { game: Game; me: string }) {
  const open = ['inspect', 'poison', 'result', 'over'].includes(game.phase);
  const activeColors = COLORS.filter(color => game.players.some(p => p.color === color));
  return <section className="table-ledger" aria-label="全員の宝石と公開した駒">
    {game.players.map(p => <article className={`ledger-seat ${p.color}`} key={p.id} data-ledger-player={p.id}>
      <header><Gem kind={p.color} /><b>{p.name}{p.id === me ? '（あなた）' : ''}</b><strong>{score(p, game.phase === 'over').total}<small>pt</small></strong></header>
      {open && <><p className="ledger-label">今回出した駒</p><div className="ledger-plays" aria-label={`${p.name}の公開した駒`}>{game.selections[p.id]?.map((play, i) => <div key={i}><small>{i === 0 ? '左' : '右'}</small><DieFace play={play} /></div>)}</div></>}
      <p className="ledger-label">獲得済みの宝石 · 得点</p>
      <div className="ledger-jewels" aria-label={`${p.name}の得点の内訳`}>{activeColors.map(color => {
        const jewels = p.jewels.filter(j => j.kind === color);
        return <div key={color}><Gem kind={color} /><span className={color}>{jewels.length ? [...new Set(jewels.map(j => j.value))].sort((a,b) => a-b).map(value => <b key={value} aria-label={`${LABELS[color]} ${value}点 ${jewels.filter(j => j.value === value).length}個`}>{value}{jewels.filter(j => j.value === value).length > 1 && <small>×{jewels.filter(j => j.value === value).length}</small>}</b>) : <small>—</small>}</span></div>;
      })}</div>
      {open && game.phase !== 'inspect' && (game.visualEvents || []).filter(e => e.type === 'thief' && (e.player === p.id || e.from === p.id)).map(e => {
        const recipient = game.players.find(player => player.id === e.player)!;
        const sender = game.players.find(player => player.id === e.from)!;
        const awarded = recipient.jewels.find(j => j.id === e.die.id);
        return <div className="theft-receipt" key={e.die.id} data-theft-direction={p.id === e.player ? 'received' : 'lost'}><Gem kind="thief" /><span><b>{p.id === e.player ? `${sender.name}から獲得` : `${recipient.name}の泥棒に渡った`}</b><span><Gem kind={e.die.kind} />{LABELS[e.die.kind]} {e.die.value}</span><small>{awarded ? `${recipient.name}の得点に ＋${awarded.value}点` : '得点の確定待ち'}</small></span></div>;
      })}
      {p.id === me && open && game.phase !== 'inspect' && (game.visualEvents || []).filter(e => e.type === 'mining' && e.player === me).map(e => <div className="mined-die" key={e.die.id} aria-label={`${p.name}が採掘で獲得した${LABELS[e.die.kind]}のサイコロ`}><div className={`mined-cube ${e.die.kind}`} aria-hidden="true"><i /><i /><i /><i /><i /></div><span><b>採掘で獲得 · あなただけに表示</b><small>{LABELS[e.die.kind]} · 手持ちに追加</small><small>出目は次に使うときに選択</small></span></div>)}
    </article>)}
  </section>;
}
