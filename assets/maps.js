// 知识地图由 Decap CMS 的 content/maps/*.md 构建为 assets/maps.json。
(() => {
  const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[char]);
  const safeHref = value => /^(https?:\/\/|\.\/|\/)/i.test(String(value || '').trim()) ? String(value).trim() : '';

  async function renderMaps() {
    const grid = document.getElementById('mapGrid');
    if (!grid) return;
    try {
      const response = await fetch('./assets/maps.json');
      if (!response.ok) throw new Error('Unable to load maps');
      const maps = await response.json();
      if (!maps.length) {
        grid.innerHTML = '<article class="map-card map-card-empty"><span>＋</span><h2>还没有地图</h2><p>去 Decap 后台新建第一张学习路径吧。</p></article>';
        return;
      }
      grid.innerHTML = maps.map(map => {
        const nodes = (map.nodes || []).map(node => {
          const label = escapeHTML(node.label || '未命名节点');
          const href = safeHref(node.link);
          return `<li>${href ? `<a href="${href}">${label}</a>` : `<span>${label}</span>`}</li>`;
        }).join('');
        return `<article class="map-card">
          <div class="map-card-heading"><span>${escapeHTML(map.icon || '🧠')}</span><div><p>${escapeHTML(map.status || 'IN PROGRESS')}</p><h2>${escapeHTML(map.title)}</h2></div></div>
          <p class="map-description">${escapeHTML(map.description || '')}</p>
          <ul class="map-tree"><li><span>${escapeHTML(map.title)}</span><ul>${nodes}</ul></li></ul>
        </article>`;
      }).join('');
    } catch {
      grid.innerHTML = '<p class="loading">知识地图暂时加载失败，请稍后再试。</p>';
    }
  }

  renderMaps();
})();
