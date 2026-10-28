const pauseDialog = document.getElementById('pause-dialog');
document.getElementById('pause-button').addEventListener('click', openPauseMenu);
document.getElementById('resume-button').addEventListener('click', resumeGame);
document.getElementById('pause-restart-button').addEventListener('click', restartGame);
document.getElementById('pause-menu-button').addEventListener('click', showMainMenu);
document.querySelector('.game-frame').addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || event.repeat || pauseDialog.open) return;
    if (document.getElementById('pause-button').hidden) return;
    event.preventDefault();
    openPauseMenu();
});
pauseDialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    resumeGame();
});
pauseDialog.addEventListener('keydown', selectPauseAction);


/** Freezes the simulation and opens the modal keyboard/touch controls. */
function openPauseMenu() {
    if (!world || !world.active || world.result || world.paused) return;
    world.paused = true;
    cancelAnimationFrame(world.animationFrame);
    keyboard.reset();
    canvas.inert = true;
    pauseDialog.showModal();
    document.getElementById('resume-button').focus({ preventScroll: true });
}


/** Continues the same world without counting time spent in the menu. */
function resumeGame() {
    if (!world || !world.paused) return;
    pauseDialog.close();
    world.paused = false;
    keyboard.reset();
    canvas.inert = false;
    world.start();
    canvas.focus({ preventScroll: true });
}


/** Clears pause controls when leaving a run or showing its result. */
function hidePauseMenu() {
    pauseDialog.close();
    document.getElementById('pause-button').hidden = true;
}


/** Cycles through actions with arrows; native Tab, Enter and Space remain available. */
function selectPauseAction(event) {
    const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (!keys.includes(event.key) && event.key !== 'Tab') return;
    event.preventDefault();
    const buttons = [...pauseDialog.querySelectorAll('button')];
    const backwards = ['ArrowUp', 'ArrowLeft'].includes(event.key) || (event.key === 'Tab' && event.shiftKey);
    const direction = backwards ? -1 : 1;
    const current = buttons.indexOf(document.activeElement);
    buttons[(current + direction + buttons.length) % buttons.length].focus();
}
