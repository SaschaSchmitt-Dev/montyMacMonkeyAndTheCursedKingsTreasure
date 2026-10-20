/** @returns {Level} A fresh jungle level for the submission version. */
function createLevel1() {
    const levelSections = 6;
    const sectionWidth = 960;
    const level = new Level(levelSections * sectionWidth, 120, 320);
    const floorY = level.groundY + 122;
    level.enemies = [
        new Enemy('vine-lizard', 1100, floorY),
        new Enemy('thorn-beetle', 1800, floorY),
        new Enemy('armored-armadillo', 2500, floorY)
    ];
    return level;
}
