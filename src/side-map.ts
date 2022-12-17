import { DieType } from "./model";

const d4: number[] = [4, 3, 2, 1];
const d6: number[] = [3, 2, 4, 5, 1, 6].flatMap((num) => [num, num]);
const d8: number[] = [2, 7, 6, 3, 5, 4, 1, 8];
const d10: number[] = [9, 1, 5, 7, 3, 2, 6, 4, 10, 8].flatMap((num) => [
  num,
  num,
]);
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

const ex: Record<DieType, Record<number, number>> = {
  d4: d4,
  d6: d6,
  d8: d8,
  d10: d10,
  d12: d12,
  d20: d20,
};

export default ex;
