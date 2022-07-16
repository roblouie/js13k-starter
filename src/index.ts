import { updateKeys } from './keys';
draw()
function draw(test?: { text: 'oops' }) {
  updateKeys();
  console.log(test?.text);
}
