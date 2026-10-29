const introVideo = document.getElementById('intro-video');
const introScreen = document.getElementById('intro-screen');
document.getElementById('intro-play-button').addEventListener('click', playIntro);
document.getElementById('intro-menu-button').addEventListener('keydown', skipIntroWithEscape);
introScreen.addEventListener('keydown', skipIntroWithEscape);
introVideo.addEventListener('ended', () => {
    if (!introScreen.hidden) showMainMenu();
});
introVideo.addEventListener('error', showIntroError);


/** Stops media when leaving, so sound never continues behind the menu or game. */
function stopIntro() {
    introVideo.pause();
    introScreen.classList.remove('intro-playing');
}


/** Restores a user-initiated entry with a direct route to the menu. */
function prepareIntro() {
    stopIntro();
    introVideo.currentTime = 0;
    introVideo.hidden = true;
    document.getElementById('intro-status').hidden = true;
    document.getElementById('intro-play-button').hidden = false;
    document.querySelector('#intro-menu-button span').textContent = t('menu');
    document.getElementById('intro-play-button').focus({ preventScroll: true });
}


/** Starts with the saved sound setting after a real click, tap or keyboard action. */
async function playIntro() {
    introVideo.muted = gameSettings.muted;
    introVideo.hidden = false;
    introScreen.classList.add('intro-playing');
    document.getElementById('intro-status').hidden = true;
    document.getElementById('intro-play-button').hidden = true;
    document.querySelector('#intro-menu-button span').textContent = t('skipIntro');
    document.getElementById('intro-menu-button').focus({ preventScroll: true });
    try {
        await introVideo.play();
        if (introScreen.hidden) stopIntro();
    } catch {
        if (!introScreen.hidden) showIntroError();
    }
}


/** Keeps the main menu reachable even if playback fails or is blocked. */
function showIntroError() {
    if (introScreen.hidden) return;
    stopIntro();
    introVideo.hidden = true;
    document.getElementById('intro-play-button').hidden = false;
    const status = document.getElementById('intro-status');
    status.textContent = t('introError');
    status.hidden = false;
}


/** @param {KeyboardEvent} event - Intro input; Escape skips to the main menu. */
function skipIntroWithEscape(event) {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    showMainMenu();
}
