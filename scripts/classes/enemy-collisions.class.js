/** Resolves player contact with living enemies. */
class EnemyCollisions {
    /** @param {Character} character - Player after moving.
     * @param {Enemy[]} enemies - Enemies in the level.
     * @param {number} previousFeet - Player foot height before moving.
     */
    static check(character, enemies, previousFeet) {
        if (character.health === 0) return;
        for (const enemy of enemies) {
            if (enemy.defeated || !this.overlapsHorizontally(character, enemy)) continue;
            const top = enemy.y + enemy.height * 0.2;
            const feet = character.y + character.height * 244 / 256;
            const fromAbove = character.velocityY > 0 && previousFeet <= top + 4 && feet >= top;
            if (fromAbove && enemy.canBeStomped) this.stomp(character, enemy, top);
            else if (fromAbove || (character.ridingEnemy === enemy && character.velocityY === 0)) this.standOnBack(character, enemy, top);
            else if (feet > top && character.y + 20 < enemy.y + enemy.height * 0.94) character.takeHit();
        }
    }


    /** @param {Character} character - Player landing on the dangerous back.
     * @param {Enemy} enemy - Living armored enemy.
     * @param {number} top - Back surface in world pixels.
     */
    static standOnBack(character, enemy, top) {
        character.takeHit();
        character.ridingEnemy = enemy;
        character.y = top - character.height * 244 / 256;
        character.groundY = character.y;
        character.velocityY = 0;
    }


    /** @param {Character} character - Player body.
     * @param {Enemy} enemy - Enemy body.
     * @returns {boolean} Whether the narrowed body regions overlap horizontally.
     */
    static overlapsHorizontally(character, enemy) {
        return character.x + character.width * 0.75 > enemy.x + enemy.width * 0.15
            && character.x + character.width * 0.25 < enemy.x + enemy.width * 0.85;
    }


    /** @param {Character} character - Falling player.
     * @param {Enemy} enemy - Stompable enemy.
     * @param {number} top - Enemy contact surface.
     */
    static stomp(character, enemy, top) {
        enemy.defeat();
        character.y = top - character.height * 244 / 256;
        character.velocityY = -400;
        character.takeoffTime = 0;
        character.landingTime = 0;
        character.airTime = 0;
    }
}
