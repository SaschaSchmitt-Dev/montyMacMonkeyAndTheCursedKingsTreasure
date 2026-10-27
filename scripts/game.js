const canvas = document.getElementById('canvas');
const keyboard = new Keyboard(canvas);
let world = new World(canvas, keyboard, createLevel1(canvas.width));

document.getElementById('restart-button').addEventListener('click', restartGame);


/** Replaces the stopped game world and clears held input without reloading the page. */
function restartGame() {
    world.stop();
    keyboard.reset();
    world = new World(canvas, keyboard, createLevel1(canvas.width));
    resetEndScreen();
    canvas.focus({ preventScroll: true });
}


/** Hides the result overlay for a fresh game. */
function resetEndScreen() {
    document.getElementById('end-screen').hidden = true;
}


/** @param {string} result - Either victory or defeat. */
function showEndScreen(result) {
    const victory = result === 'victory';
    document.getElementById('end-title').textContent = victory ? 'Level geschafft!' : 'Game Over';
    document.getElementById('end-message').textContent = victory
        ? 'Der verfluchte König ist besiegt.' : 'Dein Abenteuer ist noch nicht vorbei.';
    document.getElementById('end-panel').classList.toggle('victory', victory);
    document.getElementById('end-screen').hidden = false;
    document.getElementById('restart-button').focus({ preventScroll: true });
}
