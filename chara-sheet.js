/* =========================================================
   キャラシート：ドット絵のサメを描くスクリプト
   <canvas data-cs-sprite> を見つけて、海の中で泳ぐサメを描きます。
   ・画面外にあるときは描画を止めます
   ・「動きを減らす」設定の人には止まった1枚絵を表示します
   ========================================================= */
(function () {
  'use strict';

  const W = 96, H = 72, SAND = 62;
  const C = {
    w1: '#2a76a6', w2: '#1d5c86', w3: '#174f78', w4: '#134671',
    ray: '#bfe8f5', surf: '#bfe8f5', bubble: '#d6f1fa',
    sand: '#d9b46a', sand2: '#b8914c', sand3: '#f0d08e',
    weed: '#2f9e6e', weed2: '#1f7a52',
    O: '#0b1e37', D: '#5b6e88', B: '#7f93ad', L: '#e6edf3', G: '#5b6e88',
    E: '#061426', Wt: '#ffffff', M: '#0b1e37', T: '#ffffff',
    fish: '#f5a442', fin: '#d9752a'
  };

  // 36×17 のサメ（右向き）
  const SHARK = [
    '................OO..................',
    '...............ODDO.................',
    'OO............ODDDO.................',
    'ODO..........ODDDDO.................',
    'ODDO........ODDDDDDOOOO.............',
    '.ODDO...OOOODDDDDDDDDDDOOOO.........',
    '.ODDDOOODDDDDDDDDDDDDDDDDDDOOO......',
    '..ODDDDBBBBBBBBBBBBBBBGBGBBBBBOOO...',
    '..ODBBBBBBBBBBBBBBBBBBGBGBBBBWEBBO..',
    '...OBBBBBBBBBBBBBBBBBBGBGBBBBBBBBBO.',
    '..OBBBBBLLLLLLLLLLLLLLLLLLLLLMMMMOO.',
    '.OBBBOOLLLLLLLLLLLLLLLLLLLLLLTOTOO..',
    '.OBBO..OOLLLLLLLLLLLLLLOOOOOOO......',
    'OBBO.....OOOOBBBBBBOOOO.............',
    'OBO..........OBBBBO.................',
    'OO............OBBO..................',
    '...............OO...................'
  ];
  const FISH = ['f.FFF..', 'ffFFFEF', 'ffFFFFF', 'f.FFF..'];
  const MAP = { O: C.O, D: C.D, B: C.B, L: C.L, G: C.G, E: C.E, W: C.Wt, M: C.M, T: C.T, F: C.fish, f: C.fin };

  function toCanvas(rows, flip) {
    const w = rows[0].length, h = rows.length;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d');
    if (flip) { x.translate(w, 0); x.scale(-1, 1); }
    rows.forEach((r, y) => [...r].forEach((ch, i) => { if (MAP[ch]) { x.fillStyle = MAP[ch]; x.fillRect(i, y, 1, 1); } }));
    return c;
  }

  let shared = null;
  function assets() {
    if (shared) return shared;
    const bg = document.createElement('canvas'); bg.width = W; bg.height = H;
    const b = bg.getContext('2d');
    const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const bands = [[0, hex(C.w1)], [16, hex(C.w2)], [34, hex(C.w3)], [50, hex(C.w4)]];
    const img = b.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let k = 0; for (let i = 0; i < bands.length; i++) if (y >= bands[i][0]) k = i;
      let col = bands[k][1];
      const into = y - bands[k][0];
      if (k > 0 && into < 4) {
        const pat = into < 2 ? ((x + y) % 2 === 0 || x % 2 === 0) : (x + y) % 2 === 0;
        if (pat) col = bands[k - 1][1];
      }
      const o = (y * W + x) * 4;
      img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255;
    }
    b.putImageData(img, 0, 0);
    b.globalAlpha = .08; b.fillStyle = C.ray;
    [[14, 10], [44, 7], [74, 11]].forEach(([x, w]) => {
      b.beginPath(); b.moveTo(x, 0); b.lineTo(x + w, 0); b.lineTo(x + w - 16, SAND); b.lineTo(x - 22, SAND); b.closePath(); b.fill();
    });
    b.globalAlpha = 1;
    for (let x = 0; x < W; x++) {
      const top = SAND + Math.round(Math.sin(x * .14) * 1.2 + Math.sin(x * .37) * .8);
      b.fillStyle = C.sand; b.fillRect(x, top, 1, H - top);
      b.fillStyle = C.sand3; b.fillRect(x, top, 1, 1);
    }
    let s = 11; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    b.fillStyle = C.sand2;
    for (let i = 0; i < 28; i++) b.fillRect(Math.floor(r() * W), SAND + 3 + Math.floor(r() * 7), 1, 1);
    shared = { bg, shark: toCanvas(SHARK), fishR: toCanvas(FISH), fishL: toCanvas(FISH, true) };
    return shared;
  }

  const WEEDS = [[6, 14], [11, 9], [70, 12], [84, 16], [89, 10]];
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setup(cv) {
    if (cv.__csReady) return;
    cv.__csReady = true;
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const a = assets();

    const bubbles = Array.from({ length: 7 }, () => ({ x: Math.random() * W, y: Math.random() * SAND, v: 5 + Math.random() * 6, p: Math.random() * 6, s: Math.random() < .35 ? 2 : 1 }));
    const fish = { x: -10, y: 18, v: 9, dir: 1, wait: 2 };
    let visible = true, raf = 0, last = performance.now(), t0 = performance.now();

    function frame(now) {
      raf = 0;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      const t = (now - t0) / 1000;
      draw(t, dt);
      if (visible && !reduce) raf = requestAnimationFrame(frame);
    }

    function draw(t, dt) {
      ctx.drawImage(a.bg, 0, 0);
      // 水面のきらめき
      ctx.fillStyle = C.surf;
      for (let x = 0; x < W; x += 2) if (Math.sin(x * .4 + t * 2.4) > .55) ctx.fillRect(x, 0, 2, 1);
      // 海藻
      for (const [wx, wh] of WEEDS) {
        for (let i = 0; i < wh; i++) {
          const px = wx + Math.round(Math.sin(t * 1.6 + i * .4 + wx) * (i / wh) * 2);
          ctx.fillStyle = i % 3 === 0 ? C.weed2 : C.weed; ctx.fillRect(px, SAND + 1 - i, 2, 1);
        }
      }
      // ときどき横切る小魚
      if (dt) {
        if (fish.wait > 0) fish.wait -= dt;
        else {
          fish.x += fish.v * fish.dir * dt;
          if (fish.x > W + 10 || fish.x < -10) {
            fish.dir = Math.random() < .5 ? 1 : -1;
            fish.x = fish.dir > 0 ? -8 : W + 1;
            fish.y = 8 + Math.random() * 12; fish.wait = 3 + Math.random() * 4;
          }
        }
      }
      if (fish.wait <= 0) ctx.drawImage(fish.dir > 0 ? a.fishR : a.fishL, Math.round(fish.x), Math.round(fish.y + Math.sin(t * 4) * 1));
      // 泡
      ctx.fillStyle = C.bubble;
      for (const b of bubbles) {
        if (dt) { b.y -= b.v * dt; b.p += dt * 3; if (b.y < 1) { b.y = SAND; b.x = Math.random() * W; } }
        const bx = Math.round(b.x + Math.sin(b.p) * 1.2), by = Math.round(b.y);
        if (b.s === 2) { ctx.fillRect(bx, by - 1, 1, 1); ctx.fillRect(bx - 1, by, 1, 1); ctx.fillRect(bx + 1, by, 1, 1); ctx.fillRect(bx, by + 1, 1, 1); }
        else ctx.fillRect(bx, by, 1, 1);
      }
      // サメ本体：上下にゆらゆら＋しっぽを振る＋まばたき
      const sx = 30, sy = 26 + Math.round(Math.sin(t * 1.8) * 2);
      const wag = Math.round(Math.sin(t * 5));
      ctx.drawImage(a.shark, 0, 0, 7, 17, sx, sy + wag, 7, 17);
      ctx.drawImage(a.shark, 7, 0, 29, 17, sx + 7, sy, 29, 17);
      if (t % 3.2 < .14) { ctx.fillStyle = C.D; ctx.fillRect(sx + 29, sy + 8, 2, 1); }
      // サメの泡
      if (dt && Math.random() < dt * 1.2) bubbles.push({ x: sx + 34, y: sy + 9, v: 8, p: 0, s: 1 });
      if (bubbles.length > 14) bubbles.splice(7, 1);
    }

    if (reduce) { draw(1.2, 0); return; }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => {
        visible = es[0].isIntersecting;
        if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
      }).observe(cv);
    }
    draw(0, 0);
    raf = requestAnimationFrame(frame);
  }

  function init() { document.querySelectorAll('canvas[data-cs-sprite]').forEach(setup); }
  window.CharaSheet = { init };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
