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


/** @param {string} result - Either victory or defeat.
 * @param {Object|null} score - Final victory points and resource bonuses.
 */
function showEndScreen(result, score) {
    const victory = result === 'victory';
    document.getElementById('end-title').textContent = victory ? 'Level geschafft!' : 'Game Over';
    document.getElementById('end-message').textContent = victory
        ? 'Der verfluchte König ist besiegt.' : 'Dein Abenteuer ist noch nicht vorbei.';
    document.getElementById('end-panel').classList.toggle('victory', victory);
    showVictoryScore(score);
    document.getElementById('end-screen').hidden = false;
    document.getElementById('restart-button').focus({ preventScroll: true });
}


/** @param {Object|null} score - Captured victory result, absent after a defeat. */
function showVictoryScore(score) {
    document.getElementById('victory-score').hidden = !score;
    if (!score) return;
    document.getElementById('collected-score').textContent = score.collected;
    document.getElementById('life-bonus-label').textContent = `Leben (${score.lives} × 50)`;
    document.getElementById('life-bonus').textContent = `+${score.lifeBonus}`;
    document.getElementById('ammo-bonus-label').textContent = `Munition (${score.ammo} × 10)`;
    document.getElementById('ammo-bonus').textContent = `+${score.ammoBonus}`;
    document.getElementById('total-score').textContent = score.total;
}
