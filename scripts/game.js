const canvas = document.getElementById('canvas');
const keyboard = new Keyboard(canvas);
let world = new World(canvas, keyboard, createLevel1(canvas.width));

document.getElementById('restart-button').addEventListener('click', restartGame);


/** Replaces the stopped game world and clears held input without reloading the page. */
function restartGame() {
    world.stop();
    keyboard.reset();
    world = new World(canvas, keyboard, createLevel1(canvas.width));
    resetGameOver();
    canvas.focus({ preventScroll: true });
}


/** Hides the game-over message and restart button for a fresh game. */
function resetGameOver() {
    document.getElementById('game-status').hidden = true;
    document.getElementById('restart-button').hidden = true;
}
