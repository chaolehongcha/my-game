class SwipeHandler {
  constructor() {
    this.path = [];
    this.color = null;
    this.active = false;
    this.board = null;
  }

  setBoard(board) {
    this.board = board;
  }

  start(row, col) {
    if (!this.board) return false;
    const block = this.board.getBlock(row, col);
    if (!block || block.brick || block.wild) return false;
    this.path = [{ row, col }];
    this.color = block.color;
    this.active = true;
    return true;
  }

  move(row, col) {
    if (!this.active || !this.board) return;
    const block = this.board.getBlock(row, col);
    if (!block || block.brick) return;
    if (!block.wild && block.color !== this.color) return;

    const last = this.path[this.path.length - 1];
    const dr = Math.abs(row - last.row);
    const dc = Math.abs(col - last.col);
    if (dr + dc !== 1) return;

    if (this.path.some(p => p.row === row && p.col === col)) return;

    this.path.push({ row, col });
  }

  end() {
    this.active = false;
    if (this.path.length >= MIN_SWIPE) {
      const result = [...this.path];
      this.path = [];
      this.color = null;
      return result;
    }
    this.path = [];
    this.color = null;
    return [];
  }

  cancel() {
    this.active = false;
    this.path = [];
    this.color = null;
  }

  getPath() {
    return this.path;
  }

  isActive() {
    return this.active;
  }
}

const InputManager = {
  canvas: null,
  handlers: {},
  swipeHandler: null,
  board: null,
  frameLeftRect: null,
  frameRightRect: null,
  frameTopRect: null,
  reshuffleRect: null,
  restartRect: null,
  hoveredFrame: null,
  hoveredReshuffle: false,
  hoveredRestart: false,

  init(canvas) {
    this.canvas = canvas;
    this.swipeHandler = new SwipeHandler();
    this._bindEvents();
  },

  setBoard(board) {
    this.board = board;
    this.swipeHandler.setBoard(board);
    this._calcRects(board);
  },

  _calcRects(board) {
    if (!board) return;
    const fw = 18;

    this.frameLeftRect = {
      x: 0,
      y: board.boardY,
      w: fw,
      h: board.boardHeight,
    };
    this.frameRightRect = {
      x: CANVAS_WIDTH - fw,
      y: board.boardY,
      w: fw,
      h: board.boardHeight,
    };
    this.frameTopRect = {
      x: 0,
      y: board.boardY - fw - 2,
      w: CANVAS_WIDTH,
      h: fw,
    };

    this.reshuffleRect = { x: CANVAS_WIDTH - 48, y: 12, w: 32, h: 28 };
    this.restartRect = { x: CANVAS_WIDTH - 88, y: 12, w: 32, h: 28 };
  },

  _bindEvents() {
    const c = this.canvas;
    c.addEventListener('mousedown', (e) => this._onPointerDown(e));
    c.addEventListener('mousemove', (e) => this._onPointerMove(e));
    c.addEventListener('mouseup', (e) => this._onPointerUp(e));
    c.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this._onPointerDown(e.touches[0]);
    }, { passive: false });
    c.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this._onPointerMove(e.touches[0]);
    }, { passive: false });
    c.addEventListener('touchend', (e) => {
      e.preventDefault();
      this._onPointerUp(e);
    }, { passive: false });
  },

  _getPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width),
      y: (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height),
    };
  },

  _isInRect(pos, rect) {
    if (!rect) return false;
    return pos.x >= rect.x && pos.x <= rect.x + rect.w &&
           pos.y >= rect.y && pos.y <= rect.y + rect.h;
  },

  _onPointerDown(e) {
    AudioManager.init();
    AudioManager.resume();

    const pos = this._getPos(e);

    if (this._isInRect(pos, this.reshuffleRect)) {
      if (this.handlers.onReshuffle) this.handlers.onReshuffle();
      return;
    }
    if (this._isInRect(pos, this.restartRect)) {
      if (this.handlers.onRestart) this.handlers.onRestart();
      return;
    }
    if (this._isInRect(pos, this.frameLeftRect)) {
      if (this.handlers.onRotateCCW) this.handlers.onRotateCCW();
      return;
    }
    if (this._isInRect(pos, this.frameRightRect)) {
      if (this.handlers.onRotateCW) this.handlers.onRotateCW();
      return;
    }
    if (this._isInRect(pos, this.frameTopRect)) {
      if (this.handlers.onFlip180) this.handlers.onFlip180();
      return;
    }

    if (!this.board) return;
    const cell = this.board.getCellFromPos(pos.x, pos.y);
    if (cell) {
      this.swipeHandler.start(cell.row, cell.col);
    }
  },

  _onPointerMove(e) {
    const pos = this._getPos(e);

    this.hoveredFrame = null;
    this.hoveredReshuffle = false;
    this.hoveredRestart = false;

    if (this._isInRect(pos, this.frameLeftRect)) {
      this.hoveredFrame = 'left';
    } else if (this._isInRect(pos, this.frameRightRect)) {
      this.hoveredFrame = 'right';
    } else if (this._isInRect(pos, this.frameTopRect)) {
      this.hoveredFrame = 'top';
    }
    if (this._isInRect(pos, this.reshuffleRect)) {
      this.hoveredReshuffle = true;
    }
    if (this._isInRect(pos, this.restartRect)) {
      this.hoveredRestart = true;
    }

    if (!this.swipeHandler.isActive()) return;
    if (!this.board) return;
    const cell = this.board.getCellFromPos(pos.x, pos.y);
    if (cell) {
      this.swipeHandler.move(cell.row, cell.col);
    }
  },

  _onPointerUp(e) {
    const cells = this.swipeHandler.end();
    if (cells.length > 0 && this.handlers.onSwipeComplete) {
      this.handlers.onSwipeComplete(cells);
    }
  },

  getPath() {
    return this.swipeHandler.getPath();
  },

  on(event, handler) {
    this.handlers[event] = handler;
  },
};
