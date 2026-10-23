// 学サイト 全ページ共通スクリプト
(function () {
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
})();
