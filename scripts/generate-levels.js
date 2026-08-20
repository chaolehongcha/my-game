const fs = require('fs');
const path = require('path');

const OUTPUT = path.join(__dirname, '..', 'levels', 'level-data.json');

function getLevelConfig(num) {
  if (num === 1) {
    return {
      level: 1,
      phase: 'intro',
      rows: 6, cols: 6, numColors: 3, timeLimit: 60, targetScore: 80,
      bricks: [],
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
    intro:   { rows: 6, cols: 6, colors: 3, time: 60 - (num-1)*2,         bricks: 0 },
    easy:    { rows: 7, cols: 7, colors: 3, time: 55 - Math.floor((num-11)/3), bricks: 0 },
    medium:  { rows: 8, cols: 8, colors: 4, time: 50 - Math.floor((num-21)/4), bricks: 2 + Math.floor((num-21)/3) },
    hard:    { rows: 8, cols: 8, colors: 5, time: 45 - Math.floor((num-31)/4), bricks: 3 + Math.floor((num-31)/3) },
    expert:  { rows: 9, cols: 9, colors: 5, time: 40 - Math.floor((num-41)/5), bricks: 5 + Math.floor((num-41)/2) },
  };

  const p = params[phase];
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
  for (let i = 0; i < p.bricks; i++) {
    let r, c;
    do {
      r = Math.floor(Math.random() * p.rows);
      c = Math.floor(Math.random() * p.cols);
    } while (used.has(`${r},${c}`));
    used.add(`${r},${c}`);
    brickPositions.push([r, c]);
  }

  return {
    level: num,
    phase,
    rows: p.rows,
    cols: p.cols,
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

const dir = path.dirname(OUTPUT);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(levels, null, 2));

console.log(`已生成 ${levels.length} 关 -> ${OUTPUT}`);

const phases = {};
levels.forEach(l => { phases[l.phase] = (phases[l.phase] || 0) + 1; });
console.log('阶段分布:', phases);

console.log('\n难度梯度:');
levels.filter(l => [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].includes(l.level)).forEach(l => {
  console.log(`  第${l.level}关 (${l.phase}): ${l.rows}x${l.cols} ${l.numColors}色 目标${l.targetScore}分 ${l.timeLimit}s 砖块${l.bricks.length}`);
});
