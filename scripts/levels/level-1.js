/** @returns {Level} A fresh jungle level for the submission version. */
function createLevel1() {
    const levelSections = 6;
    const sectionWidth = 960;
    const level = new Level(levelSections * sectionWidth, 120, 320);
    level.createEnemies();
    return level;
}
