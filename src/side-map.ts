import { DieType } from "./model";

const d20: { [key: number]: number } = {
  0: 12,
  1: 10,
  2: 2,
  3: 20,
  4: 8,
  5: 17,
  6: 15,
  7: 18,
  8: 14,
  9: 16,
  10: 7,
  11: 5,
  12: 4,
  13: 6,
  14: 3,
  15: 1,
  16: 13,
  17: 11,
  18: 9,
  19: 19,
};

const ex: { [key in DieType]?: { [key: number]: number } } = {
  [DieType.D20]: d20,
};

export default ex;
