import { newInput, updateInput } from './input';

export const mouse = {
  /**
   * Mouse x coordinate.
   * @type {number}
   */
  x: 0,

  /**
   * Mouse y coordinate.
   * @type {number}
   */
  y: 0,

  /**
   * Mouse buttons
   * @const {!Array.<!Input>}
   */
  buttons: [newInput(), newInput(), newInput()],
};

/**
 * Initializes the keyboard.
 * @param {!HTMLElement} el The HTML element to listen on.
 */
export function initMouse(el: HTMLElement): void {
  el.addEventListener('mousedown', (e) => {
    mouse.buttons[e.button].down = true;
  });
  el.addEventListener('mouseup', (e) => {
    mouse.buttons[e.button].down = false;
  });
  el.addEventListener('mousemove', (e) => {
    mouse.x = e.pageX;
    mouse.y = e.pageY;
  });
}

/**
 * Updates all mouse button states.
 */
export function updateMouse() {
  mouse.buttons.forEach(updateInput);
}
