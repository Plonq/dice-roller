import { Game } from "./game";
import { DiceRoll, DieType } from "./model";

export class App {
  game: Game;

  constructor() {
    this.game = new Game(document.querySelector<HTMLCanvasElement>("#canvas")!);
  }

  async init() {
    await this.game.init();
    this.enableDebugHotkey();

    setTimeout(() => {
      this.roll({
        [DieType.D20]: 1,
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
  }
}
