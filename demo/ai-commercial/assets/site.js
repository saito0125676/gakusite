// AI COMMERCIAL+ 全ページ共通スクリプト
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  if (reduce) root.classList.add('no-glow');

  // ---------- 全画面メニュー ----------
  var menuBtn = $('.menu-btn');
  var setMenu = function (open) {
    root.classList.toggle('menu-open', open);
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.querySelector('.menu-word').textContent = open ? 'Close' : 'Menu';
    }
  };
  if (menuBtn) menuBtn.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('menu-open')) { setMenu(false); menuBtn.focus(); } });
  $$('.menu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  // ---------- オープニング：数字が 000 → 100 に進む ----------
  var loaderNum = $('.loader b');
  if (loaderNum && root.classList.contains('intro')) {
    var t0 = performance.now();
    (function count() {
      var p = Math.min((performance.now() - t0) / 1800, 1);
      loaderNum.textContent = String(Math.round(p * 100)).padStart(3, '0');
      if (p < 1) requestAnimationFrame(count);
    })();
    // CSS のフェードアウトが動かない環境でも、必ず消して中身を見せる
    setTimeout(function () { var l = $('.loader'); if (l) l.style.display = 'none'; }, 2700);
  }

  // ---------- 文字を 1 文字ずつに分ける（見出しのせり上がり用） ----------
  $$('[data-split]').forEach(function (el) {
    var i = 0;
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split('').forEach(function (c) {
            var outer = document.createElement('span'); outer.className = 'ch';
            var inner = document.createElement('span'); inner.textContent = c; inner.style.setProperty('--i', i++);
            outer.appendChild(inner); frag.appendChild(outer);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    el.classList.add('split-chars');
  });

  // ---------- スクロールに合わせて光る文章：1 文字ずつに分ける ----------
  var glows = $$('.glow-text').map(function (el) {
    var spans = [];
    var walk = function (node, hl) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split('').forEach(function (c) {
            var s = document.createElement('span'); s.className = 'w' + (hl ? ' hl' : ''); s.textContent = c;
            frag.appendChild(s); spans.push(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n, hl || n.tagName === 'EM');
      });
    };
    walk(el, false);
    var scene = el.closest('[data-scene]');
    return { el: el, spans: spans, lit: 0, scene: scene, stage: scene && $('.scene-stage', scene) };
  });

  // ヒーローとページ見出しの文字を出す
  $$('.hero, .page-head').forEach(function (top) {
    requestAnimationFrame(function () { top.classList.add('in'); $$('[data-split]', top).forEach(function (el) { el.classList.add('in'); }); });
  });

  // ---------- ヒーローの言葉の入れ替え ⟨Cheaper.⟩ ⟨Faster.⟩ … ----------
  var rot = $('.rot');
  if (rot && !reduce) {
    var words = rot.getAttribute('data-words').split('|'), wi = 0;
    var type = function (word, cb) {
      var i = 0;
      (function step() { rot.textContent = word.slice(0, ++i); if (i < word.length) setTimeout(step, 55); else cb(); })();
    };
    var erase = function (cb) {
      (function step() { rot.textContent = rot.textContent.slice(0, -1); if (rot.textContent.length) setTimeout(step, 30); else cb(); })();
    };
    var cycle = function () { setTimeout(function () { erase(function () { wi = (wi + 1) % words.length; type(words[wi], cycle); }); }, 2200); };
    setTimeout(cycle, root.classList.contains('intro') ? 3000 : 1200);
  }

  // ---------- 動画：画面に入っているあいだだけ再生（重くならないように） ----------
  var heroVideo = $('.hero-video');
  if (heroVideo) {
    // hero-3.mp4 → hero.mp4 → … と交互に流す。2 本目が無ければ 1 本目をくり返す
    var srcs = [heroVideo.getAttribute('src')], idx = 0;
    if (heroVideo.dataset.next) {
      srcs.push(heroVideo.dataset.next);
      var pre = document.createElement('video');
      pre.muted = true; pre.preload = 'auto';
      pre.addEventListener('error', function () { srcs = [srcs[0]]; heroVideo.loop = true; });
      pre.src = heroVideo.dataset.next;
    } else heroVideo.loop = true;
    heroVideo.addEventListener('loadeddata', function () {
      heroVideo.classList.add('is-ready');
      if (!reduce) heroVideo.play().catch(function () {});
    });
    heroVideo.addEventListener('ended', function () { idx = (idx + 1) % srcs.length; heroVideo.src = srcs[idx]; });
    heroVideo.addEventListener('error', function () { if (idx === 0) return; srcs = [srcs[0]]; idx = 0; heroVideo.loop = true; heroVideo.src = srcs[0]; });
  }
  var autoVideos = $$('video[data-auto]');
  if ('IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (reduce) return;
        if (e.isIntersecting) e.target.play().catch(function () {}); else e.target.pause();
      });
    }, { threshold: 0.2 });
    autoVideos.forEach(function (v) { vio.observe(v); });
  }
  // サービスの行：マウスを乗せたときだけプレビュー動画を再生
  $$('.row').forEach(function (row) {
    var v = $('.row-preview video', row);
    if (!v) return;
    row.addEventListener('mouseenter', function () { if (!reduce) v.play().catch(function () {}); });
    row.addEventListener('mouseleave', function () { v.pause(); });
  });

  // ---------- スクロール演出：場面ごとの進み具合（0〜1）を --p に渡す ----------
  // スクロール位置にそのまま合わせるとホイール 1 回ぶんずつ飛んでカクつくので、
  // 目標の値へ毎フレーム少しずつ近づけて、なめらかに動かす
  var scenes = $$('[data-scene]').map(function (el) {
    return { el: el, pass: el.dataset.scene === 'pass', top: 0, height: 0, cur: -1, shown: -1 };
  });
  var sceneOf = function (el) { return scenes.filter(function (s) { return s.el === el; })[0]; };
  var isPinned = function (stage) { return !reduce && !!stage && getComputedStyle(stage).position === 'sticky'; };
  var chapters = $$('[data-chapters]').map(function (el) {
    return { scene: sceneOf(el), items: $$('.chapter', el), videos: $$('.ch-media video', el), count: $('.ch-count b', el), now: -1 };
  });
  var setChapter = function (c, n) {
    if (n === c.now) return;
    c.now = n;
    c.items.forEach(function (li, i) { li.classList.toggle('is-on', i === n); });
    c.videos.forEach(function (v, i) {
      v.classList.toggle('is-on', i === n);
      if (i === n && !reduce) v.play().catch(function () {}); else v.pause();
    });
    if (c.count && n >= 0) c.count.textContent = String(n + 1).padStart(2, '0');
  };
  var stepScenes = $$('[data-steps]').map(function (el) {
    return {
      el: el, scene: sceneOf(el), stage: $('.scene-stage', el), pinned: false,
      steps: $$('[data-step]', el).map(function (st) {
        return { el: st, shown: -1, counts: $$('[data-count]', st).map(function (c) { return { el: c, to: parseFloat(c.getAttribute('data-count')), shown: null }; }) };
      })
    };
  });
  glows.forEach(function (g) { g.sc = g.scene && sceneOf(g.scene); });

  // 留めるかどうかは画面の大きさで決まるので、読み込み時と大きさが変わったときだけ調べる
  var measure = function () {
    stepScenes.forEach(function (s) {
      s.pinned = isPinned(s.stage);
      if (s.pinned) { s.el.dataset.pinned = '1'; return; }
      // 留めなくなったら、数字は最終の値で見せる
      if (s.el.dataset.pinned) {
        delete s.el.dataset.pinned;
        s.steps.forEach(function (st) { st.el.style.removeProperty('--q'); st.shown = -1; st.counts.forEach(function (c) { c.el.textContent = c.to; c.shown = null; }); });
      }
    });
    glows.forEach(function (g) { g.pinned = isPinned(g.stage); });
  };

  var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var raf = 0, lastT = 0;
  var frame = function (now) {
    raf = 0;
    var vh = window.innerHeight;
    // 1 フレームで差の約 10% ずつ近づく（画面の書き換え回数が違っても同じ速さになるよう時間で調整）
    var k = 1 - Math.pow(0.9,Math.min(64, lastT ? now - lastT : 16.7) / 16.7);
    lastT = now;
    // 位置はまとめて先に読み、書き込みはあとでまとめて行う（交互にすると毎回計算し直しになり重い）
    scenes.forEach(function (s) { var r = s.el.getBoundingClientRect(); s.top = r.top; s.height = r.height; });
    glows.forEach(function (g) { if (!g.pinned) { var r = g.el.getBoundingClientRect(); g.top = r.top; g.height = r.height; } });

    var moving = false;
    scenes.forEach(function (s) {
      // 画面に留まる場面は「留まっているあいだ」、data-scene="pass" は「画面を通り過ぎるあいだ」で 0 → 1
      s.target = clamp01(s.pass ? (vh - s.top) / (vh + s.height) : -s.top / Math.max(1, s.height - vh));
      if (s.cur < 0 || reduce) s.cur = s.target; else s.cur += (s.target - s.cur) * k;
      if (Math.abs(s.target - s.cur) < 0.0005) s.cur = s.target; else moving = true;
      if (s.cur !== s.shown) { s.el.style.setProperty('--p', s.cur.toFixed(4)); s.shown = s.cur; }
      // 消えきった部品は visibility でも隠し、見えないのに重い処理（背景のぼかしなど）を止める
      s.el.classList.toggle('is-past', s.cur > 0.4);
    });
    chapters.forEach(function (c) {
      var s = c.scene;
      // 画面の外では動画を止める。戻ってきたら今の章からまた再生
      if (s.top + s.height < 0 || s.top > vh) { setChapter(c, -1); return; }
      setChapter(c, Math.max(0, Math.min(c.items.length - 1, Math.floor(s.target * c.items.length))));
    });
    // 数字の場面：留まっているあいだに 1 つずつ出して、スクロールに合わせて数える
    stepScenes.forEach(function (s) {
      if (!s.pinned) return;
      s.steps.forEach(function (st, i) {
        var q = Math.round(clamp01((s.scene.cur - 0.05 - i * 0.25) / 0.25) * 1000) / 1000;
        if (q === st.shown) return;
        st.shown = q;
        st.el.style.setProperty('--q', q);
        st.counts.forEach(function (c) { var n = Math.round(c.to * q); if (n !== c.shown) { c.el.textContent = n; c.shown = n; } });
      });
    });
    // スクロールに合わせて光る文章：留まる場面の中なら、留まっているあいだの前 3/4 で光りきる
    if (!reduce) glows.forEach(function (g) {
      var p = g.pinned ? clamp01(g.sc.cur / 0.75) : clamp01((vh * 0.85 - g.top) / (g.height + vh * 0.3));
      var n = Math.round(p * g.spans.length);
      if (n === g.lit) return;
      for (var i = Math.min(n, g.lit); i < Math.max(n, g.lit); i++) g.spans[i].classList.toggle('on', i < n);
      g.lit = n;
    });

    if (moving) raf = requestAnimationFrame(frame); else lastT = 0;
  };
  var kick = function () { if (!raf) raf = requestAnimationFrame(frame); };
  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', function () { measure(); kick(); });
  window.addEventListener('load', function () { measure(); kick(); });
  measure();
  frame(performance.now());

  // ---------- 追従の相談ボタン：お問い合わせ欄やフッターが見えたら隠す ----------
  var floatCta = $('.float-cta');
  if (floatCta && 'IntersectionObserver' in window) {
    var seen = new Set();
    var fio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); });
      floatCta.classList.toggle('is-hidden', seen.size > 0);
    });
    $$('.hero, .contact, .footer').forEach(function (t) { fio.observe(t); });
  }

  // ---------- お問い合わせ：入力内容を入れた状態でメールアプリを開く ----------
  var mailForm = $('.mail-form');
  if (mailForm) {
    mailForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = mailForm.elements;
      var body = [
        'お名前：' + f.name.value,
        '会社名・店舗名：' + (f.company.value || '—'),
        'メールアドレス：' + f.email.value,
        'ご相談の内容：' + f.topic.value,
        '',
        f.message.value
      ].join('\n');
      location.href = 'mailto:' + mailForm.dataset.to +
        '?subject=' + encodeURIComponent('【無料相談】' + f.topic.value + '（' + f.name.value + '様）') +
        '&body=' + encodeURIComponent(body);
    });
  }

  // ---------- スクロール連動：表示・数字・光る文章・目盛り・カプセルの出し入れ ----------
  root.classList.add('reveal-ready');
  var pending = $$('[data-reveal]');
  var counters = $$('[data-count]');
  var ticks = $('.ticks');
  if (ticks) for (var k = 0; k < 24; k++) ticks.appendChild(document.createElement('i'));
  var tickEls = ticks ? $$('i', ticks) : [];
  var capsule = $('.capsule');
  var lastY = window.scrollY;

  var countUp = function (el) {
    var to = parseFloat(el.getAttribute('data-count'));
    if (reduce) { el.textContent = to; return; }
    var s = performance.now();
    (function step(t) {
      var p = Math.min((t - s) / 1400, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    })(s);
  };

  var check = function () {
    var vh = window.innerHeight;
    pending = pending.filter(function (el) {
      if (el.getBoundingClientRect().top > vh * 0.88) return true;
      el.classList.add('in');
      return false;
    });
    counters = counters.filter(function (el) {
      // 留まっている数字の場面では、スクロールに合わせて数える（updateScenes）
      var steps = el.closest('[data-steps]');
      if (steps && steps.dataset.pinned) return false;
      if (el.getBoundingClientRect().top > vh * 0.9) return true;
      countUp(el);
      return false;
    });
    var max = document.documentElement.scrollHeight - vh;
    var prog = max > 0 ? window.scrollY / max : 0;
    var cur = Math.round(prog * (tickEls.length - 1));
    tickEls.forEach(function (t, i) { t.classList.toggle('on', i < cur); t.classList.toggle('now', i === cur); });
    if (capsule && !root.classList.contains('menu-open')) {
      var y = window.scrollY;
      capsule.classList.toggle('is-hidden', y > lastY && y > 300);
      lastY = y;
    }
  };
  // スクロールイベントは 1 フレームに何度も来ることがあるので、確認は 1 フレームに 1 回にまとめる
  var checkQueued = false;
  var queueCheck = function () { if (!checkQueued) { checkQueued = true; requestAnimationFrame(function () { checkQueued = false; check(); }); } };
  window.addEventListener('scroll', queueCheck, { passive: true });
  window.addEventListener('resize', queueCheck);
  window.addEventListener('load', check);
  // スクロールイベントが届かない環境でも、出しきるまで 0.5 秒ごとに確認する
  var poll = setInterval(function () { check(); if (!pending.length && !counters.length) clearInterval(poll); }, 500);
  check();
})();
