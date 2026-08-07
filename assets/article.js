// 文章页阅读辅助：顶部进度条与当前目录高亮。
(() => {
  const progress = document.getElementById('readingProgress');
  const article = document.querySelector('.article-card');
  const headings = [...document.querySelectorAll('.article-body h1, .article-body h2, .article-body h3')];
  const links = [...document.querySelectorAll('.article-toc a[href^="#heading-"]')];
  const linkById = new Map(links.map(link => [link.getAttribute('href').slice(1), link]));

  function updateReadingUI() {
    if (progress && article) {
      const rect = article.getBoundingClientRect();
      const distance = Math.max(1, article.offsetHeight - window.innerHeight + 120);
      const amount = Math.min(1, Math.max(0, (120 - rect.top) / distance));
      progress.style.transform = `scaleX(${amount})`;
    }
    if (!headings.length) return;
    const offset = 118;
    const current = headings.filter(heading => heading.getBoundingClientRect().top <= offset).at(-1) || headings[0];
    links.forEach(link => link.classList.toggle('is-active', link === linkById.get(current.id)));
  }

  let pending = false;
  window.addEventListener('scroll', () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; updateReadingUI(); });
  }, { passive: true });
  window.addEventListener('resize', updateReadingUI);
  updateReadingUI();
})();
