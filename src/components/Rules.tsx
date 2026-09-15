'use client';
import { X } from 'lucide-react';
import { useDialog } from './useDialog';
import { DieFace } from './Gem';
import type { Play } from '../game/types';

const die = (kind: Play['kind'], value = 0): Play => ({ id: kind + value, kind, value });

export function Rules({ onClose }: { onClose: () => void }) {
  useDialog(onClose);
  return <div className="modal-backdrop" onClick={onClose}><section className="modal rules" role="dialog" aria-modal="true" aria-labelledby="rules-title" onClick={e => e.stopPropagation()}>
    <button className="icon-button modal-close" aria-label="遊び方を閉じる" onClick={onClose}><X /></button>
    <p className="eyebrow">HOW TO PLAY</p><h2 id="rules-title">読み合いで、宝石を手に。</h2><p>全員で10ターン。集めた宝石の合計点が一番高いプレイヤーの勝ちです。同点なら同率優勝！</p>

    <ol className="rule-steps">
      <li><b>2個を選ぶ</b><span>袋から左右に1個ずつ。宝石は空いている数字を選びます。</span></li>
      <li><b>全員で一斉公開</b><span>自分の左と相手の右、自分の右と相手の左が対決します。左右は各自から見た向きです。</span></li>
      <li><b>宝石を集める</b><span>数字がそのまま得点に。通常対戦では最後に4色そろうと＋5点。1対1モードでは4色ボーナスはありません。</span></li>
    </ol>

    <div className="rule-match" aria-hidden="true">
      <span className="rule-match-tag">相手</span>
      <div className="rule-match-grid">
        <div className="rule-match-col"><div className="cup"><span>右</span></div><div className="rule-match-link gold" /><div className="cup"><span>左</span></div></div>
        <div className="rule-match-col"><div className="cup"><span>左</span></div><div className="rule-match-link cyan" /><div className="cup"><span>右</span></div></div>
      </div>
      <span className="rule-match-tag">あなた</span>
      <div className="rule-match-legend">
        <span><i className="gold" />自分の左 ↔ 相手の右</span>
        <span><i className="cyan" />自分の右 ↔ 相手の左</span>
      </div>
    </div>

    <div className="rule-effect-grid">
      <div className="rule-effect-card"><div className="rule-effect-die"><DieFace play={die('ruby', 5)} /></div><div><b>宝石</b><span>基本は自分が獲得。泥棒には盗まれます。</span></div></div>
      <div className="rule-effect-card"><div className="rule-effect-die"><DieFace play={die('thief')} /></div><div><b>泥棒</b><span>相手が出した宝石を奪います。</span></div></div>
      <div className="rule-effect-card"><div className="rule-effect-die"><DieFace play={die('poison')} /></div><div><b>劇薬</b><span>相手の泥棒を撃退し、獲得済み宝石を1個選んで失わせます。</span></div></div>
      <div className="rule-effect-card"><div className="rule-effect-die"><DieFace play={die('mining')} /></div><div><b>採掘</b><span>採掘袋から宝石を1個追加。次のターンから使えます。</span></div></div>
    </div>

    <div className="rule-warning">
      <b>欲張りすぎに、ご用心。</b>
      <div className="rule-compare">
        <div className="rule-compare-case bad"><div className="rule-compare-dice"><DieFace play={die('ruby', 4)} /><DieFace play={die('ruby', 4)} /></div><span className="rule-compare-tag">NG・ゾロ目</span><small>左右が同じ色・同じ数字は0点</small></div>
        <div className="rule-compare-case good"><div className="rule-compare-dice"><DieFace play={die('ruby', 4)} /><DieFace play={die('sapphire', 4)} /></div><span className="rule-compare-tag">OK</span><small>色が違えば同じ数字でも得点</small></div>
        <div className="rule-compare-case bad"><div className="rule-compare-dice"><DieFace play={die('emerald', 3)} /><DieFace play={die('emerald', 3)} /></div><span className="rule-compare-tag">バッティング</span><small>全員の中で色・数字が重複すると採掘袋へ</small></div>
      </div>
    </div>

    <p className="fine-print">特殊サイコロは使い切り。ゾロ目で盗まれなかった宝石は手持ちから減り、採掘場に戻ります。同じ色の2〜6は左右で別の数字を選びます（選べる数字が1つだけの場合を除く）。宝石が完売すると、その色は1点だけ選択できます。手持ちが足りない場合は残りを出し、空ならパスします。</p>
    <button className="primary" onClick={onClose}>さあ、ゲームを始めよう</button>
  </section></div>;
}
