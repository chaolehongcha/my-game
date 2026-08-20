const LevelManager = {
  currentLevel: 1,
  maxUnlocked: TOTAL_LEVELS,

  getLevel(num) {
    const config = GENERATED_LEVELS[num - 1];
    if (!config) return null;

    const bricks = config.bricks || [];
    return { config, bricks };
  },
};