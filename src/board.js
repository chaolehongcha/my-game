class Board {
  constructor(rows, cols, numColors) {
    this.rows = rows;
    this.cols = cols;
    this.numColors = numColors;
    this.cellSize = Math.floor(Math.min(
      CANVAS_WIDTH / cols,
      BOARD_HEIGHT / rows
    ));
    this.boardWidth = this.cellSize * cols;
    this.boardHeight = this.cellSize * rows;
    this.boardX = Math.floor((CANVAS_WIDTH - this.boardWidth) / 2);
    this.boardY = Math.floor(BOARD_Y + (BOARD_HEIGHT - this.boardHeight) / 2);
    this.grid = [];
  }

  init(config, bricks) {
    if (config) {
      this.grid = config.map(row =>
        row.map(val => {
          if (val === null) return null;
          if (val === -1) return { color: 0, brick: true };
          if (typeof val === 'number') {
            return { color: val, brick: false };
          }
          return val;
        })
      );
    } else {
      this._generateRandom();
    }

    if (bricks && Array.isArray(bricks)) {
      bricks.forEach(([r, c]) => {
        if (this.grid[r] && this.grid[r][c] !== undefined) {
          this.grid[r][c] = { color: 0, brick: true };
        }
      });
    }
  }

  _generateRandom(attempts) {
    attempts = attempts || 0;
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c] = {
          color: Math.floor(Math.random() * this.numColors),
          brick: false,
        };
      }
    }
    if (!this.hasValidMove() && attempts < 10) {
      this._generateRandom(attempts + 1);
    }
  }

  getBlock(row, col) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
    return this.grid[row][col];
  }

  getBlockColor(row, col) {
    const block = this.getBlock(row, col);
    if (!block || block.brick) return null;
    return block.color;
  }

  getCellFromPos(x, y) {
    const col = Math.floor((x - this.boardX) / this.cellSize);
    const row = Math.floor((y - this.boardY) / this.cellSize);
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
    return { row, col };
  }

  getCellCenter(row, col) {
    return {
      x: Math.floor(this.boardX + col * this.cellSize + this.cellSize / 2),
      y: Math.floor(this.boardY + row * this.cellSize + this.cellSize / 2),
    };
  }

  removeBlocks(cells) {
    for (const { row, col } of cells) {
      const block = this.grid[row][col];
      if (block && !block.brick) {
        this.grid[row][col] = null;
      }
    }
  }

  applyGravity() {
    const movements = [];

    for (let c = 0; c < this.cols; c++) {
      const brickRows = [];
      for (let r = 0; r < this.rows; r++) {
        const block = this.grid[r][c];
        if (block !== null && block.brick) brickRows.push(r);
      }

      let segStart = 0;
      const segments = [];
      for (const br of brickRows) {
        segments.push([segStart, br - 1]);
        segStart = br + 1;
      }
      segments.push([segStart, this.rows - 1]);

      for (const [start, end] of segments) {
        if (start > end) continue;

        const blocks = [];
        for (let r = start; r <= end; r++) {
          const block = this.grid[r][c];
          if (block !== null && !block.brick) {
            blocks.push({ block, fromRow: r });
          }
          this.grid[r][c] = null;
        }

        let blockIdx = blocks.length - 1;
        for (let r = end; r >= start && blockIdx >= 0; r--) {
          this.grid[r][c] = blocks[blockIdx].block;
          if (r !== blocks[blockIdx].fromRow) {
            movements.push({
              block: this.grid[r][c],
              col: c,
              fromRow: blocks[blockIdx].fromRow,
              toRow: r,
            });
          }
          blockIdx--;
        }
      }
    }

    return movements;
  }

  rotate90CW() {
    const n = this.rows;
    const newGrid = Array.from({ length: n }, () => Array(n).fill(null));
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const block = this.grid[r][c];
        if (block !== null) {
          newGrid[c][n - 1 - r] = block;
        }
      }
    }
    this.grid = newGrid;
  }

  rotate90CCW() {
    const n = this.rows;
    const newGrid = Array.from({ length: n }, () => Array(n).fill(null));
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const block = this.grid[r][c];
        if (block !== null) {
          newGrid[n - 1 - c][r] = block;
        }
      }
    }
    this.grid = newGrid;
  }

  flip180() {
    const n = this.rows;
    const newGrid = Array.from({ length: n }, () => Array(n).fill(null));
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const block = this.grid[r][c];
        if (block !== null) {
          newGrid[n - 1 - r][n - 1 - c] = block;
        }
      }
    }
    this.grid = newGrid;
  }

  isEmpty() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] !== null) return false;
      }
    }
    return true;
  }

  hasValidMove() {
    const visited = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(false)
    );
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const color = this.getBlockColor(r, c);
        if (color !== null && !visited[r][c]) {
          const group = this._floodFill(r, c, color, visited);
          if (group.length >= MIN_SWIPE) return true;
        }
      }
    }
    return false;
  }

  _floodFill(row, col, color, visited) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return [];
    if (visited[row][col]) return [];
    if (this.getBlockColor(row, col) !== color) return [];

    visited[row][col] = true;
    const result = [{ row, col }];
    result.push(...this._floodFill(row - 1, col, color, visited));
    result.push(...this._floodFill(row + 1, col, color, visited));
    result.push(...this._floodFill(row, col - 1, color, visited));
    result.push(...this._floodFill(row, col + 1, color, visited));
    return result;
  }

  getRemainingCount() {
    let count = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const block = this.grid[r][c];
        if (block !== null && !block.brick) count++;
      }
    }
    return count;
  }

  reshuffle() {
    const blocks = [];
    const positions = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const block = this.grid[r][c];
        if (block !== null && !block.brick) {
          blocks.push(block.color);
          positions.push({ r, c });
        }
      }
    }

    for (let i = blocks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
    }

    for (let i = 0; i < positions.length; i++) {
      this.grid[positions[i].r][positions[i].c].color = blocks[i];
    }

    if (!this.hasValidMove() && blocks.length >= MIN_SWIPE) {
      this.reshuffle();
    }
  }
}
