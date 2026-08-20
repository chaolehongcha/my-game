const UIManager = {
  init() {
    this._setupMenu();
    this._setupLevelSelect();
  },

  _setupMenu() {
    document.getElementById('start-btn').addEventListener('click', () => {
      game.startLevel(1);
    });
    document.getElementById('levels-btn').addEventListener('click', () => {
      this.showLevelSelect();
    });
  },

  _setupLevelSelect() {
    const grid = document.getElementById('level-grid');
    grid.innerHTML = '';
    for (let i = 1; i <= Math.min(TOTAL_LEVELS, 50); i++) {
      const btn = document.createElement('button');
      btn.className = 'level-btn';
      btn.textContent = i;
      btn.dataset.level = i;
      const unlocked = i <= game.maxUnlockedLevel;
      btn.disabled = !unlocked;
      if (!unlocked) btn.classList.add('locked');
      btn.addEventListener('click', () => game.startLevel(i));
      grid.appendChild(btn);
    }
  },

  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(id);
    if (screen) screen.classList.add('active');
  },

  showMenu() {
    this.showScreen('menu-screen');
  },

  showLevelSelect() {
    this._setupLevelSelect();
    this.showScreen('level-select-screen');
  },

  showGame() {
    this.showScreen('game-screen');
  },

  showResult(won, score, level) {
    const title = document.getElementById('result-title');
    const scoreEl = document.getElementById('result-score');
    const nextBtn = document.getElementById('next-btn');
    const retryBtn = document.getElementById('retry-btn');

    title.textContent = won ? '过关!' : '时间到';
    title.style.color = won ? COLORS.success : COLORS.timer;
    scoreEl.textContent = `得分: ${score}`;

    nextBtn.style.display = won && level < TOTAL_LEVELS ? 'inline-block' : 'none';
    retryBtn.textContent = won ? '再玩一次' : '重试';
    this.showScreen('result-screen');
  },
};