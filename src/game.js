const game = {
  state: GAME_STATES.MENU,
  currentLevel: 1,
  maxUnlockedLevel: TOTAL_LEVELS,
  score: 0,
  targetScore: 0,
  board: null,
  timer: 0,
  timeLimit: 0,
  timerInterval: null,
  lastTime: 0,
  animFrame: null,
  reshufflesLeft: MAX_RESHUFFLES,
  reshuffleNotifyTimer: 0,
  deadlockTimer: 0,
  loseReason: 'timeout',
  blockAnimations: [],
  animating: false,
  rotateAnim: null,
  rotateSnapshot: null,
  levelMessage: null,
  messageTimer: 0,
  messageDuration: 2.5,

  init() {
    this._setupInput();
    UIManager.init();
    this._startLoop();
    UIManager.showMenu();
  },

  _setupInput() {
    InputManager.on('onSwipeComplete', (cells) => this._handleSwipe(cells));
    InputManager.on('onRotateCW', () => this._handleRotate('cw'));
    InputManager.on('onRotateCCW', () => this._handleRotate('ccw'));
    InputManager.on('onFlip180', () => this._handleRotate('flip'));
    InputManager.on('onReshuffle', () => this._handleReshuffle());
    InputManager.on('onRestart', () => this.retryLevel());
  },

  startLevel(num) {
    this.currentLevel = num;
    const { config, bricks } = LevelManager.getLevel(num);

    this.score = 0;
    this.targetScore = config.targetScore;
    this.timeLimit = config.timeLimit;
    this.timer = config.timeLimit;
    this.reshufflesLeft = MAX_RESHUFFLES;
    this.reshuffleNotifyTimer = 0;
    this.deadlockTimer = 0;
    this.blockAnimations = [];
    this.animating = false;
    this.rotateAnim = null;
    this.rotateSnapshot = null;

    const messages = {
      1: '划过同色方块（最少四个）！',
      2: '小心掉落！',
      3: '旋转平台！',
      4: '一次消除越多，加分更多！',
      5: '利用彩色石头消除更多！',
    };
    this.levelMessage = messages[num] || null;
    this.messageTimer = this.levelMessage ? this.messageDuration : 0;

    this.board = new Board(config.rows, config.cols, config.numColors);
    this.board.init(config.grid, bricks);
    InputManager.setBoard(this.board);

    ParticleManager.clear();

    this._startTimer();
    this.state = GAME_STATES.PLAYING;
    UIManager.showGame();
    this._checkDeadlock();
  },

  _startTimer() {
    this._clearTimer();
    this.timerInterval = setInterval(() => {
      this.timer -= 0.1;
      if (this.timer <= 0) {
        this.timer = 0;
        this._lose('timeout');
      }
    }, 100);
  },

  _clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },

  _handleSwipe(cells) {
    if (this.state !== GAME_STATES.PLAYING) return;
    if (!this.board || this.animating) return;
    if (this.messageTimer > 0) return;

    const blockInfos = cells.map(({ row, col }) => ({
      row, col,
      color: this.board.getBlockColor(row, col),
    }));

    const earned = calcScore(cells.length);

    let cx = 0, cy = 0;
    cells.forEach(({ row, col }) => {
      const center = this.board.getCellCenter(row, col);
      cx += center.x;
      cy += center.y;
    });
    cx /= cells.length;
    cy /= cells.length;

    blockInfos.forEach(info => {
      if (info.color !== null) {
        const center = this.board.getCellCenter(info.row, info.col);
        ParticleManager.spawnBlockBreak(center.x, center.y, info.color, cells.length);
      }
    });

    ParticleManager.spawnScorePopup(cx, cy, earned);
    AudioManager.playBreak(cells.length);
    AudioManager.playScore(earned);

    this.score += earned;
    this.board.removeBlocks(cells);

    const movements = this.board.applyGravity();
    if (movements.length > 0) {
      this._startFallingAnimation(movements);
      this._pendingAfterChange = true;
    } else {
      this._afterBoardChange();
    }
  },

  _handleRotate(type) {
    if (this.state !== GAME_STATES.PLAYING) return;
    if (!this.board || this.animating) return;

    this.rotateSnapshot = [];
    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        const block = this.board.getBlock(r, c);
        if (block !== null) {
          const center = this.board.getCellCenter(r, c);
          this.rotateSnapshot.push({ block, x: center.x, y: center.y });
        }
      }
    }

    const targetAngle = type === 'cw' ? Math.PI / 2 :
                        type === 'ccw' ? -Math.PI / 2 : Math.PI;

    this.rotateAnim = {
      type,
      targetAngle,
      rotation: 0,
      elapsed: 0,
      duration: 0.5,
    };
    this.animating = true;
  },

  _handleReshuffle() {
    if (this.state !== GAME_STATES.PLAYING) return;
    if (!this.board || this.animating) return;
    if (this.reshufflesLeft <= 0) return;

    this.reshufflesLeft--;
    this.board.reshuffle();
    this.reshuffleNotifyTimer = RESHUFFLE_NOTIFY_DURATION;
    this._afterBoardChange();
  },

  _startFallingAnimation(movements) {
    this.animating = true;
    this.blockAnimations = movements.map(m => ({
      block: m.block,
      fromRow: m.fromRow,
      toRow: m.toRow,
      col: m.col,
      row: null,
      fromCol: null,
      toCol: null,
      type: 'fall',
      progress: 0,
      duration: 0.35,
    }));
  },

  _updateAnimations(dt) {
    if (!this.animating) return;

    if (this.rotateAnim) {
      const ra = this.rotateAnim;
      ra.elapsed += dt;
      const progress = Math.min(ra.elapsed / ra.duration, 1);
      ra.rotation = ra.targetAngle * this._easeInOutQuad(progress);

      if (progress >= 1) {
        const type = ra.type;
        this.rotateAnim = null;
        this.rotateSnapshot = null;

        if (type === 'cw') this.board.rotate90CW();
        else if (type === 'ccw') this.board.rotate90CCW();
        else this.board.flip180();

        const movements = this.board.applyGravity();
        if (movements.length > 0) {
          this._startFallingAnimation(movements);
        } else {
          this.animating = false;
          this._afterBoardChange();
        }
      }
      return;
    }

    let allDone = true;
    this.blockAnimations.forEach(anim => {
      anim.progress += dt / anim.duration;
      if (anim.progress < 1) allDone = false;
      if (anim.progress > 1) anim.progress = 1;
    });

    if (allDone) {
      this.blockAnimations = [];
      this.animating = false;
      if (this._pendingAfterChange) {
        this._pendingAfterChange = false;
        this._afterBoardChange();
      }
    }
  },

  _easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  },

  _getAnimatedCells() {
    if (this.rotateAnim) return new Set();
    const cells = new Set();
    this.blockAnimations.forEach(anim => {
      if (anim.type === 'fall') {
        cells.add(`${anim.toRow},${anim.col}`);
      }
    });
    return cells;
  },

  _afterBoardChange() {
    if (this.score >= this.targetScore) {
      this._win();
      return;
    }
    this._checkDeadlock();
  },

  _checkDeadlock() {
    if (!this.board || this.board.isEmpty() || this.animating) {
      this.deadlockTimer = 0;
      return;
    }
    if (!this.board.hasValidMove()) {
      this.deadlockTimer = 1.5;
      AudioManager.playDeadlock();
    } else {
      this.deadlockTimer = 0;
    }
  },

  _win() {
    this._clearTimer();
    this.state = GAME_STATES.WIN;
    this.deadlockTimer = 0;
    this.animating = false;
    this.blockAnimations = [];
    this.rotateAnim = null;
    this.rotateSnapshot = null;
    if (this.currentLevel >= this.maxUnlockedLevel) {
      this.maxUnlockedLevel = Math.min(this.currentLevel + 1, TOTAL_LEVELS);
    }
    AudioManager.playWin();
    UIManager.showResult(true, this.score, this.currentLevel);
  },

  _lose(reason) {
    this._clearTimer();
    this.state = GAME_STATES.LOSE;
    this.loseReason = reason || 'timeout';
    this.animating = false;
    this.blockAnimations = [];
    this.rotateAnim = null;
    this.rotateSnapshot = null;
    UIManager.showResult(false, this.score, this.currentLevel);
  },

  nextLevel() {
    const next = this.currentLevel + 1;
    if (next <= TOTAL_LEVELS) {
      if (next > this.maxUnlockedLevel) this.maxUnlockedLevel = next;
      this.startLevel(next);
    } else {
      UIManager.showMenu();
    }
  },

  retryLevel() {
    this.startLevel(this.currentLevel);
  },

  _startLoop() {
    this.lastTime = performance.now();
    const loop = (now) => {
      const dt = Math.min((now - this.lastTime) / 1000, 0.05);
      this.lastTime = now;

      if (this.reshuffleNotifyTimer > 0) this.reshuffleNotifyTimer -= dt;
      if (this.deadlockTimer > 0) this.deadlockTimer -= dt;
      if (this.messageTimer > 0) this.messageTimer -= dt;

      this._updateAnimations(dt);
      ParticleManager.update(dt);
      this._render();
      this.animFrame = requestAnimationFrame(loop);
    };
    this.animFrame = requestAnimationFrame(loop);
  },

  _render() {
    Renderer.clear();

    if (this.state === GAME_STATES.PLAYING || this.state === GAME_STATES.WIN || this.state === GAME_STATES.LOSE) {
      if (this.board) {
        if (this.rotateAnim && this.rotateSnapshot) {
          Renderer.drawRotatedBoard(this.board, this.rotateSnapshot, this.rotateAnim.rotation);
        } else {
          Renderer.drawBoard(this.board, this._getAnimatedCells());
          if (this.animating && this.blockAnimations.length > 0) {
            Renderer.drawAnimatedBlocks(this.board, this.blockAnimations);
          }
        }

        if (this.state === GAME_STATES.PLAYING && !this.animating) {
          const path = InputManager.getPath();
          Renderer.drawPath(path, this.board);
        }

        ParticleManager.render(Renderer.ctx);

        Renderer.drawFrames(InputManager.hoveredFrame);
        Renderer.drawHUD(
          this.currentLevel,
          this.timer,
          this.board.getRemainingCount(),
          this.score,
          this.targetScore
        );

        if (this.state === GAME_STATES.PLAYING) {
          Renderer.drawReshuffleBtn(this.reshufflesLeft, InputManager.hoveredReshuffle);
          Renderer.drawRestartBtn(InputManager.hoveredRestart);

          if (this.levelMessage && this.messageTimer > 0) {
            const progress = 1 - this.messageTimer / this.messageDuration;
            Renderer.drawLevelMessage(this.levelMessage, progress);
          }

          if (this.reshuffleNotifyTimer > 0) {
            Renderer.drawNotification('已重排', this.reshuffleNotifyTimer);
          }
          if (this.deadlockTimer > 0) {
            Renderer.drawDeadlockBubble(this.deadlockTimer);
          }
        }
      }

      if (this.state === GAME_STATES.WIN) {
        Renderer.drawOverlay('过关!', `得分: ${this.score}`, COLORS.success);
      } else if (this.state === GAME_STATES.LOSE) {
        const msg = this.loseReason === 'timeout' ? '时间到' : '游戏结束';
        Renderer.drawOverlay(msg, `得分: ${this.score} / 目标: ${this.targetScore}`, COLORS.timer);
      }
    }
  },
};
