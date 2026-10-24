/** Resolves one enemy hit for each flying banana. */
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


    /** @param {BananaProjectile} projectile - Banana with transparent image margins.
     * @param {Enemy|Boss} enemy - Living opponent body.
     * @returns {boolean} Whether the visible body regions overlap.
     */
    static touches(projectile, enemy) {
        return projectile.x + projectile.width * 0.7 > enemy.x + enemy.width * 0.15
            && projectile.x + projectile.width * 0.3 < enemy.x + enemy.width * 0.85
            && projectile.y + projectile.height * 0.7 > enemy.y + enemy.height * 0.2
            && projectile.y + projectile.height * 0.3 < enemy.y + enemy.height * 0.94;
    }
}
