const fs = require('fs');
const path = require('path');

const OUTPUT = path.join(__dirname, '..', 'src', 'generated-levels.js');

function getLevelConfig(num) {
  if (num === 1) {
    return {
      level: 1, phase: 'intro',
      rows: 6, cols: 6, numColors: 3, timeLimit: 60, targetScore: 80,
      bricks: [],
      grid: [
        [0,0,0,0,0,0],
        [1,1,1,2,2,2],
        [0,0,0,0,0,0],
        [1,1,1,2,2,2],
        [0,0,2,2,2,2],
        [1,1,1,1,0,0],
      ],
    };
  }

  const phase = num <= 10 ? 'intro' :
    num <= 25 ? 'easy' :
    num <= 35 ? 'medium' :
    num <= 45 ? 'hard' : 'expert';

  const params = {
    intro:   { rows: 6, cols: 6, colors: 3, time: 60 - (num-1)*2,         bricks: 0 },
    easy:    { rows: 7, cols: 7, colors: 3, time: 55 - Math.floor((num-11)/3), bricks: 0 },
    medium:  { rows: 8, cols: 8, colors: 4, time: 50 - Math.floor((num-26)/3), bricks: 2 + Math.floor((num-26)/3) },
    hard:    { rows: 8, cols: 8, colors: 5, time: 45 - Math.floor((num-36)/3), bricks: 3 + Math.floor((num-36)/3) },
    expert:  { rows: 9, cols: 9, colors: 5, time: 40 - Math.floor((num-46)/2), bricks: 5 + Math.floor((num-46)/2) },
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

console.log('\n难度梯度:');
levels.filter(l => [1, 5, 10, 11, 15, 20, 25, 26, 30, 35, 36, 40, 45, 46, 50].includes(l.level)).forEach(l => {
  console.log(`  第${l.level}关 (${l.phase}): ${l.rows}x${l.cols} ${l.numColors}色 目标${l.targetScore}分 ${l.timeLimit}s 砖块${l.bricks.length}`);
});