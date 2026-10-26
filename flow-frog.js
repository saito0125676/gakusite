/* =========================================================
   ご依頼から納品までの流れ：ガクガエルがステップを跳んでいき、
   着地したステップを表示する(<ol class="flow-steps" data-frog>)
   ・スクロールで各ステップが画面に入ると、次のステップへ順番に跳ぶ
   ・「動きを減らす」設定の人には、カエルを出さず全ステップを表示
   ・chara-sheet.js(ドット絵)を先に読み込むこと
   ========================================================= */
(function () {
  'use strict';

  const list = document.querySelector('.flow-steps[data-frog]');
  if (!list || !window.CharaSheet || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const steps = Array.from(list.children);
  const frog = document.createElement('div');
  frog.className = 'flow-frog';
  frog.setAttribute('aria-hidden', 'true');
  const body = document.createElement('div');
  body.className = 'flow-frog-body';
  body.appendChild(window.CharaSheet.sprite('frog'));
  frog.appendChild(body);
  list.appendChild(frog);
  list.classList.add('has-frog');

  let landed = -1;   // いま乗っているステップ
  let target = -1;   // スクロールで到達したステップ
  let hopping = false;
  let pos = { x: 0, y: 0 };

  // ステップの番号の丸の上に乗る位置(.flow-steps 基準)
  function spotOf(i) {
    const li = steps[i], num = li.querySelector('.flow-num');
    return {
      x: li.offsetLeft + num.offsetLeft + num.offsetWidth / 2 - frog.offsetWidth / 2,
      y: li.offsetTop + num.offsetTop - frog.offsetHeight + 4,
      line: li.offsetTop + num.offsetTop + num.offsetHeight / 2
    };
  }
  function place(p) {
    pos = p;
    frog.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)';
  }
  function setLine(i) {
    list.style.setProperty('--flow-line', i < 0 ? '0px' : (spotOf(i).line - spotOf(0).line) + 'px');
  }

  // スタート地点:STEP 01 の左上で待機
  const first = spotOf(0);
  place({ x: first.x, y: first.y - 56 });

  function hopTo(i, done) {
    const from = pos, to = spotOf(i);
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const arc = Math.max(36, dist * .35);
    const dur = 560;
    let t0 = 0;
    body.classList.add('is-jump');
    function step(now) {
      if (!t0) t0 = now;
      const p = Math.min(1, (now - t0) / dur);
      place({ x: from.x + (to.x - from.x) * p, y: from.y + (to.y - from.y) * p - arc * 4 * p * (1 - p) });
      if (p < 1) { requestAnimationFrame(step); return; }
      body.classList.remove('is-jump');
      body.classList.remove('is-land'); void body.offsetWidth; body.classList.add('is-land');
      done();
    }
    requestAnimationFrame(step);
  }

  function next() {
    if (hopping || landed >= target) return;
    hopping = true;
    const i = landed + 1;
    hopTo(i, function () {
      landed = i;
      steps[i].classList.add('is-in');
      setLine(i);
      hopping = false;
      setTimeout(next, 120);
    });
  }

  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      target = Math.max(target, steps.indexOf(e.target));
      io.unobserve(e.target);
    });
    next();
  }, { rootMargin: '0px 0px -30% 0px' });
  steps.forEach(function (li) { io.observe(li); });

  // 画面幅が変わったら、いまの位置に置き直す
  window.addEventListener('resize', function () {
    if (hopping) return;
    if (landed >= 0) { place(spotOf(landed)); setLine(landed); }
    else { const s = spotOf(0); place({ x: s.x, y: s.y - 56 }); }
  });
})();
