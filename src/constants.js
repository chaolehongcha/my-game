const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 700;
const BOARD_Y = 100;
const BOARD_HEIGHT = 500;
const HUD_HEIGHT = 90;

const COLORS = {
  background: '#1a1a2e',
  board: '#16213e',
  text: '#ffffff',
  textDim: '#888888',
  timer: '#e94560',
  success: '#4ecca3',
  warning: '#ffc107',
  arrow: '#ffffff',
  arrowBg: 'rgba(233, 69, 96, 0.25)',
  arrowHover: 'rgba(233, 69, 96, 0.5)',
  path: 'rgba(255, 255, 255, 0.7)',
  gridLine: 'rgba(255, 255, 255, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  reshuffleBtn: '#e94560',
  reshuffleBtnDisabled: '#555555',
  reshuffleNotify: '#ffc107',
  deadlock: '#ff6b6b',
  restartBtn: '#e94560',
  targetScore: '#4ecca3',
};

const BLOCK_COLORS = [
  '#ff6b6b',
  '#4ecdc4',
  '#ffe66d',
  '#a29bfe',
  '#fd79a8',
  '#00b894',
];

const BLOCK_NAMES = ['红', '青', '黄', '紫', '粉', '绿'];

const MIN_SWIPE = 4;

const GAME_STATES = {
  MENU: 'menu',
  LEVEL_SELECT: 'level_select',
  PLAYING: 'playing',
  WIN: 'win',
  LOSE: 'lose',
};

const TOTAL_LEVELS = 45;
const MAX_RESHUFFLES = 2;
const RESHUFFLE_NOTIFY_DURATION = 1.2;
const WILD = -2;

function calcScore(n) {
  return (n - 3) * 10;
}
