/**
 * @typedef {{
 *            down:boolean,
 *            downCount:number,
 *            upCount:number
 *          }}
 */
export interface Input {
  down: boolean;
  downCount: number;
  upCount: number;
}

/**
 * Creates a new input.
 */
export const newInput = () => ({ down: false, downCount: 0, upCount: 2 });

/**
 * Updates the up/down counts for an input.
 * @param {!Input} input
 */
export const updateInput = (input: Input) => {
  if (input.down) {
    input.downCount++;
    input.upCount = 0;
  } else {
    input.downCount = 0;
    input.upCount++;
  }
};
