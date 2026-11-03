/** Resolves projectile hits against opponents and the player. */
class ProjectileCollisions {
    /** @param {BananaProjectile[]} projectiles - Active bananas and impact effects.
     * @param {Enemy[]} enemies - Enemies in the current level.
     */
    static check(projectiles, enemies) {
        for (const projectile of projectiles) {
            if (projectile.impacted || projectile.finished) continue;
            const enemy = enemies.find((candidate) => !candidate.defeated && this.touches(projectile, candidate));
            if (!enemy) continue;
            enemy.defeat();
            projectile.impact();
        }
    }

    /** @param {BananaProjectile[]} projectiles - Active bananas and impact effects.
     * @param {Boss|null} boss - Boss in the active chamber, if present.
     */
    static checkBoss(projectiles, boss) {
        if (!boss || boss.defeated) return;
        for (const projectile of projectiles) {
            if (projectile.impacted || projectile.finished || !this.touches(projectile, boss)) continue;
            boss.takeHit();
            projectile.impact();
            if (boss.defeated) break;
        }
    }

    /** @param {BossProjectile[]} projectiles - Active curse orbs.
     * @param {Character} character - Player with damage protection.
     * @returns {BossProjectile[]} Projectiles that did not touch the player.
     */
    static checkCharacter(projectiles, character) {
        if (character.health === 0) return projectiles;
        return projectiles.filter((projectile) => {
            if (!this.touchesCharacter(projectile, character)) return true;
            character.takeHit();
            return false;
        });
    }

    /** @param {BossProjectile} projectile - Curse orb with transparent outer areas.
     * @param {Character} character - Player body.
     * @returns {boolean} Whether the narrowed visible bodies overlap.
     */
    static touchesCharacter(projectile, character) {
        return projectile.x + projectile.width * 0.72 > character.x + character.width * 0.25
            && projectile.x + projectile.width * 0.12 < character.x + character.width * 0.75
            && projectile.y + projectile.height * 0.8 > character.y + 20
            && projectile.y + projectile.height * 0.2 < character.y + character.height * 244 / 256;
    }

    /** @param {BananaProjectile} projectile - Banana with transparent image margins.
     * @param {Enemy|Boss} enemy - Living opponent body.
     * @returns {boolean} Whether the visible body regions overlap.
     */
    static touches(projectile, enemy) {
        const inset = enemy.hitboxInsetX ?? 0.15;
        const top = enemy.hitboxTop ?? 0.2;
        return projectile.x + projectile.width * 0.7 > enemy.x + enemy.width * inset
            && projectile.x + projectile.width * 0.3 < enemy.x + enemy.width * (1 - inset)
            && projectile.y + projectile.height * 0.7 > enemy.y + enemy.height * top
            && projectile.y + projectile.height * 0.3 < enemy.y + enemy.height * 0.94;
    }
}
