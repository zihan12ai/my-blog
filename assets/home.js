// 算栗工坊首页：最近文章 / 时钟 / 音乐 / 本地随手记
(() => {
  const WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const pad = n => String(n).padStart(2, '0');

  function tick() {
    const now = new Date();
    const time = document.getElementById('clockTime');
    const date = document.getElementById('clockDate');
    if (time) time.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    if (date) date.textContent = `${now.getMonth() + 1}月${now.getDate()}日 · ${WEEK[now.getDay()]}`;
  }
  tick();
  setInterval(tick, 1000);

  function escapeHTML(value = '') {
    return String(value).replace(/[&<>'"]/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
    })[char]);
  }

  async function renderRecentPosts() {
    const list = document.getElementById('recentPosts');
    if (!list) return;
    try {
      const response = await fetch('./assets/posts.json');
      if (!response.ok) throw new Error('Unable to load posts');
      const posts = await response.json();
      posts.sort((a, b) => (b.updated || b.published || '').localeCompare(a.updated || a.published || ''));
      const recent = posts.slice(0, 3);
      const stats = document.getElementById('siteStats');
      if (stats) {
        const categories = new Set(posts.map(post => post.category).filter(Boolean));
        const latest = posts[0]?.updated || posts[0]?.published || '—';
        stats.innerHTML = `<strong>${posts.length}</strong><span>篇文章</span><strong>${categories.size}</strong><span>个专题</span><small>最近更新：${escapeHTML(latest)}</small>`;
      }
      if (!recent.length) {
        list.innerHTML = '<p class="recent-loading">还没有文章，去写第一篇吧。</p>';
        return;
      }
      list.innerHTML = recent.map(post => {
        const updated = (post.updated || post.published) > post.published;
        const badge = updated ? '<span class="recent-badge updated">有更新</span>' : '<span class="recent-badge">新文章</span>';
        return `<a class="recent-post" href="./post-${encodeURIComponent(post.slug)}.html">
          <div class="recent-post-top"><span>${escapeHTML(post.category || '未分类')}</span>${badge}</div>
          <h3>${escapeHTML(post.title)}</h3>
          <p>${escapeHTML(post.summary || '点击阅读这篇文章。')}</p>
          <time>${escapeHTML(post.updated || post.published || '')}</time>
        </a>`;
      }).join('');
    } catch (error) {
      list.innerHTML = '<p class="recent-loading">文章暂时加载失败，请稍后再试。</p>';
    }
  }
  renderRecentPosts();

  const copyEmail = document.getElementById('copyEmail');
  const emailFeedback = document.getElementById('emailCopyFeedback');
  copyEmail?.addEventListener('click', async () => {
    const email = copyEmail.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      const input = document.createElement('textarea');
      input.value = email;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
    if (emailFeedback) emailFeedback.textContent = '邮箱已复制';
    window.setTimeout(() => { if (emailFeedback) emailFeedback.textContent = ''; }, 1800);
  });

})();
