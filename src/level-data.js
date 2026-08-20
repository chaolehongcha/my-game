const LEVEL_DATA = [];

function generateAllLevelData() {
  for (let i = 1; i <= TOTAL_LEVELS; i++) {
    LEVEL_DATA.push(generateLevel(i));
  }
}

generateAllLevelData();