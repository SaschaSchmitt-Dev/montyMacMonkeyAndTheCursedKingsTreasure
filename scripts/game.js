const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

drawBackground();

/** Loads the first cave background and draws it when it is ready. */
function drawBackground() {
    const background = new Image();
    background.onload = function () {
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        drawGround();
    };
    background.src = 'assets/images/backgrounds/jungle-cave/layer_01_A.png';
}


/** Draws the ground before loading the character in front of it. */
function drawGround() {
    const ground = new Image();
    ground.onload = function () {
        ctx.drawImage(ground, 0, 330, 960, 320);
        drawCharacter();
    };
    ground.src = 'assets/images/objects/platforms/platform_01_ground_straight.png';
}


/** Draws the idle character with its feet on the visible ground surface. */
function drawCharacter() {
    const character = new Image();
    character.onload = function () {
        ctx.drawImage(character, 120, 314, 128, 128);
    };
    character.src = 'assets/images/character/idle/idle_00.png';
}
