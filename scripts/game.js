const canvas = document.getElementById('canvas');
const keyboard = new Keyboard(canvas);
let world = null;

document.getElementById('end-screen').addEventListener('keydown', selectEndAction);

document.getElementById('restart-button').addEventListener('click', restartGame);
document.getElementById('start-button').addEventListener('click', restartGame);
document.getElementById('menu-button').addEventListener('click', showMainMenu);
document.getElementById('loading-menu-button').addEventListener('click', showMainMenu);


/** Replaces the stopped game world and clears held input without reloading the page. */
async function restartGame() {
    if (world) world.stop();
    keyboard.reset();
    menuWalker.stop();
    showLoadingScreen();
    const nextWorld = new World(canvas, keyboard, createLevel1(canvas.width), false);
    world = nextWorld;
    try {
        await Promise.all([nextWorld.waitForImages(), document.fonts.load('104px "Racing Sans One"')]);
        if (world === nextWorld) finishLoading(nextWorld);
    } catch {
        if (world === nextWorld) showLoadingError();
    }
}


/** Hides the result overlay for a fresh game. */
function resetEndScreen() {
    document.getElementById('end-screen').hidden = true;
}


/** @param {string} result - Either victory or defeat.
 * @param {Object|null} score - Final victory points and resource bonuses.
 */
function showEndScreen(result, score) {
    touchControls.hide();
    hidePauseMenu();
    gameAudio.setScene('result', false);
    gameAudio.playResult(result);
    const victory = result === 'victory';
    saveRunScore(world, result);
    document.getElementById('end-title').textContent = victory ? t('won') : t('lost');
    document.getElementById('end-message').textContent = victory
        ? t('winMessage') : t('loseMessage');
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
    document.getElementById('life-bonus-label').textContent = `${t('lives')} (${score.lives} × 50)`;
    document.getElementById('life-bonus').textContent = `+${score.lifeBonus}`;
    document.getElementById('ammo-bonus-label').textContent = `${t('ammo')} (${score.ammo} × 10)`;
    document.getElementById('ammo-bonus').textContent = `+${score.ammoBonus}`;
    document.getElementById('total-score').textContent = score.total;
}


/** Stops the previous run and restores the start screen without reloading. */
function showMainMenu() {
    touchControls.hide();
    gameAudio.setScene('menu');
    stopIntro();
    hidePauseMenu();
    if (world) world.stop();
    world = null;
    keyboard.reset();
    document.getElementById('loading-screen').hidden = true;
    resetEndScreen();
    canvas.inert = true;
    document.getElementById('intro-screen').hidden = true;
    document.getElementById('start-screen').hidden = false;
    menuWalker.start();
    document.getElementById('start-screen').focus({ preventScroll: true });
}


/** Covers the canvas while the next level loads and disables game input. */
function showLoadingScreen() {
    touchControls.hide();
    gameAudio.setScene('none');
    hidePauseMenu();
    resetEndScreen();
    canvas.inert = true;
    document.getElementById('start-screen').hidden = true;
    document.getElementById('loading-screen').hidden = false;
    document.getElementById('loading-spinner').hidden = false;
    document.getElementById('loading-message').textContent = t('loading');
    document.getElementById('loading-menu-button').hidden = true;
    document.getElementById('loading-screen').focus({ preventScroll: true });
}


/** @param {World} nextWorld - Fully loaded world to reveal and start. */
function finishLoading(nextWorld) {
    nextWorld.ready = true;
    nextWorld.draw();
    keyboard.reset();
    nextWorld.start();
    gameAudio.setScene('jungle');
    document.getElementById('loading-screen').hidden = true;
    document.getElementById('pause-button').hidden = false;
    touchControls.show();
    canvas.inert = false;
    canvas.focus({ preventScroll: true });
}


/** Offers a way back to the menu if a required game image cannot load. */
function showLoadingError() {
    world.stop();
    document.getElementById('loading-spinner').hidden = true;
    document.getElementById('loading-message').textContent = t('loadError');
    document.getElementById('loading-menu-button').hidden = false;
    document.getElementById('loading-menu-button').focus({ preventScroll: true });
}


/** Moves between the two result actions with the horizontal arrow keys. */
function selectEndAction(event) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const buttons = [...document.querySelectorAll('#end-screen .retry-button')];
    const current = buttons.indexOf(document.activeElement);
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const next = (current + direction + buttons.length) % buttons.length;
    buttons[next].focus({ preventScroll: true });
}