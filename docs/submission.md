# 提交说明

## 项目文件结构
```
competition-project/
├── index.html                # 游戏入口（浏览器直接打开）
├── package.json              # 项目配置
├── AGENTS.md                 # AI 使用指南
├── src/
│   ├── main.js               # 入口初始化
│   ├── game.js               # 游戏主循环与状态管理
│   ├── board.js              # 棋盘逻辑（网格、消除、重力、移位）
│   ├── levels.js             # 关卡配置与生成
│   ├── level-data.js         # 50关数据
│   ├── renderer.js           # Canvas 渲染
│   ├── input.js              # 滑动/点击输入处理
│   ├── ui.js                 # UI 界面控制
│   ├── audio.js              # 音效（预留）
│   ├── constants.js          # 游戏常量与颜色定义
│   └── style.css             # 样式
├── scripts/
│   ├── generate-levels.js    # AI 批量生成 50 关
│   └── analyze-difficulty.js # 难度曲线分析
├── docs/
│   ├── game-design.md        # 游戏设计文档
│   ├── development-log.md    # 开发过程日志
│   ├── difficulty-curve.md   # 难度曲线分析报告
│   └── submission.md         # 本文件
├── levels/
│   └── level-data.json       # 生成的关卡数据
└── assets/                   # 资源目录
```

## 运行方式
### 方式一：直接打开
用浏览器打开 `index.html`

### 方式二：本地服务器
```bash
npm install
npm run dev
```
访问 http://localhost:3000

## AI 辅助工具
### 关卡生成
```bash
npm run generate-levels
```

### 难度分析
```bash
npm run analyze-difficulty
```

## 评审标准对应
| 评审维度 | 本项目的实现 |
|---------|-------------|
| 玩法设计 | 滑动连接消除 + 左右移位策略，简单规则下的深度决策 |
| 关卡体验 | 50关 / 5个难度阶段 / 递进式参数变化 |
| AI驾驭力 | AI辅助代码生成、关卡批量生成、难度曲线分析 |
| 迭代打磨 | 详见 development-log.md 记录迭代过程 |