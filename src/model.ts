// export enum DieType {
//   D4 = "D4",
//   D6 = "D6",
//   D8 = "D8",
//   D10 = "D10",
//   D12 = "D12",
//   D20 = "D20",
//   // D100 = "D100",
// }

// export type DieType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";
// export const DieTypes = ["d4", "d6", "d8", "d10", "d12", "d20"];
export const DieType = {
  d4: "d4",
  d6: "d6",
  d8: "d8",
  d10: "d10",
  d12: "d12",
  d20: "d20",
} as const;

export type DieType = keyof typeof DieType;

// export type DiceRoll = { [key in DieType]?: number };
export type DiceRoll = Record<DieType, number>;

export interface DiceRollResult {
  total: number;
  rolls: { type: DieType; num: number }[];
}
