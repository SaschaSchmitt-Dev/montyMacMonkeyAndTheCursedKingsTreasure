const menuTexts = {
    de: {
        fullscreen: 'Vollbild', fullscreenUnavailable: 'Dieser Browser unterstützt kein Spiele-Vollbild. Die Ansicht nutzt die verfügbare Fläche.', rotateTitle: 'Bitte Gerät drehen', rotateMessage: 'Montys Abenteuer spielst du im Querformat.',
        start: 'Spiel starten', options: 'Optionen', highscores: 'Highscores', guide: 'Anleitung',
        quit: 'Beenden', close: 'Schließen', touchControls: 'Touchsteuerung', moveLeft: 'Nach links', moveRight: 'Nach rechts', jumpAction: 'Springen', throwAction: 'Banane werfen', sound: 'Ton', music: 'Musik', sfx: 'Geräusche (SFX)', on: 'An', off: 'Aus', language: 'Sprache', optionKeys: '↑ ↓ Auswahl · ← → ändern · Enter/Space aktivieren · Esc zurück',
        hint: '← → Laufen · ↑ Springen · Space: Plattform aktivieren · oder anklicken',
        empty: 'Noch keine abgeschlossenen Abenteuer.', local: 'Die besten 10 Ergebnisse bleiben nur in diesem Browser auf diesem Gerät. Beim Löschen der Browserdaten gehen sie verloren.',
        session: 'Der Browser erlaubt keine Speicherung. Ergebnisse und Einstellungen gelten nur für diese Sitzung.',
        victory: 'Sieg', defeat: 'Niederlage', menu: 'Zum Hauptmenü', restart: 'Noch einmal spielen',
        won: 'Level geschafft!', lost: 'Game Over', winMessage: 'Der verfluchte König ist besiegt.',
        loseMessage: 'Dein Abenteuer ist noch nicht vorbei.', collected: 'Sammelpunkte', lives: 'Leben',
        playIntro: 'Intro starten', skipIntro: 'Überspringen', introError: 'Das Intro konnte nicht abgespielt werden. Du kannst direkt zum Hauptmenü wechseln.', paused: 'Pause', resume: 'Fortsetzen', newRun: 'Neustart', openPause: 'Pause öffnen', hudScore: 'Punkte', hudAmmo: 'Munition', ammo: 'Munition', total: 'Gesamtpunkte', loading: 'Abenteuer wird geladen …',
        loadError: 'Laden fehlgeschlagen. Bitte erneut starten.'
    },
    en: {
        fullscreen: 'Fullscreen', fullscreenUnavailable: 'This browser does not support game fullscreen. The game uses the available space.', rotateTitle: 'Please rotate your device', rotateMessage: 'Play Monty’s adventure in landscape orientation.',
        start: 'Start game', options: 'Options', highscores: 'High scores', guide: 'How to play',
        quit: 'Exit', close: 'Close', touchControls: 'Touch controls', moveLeft: 'Move left', moveRight: 'Move right', jumpAction: 'Jump', throwAction: 'Throw banana', sound: 'Sound', music: 'Music', sfx: 'Sound effects (SFX)', on: 'On', off: 'Off', language: 'Language', optionKeys: '↑ ↓ Select · ← → Change · Enter/Space activate · Esc back',
        hint: '← → Move · ↑ Jump · Space: activate platform · or click',
        empty: 'No completed adventures yet.', local: 'The top 10 results stay only in this browser on this device. Clearing browser data removes them.',
        session: 'This browser does not allow storage. Results and settings last only for this session.',
        victory: 'Victory', defeat: 'Defeat', menu: 'Main menu', restart: 'Play again',
        won: 'Level complete!', lost: 'Game Over', winMessage: 'The cursed king is defeated.',
        loseMessage: 'Your adventure is not over yet.', collected: 'Collected points', lives: 'Lives',
        playIntro: 'Play intro', skipIntro: 'Skip intro', introError: 'The intro could not be played. You can go straight to the main menu.', paused: 'Paused', resume: 'Resume', newRun: 'Restart', openPause: 'Open pause menu', hudScore: 'Score', hudAmmo: 'Ammo', ammo: 'Ammunition', total: 'Total points', loading: 'Loading your adventure …',
        loadError: 'Loading failed. Please try starting again.'
    }
};
let menuReturnButton = null;
const menuDialog = document.getElementById('menu-dialog');

/** @param {string} key - Interface text. @returns {string} Current translation. */
function t(key) { return menuTexts[gameSettings.language][key] || key; }

/** Updates static interface labels and the active dialog after a language change. */
function updateMenuLanguage() {
    document.documentElement.lang = gameSettings.language;
    document.querySelectorAll('[data-i18n-aria]').forEach((element) =>
        element.setAttribute('aria-label', t(element.dataset.i18nAria)));
    document.getElementById('pause-button').setAttribute('aria-label', t('openPause'));
    document.querySelectorAll('[data-i18n]').forEach((element) => element.textContent = t(element.dataset.i18n));
    document.querySelectorAll('[data-menu]').forEach((button) => button.setAttribute('aria-label', t(button.dataset.menu)));
    document.querySelectorAll('[data-language]').forEach((section) => section.hidden = section.dataset.language !== gameSettings.language);
    for (const key of ['music', 'sfx']) {
        const button = document.getElementById(key + '-toggle');
        button.textContent = t(gameSettings[key + 'Muted'] ? 'off' : 'on');
        button.setAttribute('aria-pressed', String(!gameSettings[key + 'Muted']));
        button.setAttribute('aria-label', t(key) + ': ' + button.textContent);
    }
    document.querySelectorAll('[data-language-option]').forEach((button) =>
        button.setAttribute('aria-pressed', String(button.dataset.languageOption === gameSettings.language)));
    document.getElementById('storage-note').textContent = t(storageAvailable ? 'local' : 'session');
    document.getElementById('options-storage-note').textContent = storageAvailable ? '' : t('session');
    if (menuDialog.open) document.getElementById('menu-dialog-title').textContent = t(menuDialog.dataset.panel);
    renderHighScores();
    window.gameDisplay?.updateLabels();
}

/** @param {string} panel - Dialog content. @param {HTMLElement} button - Invoking platform. */
function openMenuPanel(panel, button) {
    menuReturnButton = button;
    gameAudio.clearCharacter();
    menuWalker.keyboard.reset();
    menuDialog.dataset.panel = panel;
    document.querySelectorAll('[data-panel]').forEach((section) => section.hidden = section.dataset.panel !== panel);
    document.getElementById('menu-dialog-title').textContent = t(panel);
    renderHighScores();
    menuDialog.showModal();
}

/** Rebuilds the ranked list using safe text nodes from validated local records. */
function renderHighScores() {
    const list = document.getElementById('highscore-list');
    list.replaceChildren();
    document.getElementById('scores-empty').hidden = highScores.length > 0;
    for (const entry of highScores) {
        const row = document.createElement('li');
        const date = new Date(entry.date).toLocaleDateString(gameSettings.language);
        row.textContent = `${entry.points} · ${t(entry.result)} · ${date}`;
        list.append(row);
    }
}

/** Returns to the intro entry without automatically starting playback. */
function showIntroEntry() {
    showMainMenu();
    menuWalker.stop();
    document.getElementById('start-screen').hidden = true;
    document.getElementById('intro-screen').hidden = false;
    prepareIntro();
}

/** Connects each island to its click and keyboard action. */
function connectMenuButtons() {
    for (const panel of ['options', 'highscores', 'guide']) {
        const button = document.getElementById(panel + '-button');
        button.addEventListener('click', () => openMenuPanel(panel, button));
    }
    document.getElementById('quit-button').addEventListener('click', showIntroEntry);
    document.getElementById('intro-menu-button').addEventListener('click', showMainMenu);
    document.getElementById('close-menu-dialog').addEventListener('click', () => menuDialog.close());
    menuDialog.addEventListener('click', (event) => { if (event.target === menuDialog) menuDialog.close(); });
    menuDialog.addEventListener('keydown', handleOptionsKeys);
    menuDialog.addEventListener('close', () => { menuWalker.keyboard.reset(); menuReturnButton?.focus(); });
}

/** Connects and restores the two deliberately small menu options. */
function connectOptions() {
    for (const key of ['music', 'sfx']) {
        document.getElementById(key + '-toggle').addEventListener('click', () => {
            gameSettings[key + 'Muted'] = !gameSettings[key + 'Muted'];
            applyOptions();
        });
    }
    document.querySelectorAll('[data-language-option]').forEach((button) => {
        button.addEventListener('click', () => {
            gameSettings.language = button.dataset.languageOption;
            applyOptions();
        });
    });
    updateMenuLanguage();
    document.querySelectorAll('audio, video').forEach((media) => media.muted = gameSettings.sfxMuted);
}

connectMenuButtons();
connectOptions();
prepareIntro();
Promise.all([...menuWalker.screen.querySelectorAll('img, svg image')].map((element) => {
    if (element instanceof HTMLImageElement) return element.decode();
    const image = new Image();
    image.src = element.getAttribute('href');
    return image.decode();
}))
    .then(() => { if (!menuWalker.screen.hidden) menuWalker.start(); })
    .catch(() => { });
document.getElementById('intro-play-button').focus({ preventScroll: true });


/** @param {KeyboardEvent} event - Arrow navigation inside the options panel. */
function handleOptionsKeys(event) {
    if (menuDialog.dataset.panel !== 'options' || !event.key.startsWith('Arrow')) return;
    event.preventDefault();
    const fields = ['music-toggle', 'sfx-toggle', 'fullscreen-toggle', 'language-' + gameSettings.language, 'close-menu-dialog']
        .filter((id) => !document.getElementById(id).disabled);
    const active = document.activeElement.id;
    const index = fields.indexOf(active.startsWith('language-') ? 'language-' + gameSettings.language : active);
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        const step = event.key === 'ArrowDown' ? 1 : -1;
        document.getElementById(fields[(index + step + fields.length) % fields.length]).focus();
    } else changeOptionWithArrow(event.key, document.activeElement.id);
}


/** @param {string} key - Left or right arrow. @param {string} field - Active option. */
function changeOptionWithArrow(key, field) {
    if (field === 'music-toggle' || field === 'sfx-toggle') gameSettings[field.split('-')[0] + 'Muted'] = key === 'ArrowLeft';
    else if (field === 'fullscreen-toggle') {
        window.gameDisplay.toggleFullscreen(key === 'ArrowRight');
        return;
    }
    else if (field.startsWith('language-')) {
        gameSettings.language = key === 'ArrowLeft' ? 'de' : 'en';
        document.getElementById('language-' + gameSettings.language).focus();
    }
    else return;
    applyOptions();
}
