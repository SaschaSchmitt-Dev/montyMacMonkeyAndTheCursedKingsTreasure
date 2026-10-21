/** @returns {Level} A new jungle level. */
function createLevel1() {
    const levelSections = 6;
    const sectionWidth = 960;
    const platformHeight = 140;
    const level = new Level(levelSections * sectionWidth, 120, 320);
    level.createEnemies();
    level.createPlatforms(platformHeight);
    return level;
}
