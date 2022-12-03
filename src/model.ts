export enum DieType {
  D4 = "D4",
  D6 = "D6",
  D8 = "D8",
  D10 = "D10",
  D12 = "D12",
  D20 = "D20",
  // D100 = "D100",
}

export interface DiceRoll {
  d4?: number;
  d6?: number;
  d8?: number;
  d10?: number;
  d12?: number;
  d20?: number;
  // d100?: number;
}

export interface DiceRollResult {
  total: number;
  results: { [key in DieType]?: number }[];
}
