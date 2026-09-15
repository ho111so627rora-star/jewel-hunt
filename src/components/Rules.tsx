'use client';
import { X, Gem as GemIcon, ShieldCheck, Pickaxe, VenetianMask } from 'lucide-react';
import { useDialog } from './useDialog';
export function Rules({ onClose }: { onClose: () => void }) {
  useDialog(onClose);
  return <div className="modal-backdrop" onClick={onClose}><section className="modal rules" role="dialog" aria-modal="true" aria-labelledby="rules-title" onClick={e => e.stopPropagation()}>
    <button className="icon-button modal-close" aria-label="遊び方を閉じる" onClick={onClose}><X /></button>
    <p className="eyebrow">HOW TO PLAY</p><h2 id="rules-title">読み合いで、宝石を手に。</h2><p>全員で10ターン。集めた宝石の合計点が一番高いプレイヤーの勝ちです。同点なら同率優勝！</p>
    <ol className="rule-steps"><li><b>2個を選ぶ</b><span>袋から左右に1個ずつ。宝石は空いている数字を選びます。</span></li><li><b>全員で一斉公開</b><span>自分の左と相手の右、自分の右と相手の左が対決します。左右は各自から見た向きで、相手の席が正面・右隣・左隣でも同じです。</span></li><li><b>宝石を集める</b><span>数字がそのまま得点に。通常対戦では最後に4色そろうと＋5点。1対1モードでは4色ボーナスはありません。</span></li></ol>
    <div className="rule-effects"><p><GemIcon /><span><b>宝石</b>基本は自分が獲得。泥棒には盗まれます。</span></p><p><VenetianMask /><span><b>泥棒</b>相手が出した宝石を奪います。</span></p><p><ShieldCheck /><span><b>劇薬</b>泥棒を撃退し、相手の獲得済み宝石を1個選んで失わせます。その色・数字の枠が空き、全員が再び選べます。</span></p><p><Pickaxe /><span><b>採掘</b>採掘袋から宝石を1個追加。次のターンから使えます。</span></p></div>
    <div className="rule-warning"><b>欲張りすぎに、ご用心。</b><p>左右の宝石が同じ色・同じ数字だと「ゾロ目」で自分は得点できません。違う色なら同じ数字でも得点になります。全員の中で色と数字が重なると「バッティング」で採掘袋へ。</p></div>
    <p className="fine-print">特殊サイコロは使い切り。ゾロ目で盗まれなかった宝石は手持ちから減り、採掘場に戻ります。同じ色の2〜6は左右で別の数字を選びます（選べる数字が1つだけの場合を除く）。宝石が完売すると、その色は1点だけ選択できます。手持ちが足りない場合は残りを出し、空ならパスします。</p>
    <button className="primary" onClick={onClose}>さあ、ハントを始めよう</button>
  </section></div>;
}
