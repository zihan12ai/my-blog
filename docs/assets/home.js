// 算栗工坊首页：最近文章、站点索引、时钟和邮箱复制。
(() => {
  const WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const pad = n => String(n).padStart(2, '0');
  const today = new Date();
  let calendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  let calendarPosts = [];

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
      calendarPosts = posts;
      renderSiteCalendar();
      renderTopics();
      renderLearningPreview();
      if (!recent.length) {
        list.innerHTML = '<p class="recent-loading">还没有文章，去写第一篇吧。</p>';
        return;
      }
      list.innerHTML = recent.map(post => {
        const updated = (post.updated || post.published) > post.published;
        const badge = updated ? '<span class="recent-badge updated">有更新</span>' : '<span class="recent-badge">新文章</span>';
        return `<a class="recent-post" href="./post-${encodeURIComponent(post.slug)}.html">
          ${badge}<h3>${escapeHTML(post.title)}</h3>
        </a>`;
      }).join('');
    } catch (error) {
      list.innerHTML = '<p class="recent-loading">文章暂时加载失败，请稍后再试。</p>';
    }
  }
  renderRecentPosts();
  renderSiteCalendar();

  function safeHref(value, fallback = '#') {
    const href = String(value || '').trim();
    return /^(https?:\/\/|\.\/|\/)/i.test(href) ? href : fallback;
  }

  async function renderTopics() {
    const grid = document.getElementById('collectionGrid');
    if (!grid) return;
    try {
      const response = await fetch('./assets/topics.json');
      if (!response.ok) throw new Error('Unable to load topics');
      const topics = await response.json();
      if (!topics.length) {
        grid.innerHTML = '<p class="recent-loading">还没有专题，去后台新建第一个吧。</p>';
        return;
      }
      const tones = ['agent', 'python', 'tools', 'life'];
      grid.innerHTML = topics.map((topic, index) => `<a class="collection-card ${tones[index % tones.length]}" href="./posts.html?cat=${encodeURIComponent(topic.title)}">
        <span>${escapeHTML(topic.icon || '🗂️')}</span><strong>${escapeHTML(topic.title)}</strong><small>${escapeHTML(topic.description || '点击查看这个专题的文章')}</small>
      </a>`).join('');
    } catch {
      grid.innerHTML = '<p class="recent-loading">专题暂时加载失败。</p>';
    }
  }

  async function renderLearningPreview() {
    const target = document.getElementById('learningPreview');
    if (!target) return;
    try {
      const response = await fetch('./assets/maps.json');
      if (!response.ok) throw new Error('Unable to load maps');
      const maps = await response.json();
      const map = maps.find(item => item.featured) || maps[0];
      if (!map) {
        target.innerHTML = '<p class="recent-loading">还没有学习路径，去后台画第一张地图吧。</p>';
        return;
      }
      const nodes = (map.nodes || []).slice(0, 5);
      target.innerHTML = `<span class="learning-root">${escapeHTML(map.title)}</span><div class="learning-branches">${nodes.map(node =>
        `<a href="${safeHref(node.link, './maps.html')}">${escapeHTML(node.label || '未命名节点')}</a>`
      ).join('')}</div>`;
    } catch {
      target.innerHTML = '<p class="recent-loading">学习路径暂时加载失败。</p>';
    }
  }

  function renderSiteCalendar() {
    const calendar = document.getElementById('siteCalendar');
    const monthLabel = document.getElementById('calendarMonth');
    if (!calendar || !monthLabel) return;
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth() + 1;
    const events = new Map();
    const addEvent = (date, type) => {
      if (!date || !date.startsWith(`${year}-${String(month).padStart(2, '0')}-`)) return;
      const previous = events.get(date) || new Set();
      previous.add(type);
      events.set(date, previous);
    };
    calendarPosts.forEach(post => {
      addEvent(post.published, 'new');
      if (post.updated && post.updated !== post.published) addEvent(post.updated, 'updated');
    });
    monthLabel.textContent = `${year} 年 ${month} 月`;
    const firstDay = new Date(year, month - 1, 1).getDay();
    const days = new Date(year, month, 0).getDate();
    const blankDays = Array.from({ length: firstDay }, () => '<span class="calendar-day blank"></span>');
    const dateCells = Array.from({ length: days }, (_, offset) => {
      const day = offset + 1;
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const eventTypes = events.get(date);
      const hasNew = eventTypes?.has('new');
      const hasUpdated = eventTypes?.has('updated');
      const type = [hasNew && 'new', hasUpdated && 'updated'].filter(Boolean).join(' ');
      const isToday = year === today.getFullYear() && month === today.getMonth() + 1 && day === today.getDate();
      const label = hasNew && hasUpdated ? '新文章与更新' : hasNew ? '新文章' : hasUpdated ? '有更新' : '';
      return `<span class="calendar-day ${type}${isToday ? ' today' : ''}" title="${label || date}">${day}</span>`;
    });
    calendar.innerHTML = [...blankDays, ...dateCells].join('');
  }

  document.getElementById('calendarPrevious')?.addEventListener('click', () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
    renderSiteCalendar();
  });
  document.getElementById('calendarNext')?.addEventListener('click', () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    renderSiteCalendar();
  });
  document.getElementById('calendarToday')?.addEventListener('click', () => {
    calendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    renderSiteCalendar();
  });

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
