import Alpine from "alpinejs";
import { DiceRollResult, DieType } from "./model";
import { Alpine as AlpineType } from "alpinejs";

declare global {
  var Alpine: AlpineType;
}
window.Alpine = Alpine;

// Register global Alpine stores
export interface AlpineResult {
  visible: boolean;
  results: DiceRollResult[];
  toggle: () => any;
  addResult: (result: DiceRollResult) => any;
  getResult: (index: number) => DiceRollResult;
  clearResult: () => any;
  sumString: (index: number) => string;
  diceString: (index: number) => string;
}
Alpine.store("result", {
  visible: false,
  results: [],
  //   {
  //     total: 24,
  //     rolls: [
  //       // { type: DieType.d6, num: 3 },
  //       // { type: DieType.d6, num: 2 },
  //       // { type: DieType.d6, num: 6 },
  //       // { type: DieType.d8, num: 8 },
  //     ],
  //   },
  // ],

  toggle() {
    this.visible = !this.visible;
  },
  addResult(newResult: DiceRollResult) {
    this.results.unshift(newResult);
    this.visible = true;
  },
  getResult(index: number) {
    return this.results[index];
  },
  clearResult() {
    this.results = [];
    this.visible = false;
  },
  sumString(index: number) {
    const result = this.results[index];
    if (!result) {
      return "";
    }
    return result.rolls.map((res) => res.num).join("+");
  },
  diceString(index: number) {
    const result = this.results[index];
    if (!result) {
      return "";
    }
    return Object.entries(
      result.rolls.reduce((collect, res) => {
        if (!(res.type in collect)) {
          collect[res.type] = 0;
        }
        collect[res.type] += 1;
        return collect;
      }, {} as Record<DieType, number>)
    )
      .map(([type, count]) => `${count}${type}`)
      .join("+")
      .toLowerCase();
  },
} as AlpineResult);

// Roll Buttons
Alpine.data("rolls", () => ({
  open: false,
  rolls: {
    d20: 0,
    d12: 0,
    d10: 0,
    d8: 0,
    d6: 0,
    d4: 0,
  },

  toggle() {
    this.open = !this.open;
    if (!this.open) {
      this.reset();
    }
  },
  reset() {
    this.rolls.d20 = 0;
    this.rolls.d12 = 0;
    this.rolls.d10 = 0;
    this.rolls.d8 = 0;
    this.rolls.d6 = 0;
    this.rolls.d4 = 0;
  },
  canRoll() {
    return (
      this.rolls.d20 +
        this.rolls.d12 +
        this.rolls.d10 +
        this.rolls.d8 +
        this.rolls.d6 +
        this.rolls.d4 >
      0
    );
  },
  roll() {
    this.$dispatch("roll", this.rolls);
    this.reset();
  },
}));

Alpine.start();
