// 文章渲染通用脚本：用于 posts.html（近期文章）和 topics.html（专题）
// 元素不存在则跳过对应渲染；支持 URL ?cat=预选分类
(async () => {
  const CAT_ICON = { 'Python教程': '🐍', '工具教程': '🛠️', 'Agent': '🤖', '生活': '🌿' };
  const CAT_DESC = {
    'Python教程': '工具链、环境配置与数据分析实践',
    '工具教程': '日常开发与生活常用工具教程',
    'Agent': '大模型智能体开发实践与范式笔记',
    '生活': '记录生活的碎碎念',
  };

  const grid = document.getElementById('postGrid');
  const filterBar = document.getElementById('filterBar');
  const topicGrid = document.getElementById('topicGrid');

  let posts = [];
  try {
    const res = await fetch('./assets/posts.json');
    posts = await res.json();
  } catch (e) {
    if (grid) grid.innerHTML = '<div class="loading">文章加载失败（需 http 访问，不能用 file://）</div>';
    return;
  }

  posts.sort((a, b) => (b.updated || b.published).localeCompare(a.updated || a.published));

  // URL 预选分类（来自专题页跳转）
  const params = new URLSearchParams(location.search);
  let activeCat = params.get('cat') || '全部';

  // —— 列表页渲染 ——
  if (grid) {
    const cats = ['全部', ...Array.from(new Set(posts.map(p => p.category)))];
    function renderFilter() {
      if (!filterBar) return;
      filterBar.innerHTML = cats.map(c =>
        `<button class="filter-chip ${c === activeCat ? 'active' : ''}" data-cat="${c}">${c}</button>`
      ).join('');
      filterBar.querySelectorAll('.filter-chip').forEach(btn => {
        btn.addEventListener('click', () => { activeCat = btn.dataset.cat; renderFilter(); renderList(); });
      });
    }
    function renderList() {
      const list = activeCat === '全部' ? posts : posts.filter(p => p.category === activeCat);
      if (!list.length) { grid.innerHTML = '<div class="loading">暂无文章</div>'; return; }
      grid.innerHTML = list.map(p => `
        <a class="post-card" href="./post-${p.slug}.html">
          <div class="cover"></div>
          <h3>${p.title}</h3>
          <p>${p.summary}</p>
          <div class="post-meta">
            <span class="cat">${p.category}</span>
            <span class="date">${p.updated || p.published}</span>
          </div>
        </a>
      `).join('');
    }
    renderFilter();
    renderList();
  }

  // —— 专题页渲染：点专题 → 跳列表页并带 ?cat= ——
  if (topicGrid) {
    const groups = {};
    posts.forEach(p => { (groups[p.category] = groups[p.category] || []).push(p); });
    topicGrid.innerHTML = Object.entries(groups).map(([cat, arr]) => `
      <a class="topic-card" href="./posts.html?cat=${encodeURIComponent(cat)}">
        <div class="tc-icon">${CAT_ICON[cat] || '📁'}</div>
        <div class="tc-title">${cat}</div>
        <div class="tc-count">${arr.length} 篇</div>
        <div class="tc-desc">${CAT_DESC[cat] || ''}</div>
      </a>
    `).join('');
  }
})();
