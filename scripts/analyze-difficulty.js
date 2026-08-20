const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'levels', 'level-data.json');
const OUT = path.join(__dirname, '..', 'docs', 'difficulty-curve.md');

if (!fs.existsSync(DATA)) {
  console.error('请先运行 npm run generate-levels');
  process.exit(1);
}

const levels = JSON.parse(fs.readFileSync(DATA, 'utf-8'));
const analysis = levels.map(l => {
  const density = l.grid.flat().filter(c => c !== null).length / (l.rows * l.cols);
  return {
    level: l.level,
    phase: l.phase,
    rows: l.rows, cols: l.cols,
    colors: l.numColors,
    time: l.timeLimit,
    cells: l.rows * l.cols,
    difficulty: (l.rows * l.cols * 0.3 + l.numColors * 5 + (60 - l.timeLimit) * 0.5).toFixed(0),
  };
});

let md = '# 难度曲线分析\n\n';
md += '| 关卡 | 阶段 | 棋盘 | 颜色数 | 时限 | 总格数 | 难度分 |\n';
md += '|------|------|------|--------|------|--------|--------|\n';
analysis.forEach(a => {
  md += `| ${a.level} | ${a.phase} | ${a.rows}×${a.cols} | ${a.colors} | ${a.time}s | ${a.cells} | ${a.difficulty} |\n`;
});

const scores = analysis.map(a => parseInt(a.difficulty));
md += `\n## 统计\n- 难度范围: ${Math.min(...scores)} ~ ${Math.max(...scores)}\n`;
md += `- 总关卡: ${analysis.length}\n`;

const slope = (parseInt(scores[scores.length - 1]) - parseInt(scores[0])) / scores.length;
md += `- 每关增长: ${slope.toFixed(2)}\n`;
md += slope > 0 ? '✅ 难度曲线递增\n' : '⚠️ 难度未递增，需调整参数\n';

fs.writeFileSync(OUT, md);
console.log(`分析完成 -> ${OUT}`);