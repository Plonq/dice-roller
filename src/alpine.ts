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
  result: DiceRollResult | null;
  toggle: () => any;
  setResult: (result: DiceRollResult) => any;
  clearResult: () => any;
  sumString: () => string;
}
Alpine.store("result", {
  visible: false,
  result: {
    total: 24,
    results: [
      // { type: DieType.D6, num: 3 },
      // { type: DieType.D6, num: 2 },
      // { type: DieType.D6, num: 6 },
      // { type: DieType.D8, num: 8 },
    ],
  },

  toggle() {
    this.visible = !this.visible;
  },
  setResult(newResult: DiceRollResult) {
    this.result = newResult;
  },
  clearResult() {
    this.result = null;
  },
  sumString() {
    return this.result!.results.map((res) => res.num).join("+");
  },
  diceString() {
    return Object.entries(
      this.result!.results.reduce((collect, res) => {
        if (!(res.type in collect)) {
          collect[res.type] = 0;
        }
        collect[res.type] += 1;
        return collect;
      }, {})
    )
      .map(([type, count]) => `${count}${type}`)
      .join(", ")
      .toLowerCase();
  },
} as AlpineResult);

Alpine.start();
