
export const initInputController = () => {
  window.inputForward = false;
  window.inputBackward = false;
  window.inputLeft = false;
  window.inputRight = false;

  window.addEventListener('keydown', e => {
    switch(e.key) {
      case 'w':
        window.inputForward = true;
        break;
      case 'a':
        window.inputLeft = true;
        break;
      case 's':
        window.inputBackward = true;
        break;
      case 'd':
        window.inputRight = true;
        break;
    }
  });
  window.addEventListener('keyup', e => {
    switch (e.key) {
      case 'w':
        window.inputForward = false;
        break;
      case 'a':
        window.inputLeft = false;
        break;
      case 's':
        window.inputBackward = false;
        break;
      case 'd':
        window.inputRight = false;
        break;
    }
  });
}
