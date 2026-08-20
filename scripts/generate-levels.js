const fs = require('fs');
const path = require('path');

const OUTPUT = path.join(__dirname, '..', 'src', 'generated-levels.js');

const TUTORIAL_LEVELS = [
  {
    level: 1, phase: 'intro',
    rows: 5, cols: 5, numColors: 2, timeLimit: 120, targetScore: 30,
    bricks: [],
    grid: [
      [null,null,1,null,null],
      [null,null,1,null,null],
      [0,0,0,0,0],
      [null,null,1,null,null],
      [null,null,1,null,null],
    ],
  },
  {
    level: 2, phase: 'intro',
    rows: 5, cols: 5, numColors: 3, timeLimit: 120, targetScore: 70,
    bricks: [],
    grid: [
      [0,0,0,0,1],
      [0,null,null,null,1],
      [2,null,null,null,1],
      [2,null,null,null,1],
      [2,2,2,1,1],
    ],
  },
  {
    level: 3, phase: 'intro',
    rows: 5, cols: 5, numColors: 2, timeLimit: 120, targetScore: 30,
    bricks: [],
    grid: [
      [null,null,null,null,null],
      [null,null,null,null,null],
      [null,null,null,null,null],
      [0,null,null,null,0],
      [0,null,null,null,0],
    ],
  },
];

function getPhase(num) {
  if (num <= 15) return 'intro';
  if (num <= 30) return 'easy';
  if (num <= 40) return 'medium';
  if (num <= 50) return 'hard';
  return 'expert';
}

function getParams(num) {
  if (num <= 3) return null;
  if (num <= 5) return { rows: 5, cols: 5, colors: 3, time: 60 };
  if (num <= 15) return { rows: 6, cols: 6, colors: 3, time: 60 - (num - 6) * 2, bricks: 0 };
  if (num <= 30) return { rows: 7, cols: 7, colors: 3, time: 55 - Math.floor((num - 16) / 3), bricks: 0 };
  if (num <= 40) return { rows: 8, cols: 8, colors: 4, time: 50 - Math.floor((num - 31) / 3), bricks: 2 + Math.floor((num - 31) / 3) };
  if (num <= 50) return { rows: 8, cols: 8, colors: 5, time: 45 - Math.floor((num - 41) / 3), bricks: 3 + Math.floor((num - 41) / 3) };
  return { rows: 9, cols: 9, colors: 5, time: 40 - Math.floor((num - 51) / 2), bricks: 5 + Math.floor((num - 51) / 2) };
}

function getLevelConfig(num) {
  if (num <= 3) return TUTORIAL_LEVELS[num - 1];

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
for (let i = 1; i <= 50; i++) {
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

console.log('\n前15关列表:');
for (let i = 1; i <= 15; i++) {
  const l = levels[i-1];
  console.log(`  第${l.level}关 (${l.phase}): ${l.rows}x${l.cols} ${l.numColors}色 目标${l.targetScore}分 ${l.timeLimit}s`);
}
console.log('\n其他关卡:');
[16,20,25,30,35,40,45,50].forEach(i => {
  const l = levels[i-1];
  console.log(`  第${l.level}关 (${l.phase}): ${l.rows}x${l.cols} ${l.numColors}色 目标${l.targetScore}分 ${l.timeLimit}s 砖块${l.bricks.length}`);
});