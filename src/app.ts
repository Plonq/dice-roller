import { Game } from "./game";
import { DiceRoll, DiceRollResult, DieType } from "./model";
import Alpine from "alpinejs";
import { AlpineResult } from "./main";

export class App {
  game: Game;
  alpineResult = Alpine.store("result") as AlpineResult;

  constructor() {
    this.game = new Game(document.querySelector<HTMLCanvasElement>("#canvas")!);
  }

  async init() {
    await this.game.init();
    this.enableDebugHotkey();

    setTimeout(() => {
      this.roll({
        [DieType.D20]: 1,
        [DieType.D12]: 1,
        [DieType.D10]: 1,
        [DieType.D8]: 1,
        [DieType.D6]: 1,
        [DieType.D4]: 1,
      });
    }, 300);
  }

  enableDebugHotkey() {
    window.addEventListener("keydown", (ev) => {
      // Shift+Ctrl+Alt+I
      if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
        this.game.toggleDebugLayer();
      }
      if (ev.key === "g") {
        this.roll({
          [DieType.D20]: 5,
          [DieType.D12]: 5,
          [DieType.D10]: 5,
          [DieType.D8]: 5,
          [DieType.D6]: 5,
          [DieType.D4]: 5,
        });
      }
    });
  }

  async roll(dice: DiceRoll) {
    const result = await this.game.roll(dice);

    console.log("Result: ", result);
    this.displayResult(result);
  }

  private displayResult(result: DiceRollResult) {
    this.alpineResult.setResult(result);
    this.alpineResult.toggle();
  }

  clearResult() {
    this.alpineResult.clearResult();
  }
}
