import Alpine from "alpinejs";
import { DiceRollResult, DieType, RollType } from "./model";
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
  removeResult: (index: number) => any;
  clearResult: () => any;
  line1Str: (index: number) => string;
  line2Str: (index: number) => string;
  totalStr: (index: number) => string;
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
  removeResult(index: number) {
    this.results.splice(index, 1);
    if (this.results.length <= 0) {
      this.visible = false;
    }
  },
  clearResult() {
    this.results = [];
    this.visible = false;
  },
  line1Str(index: number) {
    const result = this.results[index];
    if (!result) {
      return "";
    }

    const advDisStr = (rolls: number[], adv = true) => {
      if (rolls[0] === rolls[1]) {
        return `${rolls[0]} = ${rolls[1]}`;
      } else {
        if (adv) {
          return `${Math.max(...rolls)} > ${Math.min(...rolls)}`;
        } else {
          return `${Math.min(...rolls)} < ${Math.max(...rolls)}`;
        }
      }
    };

    switch (result.type) {
      case "adv":
        return advDisStr(
          result.rolls.map((r) => r.num),
          true
        );
      case "dis":
        return advDisStr(
          result.rolls.map((r) => r.num),
          false
        );
      case "normal":
      default:
        return result.rolls.map((res) => res.num).join("+");
    }
  },
  line2Str(index: number) {
    const result = this.results[index];
    if (!result) {
      return "";
    }

    switch (result.type) {
      case "adv":
        return "Advantage";
      case "dis":
        return "Disadvantage";
      case "normal":
      default:
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
    }
  },
  totalStr(index: number) {
    const result = this.results[index];
    if (!result) {
      return "";
    }

    switch (result.type) {
      case "adv":
        return Math.max(...result.rolls.map((r) => r.num));
      case "dis":
        return Math.min(...result.rolls.map((r) => r.num));
      case "normal":
      default:
        return result.total.toString();
    }
  },
} as AlpineResult);

// Roll Buttons
Alpine.data("rolls", () => ({
  open: false,
  type: "normal" as RollType,
  rolls: {
    d20: 0,
    d12: 0,
    d10: 0,
    d8: 0,
    d6: 0,
    d4: 0,
  },

  show() {
    this.open = true;
  },
  hide() {
    this.open = false;
    this.reset();
    this.type = "normal";
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
  rollAdv() {
    this.type = "adv";
    this.reset();
    this.rolls.d20 = 2;
    this.roll();
  },
  rollDis() {
    this.type = "dis";
    this.reset();
    this.rolls.d20 = 2;
    this.roll();
  },
  roll() {
    this.$dispatch("roll", { type: this.type, rolls: this.rolls });
    this.hide();
  },
}));

Alpine.start();
