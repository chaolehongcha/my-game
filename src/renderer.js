const Renderer = {
  canvas: null,
  ctx: null,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
  },

  clear() {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  },

  drawBoard(board, animatedCells) {
    const ctx = this.ctx;
    const skipCells = animatedCells || new Set();

    ctx.fillStyle = COLORS.board;
    ctx.fillRect(board.boardX, board.boardY, board.boardWidth, board.boardHeight);

    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        if (skipCells.has(`${r},${c}`)) continue;

        const block = board.getBlock(r, c);
        if (block === null) continue;

        const center = board.getCellCenter(r, c);
        const pad = 3;
        const size = board.cellSize - pad * 2;
        const x = center.x - size / 2;
        const y = center.y - size / 2;

        if (block.brick) {
          this._drawBrick(x, y, size);
        } else if (block.wild) {
          this._drawWildBlock(x, y, size);
        } else {
          this._drawBlock(x, y, size, BLOCK_COLORS[block.color] || '#888');
        }
      }
    }

    this._drawGridLines(board);
  },

  drawRotatedBoard(board, snapshot, rotation) {
    const ctx = this.ctx;
    const cx = board.boardX + board.boardWidth / 2;
    const cy = board.boardY + board.boardHeight / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.translate(-cx, -cy);

    ctx.fillStyle = COLORS.board;
    ctx.fillRect(board.boardX, board.boardY, board.boardWidth, board.boardHeight);

    this._drawGridLines(board);

    const pad = 3;
    const size = board.cellSize - pad * 2;

    snapshot.forEach(item => {
      const bx = item.x - size / 2;
      const by = item.y - size / 2;
      if (item.block.brick) {
        this._drawBrick(bx, by, size);
      } else if (item.block.wild) {
        this._drawWildBlock(bx, by, size);
      } else {
        this._drawBlock(bx, by, size, BLOCK_COLORS[item.block.color] || '#888');
      }
    });

    ctx.restore();
  },

  drawAnimatedBlocks(board, animations) {
    const ctx = this.ctx;
    const pad = 3;
    const size = board.cellSize - pad * 2;

    animations.forEach(anim => {
      if (anim.block === null) return;
      const t = anim.progress >= 1 ? 1 : anim.progress * anim.progress;

      const from = board.getCellCenter(anim.fromRow, anim.col);
      const to = board.getCellCenter(anim.toRow, anim.col);
      const x = to.x;
      const y = from.y + (to.y - from.y) * t;

      const bx = x - size / 2;
      const by = y - size / 2;

      if (anim.block.brick) {
        this._drawBrick(bx, by, size);
      } else if (anim.block.wild) {
        this._drawWildBlock(bx, by, size);
      } else {
        this._drawBlock(bx, by, size, BLOCK_COLORS[anim.block.color] || '#888');
      }
    });
  },

  _drawGridLines(board) {
    const ctx = this.ctx;
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 1;
    for (let r = 0; r <= board.rows; r++) {
      const y = board.boardY + r * board.cellSize;
      ctx.beginPath();
      ctx.moveTo(board.boardX, y);
      ctx.lineTo(board.boardX + board.boardWidth, y);
      ctx.stroke();
    }
    for (let c = 0; c <= board.cols; c++) {
      const x = board.boardX + c * board.cellSize;
      ctx.beginPath();
      ctx.moveTo(x, board.boardY);
      ctx.lineTo(x, board.boardY + board.boardHeight);
      ctx.stroke();
    }
  },

  _drawBlock(x, y, size, color) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    this._roundRect(x, y, size, size, 6);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    this._roundRect(x, y + 2, size, size / 2, 6);
    ctx.fill();
  },

  _drawBrick(x, y, size) {
    const ctx = this.ctx;
    ctx.fillStyle = '#4a4a5a';
    this._roundRect(x, y, size, size, 2);
    ctx.fill();

    ctx.strokeStyle = '#3a3a4a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + size / 2);
    ctx.lineTo(x + size, y + size / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + size / 2, y);
    ctx.lineTo(x + size / 2, y + size / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + size / 4, y + size / 2);
    ctx.lineTo(x + size / 4, y + size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + size * 3 / 4, y + size / 2);
    ctx.lineTo(x + size * 3 / 4, y + size);
    ctx.stroke();
  },

  _drawWildBlock(x, y, size) {
    const ctx = this.ctx;
    const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a29bfe', '#fd79a8'];
    const seg = size / colors.length;
    for (let i = 0; i < colors.length; i++) {
      ctx.fillStyle = colors[i];
      this._roundRect(x + i * seg, y, seg + 1, size, 1);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    this._roundRect(x, y, size, size, 6);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = 'bold ' + Math.floor(size * 0.45) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', x + size / 2, y + size / 2 + 1);
  },

  drawLevelMessage(text, progress) {
    if (progress <= 0 || progress >= 1) return;
    const ctx = this.ctx;
    const alpha = progress < 0.2 ? progress / 0.2 : progress > 0.8 ? (1 - progress) / 0.2 : 1;
    const scale = 0.8 + progress * 0.2;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.scale(scale, scale);

    ctx.fillStyle = '#fff';
    ctx.font = 'italic bold 32px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 8;
    ctx.fillText(text, 0, 0);
    ctx.shadowBlur = 0;

    ctx.restore();
  },

  drawPath(path, board) {
    if (!path || path.length === 0) return;
    const ctx = this.ctx;

    ctx.strokeStyle = COLORS.path;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < path.length; i++) {
      const center = board.getCellCenter(path[i].row, path[i].col);
      if (i === 0) ctx.moveTo(center.x, center.y);
      else ctx.lineTo(center.x, center.y);
    }
    ctx.stroke();

    for (const p of path) {
      const center = board.getCellCenter(p.row, p.col);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      const highlight = board.cellSize * 0.8;
      ctx.beginPath();
      ctx.arc(center.x, center.y, highlight / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  drawFrames(hoveredFrame) {
    const ctx = this.ctx;
    const frames = [
      { rect: InputManager.frameLeftRect, key: 'left', icon: 'ccw' },
      { rect: InputManager.frameRightRect, key: 'right', icon: 'cw' },
      { rect: InputManager.frameTopRect, key: 'top', icon: 'flip' },
    ];

    frames.forEach(frame => {
      if (!frame.rect) return;
      const hovered = hoveredFrame === frame.key;

      ctx.fillStyle = hovered ? COLORS.arrowHover : COLORS.arrowBg;
      this._roundRect(frame.rect.x, frame.rect.y, frame.rect.w, frame.rect.h, 4);
      ctx.fill();

      const cx = frame.rect.x + frame.rect.w / 2;
      const cy = frame.rect.y + frame.rect.h / 2;

      ctx.strokeStyle = COLORS.arrow;
      ctx.fillStyle = COLORS.arrow;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      if (frame.icon === 'cw') {
        ctx.beginPath();
        ctx.arc(cx, cy, 6, -0.3, Math.PI * 1.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
        ctx.fill();
        const endAngle = Math.PI * 1.4;
        const ex = cx + Math.cos(endAngle) * 6;
        const ey = cy + Math.sin(endAngle) * 6;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 4, ey - 2);
        ctx.lineTo(ex + 1, ey - 5);
        ctx.closePath();
        ctx.fill();
      } else if (frame.icon === 'ccw') {
        ctx.beginPath();
        ctx.arc(cx, cy, 6, Math.PI * 1.6, Math.PI * 1.3, false);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
        ctx.fill();
        const startAngle = Math.PI * 1.6;
        const sx = cx + Math.cos(startAngle) * 6;
        const sy = cy + Math.sin(startAngle) * 6;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + 4, sy - 2);
        ctx.lineTo(sx - 1, sy - 5);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(cx - 3, cy - 5);
        ctx.lineTo(cx + 3, cy - 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, cy - 5);
        ctx.lineTo(cx, cy + 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - 4, cy);
        ctx.lineTo(cx, cy + 5);
        ctx.lineTo(cx + 4, cy);
        ctx.closePath();
        ctx.fill();
      }
    });
  },

  drawReshuffleBtn(reshufflesLeft, hovered) {
    const ctx = this.ctx;
    const rect = InputManager.reshuffleRect;
    if (!rect) return;

    const disabled = reshufflesLeft <= 0;
    ctx.fillStyle = hovered && !disabled ? COLORS.reshuffleBtn : (disabled ? COLORS.reshuffleBtnDisabled : 'rgba(233,69,96,0.4)');
    this._roundRect(rect.x, rect.y, rect.w, rect.h, 6);
    ctx.fill();

    ctx.fillStyle = disabled ? '#777' : '#fff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('↺', rect.x + rect.w / 2, rect.y + rect.h / 2 - 3);

    ctx.font = '9px sans-serif';
    ctx.fillText(reshufflesLeft, rect.x + rect.w / 2, rect.y + rect.h - 5);
  },

  drawRestartBtn(hovered) {
    const ctx = this.ctx;
    const rect = InputManager.menuRect;
    if (!rect) return;

    ctx.fillStyle = hovered ? '#ff8a8a' : 'rgba(233,69,96,0.4)';
    this._roundRect(rect.x, rect.y, rect.w, rect.h, 6);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('☰', rect.x + rect.w / 2, rect.y + rect.h / 2);

    if (InputManager.menuOpen) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this._roundRect(InputManager.menuRestartRect.x - 4, InputManager.menuRestartRect.y - 4, InputManager.menuRestartRect.w + 8, 64, 8);
      ctx.fill();

      ctx.fillStyle = InputManager.hoveredMenuRestart ? '#ff8a8a' : 'rgba(233,69,96,0.5)';
      this._roundRect(InputManager.menuRestartRect.x, InputManager.menuRestartRect.y, InputManager.menuRestartRect.w, InputManager.menuRestartRect.h, 6);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('重新开始', InputManager.menuRestartRect.x + InputManager.menuRestartRect.w / 2, InputManager.menuRestartRect.y + InputManager.menuRestartRect.h / 2);

      ctx.fillStyle = InputManager.hoveredMenuHome ? '#ff8a8a' : 'rgba(233,69,96,0.5)';
      this._roundRect(InputManager.menuHomeRect.x, InputManager.menuHomeRect.y, InputManager.menuHomeRect.w, InputManager.menuHomeRect.h, 6);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('返回主页', InputManager.menuHomeRect.x + InputManager.menuHomeRect.w / 2, InputManager.menuHomeRect.y + InputManager.menuHomeRect.h / 2);
    }
  },

  drawNotification(text, timer) {
    const ctx = this.ctx;
    const alpha = Math.min(timer, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = COLORS.reshuffleNotify;
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.globalAlpha = 1;
  },

  drawDeadlockBubble(timer) {
    const ctx = this.ctx;
    const alpha = Math.min(timer, 1);
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2 - 40;
    const bw = 280;
    const bh = 60;

    ctx.globalAlpha = alpha;

    ctx.fillStyle = 'rgba(40, 40, 60, 0.92)';
    this._roundRect(cx - bw / 2, cy - bh / 2, bw, bh, 12);
    ctx.fill();

    ctx.fillStyle = COLORS.deadlock;
    ctx.font = 'bold 18px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('无路可走！试试旋转或打乱', cx, cy);

    ctx.beginPath();
    ctx.moveTo(cx - 8, cy + bh / 2);
    ctx.lineTo(cx + 8, cy + bh / 2);
    ctx.lineTo(cx, cy + bh / 2 + 10);
    ctx.closePath();
    ctx.fillStyle = 'rgba(40, 40, 60, 0.92)';
    ctx.fill();

    ctx.globalAlpha = 1;
  },

  drawHUD(level, timer, remaining, score, targetScore) {
    const ctx = this.ctx;

    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, BOARD_Y);

    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 18px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`第 ${level} 关`, 12, BOARD_Y / 2 - 12);

    ctx.fillStyle = COLORS.textDim;
    ctx.font = '14px "Segoe UI", "PingFang SC", sans-serif';
    ctx.fillText(`剩余: ${remaining}`, 12, BOARD_Y / 2 + 12);

    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.targetScore;
    ctx.fillText(`目标 ${targetScore}`, CANVAS_WIDTH - 96, BOARD_Y / 2 - 12);
    ctx.fillStyle = COLORS.text;
    ctx.fillText(`得分 ${score}`, CANVAS_WIDTH - 96, BOARD_Y / 2 + 12);

    const timerColor = timer <= 10 ? COLORS.timer : timer <= 20 ? COLORS.warning : COLORS.text;
    ctx.fillStyle = timerColor;
    ctx.font = 'bold 24px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(timer)}s`, CANVAS_WIDTH / 2, BOARD_Y / 2);

    const progress = Math.min(score / targetScore, 1);
    ctx.fillStyle = COLORS.gridLine;
    ctx.fillRect(0, BOARD_Y - 6, CANVAS_WIDTH, 4);
    ctx.fillStyle = COLORS.targetScore;
    ctx.fillRect(0, BOARD_Y - 6, CANVAS_WIDTH * progress, 4);

    ctx.fillStyle = COLORS.gridLine;
    ctx.fillRect(0, BOARD_Y - 2, CANVAS_WIDTH, 2);
  },

  drawOverlay(text, subtext, color) {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.overlay;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = color || COLORS.text;
    ctx.font = 'bold 42px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

    if (subtext) {
      ctx.fillStyle = COLORS.textDim;
      ctx.font = '18px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText(subtext, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    }
  },

  _roundRect(x, y, w, h, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  },
};
