document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  Renderer.init(canvas);
  InputManager.init(canvas);
  game.init();

  window.addEventListener('resize', () => {
    const container = document.getElementById('game-container');
    const maxW = window.innerWidth;
    const maxH = window.innerHeight;
    const scale = Math.min(maxW / CANVAS_WIDTH, maxH / CANVAS_HEIGHT);
    canvas.style.width = (CANVAS_WIDTH * scale) + 'px';
    canvas.style.height = (CANVAS_HEIGHT * scale) + 'px';
  });
  window.dispatchEvent(new Event('resize'));
});