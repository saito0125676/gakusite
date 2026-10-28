/* =========================================================
   よくある質問：答えをRPGのように1文字ずつ表示する
   ・<p data-fq-type> の文章を、質問をひらいたときに文字送りします
   ・文字送り中にセリフ枠をクリックすると、全文をすぐに出します
   ・読み上げソフトには最初から全文を渡します
   ・「動きを減らす」設定の人には文字送りをしません
   ========================================================= */
(function () {
  'use strict';

  const SPEED = 28; // 1文字あたりのミリ秒
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  // 文章を1文字ずつの <span> に分ける（<br> や <strong> はそのまま残す）
  function split(node, out) {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        for (const ch of n.textContent) {
          const s = document.createElement('span');
          s.className = 'fq-ch is-on';
          s.textContent = ch;
          frag.appendChild(s); out.push(s);
        }
        n.replaceWith(frag);
      } else if (n.nodeType === 1) split(n, out);
    });
  }

  function setup(item) {
    const msg = item.querySelector('[data-fq-type]');
    if (!msg) return;
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.innerHTML = msg.innerHTML;
    const shown = document.createElement('span');
    shown.setAttribute('aria-hidden', 'true');
    shown.innerHTML = msg.innerHTML;
    msg.replaceChildren(sr, shown);
    const chars = [];
    split(shown, chars);

    let timer = 0;
    function finish() {
      clearInterval(timer); timer = 0;
      chars.forEach(c => c.classList.add('is-on'));
      msg.classList.remove('is-typing');
    }
    function play() {
      finish();
      chars.forEach(c => c.classList.remove('is-on'));
      msg.classList.add('is-typing');
      let i = 0;
      timer = setInterval(() => {
        if (i >= chars.length) return finish();
        chars[i++].classList.add('is-on');
      }, SPEED);
    }

    item.addEventListener('toggle', () => { if (item.open) play(); else finish(); });
    msg.addEventListener('click', () => { if (timer) finish(); });
  }

  function init() { document.querySelectorAll('.fq-item').forEach(setup); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
