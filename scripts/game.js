const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

drawBackground();

/** Loads the first cave background and draws it when it is ready. */
function drawBackground() {
    const background = new Image();
    background.onload = function () {
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    };
    background.src = 'assets/images/backgrounds/jungle-cave/layer_01_A.png';
}
