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

const d20 = [
  12, 10, 2, 20, 8, 17, 15, 18, 14, 16, 7, 5, 4, 6, 3, 1, 13, 11, 9, 19,
];

const ex: Record<DieType, Record<number, number>> = {
  d4: d4,
  d6: d6,
  d8: d8,
  d10: d10,
  d12: d12,
  d20: d20,
};

export default ex;
