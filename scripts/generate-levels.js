const fs = require('fs');
const path = require('path');

const OUTPUT = path.join(__dirname, '..', 'src', 'generated-levels.js');

const TUTORIAL_LEVELS = [
  {
    level: 1, phase: 'intro',
    rows: 5, cols: 5, numColors: 2, timeLimit: 120, targetScore: 30,
    grid: [
      [-1,-1,1,-1,-1],
      [-1,-1,1,-1,-1],
      [0,0,0,0,0],
      [-1,-1,1,-1,-1],
      [-1,-1,1,-1,-1],
    ],
  },
  {
    level: 2, phase: 'intro',
    rows: 5, cols: 5, numColors: 1, timeLimit: 120, targetScore: 40,
    grid: [
      [0,0,null,null,null],
      [0,0,null,null,null],
      [null,null,null,null,null],
      [0,0,0,null,null],
      [0,0,0,null,null],
    ],
  },
  {
    level: 3, phase: 'intro',
    rows: 5, cols: 5, numColors: 2, timeLimit: 120, targetScore: 10,
    grid: [
      [null,null,null,null,null],
      [null,-1,-1,-1,null],
      [null,-1,-1,-1,null],
      [0,-1,-1,-1,0],
      [0,null,null,null,0],
    ],
  },
  {
    level: 4, phase: 'intro',
    rows: 5, cols: 5, numColors: 1, timeLimit: 120, targetScore: 50,
    grid: [
      [0,0,0,0,null],
      [null,null,null,null,null],
      [null,null,null,null,null],
      [0,0,0,0,0],
      [0,0,0,0,0],
    ],
  },
  {
    level: 5, phase: 'intro',
    rows: 5, cols: 5, numColors: 2, timeLimit: 120, targetScore: 40,
    grid: [
      [0,0,0,0,null],
      [0,null,-2,0,0],
      [null,null,0,null,null],
      [null,null,null,null,null],
      [null,null,null,null,null],
    ],
  },
];

function getPhase(num) {
  if (num <= 15) return 'intro';
  if (num <= 30) return 'easy';
  return 'hard';
}

function getParams(num) {
  if (num <= 5) return null;
  if (num <= 15) return { rows: 6, cols: 6, colors: 3, time: 60 - (num - 6) * 2, bricks: 0 };
  if (num <= 30) return { rows: 7, cols: 7, colors: 3, time: 55 - Math.floor((num - 16) / 3), bricks: 0 };
  return { rows: 9, cols: 9, colors: 4, time: 45 - Math.floor((num - 31) / 2), bricks: 2 + Math.floor((num - 31) / 3) };
}

function getLevelConfig(num) {
  if (num <= 5) return TUTORIAL_LEVELS[num - 1];

  const p = getParams(num);
  const phase = getPhase(num);
  const targetScore = Math.floor(p.rows * p.cols * 2 + num * 5);

  const grid = [];
  for (let r = 0; r < p.rows; r++) {
    grid[r] = [];
    for (let c = 0; c < p.cols; c++) {
      grid[r][c] = Math.floor(Math.random() * p.colors);
    }
  }

  const brickPositions = [];
  const used = new Set();
  for (let i = 0; i < (p.bricks || 0); i++) {
    let r, c, attempts = 0;
    do {
      r = Math.floor(Math.random() * p.rows);
      c = Math.floor(Math.random() * p.cols);
      attempts++;
    } while (used.has(`${r},${c}`) && attempts < 50);
    if (attempts < 50) {
      used.add(`${r},${c}`);
      brickPositions.push([r, c]);
    }
  }

  return {
    level: num, phase,
    rows: p.rows, cols: p.cols,
    numColors: p.colors,
    timeLimit: Math.max(p.time, 20),
    targetScore,
    bricks: brickPositions,
    grid,
  };
}

const levels = [];
for (let i = 1; i <= 40; i++) {
  levels.push(getLevelConfig(i));
}

let js = 'const GENERATED_LEVELS = [\n';
levels.forEach((l, idx) => {
  const comma = idx < levels.length - 1 ? ',' : '';
  js += JSON.stringify(l) + comma + '\n';
});
js += '];\n';

fs.writeFileSync(OUTPUT, js, 'utf-8');
console.log(`已生成固定关卡数据 -> ${OUTPUT}`);
console.log(`共 ${levels.length} 关`);

const phases = {};
levels.forEach(l => { phases[l.phase] = (phases[l.phase] || 0) + 1; });
console.log('阶段分布:', phases);

console.log('\n关卡列表:');
levels.forEach(l => {
  console.log(`  第${l.level}关 (${l.phase}): ${l.rows}x${l.cols} ${l.numColors}色 目标${l.targetScore}分 ${l.timeLimit}s 砖块${(l.bricks || []).length}`);
});