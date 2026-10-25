const canvas = document.getElementById('canvas');
const keyboard = new Keyboard(canvas);
let world = new World(canvas, keyboard, createLevel1(canvas.width));

document.getElementById('restart-button').addEventListener('click', restartGame);


/** Replaces the stopped game world and clears held input without reloading the page. */
function restartGame() {
    world.stop();
    keyboard.reset();
    world = new World(canvas, keyboard, createLevel1(canvas.width));
    resetStatus();
    canvas.focus({ preventScroll: true });
}


/** Restores the counters and hides the restart action for a fresh game. */
function resetStatus() {
    document.getElementById('ammo-counter').textContent = 'Bananen: ' + world.character.ammo;
    document.getElementById('score-counter').textContent = 'Punkte: ' + world.character.score;
    document.getElementById('health-counter').textContent = 'Leben: ' + world.character.health;
    document.getElementById('health-counter').hidden = true;
    document.getElementById('restart-button').hidden = true;
}
