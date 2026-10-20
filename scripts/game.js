const canvas = document.getElementById('canvas');
const keyboard = new Keyboard(canvas);
const world = new World(canvas, keyboard, createLevel1());
