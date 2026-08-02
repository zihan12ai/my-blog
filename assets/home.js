// 算栗工坊 首页交互：时钟 / 日历 / 音乐 / 随手记
(() => {
  /* ===== 实时时钟 ===== */
  const tEl = document.getElementById('clockTime');
  const dEl = document.getElementById('clockDate');
  const WEEK = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
  function pad(n){return String(n).padStart(2,'0');}
  function tick(){
    const now = new Date();
    if (tEl) tEl.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    if (dEl) dEl.textContent = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 ${WEEK[now.getDay()]}`;
    // 日历卡
    const cal = document.getElementById('calInfo');
    const cw  = document.getElementById('calWeek');
    if (cal) cal.textContent = `${now.getMonth()+1} 月 ${now.getDate()} 日`;
    if (cw)  cw.textContent  = WEEK[now.getDay()];
  }
  tick(); setInterval(tick, 1000);

  /* ===== 音乐播放器（免费示例音频，可替换为自己乐曲）===== */
  const AUDIO_SRC = 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3'; // 轻音乐
  const audio = document.getElementById('audio');
  const playBtn = document.getElementById('musicPlay');
  const titleEl = document.getElementById('musicTitle');
  const card = document.getElementById('musicCard');
  let ready = false;
  if (audio) {
    audio.src = AUDIO_SRC;
    audio.preload = 'none';
    audio.addEventListener('playing', () => {
      card && card.classList.remove('paused');
      if (playBtn) playBtn.textContent = '⏸';
      if (titleEl) titleEl.textContent = '正在播放…';
    });
    audio.addEventListener('pause', () => {
      card && card.classList.add('paused');
      if (playBtn) playBtn.textContent = '▶';
      if (titleEl) titleEl.textContent = '已暂停';
    });
    audio.addEventListener('ended', () => { if (playBtn) playBtn.textContent = '▶'; });
  }
  if (playBtn) {
    playBtn.addEventListener('click', async () => {
      if (!audio) return;
      try {
        if (audio.paused) { await audio.play(); }
        else { audio.pause(); }
      } catch (e) {
        if (titleEl) titleEl.textContent = '点击重试（需网络）';
      }
    });
  }

  /* ===== 卡片拖拽（在舞台内调整位置，仅本地）===== */
  const stage = document.getElementById('stage');
  const cards = document.querySelectorAll('.float-card');
  let drag = null;

  function startDrag(card, clientX, clientY) {
    const rect = card.getBoundingClientRect();
    const sRect = stage.getBoundingClientRect();
    drag = {
      card,
      offX: clientX - rect.left,
      offY: clientY - rect.top,
      sRect,
    };
    card.style.zIndex = 20;
    card.style.transition = 'none';
    card.classList.add('dragging');
  }
  function moveDrag(clientX, clientY) {
    if (!drag) return;
    const { card, offX, offY, sRect } = drag;
    let x = clientX - sRect.left - offX;
    let y = clientY - sRect.top - offY;
    // 限制在舞台内
    const maxX = sRect.width - card.offsetWidth;
    const maxY = sRect.height - card.offsetHeight;
    x = Math.max(0, Math.min(x, maxX));
    y = Math.max(0, Math.min(y, maxY));
    card.style.left = x + 'px';
    card.style.top = y + 'px';
    card.style.right = 'auto';
    card.style.bottom = 'auto';
  }
  function endDrag() {
    if (!drag) return;
    drag.card.style.zIndex = '';
    drag.card.style.transition = '';
    drag.card.classList.remove('dragging');
    drag = null;
  }

  cards.forEach(card => {
    // 分类卡和链接卡用来点击，不参与拖拽
    if (card.classList.contains('entry-card') || card.tagName === 'A') return;
    // 标题区作为拖拽手柄（避免和按钮/文本框冲突）
    const handle = card.querySelector('.fc-title') || card;
    handle.style.cursor = 'grab';
    handle.addEventListener('mousedown', (e) => {
      if (e.target.closest('button, textarea, a, kbd')) return;
      e.preventDefault();
      startDrag(card, e.clientX, e.clientY);
    });
    handle.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      startDrag(card, t.clientX, t.clientY);
    }, { passive: true });
  });
  document.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));
  document.addEventListener('mouseup', endDrag);
  document.addEventListener('touchmove', (e) => {
    if (!drag) return;
    const t = e.touches[0];
    moveDrag(t.clientX, t.clientY);
  }, { passive: true });
  document.addEventListener('touchend', endDrag);

  /* ===== 入口卡点击：跳转到独立页面 ===== */
  document.querySelectorAll('.entry-card').forEach(card => {
    card.addEventListener('click', () => {
      const go = card.dataset.go;
      if (go === 'topics') location.href = './topics.html';
      else if (go === 'posts') location.href = './posts.html';
    });
  });

  /* ===== 随手记：本地存储自动保存 ===== */
  const note = document.getElementById('noteArea');
  const KEY = 'suanli_note';
  if (note) {
    note.value = localStorage.getItem(KEY) || '';
    note.addEventListener('input', () => { localStorage.setItem(KEY, note.value); });
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        localStorage.setItem(KEY, note.value);
        const hint = note.parentElement.querySelector('.note-hint');
        if (hint) {
          const old = hint.innerHTML;
          hint.innerHTML = '✓ 已保存';
          setTimeout(() => hint.innerHTML = old, 1200);
        }
      }
    });
  }
})();
