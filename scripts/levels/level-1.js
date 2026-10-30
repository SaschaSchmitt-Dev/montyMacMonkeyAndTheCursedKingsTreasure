/** @param {number} [viewWidth=960] - Canvas viewport width in world pixels.
 * @returns {Level} A new jungle level.
 */
function createLevel1(viewWidth = 960) {
    const levelSections = 20;
    const sectionWidth = 960;
    const platformHeight = 140;
    const groundOffsetY = 20;
    const blockGroundOffsetY = 6;
    const enemyPatrolRadius = viewWidth * 0.25;
    const level = new Level(levelSections * sectionWidth, 120, 330 + groundOffsetY);
    level.createEnemies(enemyPatrolRadius);
    level.createPlatforms(platformHeight);
    level.createEnemyZone(blockGroundOffsetY);
    level.configureEnemyPatrols();
    level.createAmmo();
    level.createScoreItems();
    level.addTransition();
    return level;
}
