const LEVELS = [];

function getLevelConfig(num) {
  if (num === 1) {
    return {
      level: 1,
      rows: 6,
      cols: 6,
      numColors: 3,
      timeLimit: 60,
      targetScore: 80,
      bricks: [],
      description: '滑动连接4个同色方块消除',
      grid: [
        [0, 0, 0, 0, 0, 0],
        [1, 1, 1, 2, 2, 2],
        [0, 0, 0, 0, 0, 0],
        [1, 1, 1, 2, 2, 2],
        [0, 0, 2, 2, 2, 2],
        [1, 1, 1, 1, 0, 0],
      ],
    };
  }

  const phase = num <= 10 ? 'intro' :
    num <= 20 ? 'easy' :
    num <= 30 ? 'medium' :
    num <= 40 ? 'hard' : 'expert';

  const params = {
    intro:  { rows: 6, cols: 6, colors: 3, time: 60 - (num - 1) * 2,         bricks: 0 },
    easy:   { rows: 7, cols: 7, colors: 3, time: 55 - Math.floor((num-11)/3), bricks: 0 },
    medium: { rows: 8, cols: 8, colors: 4, time: 50 - Math.floor((num-21)/4), bricks: 2 + Math.floor((num-21)/3) },
    hard:   { rows: 8, cols: 8, colors: 5, time: 45 - Math.floor((num-31)/4), bricks: 3 + Math.floor((num-31)/3) },
    expert: { rows: 9, cols: 9, colors: 5, time: 40 - Math.floor((num-41)/5), bricks: 5 + Math.floor((num-41)/2) },
  };

  const p = params[phase];
  const targetScore = Math.floor(p.rows * p.cols * 2 + num * 5);

  return {
    level: num,
    rows: p.rows,
    cols: p.cols,
    numColors: p.colors,
    timeLimit: Math.max(p.time, 20),
    targetScore,
    bricks: p.bricks,
    description: '',
    grid: null,
  };
}

function generateLevel(num) {
  const config = getLevelConfig(num);
  if (config.grid) return config;

  const grid = [];
  for (let r = 0; r < config.rows; r++) {
    grid[r] = [];
    for (let c = 0; c < config.cols; c++) {
      grid[r][c] = Math.floor(Math.random() * config.numColors);
    }
  }
  config.grid = grid;

  if (config.bricks > 0) {
    config._bricks = [];
    const used = new Set();
    for (let i = 0; i < config.bricks; i++) {
      let r, c;
      do {
        r = Math.floor(Math.random() * config.rows);
        c = Math.floor(Math.random() * config.cols);
      } while (used.has(`${r},${c}`));
      used.add(`${r},${c}`);
      config._bricks.push([r, c]);
    }
  }

  return config;
}

const LevelManager = {
  currentLevel: 1,
  maxUnlocked: 1,

  getLevel(num) {
    const config = generateLevel(num);
    const bricks = config._bricks || config.bricks || [];
    return { config, bricks: Array.isArray(bricks) ? bricks : [] };
  },
};
