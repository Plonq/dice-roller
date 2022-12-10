import { DieType } from "./model";

const d4: number[] = [4, 3, 2, 1];
const d6: number[] = [3, 2, 4, 5, 1, 6].flatMap((num) => [num, num]);
const d8: number[] = [2, 7, 6, 3, 5, 4, 1, 8];
const d10: number[] = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const d12: number[] = [2, 9, 12, 7, 3, 8, 10, 6, 5, 1, 4, 11].flatMap((num) => [
  num,
  num,
  num,
]);

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
  [DieType.D4]: d4,
  [DieType.D6]: d6,
  [DieType.D8]: d8,
  [DieType.D10]: d10,
  [DieType.D12]: d12,
  [DieType.D20]: d20,
};

export default ex;
