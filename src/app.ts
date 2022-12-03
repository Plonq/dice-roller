import { Game } from "./game";
import { DiceRoll } from "src/die";

export class App {
  game: Game;

  constructor() {
    this.game = new Game(document.querySelector<HTMLCanvasElement>("#canvas")!);
  }

  async init() {
    await this.game.init();
    this.enableDebugHotkey();

    this.roll({
      d20: 2,
    });
  }

  enableDebugHotkey() {
    window.addEventListener("keydown", (ev) => {
      // Shift+Ctrl+Alt+I
      if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
        this.game.toggleDebugLayer();
      }
      if (ev.key === "g") {
        this.roll({ d20: 2 });
      }
    });
  }

  async roll(dice: DiceRoll) {
    const result = await this.game.roll(dice);

    console.log("Result: ", result);
  }
}
