/** A banana bunch that adds three throws to the player's inventory. */
class BananaAmmo extends DrawableObject {
    width = 48;
    height = 48;
    amount = 3;
    supportY;

    /** @param {number} x - Left edge in world pixels.
     * @param {number} surfaceY - Supporting floor or platform surface.
     */
    constructor(x, surfaceY) {
        super();
        this.x = x;
        this.y = surfaceY - this.height;
        this.supportY = surfaceY;
        this.loadImage('assets/images/items/banana-ammo/banana-ammo-bunch.png');
    }

    /** @param {Character} character - Player with a narrower body hitbox.
     * @returns {boolean} Whether the player touches this bunch.
     */
    touches(character) {
        return character.y + character.height * 244 / 256 <= this.supportY + 4
            && character.x + character.width * 0.75 > this.x + 6
            && character.x + character.width * 0.25 < this.x + this.width - 6
            && character.y + character.height * 244 / 256 > this.y + 6
            && character.y + 20 < this.y + this.height - 4;
    }
}
