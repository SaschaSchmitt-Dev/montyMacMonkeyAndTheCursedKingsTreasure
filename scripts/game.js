const canvas = document.getElementById('canvas');
const keyboard = new Keyboard(canvas);
const world = new World(canvas, keyboard, createLevel1(canvas.width));
document.getElementById('restart-button').addEventListener('click', () => location.reload());
