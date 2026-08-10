// 文章与专题页共用：文章来自 posts.json，专题的名称、图标和简介来自 Decap 内容。
(async () => {
  const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[char]);
  const grid = document.getElementById('postGrid');
  const filterBar = document.getElementById('filterBar');
  const topicGrid = document.getElementById('topicGrid');
  let posts = [];
  let topics = [];

  try {
    const response = await fetch('./assets/posts.json');
    if (!response.ok) throw new Error('Unable to load posts');
    posts = await response.json();
  } catch {
    if (grid) grid.innerHTML = '<div class="loading">文章暂时加载失败，请稍后再试。</div>';
    if (topicGrid) topicGrid.innerHTML = '<div class="loading">专题暂时加载失败，请稍后再试。</div>';
    return;
  }

  try {
    const response = await fetch('./assets/topics.json');
    if (response.ok) topics = await response.json();
  } catch { /* 没有专题文件时仍保留文章浏览。 */ }

  posts.sort((a, b) => (b.updated || b.published).localeCompare(a.updated || a.published));
  const postCategories = Array.from(new Set(posts.map(post => post.category)));
  const topicNames = topics.map(topic => topic.title);
  const categories = [...topicNames, ...postCategories.filter(category => !topicNames.includes(category))];
  const topicRecords = [
    ...topics,
    ...postCategories.filter(category => !topicNames.includes(category)).map(title => ({ title, icon: '🗂️', description: '' })),
  ];
  const params = new URLSearchParams(location.search);
  let activeCategory = params.get('cat') || '全部';

  if (grid) {
    function renderFilter() {
      if (!filterBar) return;
      filterBar.innerHTML = ['全部', ...categories].map(category =>
        `<button class="filter-chip ${category === activeCategory ? 'active' : ''}" data-cat="${escapeHTML(category)}">${escapeHTML(category)}</button>`
      ).join('');
      filterBar.querySelectorAll('.filter-chip').forEach(button => {
        button.addEventListener('click', () => {
          activeCategory = button.dataset.cat;
          renderFilter();
          renderList();
        });
      });
    }
    function renderList() {
      const list = activeCategory === '全部' ? posts : posts.filter(post => post.category === activeCategory);
      if (!list.length) {
        grid.innerHTML = '<div class="loading">这个专题暂时还没有文章。</div>';
        return;
      }
      grid.innerHTML = list.map(post => `<a class="post-card" href="./post-${encodeURIComponent(post.slug)}.html">
        <div class="cover"></div><h3>${escapeHTML(post.title)}</h3><p>${escapeHTML(post.summary)}</p>
        <div class="post-meta"><span class="cat">${escapeHTML(post.category)}</span><span class="date">${escapeHTML(post.updated || post.published)}</span></div>
      </a>`).join('');
    }
    renderFilter();
    renderList();
  }

  if (topicGrid) {
    if (!topicRecords.length) {
      topicGrid.innerHTML = '<div class="loading">还没有专题，去 Decap 后台新建第一个吧。</div>';
      return;
    }
    topicGrid.innerHTML = topicRecords.map(topic => {
      const count = posts.filter(post => post.category === topic.title).length;
      return `<a class="topic-card" href="./posts.html?cat=${encodeURIComponent(topic.title)}">
        <div class="tc-icon">${escapeHTML(topic.icon || '🗂️')}</div><div class="tc-title">${escapeHTML(topic.title)}</div>
        <div class="tc-count">${count} 篇</div><div class="tc-desc">${escapeHTML(topic.description || '')}</div>
      </a>`;
    }).join('');
  }
})();
