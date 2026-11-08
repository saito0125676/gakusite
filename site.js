// 学サイト 全ページ共通スクリプト(v3 PIXEL BUILD)
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var C = { ink: '#0e0f11', paper: '#ffffff', paper2: '#ebebe8', white: '#ffffff', pool: '#3fc1c9', orange: '#1f3a5f' };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var vh = function () { return window.innerHeight; };
  // 固定(sticky)セクションの進み具合 0〜1
  var progressOf = function (sec) {
    var r = sec.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, r.height - vh()), 0, 1);
  };
  var onScrollFns = [];
  var onScroll = function (fn) { onScrollFns.push(fn); };
  var ticking = false;
  var runScroll = function () {
    ticking = false;
    for (var i = 0; i < onScrollFns.length; i++) onScrollFns[i]();
  };
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(runScroll); }
  }, { passive: true });
  window.addEventListener('resize', function () { requestAnimationFrame(runScroll); });

  // ---------- ドット絵を描く(1 文字 = 1 マス。. は透明) ----------
  var PAL = { K: C.ink, W: C.white, P: C.pool, O: C.orange, G: C.paper2 };
  function drawSprite(canvas, rows, scale) {
    scale = scale || 1;
    canvas.width = rows[0].length * scale;
    canvas.height = rows.length * scale;
    var x = canvas.getContext('2d');
    rows.forEach(function (row, y) {
      for (var i = 0; i < row.length; i++) {
        if (!PAL[row[i]]) continue;
        x.fillStyle = PAL[row[i]];
        x.fillRect(i * scale, y * scale, scale, scale);
      }
    });
  }
  var SPRITES = {
    book: ['................', '................', '.KKKKKK..KKKKKK.', '.KWWWWWKKWWWWWK.', '.KWPPPWKKWPPPWK.', '.KWWWWWKKWWWWWK.', '.KWPPWWKKWPPPWK.', '.KWWWWWKKWWWWWK.', '.KWPPPWKKWPPWWK.', '.KWWWWWKKWWWWWK.', '.KKKKKKKKKKKKKK.', '..KOOOOOOOOOOK..', '...KKKKKKKKKK...', '................', '................', '................'],
    music: ['................', '.......KKKKKKK..', '.......KPPPPPK..', '.......KKKKKKK..', '.......K.....K..', '.......K.....K..', '.......K.....K..', '.......K.....K..', '....KKKK..KKKK..', '...KOOOK.KOOOK..', '...KOOOK.KOOOK..', '....KKK...KKK...', '................', '................', '................', '................'],
    shop: ['................', '................', '.KKKKKKKKKKKKKK.', '.KPPWWPPWWPPWWK.', '.KPPWWPPWWPPWWK.', '.KKKKKKKKKKKKKK.', '..K..........K..', '..K.KKKK.KKK.K..', '..K.KWWK.KOK.K..', '..K.KWWK.KOK.K..', '..K.KKKK.KOK.K..', '..K......KOK.K..', 'KKKKKKKKKKKKKKKK', '................', '................', '................'],
    person: ['................', '.....KKKKKK.....', '....KWWWWWWK....', '....KWKWWKWK....', '....KWWWWWWK....', '....KWWOOWWK....', '.....KKKKKK.....', '......KPPK......', '...KKKPPPPKKK...', '..KPPPPPPPPPPK..', '..KPPPPPPPPPPK..', '..KPPKPPPPKPPK..', '..KPPKPPPPKPPK..', 'KKKKKKKKKKKKKKKK', '................', '................'],
    building: ['................', '...KKKKKKK......', '...KWWWWWK......', '...KWPWPWK......', '...KWWWWWKKKKKK.', '...KWPWPWKWWWWK.', '...KWWWWWKWOWOK.', '...KWPWPWKWWWWK.', '...KWWWWWKWOWOK.', '...KWPWPWKWWWWK.', '...KWWKWWKWWWWK.', '...KWWKWWKWWWWK.', 'KKKKKKKKKKKKKKKK', '................', '................', '................']
  };
  document.querySelectorAll('canvas[data-sprite]').forEach(function (c) {
    var s = SPRITES[c.getAttribute('data-sprite')];
    if (s) drawSprite(c, s, 1);
  });

  // 5×7 のドット数字
  var GLYPH = {
    '0': ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
    '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
    'h': ['#....', '#....', '#.##.', '##..#', '#...#', '#...#', '#...#'],
    '□': ['######...', '#....#...', '#..######', '#..#.#..#', '#..#.#..#', '######..#', '...#....#', '...######'],
    '¥': ['#...#', '.#.#.', '..#..', '#####', '..#..', '#####', '..#..']
  };
  function glyphCells(text) {
    var cells = [], ox = 0;
    Array.from(text).forEach(function (ch) {
      var g = GLYPH[ch];
      if (!g) { ox += 3; return; }
      g.forEach(function (row, y) { for (var i = 0; i < row.length; i++) if (row[i] === '#') cells.push([ox + i, y]); });
      ox += g[0].length + 1;
    });
    var h = 0;
    Array.from(text).forEach(function (ch) { if (GLYPH[ch]) h = Math.max(h, GLYPH[ch].length); });
    return { cells: cells, w: ox - 1, h: h };
  }

  // ---------- オープニング(セッション初回のみ) ----------
  var loader = document.querySelector('.loader');
  var whale = document.querySelector('.whale');
  if (whale && (root.classList.contains('no-intro') || reduce)) { whale.remove(); whale = null; }
  if (loader) {
    if (root.classList.contains('no-intro') || reduce) {
      loader.remove();
      root.classList.remove('is-loading', 'intro-playing');
    } else {
      var startLoader = function () {
      var lc = loader.querySelector('canvas');
      var count = loader.querySelector('.loader-count');
      var lx = lc.getContext('2d');
      var cs = window.innerWidth < 700 ? 20 : 28;
      var lw = Math.ceil(window.innerWidth / cs), lh = Math.ceil(window.innerHeight / cs);
      lc.width = lw; lc.height = lh;
      var order = [];
      for (var i = 0; i < lw * lh; i++) order.push(i);
      order.sort(function () { return Math.random() - .5; });
      var t0 = performance.now(), DUR = 1400, done = false;
      var finish = function () {
        if (done) return;
        done = true;
        loader.classList.add('is-done');
        setTimeout(function () {
          root.classList.remove('is-loading', 'intro-playing');
          loader.remove();
          window.dispatchEvent(new Event('scroll'));
        }, 1100);
      };
      var frame = function (t) {
        var p = clamp((t - t0) / DUR, 0, 1);
        var n = Math.floor(order.length * Math.pow(p, 1.6) * .55);
        lx.clearRect(0, 0, lw, lh);
        for (var j = 0; j < n; j++) {
          var k = order[j];
          lx.fillStyle = j % 11 === 0 ? C.orange : (j % 3 === 0 ? C.pool : '#1a1c20');
          lx.fillRect(k % lw, Math.floor(k / lw), 1, 1);
        }
        if (count) count.textContent = String(Math.round(p * 100)).padStart(3, '0') + ' %';
        if (p < 1 && !done) requestAnimationFrame(frame); else setTimeout(finish, 250);
      };
      requestAnimationFrame(frame);
      loader.addEventListener('click', finish);
      };

      // ① クジラの動画 → 終わったら ② ピクセルのロード画面
      if (whale) {
        var wv = whale.querySelector('video');
        var whaleDone = false;
        var endWhale = function () {
          if (whaleDone) return;
          whaleDone = true;
          whale.classList.add('is-done');
          try { wv.pause(); } catch (e) {}
          startLoader();
          setTimeout(function () { whale.remove(); }, 950);
        };
        // 自動再生できない環境(低電力モードなど)は、最後のロゴを静止画で見せてから進む
        var showStill = function () {
          if (whaleDone) return;
          whale.classList.add('is-still');
          setTimeout(endWhale, 1600);
        };
        wv.addEventListener('ended', endWhale);
        wv.addEventListener('error', showStill);
        var pr = wv.play();
        if (pr && pr.catch) pr.catch(showStill);
        // 読み込みが遅すぎるときの保険
        var guard = setTimeout(function () { if (wv.paused || wv.currentTime === 0) showStill(); }, 4000);
        wv.addEventListener('playing', function () { clearTimeout(guard); whale.classList.add('is-playing'); });
      } else {
        startLoader();
      }
    }
  }

  // ---------- なめらかスクロール(Lenis) ----------
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 1 });
    var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    document.querySelectorAll('a[href="#top"]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); lenis.scrollTo(0); });
    });
  }

  // ---------- ヘッダー:下で隠れて上で出る / 下のセクションの色に合わせる ----------
  var hd = document.querySelector('.hd');
  var menuToggle = document.getElementById('menu-toggle');
  if (hd) {
    var lastY = window.scrollY;
    var themed = document.querySelectorAll('[data-theme]');
    onScroll(function () {
      var y = window.scrollY;
      var open = menuToggle && menuToggle.checked;
      if (!open && y > 200 && y > lastY + 3) hd.classList.add('is-hidden');
      else if (y < lastY - 3 || y <= 200) hd.classList.remove('is-hidden');
      lastY = y;
      var on = 'paper';
      for (var i = 0; i < themed.length; i++) {
        var r = themed[i].getBoundingClientRect();
        if (r.top <= 40 && r.bottom > 40) on = themed[i].getAttribute('data-theme');
      }
      hd.setAttribute('data-on', on);
    });
  }
  if (menuToggle) {
    menuToggle.addEventListener('change', function () {
      if (lenis) { if (menuToggle.checked) lenis.stop(); else lenis.start(); }
      root.style.overflow = menuToggle.checked ? 'hidden' : '';
    });
    document.querySelectorAll('.menu a').forEach(function (a) {
      a.addEventListener('click', function () { menuToggle.checked = false; menuToggle.dispatchEvent(new Event('change')); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuToggle.checked) { menuToggle.checked = false; menuToggle.dispatchEvent(new Event('change')); }
    });
  }

  // ---------- 文字を 1 字ずつ包む(見出しのせり上がり用) ----------
  function wrapChars(el) {
    var i = 0;
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          Array.from(n.textContent).forEach(function (ch) {
            if (ch === '\n') return;
            if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var s = document.createElement('span'); s.textContent = ch; s.style.setProperty('--i', i++);
            w.appendChild(s); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR' && n.tagName !== 'RT' && n.tagName !== 'IMG') {
          walk(n);
        }
      });
    };
    walk(el);
    el.classList.add('split');
  }
  document.querySelectorAll('[data-split]').forEach(wrapChars);

  // ---------- スクロールで表示 ----------
  var rvs = document.querySelectorAll('[data-rv], .split');
  if (!('IntersectionObserver' in window) || reduce) {
    rvs.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    rvs.forEach(function (el) { io.observe(el); });
  }

  // ---------- 1 文字ずつ灯る文章 ----------
  var lit = document.querySelector('.lit');
  if (lit && !reduce) {
    var walkLit = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          Array.from(n.textContent).forEach(function (ch) {
            if (/\s/.test(ch)) { frag.appendChild(document.createTextNode(ch)); return; }
            var s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; frag.appendChild(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !n.classList.contains('chip-img') && n.tagName !== 'RT') walkLit(n);
      });
    };
    walkLit(lit);
    var chs = lit.querySelectorAll('.ch');
    root.classList.add('js-lit');
    onScroll(function () {
      var r = lit.getBoundingClientRect();
      var p = (vh() * 0.88 - r.top) / (r.height + vh() * 0.35);
      var n = Math.round(clamp(p, 0, 1) * chs.length);
      for (var i = 0; i < chs.length; i++) chs[i].classList.toggle('on', i < n);
    });
  }

  // ---------- ピクセルの面(下層ページの見出し・カーソルの軌跡) ----------
  function PixelField(canvas, opt) {
    opt = opt || {};
    var ctx = canvas.getContext('2d');
    var self = this;
    var W, H, dpr, cell, cols, rows;
    var trail = new Map();
    var amb = [];
    var visible = true;
    self.extra = null;
    self.resize = function () {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      cell = W < 700 ? (opt.cellS || 12) : (opt.cell || 16);
      cols = Math.ceil(W / cell); rows = Math.ceil(H / cell);
      amb = [];
      var na = Math.round(cols * rows * (opt.ambient || 0.012));
      for (var i = 0; i < na; i++) amb.push({ x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows), ph: Math.random() * 6.28, sp: .4 + Math.random(), c: Math.random() < .25 ? C.orange : C.pool });
      self.cols = cols; self.rows = rows; self.cell = cell; self.W = W; self.H = H;
      if (opt.onResize) opt.onResize(self);
    };
    var host = opt.host || canvas.parentNode;
    host.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      var cx = Math.floor((e.clientX - r.left) / cell), cy = Math.floor((e.clientY - r.top) / cell);
      var now = performance.now();
      for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) {
        if (Math.abs(dx) + Math.abs(dy) > 1) continue;
        trail.set((cx + dx) + ',' + (cy + dy), now - (dx || dy ? 120 : 0));
      }
    });
    var draw = function (t) {
      if (!visible) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // 格子の点
      ctx.fillStyle = opt.dot || 'rgba(14,15,17,.14)';
      for (var y = 1; y < rows; y++) for (var x = 1; x < cols; x++) ctx.fillRect(x * cell - .5, y * cell - .5, 1, 1);
      // ときどき点滅するマス
      for (var i = 0; i < amb.length; i++) {
        var a = amb[i], v = Math.sin(t / 1000 * a.sp + a.ph);
        if (v < .55) continue;
        ctx.globalAlpha = (v - .55) / .45;
        ctx.fillStyle = a.c;
        ctx.fillRect(a.x * cell, a.y * cell, cell, cell);
      }
      ctx.globalAlpha = 1;
      if (self.extra) self.extra(ctx, t);
      // カーソルの軌跡
      trail.forEach(function (time, key) {
        var age = (t - time) / 700;
        if (age >= 1) { trail.delete(key); return; }
        var p = key.split(',');
        ctx.globalAlpha = 1 - age;
        ctx.fillStyle = age < .25 ? C.orange : C.pool;
        ctx.fillRect(p[0] * cell, p[1] * cell, cell, cell);
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    };
    self.resize();
    window.addEventListener('resize', self.resize);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        var was = visible; visible = es[0].isIntersecting;
        if (visible && !was) requestAnimationFrame(draw);
      }).observe(canvas);
    }
    if (reduce) { visible = false; setTimeout(function () { visible = true; draw(performance.now()); visible = false; }, 50); }
    else requestAnimationFrame(draw);
  }
  document.querySelectorAll('.ph-canvas').forEach(function (c) { new PixelField(c, { ambient: .01, dot: c.getAttribute('data-dot') || undefined }); });

  // ---------- ヒーロー:スクロールでピクセルのホームページが組み上がる ----------
  var hero = document.querySelector('.hero');
  if (hero) {
    var hc = hero.querySelector('.hero-canvas');
    var notes = hero.querySelectorAll('.note-pin');
    var bar = hero.querySelector('.hero-bar');
    var build = [], anchors = {};
    var heroP = 0;
    var layout = function (f) {
      var cols = f.cols, rows = f.rows, mob = f.W < 860;
      var x0 = mob ? 1 : Math.round(cols * .6), x1 = mob ? cols - 2 : cols - Math.round(cols * .05);
      var y0 = mob ? Math.round(rows * .2) : Math.round(rows * .17), y1 = mob ? Math.round(rows * .5) : Math.round(rows * .66);
      if (mob) {
        // スマホ:上の帯(GAKU SITE+)の下から、見出しの少し上までに収める(文字と重ねない)
        var cr = hc.getBoundingClientRect();
        var hud = hero.querySelector('.hero-hud'), ttl = hero.querySelector('.hero-title');
        if (hud && ttl) {
          var topPx = hud.getBoundingClientRect().bottom - cr.top + 12;
          var botPx = ttl.getBoundingClientRect().top - cr.top - 28;
          y0 = Math.ceil(topPx / f.cell); y1 = Math.floor(botPx / f.cell);
        }
      }
      var grid = {};
      var set = function (x, y, c) { if (x >= x0 && x <= x1 && y >= y0 && y <= y1) grid[x + ',' + y] = c; };
      var rect = function (ax, ay, bx, by, c) { for (var y = ay; y <= by; y++) for (var x = ax; x <= bx; x++) set(x, y, c); };
      var gw = x1 - x0, gh = y1 - y0;
      rect(x0, y0, x1, y1, C.white);                         // ページの地
      rect(x0, y0, x1, y0 + 2, C.paper2);                    // ブラウザのバー
      set(x0 + 2, y0 + 1, C.orange); set(x0 + 4, y0 + 1, C.pool); set(x0 + 6, y0 + 1, C.ink);
      rect(x0 + 10, y0 + 1, x1 - 6, y0 + 1, '#d3d2cc');      // URL 欄
      var ny = y0 + 5;                                       // ナビ
      rect(x0 + 3, ny - 1, x0 + 4, ny, C.pool); rect(x0 + 5, ny, x0 + 6, ny + 1, C.ink);
      for (var k = 0; k < 4; k++) rect(x1 - 4 - k * 5, ny, x1 - 2 - k * 5 - 1, ny, C.ink);
      var hy0 = y0 + 9, hy1 = hy0 + Math.max(mob ? 6 : 13, Math.round(gh * .42));  // ヒーロー
      rect(x0 + 3, hy0, x1 - 3, hy1, C.pool);
      var tw = Math.round((gw - 6) * .62);
      rect(x0 + 6, hy0 + 3, x0 + 6 + tw, hy0 + 4, C.ink);
      rect(x0 + 6, hy0 + 6, x0 + 6 + Math.round(tw * .7), hy0 + 7, C.ink);
      var by = hy0 + 10;
      rect(x0 + 6, by, x0 + 14, by + 1, C.orange);
      var cy0 = hy1 + 3, cy1 = Math.min(y1 - 4, cy0 + Math.max(4, Math.round(gh * .2)));  // カード 3 枚
      var cw = Math.floor((gw - 6 - 4) / 3);
      for (var c = 0; c < 3; c++) {
        var cx0 = x0 + 3 + c * (cw + 2), cx1 = cx0 + cw - 1;
        rect(cx0, cy0, cx1, cy1, C.paper2);
        rect(cx0 + 1, cy0 + 1, cx0 + Math.round(cw * .6), cy0 + 1, C.ink);
        rect(cx0 + 1, cy1 - 1, cx0 + 3, cy1 - 1, c === 1 ? C.orange : C.pool);
      }
      rect(x0, y1 - 1, x1, y1, C.ink);                       // フッター
      for (var x = x0; x <= x1; x++) { set(x, y0, C.ink); set(x, y1, C.ink); }  // 外枠
      for (var y = y0; y <= y1; y++) { set(x0, y, C.ink); set(x1, y, C.ink); }
      build = Object.keys(grid).map(function (key) {
        var p = key.split(',').map(Number);
        return { x: p[0], y: p[1], c: grid[key], o: p[1] + Math.random() * 2.2 + (p[0] - x0) / gw * .8 };
      }).sort(function (a, b) { return a.o - b.o; });
      var cellPx = f.cell;
      anchors = {
        seo: [(x0 + 10) * cellPx, (y0 + 3) * cellPx, 0.18],
        design: [(x1 - 3) * cellPx, (hy0 + 1) * cellPx, 0.42],
        launch: [(x0 + 15) * cellPx, (by + 2) * cellPx, 0.62],
        code: [(x0 + 3) * cellPx, (cy1 + 2) * cellPx, 0.82]
      };
      notes.forEach(function (n) {
        var a = anchors[n.getAttribute('data-at')];
        if (!a) return;
        var left = a[0], top = a[1];
        if (n.getAttribute('data-at') === 'design') left -= n.offsetWidth;
        // スマホ:03・04 は絵の下端の右・左に分けて、重ならないようにする
        if (mob && n.getAttribute('data-at') === 'launch') { left = (x1 - 1) * cellPx - n.offsetWidth; top = y1 * cellPx - n.offsetHeight - 8; }
        if (mob && n.getAttribute('data-at') === 'code') { left = (x0 + 2) * cellPx; top = y1 * cellPx - n.offsetHeight - 8; }
        left = clamp(left, 8, f.W - n.offsetWidth - 8);
        n.style.left = left + 'px'; n.style.top = top + 'px';
      });
    };
    var field = new PixelField(hc, { host: hero.querySelector('.hero-stick'), ambient: .006, cell: 10, cellS: 6, onResize: layout });
    // フォントの読み込みで見出しの位置が変わるので、読み込み後に配置し直す
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { field.resize(); });
    field.extra = function (ctx) {
      var cell = field.cell;
      var n = Math.floor(clamp(.1 + heroP * 1.15, 0, 1) * build.length);
      for (var i = 0; i < n; i++) { var b = build[i]; ctx.fillStyle = b.c; ctx.fillRect(b.x * cell, b.y * cell, cell, cell); }
      // 組み上げ中の先頭はオレンジで光る
      if (n < build.length) {
        ctx.fillStyle = C.orange;
        for (var j = n; j < Math.min(build.length, n + 6); j++) ctx.fillRect(build[j].x * cell, build[j].y * cell, cell, cell);
      }
    };
    var heroUpdate = function () {
      heroP = reduce ? 1 : progressOf(hero);
      if (bar) bar.style.setProperty('--p', heroP);
      notes.forEach(function (nn) {
        var a = anchors[nn.getAttribute('data-at')];
        nn.classList.toggle('on', !!a && heroP >= a[2] - .12);
      });
    };
    onScroll(heroUpdate);
    heroUpdate();
  }

  // ---------- 数字:巨大な数字が 0 → 2 → 24 と回る ----------
  var nums = document.querySelector('.numbers');
  if (nums) {
    var reel = nums.querySelector('.num-reel');
    var items = nums.querySelectorAll('.num-item');
    var idx = nums.querySelector('.num-idx');
    onScroll(function () {
      // スクロール量にそのまま合わせて回す(数字ごとに止まって見せる区間あり)
      //  0〜.18 0円で静止 → .18〜.34 回る → .34〜.58 2万円で静止 → .58〜.74 回る → .74〜1 24時間で静止
      var p = progressOf(nums);
      var seg = function (a, b) { var t = clamp((p - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
      var f = seg(.18, .34) + seg(.58, .74);
      reel.style.setProperty('--s', f.toFixed(4));
      var s = Math.round(f);
      items.forEach(function (it, i) { it.classList.toggle('on', i === s); });
      if (idx) idx.textContent = '0' + (s + 1) + ' / 03';
    });
  }

  // ---------- 強み:ドット絵のビジュアル ----------
  document.querySelectorAll('canvas[data-glyph]').forEach(function (cv) {
    var g = glyphCells(cv.getAttribute('data-glyph'));
    var color = cv.getAttribute('data-color') === 'pool' ? C.pool : C.ink;
    var N = 32, sc = Math.floor((N - 4) / g.w);
    var ox = Math.floor((N - g.w * sc) / 2), oy = Math.floor((N - g.h * sc) / 2) - (cv.hasAttribute('data-bar') ? 3 : 0);
    var px = [];
    g.cells.forEach(function (c) { for (var a = 0; a < sc; a++) for (var b = 0; b < sc; b++) px.push([ox + c[0] * sc + a, oy + c[1] * sc + b]); });
    px.sort(function (a, b) { return (a[1] - b[1]) || (a[0] - b[0]); });
    cv.width = N; cv.height = N;
    var x = cv.getContext('2d');
    var start = null, on = false;
    var tick = function (t) {
      if (!on) return;
      if (start === null) start = t;
      var e = (t - start) / 1000;
      x.clearRect(0, 0, N, N);
      // 外周のドット枠
      x.fillStyle = color;
      for (var i = 0; i < N; i += 2) { x.fillRect(i, 0, 1, 1); x.fillRect(i, N - 1, 1, 1); x.fillRect(0, i, 1, 1); x.fillRect(N - 1, i, 1, 1); }
      var n = Math.min(px.length, Math.floor(e * px.length / 1.2));
      for (var j = 0; j < n; j++) x.fillRect(px[j][0], px[j][1], 1, 1);
      if (cv.hasAttribute('data-bar')) {
        var bp = (e % 3) / 2.4;
        var bw = Math.floor(clamp(bp, 0, 1) * (N - 8));
        x.fillRect(4, N - 7, N - 8, 1); x.fillRect(4, N - 4, N - 8, 1);
        x.fillStyle = C.orange; x.fillRect(4, N - 6, bw, 2);
      } else {
        // カーソル点滅
        if (Math.floor(e * 2) % 2) { x.fillStyle = C.white; x.fillRect(ox + g.w * sc + 1, oy + g.h * sc - 2, 2, 2); }
      }
      requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window && !reduce) {
      new IntersectionObserver(function (es) {
        var was = on; on = es[0].isIntersecting;
        if (on && !was) { start = null; requestAnimationFrame(tick); }
      }).observe(cv);
    } else { on = true; start = -99999; tick(0); on = false; }
  });

  // ---------- 制作実績:カードが弧を描いて流れる ----------
  var works = document.querySelector('.works');
  if (works) {
    var cards = Array.prototype.slice.call(works.querySelectorAll('.arc-card'));
    var metaH = works.querySelector('.works-meta h3'), metaP = works.querySelector('.works-meta p');
    var go = works.querySelector('.works-go'), active = null;
    // 枚数に応じてスクロール量を調整(少ないうちは短く)
    works.style.height = Math.min(480, 300 + cards.length * 40) + 'vh';
    var place = function () {
      var p = reduce ? .5 : progressOf(works);
      var W = window.innerWidth, H = vh();
      var cw = W < 760 ? W * .62 : Math.min(W * .26, 420);
      var R = Math.max(W * 1.15, 900);
      var cy = H * (W < 760 ? .6 : .56) + R;
      var step = (cw * 1.18) / R;
      // p=0 で 1 枚目が右から入り、p=1 で最後の 1 枚が左へ抜ける
      var shift = -1.6 + p * (cards.length - 1 + 3.2);
      works.style.setProperty('--cw', cw + 'px');
      // 中央に一番近いカードのサイト名・説明・リンクを下に表示
      var cur = cards[Math.max(0, Math.min(cards.length - 1, Math.round(shift)))];
      if (cur && cur !== active) {
        active = cur;
        if (metaH) metaH.textContent = cur.getAttribute('data-name') || '';
        if (metaP) metaP.textContent = cur.getAttribute('data-desc') || '';
        if (go) go.setAttribute('href', cur.getAttribute('href'));
      }
      cards.forEach(function (c, i) {
        var a = (i - shift) * step;
        var x = R * Math.sin(a), y = cy - R * Math.cos(a) - cw * .3125;
        c.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + (a * 57.2958).toFixed(2) + 'deg)';
      });
    };
    onScroll(place);
    place();
  }

  // ---------- 追従の相談ボタン:ヒーロー・締めの CTA・フッターでは隠す ----------
  var fl = document.querySelector('.float');
  var hideAt = document.querySelectorAll('.hero, .numbers, .stack, .works, .xsec, .cta, .ft, .ph');
  if (fl && hideAt.length && 'IntersectionObserver' in window) {
    var seen = new Set();
    var fio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); });
      fl.classList.toggle('is-hidden', seen.size > 0);
    });
    hideAt.forEach(function (el) { fio.observe(el); });
  }

  // ---------- 全ページ共通:左下のスクロール量メーター(ヒーローの「Scroll to build」と同じ見た目) ----------
  var pm = document.createElement('p');
  pm.className = 'pg-meter mono';
  pm.setAttribute('aria-hidden', 'true');
  pm.innerHTML = '<span>Scroll</span><span class="pg-bar"><i></i></span><span class="pg-num">0%</span>';
  document.body.appendChild(pm);
  var pmNum = pm.querySelector('.pg-num');
  var pmThemed = document.querySelectorAll('[data-theme]');
  var pmHero = document.querySelector('.hero');
  onScroll(function () {
    var max = Math.max(1, document.documentElement.scrollHeight - vh());
    var p = clamp(window.scrollY / max, 0, 1);
    pm.style.setProperty('--p', p);
    pmNum.textContent = Math.round(p * 100) + '%';
    // メーターの位置(画面の下端)にあるセクションの色に合わせる
    var y = vh() - 24, on = 'paper';
    for (var i = 0; i < pmThemed.length; i++) {
      var r = pmThemed[i].getBoundingClientRect();
      if (r.top <= y && r.bottom > y) on = pmThemed[i].getAttribute('data-theme');
    }
    pm.setAttribute('data-on', on);
    // トップのヒーローには専用のメーターがあるので、その間は隠す
    var ftb = document.querySelector('.ft-bottom');
    pm.classList.toggle('is-hidden', (!!pmHero && pmHero.getBoundingClientRect().bottom > vh() * .5) || (!!ftb && ftb.getBoundingClientRect().top < vh() - 10));
  });

  runScroll();


  // ---------- 見出しの文字がランダムな記号から本来の文字に変わる(Sui の ScrambleText 風) ----------
  var scr = document.querySelectorAll('[data-scramble]');
  if (scr.length && 'IntersectionObserver' in window && !reduce) {
    var POOL = 'アイウエオカキクケコサシスセソ01#%&*+=<>/▪︎□';
    var scramble = function (el) {
      var final = el.textContent, len = final.length, t0 = null, DUR = 1100;
      var step = function (t) {
        if (t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / DUR), n = Math.floor(p * len), out = final.slice(0, n);
        for (var i = n; i < len; i++) out += final[i] === ' ' ? ' ' : POOL[Math.floor(Math.random() * POOL.length)];
        el.textContent = out;
        if (p < 1) requestAnimationFrame(step); else el.textContent = final;
      };
      requestAnimationFrame(step);
    };
    var sio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        sio.unobserve(e.target);
        setTimeout(function () { scramble(e.target); }, 300);
      });
    }, { threshold: 0.6 });
    scr.forEach(function (el) { el.setAttribute('aria-label', el.textContent); sio.observe(el); });
  }

  // =========================================================
  // セクションの切り替わり演出(Sui を参照)
  // =========================================================

  // ① 光の縞のトランジション(専用の区間。文字には重ならない)
  //    スクロールに合わせて、中央の線から光の帯が広がり → 漂い → たたまれて、次の見出しが現れる
  // 見出しが出そろってから固定が外れるまでの「余韻」区間は、ホイールを重くしてゆっくり進ませる
  var holding = [];
  var setHold = function (i, on) {
    if (holding[i] === on) return;
    holding[i] = on;
    if (lenis && lenis.virtualScroll) lenis.virtualScroll.options.wheelMultiplier = holding.indexOf(true) >= 0 ? .3 : 1;
  };
  document.querySelectorAll('.xsec').forEach(function (sec, xi) {
    var cv = sec.querySelector('canvas'), ctx = cv.getContext('2d');
    var word = sec.querySelector('.xsec-word'), en = sec.querySelector('.xsec-word .en');
    // 目にやさしい光:細い線ではなく、ぼかした太い光の帯をゆっくり重ねる(白は使わない)
    var COLS = [[63, 193, 201], [63, 193, 201], [42, 143, 191], [31, 58, 95], [46, 110, 140], [120, 205, 214]];
    var W = 0, H = 0, bars = [], visible = false, raf = 0, p = 0, scrambled = false;
    var SC = 6; // 1/6 の解像度で描いて拡大 → 自然にふんわりぼける
    var ss = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
    var build = function () {
      W = Math.max(1, Math.round(cv.clientWidth / SC)); H = Math.max(1, Math.round(cv.clientHeight / SC));
      cv.width = W; cv.height = H;
      bars = [];
      var n = Math.max(7, Math.round(cv.clientWidth / 150));
      for (var i = 0; i < n; i++) {
        bars.push({
          x: (i + .5) / n + (Math.random() - .5) * .08, w: (60 + Math.random() * 120) / SC,
          c: COLS[Math.floor(Math.random() * COLS.length)], a: .28 + Math.random() * .3,
          ph: Math.random(), sp: .15 + Math.random() * .25, off: Math.random() * 6.283
        });
      }
    };
    var frame = function (now) {
      raf = 0;
      var t = now / 1000;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var grow = ss(.02, .32, p), fold = ss(.56, .8, p); // 0.32〜0.56 は光が漂う「見せ場」
      // 中央のやわらかい光だまり
      var glow = clamp(grow - fold, 0, 1);
      if (glow > .01) {
        var rg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * .6);
        rg.addColorStop(0, 'rgba(63,193,201,' + (.16 * glow) + ')'); rg.addColorStop(1, 'rgba(31,58,95,0)');
        ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
      }
      ctx.globalCompositeOperation = 'screen';
      for (var i = 0; i < bars.length; i++) {
        var b = bars[i];
        var v = clamp(grow * 1.4 - b.ph * .4, 0, 1) * (1 - clamp(fold * 1.4 - (1 - b.ph) * .4, 0, 1));
        if (v <= .003) continue;
        var e = 1 - Math.pow(1 - v, 3);
        var h = H * (.15 + .85 * e), cy = H / 2 + Math.sin(t * b.sp + b.off) * H * .04, y0 = cy - h / 2;
        var cx = b.x * W + Math.sin(t * b.sp * .7 + b.off) * W * .015, w = b.w * (.6 + .4 * e);
        var c = b.c, col = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',';
        // 横方向も縦方向も端がふわっと消えるよう、2 本のグラデーションを重ねる
        var gx = ctx.createLinearGradient(cx - w, 0, cx + w, 0);
        gx.addColorStop(0, col + '0)'); gx.addColorStop(.5, col + (b.a * v) + ')'); gx.addColorStop(1, col + '0)');
        ctx.fillStyle = gx;
        ctx.save();
        ctx.beginPath(); ctx.rect(cx - w, y0, w * 2, h); ctx.clip();
        ctx.fillRect(cx - w, y0, w * 2, h);
        ctx.restore();
      }
      ctx.globalCompositeOperation = 'destination-in';
      var gy = ctx.createLinearGradient(0, 0, 0, H);
      gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(.3, 'rgba(0,0,0,1)'); gy.addColorStop(.7, 'rgba(0,0,0,1)'); gy.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gy; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      if (visible) raf = requestAnimationFrame(frame);
    };
    var update = function () {
      var r = sec.getBoundingClientRect();
      p = clamp(-r.top / Math.max(1, r.height - vh()), 0, 1);
      // 次の見出し:たたまれていくのに合わせて、ぼかしから現れる
      var show = ss(.56, .72, p); // 0.72〜1 は見出しをじっくり見せる(余韻)
      // 見出しが出そろってから、画面の上へ半分抜けるまでをゆっくりに
      setHold(xi, p > .7 && r.bottom > vh() * .45);
      word.style.opacity = show;
      word.style.filter = 'blur(' + ((1 - show) * 16).toFixed(1) + 'px)';
      word.style.transform = 'translateY(' + ((1 - show) * 24).toFixed(1) + 'px)';
      if (show > .2 && !scrambled && en) {
        scrambled = true;
        var fin = en.textContent, t0 = null, POOL_X = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#_';
        var step = function (tm) {
          if (t0 === null) t0 = tm;
          var q = Math.min(1, (tm - t0) / 900), k = Math.floor(q * fin.length), s = fin.slice(0, k);
          for (var j = k; j < fin.length; j++) s += fin[j] === ' ' ? ' ' : POOL_X[Math.floor(Math.random() * POOL_X.length)];
          en.textContent = s;
          if (q < 1) requestAnimationFrame(step); else en.textContent = fin;
        };
        requestAnimationFrame(step);
      }
    };
    if (reduce) { word.style.opacity = 1; return; }
    build();
    window.addEventListener('resize', build);
    onScroll(update);
    update();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(frame);
      }).observe(sec);
    }
  });

  // ② パネルが角丸の細い形から全幅に広がって現れる
  var clips = document.querySelectorAll('[data-clip]');
  if (clips.length && !reduce) {
    onScroll(function () {
      var H = vh();
      clips.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top > H || r.bottom < 0) return;
        var q = clamp(r.top / (H * .9), 0, 1);
        q = q * q;
        el.style.clipPath = q > .001 ? 'inset(0 ' + (q * 9).toFixed(2) + '% round ' + (q * 56).toFixed(1) + 'px)' : '';
      });
    });
  }

  // ③ 文字を 1 字ずつタイプする(ブロックカーソル付き。レイアウトは崩さない)
  var typers = document.querySelectorAll('[data-type]');
  if (typers.length && 'IntersectionObserver' in window && !reduce) {
    typers.forEach(function (el) {
      var txt = el.textContent;
      el.setAttribute('aria-label', txt);
      el.innerHTML = '';
      Array.from(txt).forEach(function (ch) {
        var s = document.createElement('span'); s.className = 'tc'; s.textContent = ch; s.setAttribute('aria-hidden', 'true'); el.appendChild(s);
      });
    });
    var tio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        tio.unobserve(e.target);
        var cs = e.target.querySelectorAll('.tc'), i = 0;
        var tick = function () {
          if (i > 0) { cs[i - 1].classList.remove('cur'); cs[i - 1].classList.add('on'); }
          if (i >= cs.length) return;
          cs[i].classList.add('cur'); i++;
          setTimeout(tick, 42);
        };
        setTimeout(tick, 200);
      });
    }, { threshold: 0.8 });
    typers.forEach(function (el) { tio.observe(el); });
  }

  // ④ 英字ラベルがランダムな記号から元の文字へ
  var tags = document.querySelectorAll('.tag, .head-row .mono');
  if (tags.length && 'IntersectionObserver' in window && !reduce) {
    var POOL_EN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#%_<>';
    var scrambleEn = function (el) {
      var node = null;
      for (var k = el.childNodes.length - 1; k >= 0; k--) if (el.childNodes[k].nodeType === 3 && el.childNodes[k].textContent.trim()) { node = el.childNodes[k]; break; }
      if (!node) return;
      var fin = node.textContent, t0 = null;
      var step = function (t) {
        if (t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / 700), n = Math.floor(p * fin.length), s = fin.slice(0, n);
        for (var i = n; i < fin.length; i++) s += fin[i] === ' ' ? ' ' : POOL_EN[Math.floor(Math.random() * POOL_EN.length)];
        node.textContent = s;
        if (p < 1) requestAnimationFrame(step); else node.textContent = fin;
      };
      requestAnimationFrame(step);
    };
    var gio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { gio.unobserve(e.target); scrambleEn(e.target); } });
    }, { threshold: 1 });
    tags.forEach(function (el) { gio.observe(el); });
  }

  // ⑤ 一覧で、画面の中央にある行が自動でハイライトされる
  var rows = document.querySelectorAll('.svc-row');
  if (rows.length && !reduce) {
    onScroll(function () {
      var mid = vh() * .5, best = null, bd = 1e9;
      rows.forEach(function (r) {
        var b = r.getBoundingClientRect(), d = Math.abs(b.top + b.height / 2 - mid);
        if (b.bottom > 0 && b.top < vh() && d < bd) { bd = d; best = r; }
      });
      rows.forEach(function (r) { r.classList.toggle('is-on', r === best && bd < vh() * .3); });
    });
  }

  // ⑥ 数字のカウントアップ(data-count。3 桁区切りも保つ)
  var counts = document.querySelectorAll('[data-count]');
  if (counts.length && 'IntersectionObserver' in window && !reduce) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target, to = parseFloat(el.getAttribute('data-count')), t0 = null;
        var step = function (t) {
          if (t0 === null) t0 = t;
          var p = Math.min(1, (t - t0) / 1300), v = Math.round(to * (1 - Math.pow(1 - p, 4)));
          el.textContent = v.toLocaleString('ja-JP');
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counts.forEach(function (el) { cio.observe(el); });
  }

  // ぼかしから現れる見出しも、スクロール表示の対象にする
  if ('IntersectionObserver' in window && !reduce) {
    var bio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); bio.unobserve(e.target); } });
    }, { threshold: 0.2 });
    document.querySelectorAll('[data-blur]').forEach(function (el) { bio.observe(el); });
  }
  runScroll();
  // ガクザメ:ときどき画面を横切る。z-index:-1 なので、何もない空白でだけ見える
  // <body data-gakuzame> のページ(トップ・私たちについて)だけで泳がせる
  if (document.body.hasAttribute('data-gakuzame') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // chara-sheet.js と同じドット絵(36×17、右向き)
    var SHARK = [
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
    var COLORS = { O: '#0b1e37', D: '#5b6e88', B: '#7f93ad', L: '#e6edf3', G: '#5b6e88', E: '#061426', W: '#ffffff', M: '#0b1e37', T: '#ffffff' };
    // しっぽ(左 7 列)だけ上下にずらした 2 コマを作り、交互に表示してしっぽを振る
    var drawShark = function (tailDy) {
      var c = document.createElement('canvas');
      c.width = 36; c.height = 19;
      var x = c.getContext('2d');
      SHARK.forEach(function (row, y) {
        for (var i = 0; i < row.length; i++) {
          if (!COLORS[row[i]]) continue;
          x.fillStyle = COLORS[row[i]];
          x.fillRect(i, y + 1 + (i < 7 ? tailDy : 0), 1, 1);
        }
      });
      return c;
    };
    var swimmer = document.createElement('div');
    swimmer.className = 'gakuzame-swim';
    swimmer.setAttribute('aria-hidden', 'true');
    var bob = document.createElement('div');
    bob.className = 'gakuzame-bob';
    bob.appendChild(drawShark(-1));
    bob.appendChild(drawShark(1));
    swimmer.appendChild(bob);
    document.body.appendChild(swimmer);

    var swim = function () {
      var html = document.documentElement;
      if (!document.hidden && !html.classList.contains('intro-playing')) {
        var toLeft = Math.random() < .5;
        var w = swimmer.offsetWidth;
        var vw = window.innerWidth;
        var y = Math.round(window.innerHeight * (.15 + Math.random() * .7));
        var from = toLeft ? vw + 20 : -w - 20;
        var to = toLeft ? -w - 20 : vw + 20;
        swimmer.classList.toggle('is-left', toLeft);
        swimmer.style.opacity = 1;
        swimmer.animate(
          [{ transform: 'translate(' + from + 'px,' + y + 'px)' }, { transform: 'translate(' + to + 'px,' + y + 'px)' }],
          { duration: 9000 + Math.random() * 5000, easing: 'linear' }
        ).onfinish = function () { swimmer.style.opacity = 0; };
      }
      setTimeout(swim, 20000 + Math.random() * 20000);
    };
    setTimeout(swim, 4000 + Math.random() * 4000);
  }
})();
