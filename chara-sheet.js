/* =========================================================
   キャラシート：ドット絵のキャラを描くスクリプト
   <canvas data-cs-sprite> を見つけて、海の中で泳ぐサメを描きます。
   <canvas data-cs-sprite="frog"> なら、夕焼けの池にいるカエルを描きます。
   <canvas data-cs-sprite="octo"> なら、海の底でゆれるタコを描きます。
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

  // 26×19 のカエル（正面）
  const FROG = [
    '..........................',
    '...OOOOOO........OOOOOO...',
    '...OWWWWO........OWWWWO...',
    '..OWWWPPWO......OWWWPPWO..',
    '..OWWWPPWO......OWWWPPWO..',
    '..OWWWWWWOOOOOOOOWWWWWWO..',
    '...OWWWWOGGGGGGGGOWWWWO...',
    '...OOOOOOGGGGGGGGOOOOOO...',
    '..OGGGGGGGGGGGGGGGGGGGGO..',
    '.OGGGGGGGGGGGGGGGGGGGGGGO.',
    '.OGGGGGMGGGGGGGGGGGMGGGGO.',
    'OGGGRRGGMMMMMMMMMMMGGRRGGO',
    '.OGGGGGGYYYYYYYYYYGGGGGGO.',
    '.OGGGGGYYYYYYYYYYYYGGGGGO.',
    '..OGGGGYYYYYYYYYYYYGGGGO..',
    '...OOGGYYYYYYYYYYYYGGOO...',
    '...OOOOOYYYYYYYYYYOOOOO...',
    '...OGGGGOOOYYYYOOOGGGGO...',
    '....OOOOOO......OOOOOO....'
  ];
  const P = {
    sky: ['#f6d8a6', '#f4bc8e', '#ee9f86', '#df8d8c'], sun: '#fbe8ac',
    hill: '#6f8f86', hill2: '#5b7c76',
    water: ['#3f8189', '#367480', '#2e6873'], glint: '#7fb8bf',
    pad: '#4caf63', pad2: '#2f7f47', reed: '#5c8a4a', cat: '#8a5a3c',
    O: '#1d3b25', G: '#7ccf5a', W: '#ffffff', P: '#14202a', M: '#1d3b25', Y: '#e9f2b0', R: '#f29aa0'
  };
  const FROG_MAP = { O: P.O, G: P.G, W: P.W, P: P.P, M: P.M, Y: P.Y, R: P.R };

  // 22×15 のタコ（正面・頭だけ。足はうごかすので描画時に描く）
  const OCTO = [
    '.......OOOOOOOO.......',
    '.....OOKKKKKKKKOO.....',
    '....OKKHHKKKKKKKKO....',
    '...OKHHKKKKKKKKKKKO...',
    '...OKHKKKKKKKKKKKKO...',
    '..OKKKKKKKKKKKKKKKKO..',
    '..OKKKKKKKKKKKKKKKKO..',
    '..OKKWWWKKKKKKWWWKKO..',
    '..OKKWPPKKKKKKWPPKKO..',
    '..OKKWPPKKKKKKWPPKKO..',
    '..OKRRKKKKKKKKKKRRKO..',
    '..OKKKKKKKMMKKKKKKKO..',
    '...OKKKKKKKKKKKKKKO...',
    '...OSKKKKKKKKKKKKSO...',
    '..OSSSSSSSSSSSSSSSSO..'
  ];
  const Q = { O: '#3a1f3d', K: '#f59ab0', H: '#ffd0dc', S: '#d8708f', W: '#ffffff', P: '#14202a', R: '#ff6f8e', M: '#3a1f3d', shell: '#fbe3c4', shell2: '#d9a877', rock: '#5a6f86', rock2: '#3f5268' };
  const OCTO_MAP = { O: Q.O, K: Q.K, H: Q.H, S: Q.S, W: Q.W, P: Q.P, R: Q.R, M: Q.M };

  function toCanvas(rows, flip, map) {
    map = map || MAP;
    const w = rows[0].length, h = rows.length;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d');
    if (flip) { x.translate(w, 0); x.scale(-1, 1); }
    rows.forEach((r, y) => [...r].forEach((ch, i) => { if (map[ch]) { x.fillStyle = map[ch]; x.fillRect(i, y, 1, 1); } }));
    return c;
  }

  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

  // 帯状の色を、境目をドットのまだらでなじませながら塗る
  function paintBands(img, y0, y1, bands) {
    for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) {
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
  }

  let sharkAssets = null;
  function sharkScene() {
    if (sharkAssets) return sharkAssets;
    const bg = document.createElement('canvas'); bg.width = W; bg.height = H;
    const b = bg.getContext('2d');
    const img = b.createImageData(W, H);
    paintBands(img, 0, H, [[0, hex(C.w1)], [16, hex(C.w2)], [34, hex(C.w3)], [50, hex(C.w4)]]);
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
    sharkAssets = { bg, shark: toCanvas(SHARK), fishR: toCanvas(FISH), fishL: toCanvas(FISH, true) };
    return sharkAssets;
  }

  const WEEDS = [[6, 14], [11, 9], [70, 12], [84, 16], [89, 10]];

  // 海の背景＋水面のきらめき＋ゆれる海藻（サメとタコで共通）
  function drawSea(ctx, a, t) {
    ctx.drawImage(a.bg, 0, 0);
    ctx.fillStyle = C.surf;
    for (let x = 0; x < W; x += 2) if (Math.sin(x * .4 + t * 2.4) > .55) ctx.fillRect(x, 0, 2, 1);
    for (const [wx, wh] of WEEDS) {
      for (let i = 0; i < wh; i++) {
        const px = wx + Math.round(Math.sin(t * 1.6 + i * .4 + wx) * (i / wh) * 2);
        ctx.fillStyle = i % 3 === 0 ? C.weed2 : C.weed; ctx.fillRect(px, SAND + 1 - i, 2, 1);
      }
    }
  }

  // ---------- サメ（海） ----------
  function makeShark(ctx) {
    const a = sharkScene();
    const bubbles = Array.from({ length: 7 }, () => ({ x: Math.random() * W, y: Math.random() * SAND, v: 5 + Math.random() * 6, p: Math.random() * 6, s: Math.random() < .35 ? 2 : 1 }));
    const fish = { x: -10, y: 18, v: 9, dir: 1, wait: 2 };

    return function draw(t, dt) {
      drawSea(ctx, a, t);
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
    };
  }

  // ---------- カエル（夕焼けの池） ----------
  const HORIZON = 31;
  const SUN = { x: 70, y: 15, r: 5 };
  const CATTAILS = [[5, 40], [9, 46], [83, 44], [88, 38], [92, 47]];
  const PADS = [[16, 45, 8, 2], [84, 60, 9, 2]];
  const BIG_PAD = { x: 48, y: 60, rx: 18, ry: 5 };

  function fillEllipse(ctx, cx, cy, rx, ry, col) {
    ctx.fillStyle = col;
    for (let y = -ry; y <= ry; y++) {
      const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y / (ry + .5)) ** 2)));
      ctx.fillRect(cx - half, cy + y, half * 2, 1);
    }
  }

  let frogAssets = null;
  function frogScene() {
    if (frogAssets) return frogAssets;
    const bg = document.createElement('canvas'); bg.width = W; bg.height = H;
    const b = bg.getContext('2d');
    const img = b.createImageData(W, H);
    paintBands(img, 0, HORIZON, P.sky.map((c, i) => [i * 8, hex(c)]));
    paintBands(img, HORIZON, H, P.water.map((c, i) => [HORIZON + i * 14, hex(c)]));
    b.putImageData(img, 0, 0);
    // 夕日
    fillEllipse(b, SUN.x, SUN.y, SUN.r, SUN.r, P.sun);
    // 遠くの山なみ（夕日の下半分を隠す）
    for (let x = 0; x < W; x++) {
      const top = HORIZON - 4 + Math.round(Math.sin(x * .09) * 1.6 + Math.sin(x * .23 + 1) * 1.2);
      b.fillStyle = P.hill2; b.fillRect(x, top, 1, HORIZON - top);
      b.fillStyle = P.hill; b.fillRect(x, top, 1, 1);
    }
    // 小さなハスの葉
    for (const [px, py, rx, ry] of PADS) {
      fillEllipse(b, px, py, rx, ry, P.pad2);
      fillEllipse(b, px, py - 1, rx - 1, ry - 1, P.pad);
    }
    // カエルが乗る大きなハスの葉（手前に切れ込み）
    fillEllipse(b, BIG_PAD.x, BIG_PAD.y, BIG_PAD.rx, BIG_PAD.ry, P.pad2);
    fillEllipse(b, BIG_PAD.x, BIG_PAD.y - 1, BIG_PAD.rx - 1, BIG_PAD.ry - 1, P.pad);
    b.fillStyle = P.water[2]; b.fillRect(BIG_PAD.x + 6, BIG_PAD.y + 2, 3, 4);
    frogAssets = { bg, frog: toCanvas(FROG, false, FROG_MAP) };
    return frogAssets;
  }

  function makeFrog(ctx) {
    const a = frogScene();
    const ripples = [];
    let hop = 0, nextHop = 3;

    return function draw(t, dt) {
      ctx.drawImage(a.bg, 0, 0);
      // 夕日の映り込み（ゆらゆら）
      ctx.fillStyle = P.sun;
      [[34, 12], [37, 9], [40, 6], [43, 4], [46, 2]].forEach(([y, w], i) => {
        const sway = Math.round(Math.sin(t * 2 + i) * 1);
        ctx.fillRect(SUN.x - w / 2 + sway, y, w, 1);
      });
      // 水面のきらめき
      ctx.fillStyle = P.glint;
      for (let i = 0; i < 9; i++) {
        const gx = (i * 37 + Math.floor(t * 3) * 11) % W, gy = HORIZON + 5 + (i * 13) % 34;
        if (Math.sin(t * 3 + i * 2) > .2) ctx.fillRect(gx, gy, 3, 1);
      }
      // ガマ（ゆれる）
      for (const [cx, top] of CATTAILS) {
        for (let y = top; y < H; y++) {
          const k = (H - y) / (H - top);
          const px = cx + Math.round(Math.sin(t * 1.4 + cx) * k * 1.5);
          ctx.fillStyle = P.reed; ctx.fillRect(px, y, 1, 1);
          if (y < top + 5 && y > top) { ctx.fillStyle = P.cat; ctx.fillRect(px - 1, y, 3, 1); }
        }
      }
      // ときどきぴょんと跳ねて、波紋が広がる
      if (dt) {
        nextHop -= dt;
        if (nextHop <= 0) { hop = .5; nextHop = 3 + Math.random() * 3; }
        if (hop > 0) {
          hop -= dt;
          if (hop <= 0) ripples.push({ r: BIG_PAD.rx, life: 1 });
        }
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        if (dt) { rp.r += dt * 10; rp.life -= dt * .8; }
        if (rp.life <= 0) { ripples.splice(i, 1); continue; }
        ctx.fillStyle = P.glint;
        for (let k = 0; k < 40; k++) {
          const ang = k / 40 * Math.PI * 2;
          ctx.fillRect(Math.round(BIG_PAD.x + Math.cos(ang) * rp.r), Math.round(BIG_PAD.y + Math.sin(ang) * rp.r * .28), 1, 1);
        }
      }
      const jump = hop > 0 ? Math.round(Math.sin((.5 - hop) / .5 * Math.PI) * 6) : 0;
      const fx = BIG_PAD.x - 13, fy = BIG_PAD.y - 18 - jump;
      ctx.drawImage(a.frog, fx, fy);
      // まばたき
      if (t % 3.6 < .16) {
        ctx.fillStyle = P.G;
        ctx.fillRect(fx + 3, fy + 2, 6, 4); ctx.fillRect(fx + 17, fy + 2, 6, 4);
        ctx.fillStyle = P.O;
        ctx.fillRect(fx + 3, fy + 4, 6, 1); ctx.fillRect(fx + 17, fy + 4, 6, 1);
      }
    };
  }

  // ---------- タコ（海の底） ----------
  const LEGS = [3, 6, 9, 12, 15, 18];

  function makeOcto(ctx) {
    const a = sharkScene();
    const head = toCanvas(OCTO, false, OCTO_MAP);
    const bubbles = [];
    let puff = 0, nextPuff = 4;

    return function draw(t, dt) {
      drawSea(ctx, a, t);
      // 岩と貝がら
      ctx.fillStyle = Q.rock2; ctx.fillRect(66, SAND - 3, 12, 5); ctx.fillRect(68, SAND - 5, 8, 2);
      ctx.fillStyle = Q.rock; ctx.fillRect(67, SAND - 4, 10, 3); ctx.fillRect(69, SAND - 5, 5, 1);
      ctx.fillStyle = Q.shell2; ctx.fillRect(20, SAND + 2, 5, 2); ctx.fillRect(21, SAND + 1, 3, 1);
      ctx.fillStyle = Q.shell; ctx.fillRect(21, SAND + 2, 1, 1); ctx.fillRect(23, SAND + 2, 1, 1);

      // ときどきふわっと浮き上がる
      if (dt) {
        nextPuff -= dt;
        if (nextPuff <= 0) { puff = .9; nextPuff = 4 + Math.random() * 3; }
        if (puff > 0) puff -= dt;
      }
      const lift = puff > 0 ? Math.round(Math.sin((.9 - puff) / .9 * Math.PI) * 5) : 0;
      const ox = 37, oy = SAND - 18 + Math.round(Math.sin(t * 1.5) * 1) - lift;
      const len = 6 + (lift > 2 ? 1 : 0);

      // 足：まず縁どり、つぎに中身を塗る
      const legX = (i, k) => ox + LEGS[i] + Math.round(Math.sin(t * 3 + i * 1.3 + k * .6) * (k / len) * 1.6);
      ctx.fillStyle = Q.O;
      LEGS.forEach((_, i) => {
        for (let k = 0; k < len; k++) {
          ctx.fillRect(legX(i, k) - 1, oy + 15 + k, 1, 1);
          ctx.fillRect(legX(i, k) + 2, oy + 15 + k, 1, 1);
        }
        ctx.fillRect(legX(i, len) - 1, oy + 15 + len, 4, 1);
      });
      LEGS.forEach((_, i) => {
        for (let k = 0; k < len; k++) {
          const px = legX(i, k);
          ctx.fillStyle = Q.K; ctx.fillRect(px, oy + 15 + k, 2, 1);
          if (k % 2) { ctx.fillStyle = Q.S; ctx.fillRect(px + 1, oy + 15 + k, 1, 1); }
        }
      });
      ctx.drawImage(head, ox, oy);
      // まばたき
      if ((t + 2) % 4 < .16) {
        ctx.fillStyle = Q.K;
        ctx.fillRect(ox + 5, oy + 7, 3, 3); ctx.fillRect(ox + 14, oy + 7, 3, 3);
        ctx.fillStyle = Q.O;
        ctx.fillRect(ox + 5, oy + 8, 3, 1); ctx.fillRect(ox + 14, oy + 8, 3, 1);
      }
      // 浮き上がるときに泡をぷくぷく
      if (dt && puff > .5 && Math.random() < dt * 8) bubbles.push({ x: ox + 4 + Math.random() * 14, y: oy, v: 9 + Math.random() * 4 });
      ctx.fillStyle = C.bubble;
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        if (dt) b.y -= b.v * dt;
        if (b.y < 1) { bubbles.splice(i, 1); continue; }
        ctx.fillRect(Math.round(b.x + Math.sin(b.y * .3)), Math.round(b.y), 1, 1);
      }
    };
  }

  const SCENES = { shark: makeShark, frog: makeFrog, octo: makeOcto };
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setup(cv) {
    if (cv.__csReady) return;
    cv.__csReady = true;
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const draw = (SCENES[cv.dataset.csSprite] || makeShark)(ctx);
    let visible = true, raf = 0, last = performance.now(), t0 = performance.now();

    function frame(now) {
      raf = 0;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      draw((now - t0) / 1000, dt);
      if (visible && !reduce) raf = requestAnimationFrame(frame);
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
  // ほかのスクリプト(流れのカエルなど)でドット絵だけ使えるようにする
  function sprite(name) {
    if (name === 'frog') return toCanvas(FROG, false, FROG_MAP);
    if (name === 'octo') return toCanvas(OCTO, false, OCTO_MAP);
    return toCanvas(SHARK);
  }
  window.CharaSheet = { init, sprite };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
