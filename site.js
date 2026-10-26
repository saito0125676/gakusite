// 学サイト 全ページ共通スクリプト
(function () {
  // オープニング動画:自動再生が許される無音で流し、終わったらフェードアウト
  var intro = document.querySelector('.intro-splash--video');
  if (intro) {
    var root = document.documentElement;
    var introVideo = intro.querySelector('.intro-video');
    var reduceIntro = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finished = true;
    var endIntro = function () {
      if (finished) return;
      finished = true;
      introVideo.pause();
      intro.classList.add('is-done');
      root.classList.remove('intro-playing');
    };
    var startIntro = function () {
      finished = false;
      root.classList.add('intro-playing');
      introVideo.muted = true;
      // 自動再生を止められたとき(低電力モードなど):動画の最後のロゴを静止画で見せてからフェード
      introVideo.play().catch(function () {
        intro.classList.add('is-still');
        setTimeout(endIntro, 1600);
      });
    };
    introVideo.addEventListener('ended', endIntro);
    introVideo.addEventListener('error', endIntro);
    if (root.classList.contains('no-intro') || reduceIntro) {
      intro.classList.add('is-done');
    } else {
      startIntro();
    }
  }

  // ヘッダーの影
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // メニュー内のリンクを押したら閉じる
  var toggle = document.getElementById('nav-toggle');
  if (toggle) {
    document.querySelectorAll('.global-nav a').forEach(function (a) {
      a.addEventListener('click', function () { toggle.checked = false; });
    });
  }

  // 背景動画:読み込めたときだけ停止ボタンを出す。動きを減らす設定なら止めて静止画に
  var video = document.querySelector('.hero-video');
  var videoBtn = document.querySelector('.hero-video-toggle');
  if (video && videoBtn) {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches) video.removeAttribute('autoplay');
    var syncBtn = function () {
      videoBtn.classList.toggle('is-paused', video.paused);
      videoBtn.setAttribute('aria-label', video.paused ? '背景動画を再生' : '背景動画を一時停止');
    };
    var onLoaded = function () {
      videoBtn.hidden = false;
      if (reduce.matches) video.pause();
      syncBtn();
    };
    if (video.readyState >= 2) { onLoaded(); } else { video.addEventListener('loadeddata', onLoaded); }
    video.addEventListener('play', syncBtn);
    video.addEventListener('pause', syncBtn);
    videoBtn.addEventListener('click', function () {
      if (video.paused) { video.play(); } else { video.pause(); }
    });
  }

  // 追従の相談ボタン:CTA 帯やフッターが画面に入ったら隠す(ボタンの重なり防止)
  var floatBtn = document.querySelector('.consult-float');
  var floatTargets = document.querySelectorAll('.cta-band, .site-footer');
  if (floatBtn && floatTargets.length && 'IntersectionObserver' in window) {
    var visible = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { visible.add(e.target); } else { visible.delete(e.target); }
      });
      floatBtn.classList.toggle('is-hidden', visible.size > 0);
    });
    floatTargets.forEach(function (t) { io.observe(t); });
  }

  // 実績プレビュー(iframe)を枠の幅に合わせて縮小
  var frames = document.querySelectorAll('.work-frame');
  if (frames.length && 'ResizeObserver' in window) {
    var ro = new ResizeObserver(function (entries) {
      entries.forEach(function (e) {
        e.target.style.setProperty('--scale', e.contentRect.width / 1280);
      });
    });
    frames.forEach(function (f) { ro.observe(f); });
  }

  // ガクザメ:ときどき画面を横切る。z-index:-1 なので、何もない空白でだけ見える
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
