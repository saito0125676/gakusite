// ガクサイト 演出(全ページ共通)
// ① ピクセルのページ遷移  ② フッターの粒子ロゴ  ③ ラベル付きカーソル  ④ ホバーで文字がスクランブル  ⑤ 入れ替わる単語
// 参考:nudot(ピクセル遷移)/ revelatio(粒子ロゴ・スクランブル・カーソル)/ funtech(入れ替わる単語)
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var KEY = 'gs:px-shift';
  var INK = '#0e0f11', POOL = '#3fc1c9', NAVY = '#1f3a5f';

  // =========================================================
  // ① ピクセルのページ遷移
  //    リンクを押すと、押した場所からマスが波のように広がって画面を埋め、
  //    行き先の名前を見せてから移動。新しいページでは中央からマスがほどける。
  // =========================================================
  var PAGES = {
    'index.html': ['HOME', '01 / ホーム'],
    '': ['HOME', '01 / ホーム'],
    'about.html': ['ABOUT', '02 / 私たちについて'],
    'service.html': ['SERVICE', '03 / サービス'],
    'pricing.html': ['PRICE', '04 / 料金'],
    'works.html': ['WORKS', '05 / 実績'],
    'faq.html': ['FAQ', '06 / よくある質問'],
    'contact.html': ['CONTACT', '07 / お問い合わせ'],
    'hearing.html': ['HEARING', 'ヒアリングシート']
  };
  var dirOf = function (p) { return p.slice(0, p.lastIndexOf('/') + 1); };
  var fileOf = function (p) { return p.slice(p.lastIndexOf('/') + 1); };

  var shell = null, cells = [], cols = 0, rows = 0, busy = false;
  var build = function (label) {
    if (shell) shell.remove();
    var W = window.innerWidth, H = window.innerHeight;
    var size = W < 700 ? 72 : 96;
    cols = Math.ceil(W / size); rows = Math.ceil(H / size);
    shell = document.createElement('div');
    shell.className = 'px-shift';
    shell.setAttribute('aria-hidden', 'true');
    shell.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
    shell.style.gridTemplateRows = 'repeat(' + rows + ', 1fr)';
    cells = [];
    var frag = document.createDocumentFragment();
    for (var i = 0; i < cols * rows; i++) {
      var c = document.createElement('i');
      var r = Math.random();
      c.className = 'px-c' + (r < .05 ? ' px-c--pool' : r < .09 ? ' px-c--navy' : '');
      frag.appendChild(c); cells.push(c);
    }
    shell.appendChild(frag);
    var lb = document.createElement('div');
    lb.className = 'px-label';
    lb.innerHTML = '<span class="px-dots"><i></i><i></i><i></i></span><b></b><small></small>';
    lb.querySelector('b').textContent = label ? label[0] : '';
    lb.querySelector('small').textContent = label ? label[1] : '';
    shell.appendChild(lb);
    document.body.appendChild(shell);
  };
  // 点 (ox, oy) からの距離に応じて、各マスの出るタイミングをずらす
  var stagger = function (ox, oy, spread) {
    var W = window.innerWidth, H = window.innerHeight;
    var maxD = Math.hypot(Math.max(ox, W - ox), Math.max(oy, H - oy));
    cells.forEach(function (c, i) {
      var x = ((i % cols) + .5) / cols * W, y = (Math.floor(i / cols) + .5) / rows * H;
      var d = Math.hypot(x - ox, y - oy) / maxD;
      c.style.transitionDelay = (d * spread + Math.random() * .04).toFixed(3) + 's';
    });
  };

  var leave = function (href, label, ox, oy) {
    if (busy) return;
    busy = true;
    try { sessionStorage.setItem(KEY, JSON.stringify({ label: label, at: Date.now() })); } catch (e) {}
    if (window.__lenis) { try { window.__lenis.stop(); } catch (e) {} }
    build(label);
    stagger(ox, oy, .32);
    void shell.offsetWidth;
    shell.classList.add('is-on');
    var go = function () { window.location.href = href; };
    var fallback = setTimeout(go, 1400);
    setTimeout(function () {
      shell.classList.add('show-label');
      setTimeout(function () { clearTimeout(fallback); go(); }, 260);
    }, 620);
  };

  var enter = function () {
    var data = null;
    try { data = JSON.parse(sessionStorage.getItem(KEY) || 'null'); sessionStorage.removeItem(KEY); } catch (e) {}
    if (!root.classList.contains('px-enter')) return;
    build(data && data.label);
    shell.classList.add('is-on', 'show-label', 'no-anim');
    root.classList.remove('px-enter');
    var W = window.innerWidth, H = window.innerHeight;
    stagger(W / 2, H / 2, .34);
    // 行き先の名前を少し見せてから、中央からほどく
    setTimeout(function () {
      shell.classList.remove('no-anim', 'show-label');
      void shell.offsetWidth;
      shell.classList.remove('is-on');
      setTimeout(function () { if (shell) { shell.remove(); shell = null; } }, 900);
    }, 220);
  };

  if (!reduce) {
    enter();
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      var raw = a.getAttribute('href');
      if (!raw || raw.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/i.test(raw)) return;
      var url;
      try { url = new URL(a.href, window.location.href); } catch (err) { return; }
      if (url.protocol !== location.protocol || url.host !== location.host) return;
      if (dirOf(url.pathname) !== dirOf(location.pathname)) return;      // デモサイトなど別フォルダは対象外
      var f = fileOf(url.pathname);
      if (!PAGES.hasOwnProperty(f)) return;
      if (url.pathname === location.pathname) return;                    // 同じページ内(#top など)はそのまま
      e.preventDefault();
      var menu = document.getElementById('menu-toggle');
      if (menu) menu.checked = false;
      leave(url.href, PAGES[f], e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight / 2);
    });
  } else {
    root.classList.remove('px-enter');
  }
  // 戻るボタンで復元されたページでは、マスを消しておく
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    busy = false;
    root.classList.remove('px-enter');
    if (shell) { shell.remove(); shell = null; }
    if (window.__lenis) { try { window.__lenis.start(); } catch (err) {} }
  });

  // =========================================================
  // ② フッターの粒子ロゴ:GAKU SITE+ がピクセルの粒でできている
  //    見えたら散らばった粒が集まって形になり、マウスを近づけると粒がよける
  // =========================================================
  var initLogo = function (el) {
    var cv = document.createElement('canvas');
    cv.className = 'ft-word-cv';
    cv.setAttribute('aria-hidden', 'true');
    el.appendChild(cv);
    var ctx = cv.getContext('2d');
    var parts = [], W = 0, H = 0, dpr = 1, step = 6, phase = 'wait', t0 = 0, raf = 0;
    var mouse = { x: -9999, y: -9999, on: false };

    var layout = function () {
      var r = el.getBoundingClientRect();
      var cs = getComputedStyle(el);
      var fs = parseFloat(cs.fontSize);
      W = Math.round(r.width); H = Math.round(r.height + fs * .3);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.height = H + 'px';
      step = W < 700 ? 4 : W < 1100 ? 5 : 6;
      // 下書き:本文と同じ書体で GAKU SITE を書き、+ はピクセル書体の水色で
      var off = document.createElement('canvas');
      off.width = W; off.height = H;
      var o = off.getContext('2d');
      var base = H - fs * .06;
      var x = 0, ls = -.075 * fs;
      o.textBaseline = 'alphabetic';
      o.fillStyle = '#fff';
      o.font = cs.fontWeight + ' ' + fs + 'px ' + cs.fontFamily;
      var word = 'GAKU SITE';
      for (var i = 0; i < word.length; i++) { o.fillText(word[i], x, base); x += o.measureText(word[i]).width + ls; }
      var plus = el.querySelector('.plus');
      if (plus) {
        var pcs = getComputedStyle(plus);
        o.fillStyle = POOL;
        o.font = pcs.fontWeight + ' ' + fs + 'px ' + pcs.fontFamily;
        o.fillText('+', x + fs * .08, base);
      }
      var img = o.getImageData(0, 0, W, H).data;
      var old = parts;
      parts = [];
      var hs = step >> 1;
      for (var y = 0; y + hs < H; y += step) for (var xx = 0; xx + hs < W; xx += step) {
        var k = ((y + hs) * W + xx + hs) * 4;
        if (!(img[k + 3] >= 128)) continue;
        var pool = img[k] < 140 && img[k + 1] > 150;
        parts.push({ hx: xx, hy: y, x: xx, y: y, vx: 0, vy: 0, c: pool ? POOL : '#ffffff', sx: 0, sy: 0, d: 0 });
      }
      if (phase === 'wait' && old.length === 0) {
        // 集まる前の散らばった位置(下の方へばらけさせる)
        parts.forEach(function (p) {
          p.sx = p.hx + (Math.random() - .5) * W * .35;
          p.sy = p.hy + H * (.4 + Math.random() * 1.2);
          p.d = (p.hx / W) * .45 + Math.random() * .25;
          p.x = p.sx; p.y = p.sy;
        });
      }
    };
    var draw = function () {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var s = step - 1;
      var last = '';
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (p.c !== last) { ctx.fillStyle = p.c; last = p.c; }
        ctx.fillRect(p.x, p.y, s, s);
      }
    };
    var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
    var tick = function (now) {
      raf = 0;
      var moving = false;
      if (phase === 'form') {
        var T = (now - t0) / 1000, all = true;
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          var t = Math.min(1, Math.max(0, (T - p.d) / .9));
          if (t < 1) all = false;
          var e = ease(t);
          p.x = p.sx + (p.hx - p.sx) * e; p.y = p.sy + (p.hy - p.sy) * e;
        }
        moving = !all;
        if (all) phase = fine ? 'live' : 'done';
      } else if (phase === 'live') {
        var R = 110, R2 = R * R;
        for (var j = 0; j < parts.length; j++) {
          var q = parts[j];
          if (mouse.on) {
            var dx = q.x - mouse.x, dy = q.y - mouse.y, d2 = dx * dx + dy * dy;
            if (d2 < R2) {
              var d = Math.sqrt(d2) || 1, f = (1 - d / R) * 5.5;
              q.vx += dx / d * f; q.vy += dy / d * f;
            }
          }
          q.vx += (q.hx - q.x) * .07; q.vy += (q.hy - q.y) * .07;
          q.vx *= .8; q.vy *= .8;
          q.x += q.vx; q.y += q.vy;
          if (!moving && (Math.abs(q.vx) > .05 || Math.abs(q.vy) > .05 || Math.abs(q.hx - q.x) > .3 || Math.abs(q.hy - q.y) > .3)) moving = true;
        }
      }
      draw();
      if (moving || (phase === 'live' && mouse.on)) raf = requestAnimationFrame(tick);
    };
    var kick = function () { if (!raf) raf = requestAnimationFrame(tick); };

    var start = function () {
      layout();
      if (reduce) { parts.forEach(function (p) { p.x = p.hx; p.y = p.hy; }); phase = 'done'; draw(); el.classList.add('is-px'); return; }
      draw();
      el.classList.add('is-px');
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) {
          if (!es[0].isIntersecting || phase !== 'wait') return;
          io.disconnect();
          phase = 'form'; t0 = performance.now(); kick();
        }, { threshold: .35 });
        io.observe(el);
      } else { phase = 'form'; t0 = performance.now(); kick(); }
      if (fine) {
        el.addEventListener('pointermove', function (e) {
          var r = cv.getBoundingClientRect();
          mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true;
          if (phase === 'live') kick();
        });
        el.addEventListener('pointerleave', function () { mouse.on = false; if (phase === 'live') kick(); });
      }
      var rt = 0, lw = window.innerWidth;
      window.addEventListener('resize', function () {
        if (window.innerWidth === lw) return;   // スマホのアドレスバーの伸び縮みでは作り直さない
        lw = window.innerWidth;
        clearTimeout(rt);
        rt = setTimeout(function () {
          var ph = phase; layout();
          if (ph !== 'wait') { parts.forEach(function (p) { p.x = p.hx; p.y = p.hy; }); if (ph === 'form') phase = fine ? 'live' : 'done'; }
          draw();
        }, 200);
      });
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
  };
  document.querySelectorAll('.ft-word').forEach(initLogo);

  // =========================================================
  // ⑥ ページ上部の大きな見出し(About. / Service. など)をドットマトリクスに
  //    丸いドットがランダムに点灯して文字が組み上がり(点いた瞬間は水色)、
  //    マウスを近づけると周りのドットがレンズのようにふくらむ
  // =========================================================
  var initDots = function (el) {
    var cv = document.createElement('canvas');
    cv.className = 'ph-dots';
    cv.setAttribute('aria-hidden', 'true');
    el.appendChild(cv);
    var ctx = cv.getContext('2d');
    var dots = [], W = 0, H = 0, dpr = 1, step = 6, top = 0, t0 = 0, raf = 0, built = false;
    var mouse = { x: -9999, y: -9999, on: false };
    var hex = function (c) {   // 'rgb(r, g, b)' → [r, g, b]
      var m = c.match(/\d+(\.\d+)?/g) || [0, 0, 0];
      return [+m[0], +m[1], +m[2]];
    };
    var layout = function () {
      var had = el.classList.contains('is-dots');
      el.classList.remove('is-dots');   // 色を読むため、いったん文字色を戻す
      var r = el.getBoundingClientRect();
      var cs = getComputedStyle(el);
      var fs = parseFloat(cs.fontSize);
      top = Math.round(fs * .25);
      W = Math.round(r.width); H = Math.round(r.height + top + fs * .2);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.top = -top + 'px'; cv.style.height = H + 'px';
      step = Math.max(3, Math.round(fs / 30));
      // ベースライン:高さ 0 の inline-block を置くと、その上端がベースラインになる
      var mk = document.createElement('span');
      mk.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
      el.appendChild(mk);
      var base = mk.getBoundingClientRect().top - r.top + top;
      mk.remove();
      var off = document.createElement('canvas');
      off.width = W; off.height = H;
      var o = off.getContext('2d');
      o.textBaseline = 'alphabetic';
      var cols = [];
      // 1 文字ずつ、本文と同じ位置・書体で下書き(色は「どの色の文字か」の目印)
      var chars = el.querySelectorAll('.w');
      var list = chars.length ? chars : [el];
      Array.prototype.forEach.call(list, function (w) {
        var host = w.parentElement && w.parentElement.tagName === 'EM' ? w.parentElement : el;
        var hs = getComputedStyle(host);
        var col = hs.color, idx = cols.indexOf(col);
        if (idx < 0) { cols.push(col); idx = cols.length - 1; }
        var wr = w.getBoundingClientRect();
        o.font = hs.fontStyle + ' ' + hs.fontWeight + ' ' + fs + 'px ' + hs.fontFamily;
        o.fillStyle = o.strokeStyle = 'rgb(' + (idx + 1) * 20 + ',0,0)';
        o.lineWidth = fs * .035; o.lineJoin = 'round';   // 線を太らせて、ドットが 2〜3 列並ぶように
        o.fillText(w.textContent, wr.left - r.left, base);
        o.strokeText(w.textContent, wr.left - r.left, base);
      });
      var img = o.getImageData(0, 0, W, H).data;
      var rgbs = cols.map(hex);
      var old = dots.length;
      dots = [];
      var hs2 = step >> 1;
      for (var y = hs2; y < H; y += step) for (var x = hs2; x < W; x += step) {
        var k = (y * W + x) * 4;
        if (!(img[k + 3] >= 140)) continue;
        var ci = Math.max(0, Math.round(img[k] / 20) - 1);
        dots.push({ x: x, y: y, c: rgbs[ci] || rgbs[0], d: Math.random() * .75 + x / W * .3, s: 1 });
      }
      if (old) built = true;
      if (had) el.classList.add('is-dots');
    };
    var POOLRGB = [63, 193, 201];
    var draw = function (now) {
      raf = 0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var T = (now - t0) / 1000, busy = false, R = Math.max(90, step * 18), R2 = R * R, base = step * .42;
      for (var i = 0; i < dots.length; i++) {
        var p = dots[i], col = p.c, s = 1, k = 0;
        if (!built) {
          var a = T - p.d;
          if (a < 0) { busy = true; continue; }
          if (a < .22) { busy = true; k = 1 - a / .22; s = 1 + .5 * k; }   // 点いた瞬間は大きめの水色
        }
        var target = 1, mk2 = 0;
        if (mouse.on) {
          var dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < R2) { var f = 1 - Math.sqrt(d2) / R; target = 1 + 1.1 * f * f; mk2 = f; }
        }
        p.s += (target - p.s) * .22;
        if (Math.abs(target - p.s) > .01) busy = true;
        s *= p.s;
        var mix = Math.max(k, Math.min(1, (p.s - 1) * 1.6), mk2 > .55 ? 1 : 0);
        var rr = mix ? Math.round(col[0] + (POOLRGB[0] - col[0]) * mix) : col[0];
        var gg = mix ? Math.round(col[1] + (POOLRGB[1] - col[1]) * mix) : col[1];
        var bb = mix ? Math.round(col[2] + (POOLRGB[2] - col[2]) * mix) : col[2];
        ctx.fillStyle = 'rgb(' + rr + ',' + gg + ',' + bb + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, base * s, 0, 6.2832);
        ctx.fill();
      }
      if (!built && !busy) built = true;
      if (busy || mouse.on) raf = requestAnimationFrame(draw);
    };
    var kick = function () { if (!raf) raf = requestAnimationFrame(draw); };
    var start = function () {
      layout();
      el.classList.add('is-dots');
      if (reduce) { built = true; kick(); return; }
      // ページ遷移のマスがほどけるのを待ってから組み上げる
      setTimeout(function () { t0 = performance.now(); kick(); }, shell ? 520 : 200);
      if (fine) {
        var host = el.closest('.ph') || el;
        host.addEventListener('pointermove', function (e) {
          var r = cv.getBoundingClientRect();
          mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true; kick();
        });
        host.addEventListener('pointerleave', function () { mouse.on = false; kick(); });
      }
      var lw = window.innerWidth, rt = 0;
      window.addEventListener('resize', function () {
        if (window.innerWidth === lw) return;
        lw = window.innerWidth; clearTimeout(rt);
        rt = setTimeout(function () { layout(); built = true; kick(); }, 200);
      });
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
  };
  document.querySelectorAll('.ph .display').forEach(initDots);

  // =========================================================
  // ⑦ スクロール演出(パララックス)
  //    参考:landonorris(上辺がふくらんで入ってくるセクション・楕円で開く画像)
  //          obsidianassembly(前のセクションに重なっていくシート・速さの違う奥行き)
  //          estrela(ぼかしからくっきり・大きな見出しが横に流れる)
  //    すべてスクロール量に直結。スマホでは弱め、「動きを減らす」設定では何もしない。
  // =========================================================
  if (!reduce) (function () {
    var mob = window.innerWidth < 760;
    var K = mob ? .55 : 1;
    var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    var tasks = [];

    // A. せり上がるシート:上辺がドーム状にふくらんだ形で入ってきて、上に来るほど平らに・全幅に。
    //    その間、前のセクションの中身は少し遅れて沈み、暗くなって奥へ下がる。
    document.querySelectorAll('[data-sheet]').forEach(function (sec) {
      sec.classList.add('fx-sheet');
      var prev = sec.previousElementSibling;
      while (prev && prev.tagName !== 'SECTION') prev = prev.previousElementSibling;
      var sink = prev ? Array.prototype.filter.call(prev.children, function (c) { return !/^(H2|CANVAS)$/.test(c.tagName) && !c.classList.contains('sr-only'); }) : [];
      var was = -1;
      tasks.push(function (vh) {
        var r = sec.getBoundingClientRect();
        var p = clamp(1 - (r.top - vh * .08) / (vh * .92), 0, 1);
        if (p === was) return;
        was = p;
        var e = 1 - Math.pow(1 - p, 2.2);
        if (e > .998) { sec.style.clipPath = ''; }
        else {
          var sx = (1 - e) * (mob ? 2.5 : 5), rx = (1 - e) * 50, ry = (1 - e) * (mob ? 70 : 170);
          sec.style.clipPath = 'inset(0 ' + sx.toFixed(2) + '% 0 ' + sx.toFixed(2) + '% round ' + rx.toFixed(1) + '% ' + rx.toFixed(1) + '% 0 0 / ' + ry.toFixed(0) + 'px ' + ry.toFixed(0) + 'px 0 0)';
        }
        var push = e < .001 || e > .998 ? 0 : e;
        sink.forEach(function (c) {
          c.style.translate = push ? '0 ' + (push * vh * .22 * K).toFixed(1) + 'px' : '';
          c.style.opacity = push ? (1 - push * .45).toFixed(3) : '';
        });
      });
    });

    // B. 奥行き:絵の要素をそれぞれ違う速さで動かす(translate を使うので、回転などの元の動きとぶつからない)
    var depth = [
      ['.pop-card', [.10, -.05, .14]],
      ['.circle-pic', [.12]],
      ['.team-pic-wrap', [.08]],
      ['.svc-fig', [-.10, -.04, -.12, -.06]]
    ];
    depth.forEach(function (d) {
      document.querySelectorAll(d[0]).forEach(function (el, i) {
        var sp = d[1][i % d[1].length] * K;
        tasks.push(function (vh) {
          var r = el.getBoundingClientRect();
          if (r.bottom < -200 || r.top > vh + 200) return;
          var c = r.top + r.height / 2 - (parseFloat(el.dataset.fy) || 0);
          var y = (c - vh / 2) * -sp;
          el.dataset.fy = y.toFixed(1);
          el.style.translate = '0 ' + y.toFixed(1) + 'px';
        });
      });
    });

    // C. 大きな見出しが、スクロールに合わせて横にゆっくり流れる
    var drift = [['.works-top .display--m', 1], ['.cta .display', -1], ['.manifesto .display', 1]];
    drift.forEach(function (d) {
      document.querySelectorAll(d[0]).forEach(function (el) {
        tasks.push(function (vh) {
          var r = el.getBoundingClientRect();
          if (r.bottom < -100 || r.top > vh + 100) return;
          var q = clamp((r.top + r.height / 2) / vh, -.5, 1.5) - .5;   // 画面の中央で 0
          el.style.translate = (q * d[1] * (mob ? 6 : 9)).toFixed(2) + 'vw 0';
        });
      });
    });

    // D. ぼかしからくっきり:画面の下から上がってくるにつれて、文字のぼかしが取れていく
    document.querySelectorAll('.quote, .cta-row .h-ja, .works-top .display--m').forEach(function (el) {
      tasks.push(function (vh) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var q = clamp((vh - r.top) / (vh * .45), 0, 1);
        el.style.filter = q < 1 ? 'blur(' + ((1 - q) * (mob ? 6 : 12)).toFixed(1) + 'px)' : '';
      });
    });

    // E. 楕円で開く:画像が下から楕円形に開いて現れる
    document.querySelectorAll('.work-shot, .team-pic, .circle-pic').forEach(function (el) {
      tasks.push(function (vh) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var q = clamp((vh - r.top) / (vh * .55), 0, 1);
        var e = 1 - Math.pow(1 - q, 2);
        el.style.clipPath = e < .999 ? 'ellipse(' + (30 + e * 90).toFixed(1) + '% ' + (e * 140).toFixed(1) + '% at 50% 100%)' : '';
      });
    });

    var ticking = false;
    var run = function () {
      ticking = false;
      var vh = window.innerHeight;
      for (var i = 0; i < tasks.length; i++) tasks[i](vh);
    };
    var req = function () { if (!ticking) { ticking = true; requestAnimationFrame(run); } };
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
    run();
  })();

  // =========================================================
  // ③ ラベル付きカーソル(マウスのときだけ):data-cursor のある要素に乗ると、ラベルが付いてくる
  // =========================================================
  if (fine && !reduce) {
    var auto = [['.arc-card', 'OPEN ↗'], ['.work a', 'VIEW ↗'], ['.route', 'GO →']];
    auto.forEach(function (a) {
      document.querySelectorAll(a[0]).forEach(function (el) { if (!el.hasAttribute('data-cursor')) el.setAttribute('data-cursor', a[1]); });
    });
    var cur = document.createElement('div');
    cur.className = 'px-cursor';
    cur.setAttribute('aria-hidden', 'true');
    cur.innerHTML = '<i></i><span></span>';
    document.body.appendChild(cur);
    var curText = cur.querySelector('span');
    var cx = 0, cy = 0, tx = 0, ty = 0, cRaf = 0, shown = false;
    var loop = function () {
      cRaf = 0;
      cx += (tx - cx) * .35; cy += (ty - cy) * .35;
      cur.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px)';
      if (shown || Math.abs(tx - cx) > .5 || Math.abs(ty - cy) > .5) cRaf = requestAnimationFrame(loop);
    };
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      tx = e.clientX; ty = e.clientY;
      var t = e.target.closest && e.target.closest('[data-cursor]');
      if (t) {
        if (!shown) { cx = tx; cy = ty; }
        curText.textContent = t.getAttribute('data-cursor');
        cur.classList.add('is-on'); shown = true;
      } else if (shown) { cur.classList.remove('is-on'); shown = false; }
      if (!cRaf) cRaf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('pointerleave', function () { cur.classList.remove('is-on'); shown = false; });
  }

  // =========================================================
  // ④ ホバーで文字がスクランブル(マウスのときだけ)
  // =========================================================
  var POOLCH = 'アイウエオカキクケコサシスセソ#%&*+=<>/□■';
  var scramble = function (node, dur) {
    if (node.__scr) return;
    var fin = node.nodeValue, len = fin.length, t0 = null;
    node.__scr = true;
    var step = function (t) {
      if (t0 === null) t0 = t;
      var q = Math.min(1, (t - t0) / dur), k = Math.floor(q * len), s = fin.slice(0, k);
      for (var j = k; j < len; j++) s += /\s/.test(fin[j]) ? fin[j] : POOLCH[Math.floor(Math.random() * POOLCH.length)];
      node.nodeValue = s;
      if (q < 1) requestAnimationFrame(step); else { node.nodeValue = fin; node.__scr = false; }
    };
    requestAnimationFrame(step);
  };
  var lastText = function (el) {
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n, last = null;
    while ((n = w.nextNode())) if (n.nodeValue.trim()) last = n;
    return last;
  };
  if (fine && !reduce) {
    document.querySelectorAll('.hd-nav a, .ft-nav a, .ul-link, .crumb a').forEach(function (a) {
      a.addEventListener('mouseenter', function () { var n = lastText(a); if (n) scramble(n, 380); });
    });
  }

  // =========================================================
  // ⑤ 入れ替わる単語:「Let's build your site.」の site が shop / brand / story … と切り替わる
  // =========================================================
  var WORDS = ['site', 'shop', 'brand', 'story', 'idea'];
  document.querySelectorAll('.cta .display em').forEach(function (em) {
    if (reduce) return;
    var i = 0, timer = 0, vis = false;
    em.classList.add('cycle');
    var next = function () {
      i = (i + 1) % WORDS.length;
      // 見出しの演出で 1 文字ずつ分割されているので、ふつうの文字に戻してから差し替える
      em.textContent = WORDS[i];
      var n = em.firstChild;
      em.classList.remove('is-swap'); void em.offsetWidth; em.classList.add('is-swap');
      scramble(n, 420);
    };
    var run = function () { clearInterval(timer); if (vis) timer = setInterval(next, 2400); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { vis = es[0].isIntersecting; run(); }).observe(em);
    }
  });
})();
