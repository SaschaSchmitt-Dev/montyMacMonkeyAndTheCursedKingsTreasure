/** A drawable object with movement and simple ground-based gravity. */
class MovableObject extends DrawableObject {
    speed = 350;
    facingLeft = false;
    groundY = 320;
    velocityY = 0;
    gravity = 1800;
    jumpSpeed = 680;

    /**
     * @param {number} deltaTime - Frame duration in seconds.
     * @param {number} direction - -1 for left, 1 for right, or 0.
     * @param {number} screenWidth - Width of the playable area.
     */
    move(deltaTime, direction, screenWidth) {
        if (direction !== 0) this.facingLeft = direction < 0;
        this.x += direction * this.speed * deltaTime;
        this.x = Math.max(0, Math.min(this.x, screenWidth - this.width));
    }


    /** @returns {boolean} Whether the object rests on the ground. */
    isGrounded() {
        return this.y >= this.groundY && this.velocityY >= 0;
    }


    /** Starts one upward impulse; the character checks when jumping is allowed. */
    jump() {
        this.velocityY = -this.jumpSpeed;
    }


    /** @param {number} deltaTime - Frame duration in seconds. */
    applyGravity(deltaTime) {
        if (this.isGrounded()) return;
        this.y += this.velocityY * deltaTime + this.gravity * deltaTime * deltaTime / 2;
        this.velocityY += this.gravity * deltaTime;
        if (this.y >= this.groundY) {
            this.y = this.groundY;
            this.velocityY = 0;
        }
    }
}
