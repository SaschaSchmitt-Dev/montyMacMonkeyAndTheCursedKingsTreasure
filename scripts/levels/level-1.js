/** @param {number} [viewWidth=960] - Canvas viewport width in world pixels.
 * @returns {Level} A new jungle level.
 */
function createLevel1(viewWidth = 960) {
    const levelSections = 20;
    const sectionWidth = 960;
    const platformHeight = 140;
    const gameplayRaiseY = 40;
    const groundOffsetY = 20 - gameplayRaiseY;
    const blockGroundOffsetY = 6;
    const enemyPatrolRadius = viewWidth * 0.25;
    const level = new Level(levelSections * sectionWidth, 120, 330 + groundOffsetY);
    populateLevel1(level, platformHeight, blockGroundOffsetY, enemyPatrolRadius);
    return level;
}

/** @param {Level} level - Empty world. @param {number} platformHeight - Base platform offset.
 * @param {number} blockGroundOffsetY - Floor-block offset. @param {number} enemyPatrolRadius - Preferred movement radius.
 */
function populateLevel1(level, platformHeight, blockGroundOffsetY, enemyPatrolRadius) {
    level.createEnemies(enemyPatrolRadius);
    level.createPlatforms(platformHeight);
    level.createEnemyZone(blockGroundOffsetY);
    level.configureEnemyPatrols();
    level.createAmmo();
    level.createScoreItems();
    level.addTransition();
}
