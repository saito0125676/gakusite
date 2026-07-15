(function () {
  var sections = document.querySelectorAll('main section');
  if (!sections.length || !('IntersectionObserver' in window)) {
    document.documentElement.classList.remove('reveal-ready');
    return;
  }
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  sections.forEach(function (section) { observer.observe(section); });
})();
