const settingsKey = 'montyMacMonkey.settings';
const scoresKey = 'montyMacMonkey.highscores';
let storageAvailable = true;

/** @param {string} key - Local record. @param {*} fallback - Value on missing or invalid data.
 * @returns {*} Decoded record or supplied fallback.
 */
function readLocal(key, fallback) {
    let value;
    try { value = localStorage.getItem(key); }
    catch { storageAvailable = false; return fallback; }
    try { return JSON.parse(value) ?? fallback; }
    catch { return fallback; }
}

/** @param {string} key - Local record. @param {*} value - Serializable value. */
function writeLocal(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { storageAvailable = false; }
}

const savedSettings = readLocal(settingsKey, {});
const gameSettings = {
    musicMuted: typeof savedSettings?.musicMuted === 'boolean' ? savedSettings.musicMuted : savedSettings?.muted === true,
    sfxMuted: typeof savedSettings?.sfxMuted === 'boolean' ? savedSettings.sfxMuted : savedSettings?.muted === true,
    displaySize: savedSettings?.displaySize === 'max' ? 'max' : 'standard',
    language: savedSettings?.language === 'en' ? 'en' : 'de'
};
const savedScores = readLocal(scoresKey, []);
let highScores = Array.isArray(savedScores) ? savedScores.filter(isValidScore).slice(0, 10) : [];

/** @param {Object} entry - Stored run. @returns {boolean} Whether the score is usable. */
function isValidScore(entry) {
    return entry && Number.isSafeInteger(entry.points) && entry.points >= 0
        && ['victory', 'defeat'].includes(entry.result) && Number.isFinite(Date.parse(entry.date));
}

/** @param {World} run - Completed run. @param {string} result - Outcome. */
function saveRunScore(run, result) {
    if (!run || run.scoreSaved) return;
    run.scoreSaved = true;
    const points = result === 'victory' ? run.endScore.total : run.character.score;
    highScores.push({ points, result, date: new Date().toISOString() });
    highScores.sort((first, second) => second.points - first.points);
    highScores = highScores.slice(0, 10);
    writeLocal(scoresKey, highScores);
}

/** Applies and saves shared sound, language, and display-size preferences. */
function applyOptions() {
    gameAudio.setPreferences();
    document.querySelectorAll('audio, video:not(#intro-video)').forEach((media) => media.muted = gameSettings.sfxMuted);
    writeLocal(settingsKey, gameSettings);
    updateMenuLanguage();
    window.gameDisplay?.updateLayout();
}
