import { Game } from "./game";
import { DiceRoll } from "./model";
import Alpine from "alpinejs";
import { AlpineResult } from "./alpine";

export class App {
  game: Game;
  alpineResult = Alpine.store("result") as AlpineResult;

  constructor() {
    this.game = new Game(document.querySelector<HTMLCanvasElement>("#canvas")!);
  }

  async init() {
    await this.game.init();
    this.enableDebugHotkey();

    window.addEventListener("roll", (event: Event) => {
      const e = event as CustomEvent;
      console.log("Rolling with...", e.detail);

      // this.clearResult();
      this.roll(e.detail);
    });

    // setTimeout(() => {
    //   this.roll({
    //     d20: 1,
    //     d12: 1,
    //     d10: 1,
    //     d8: 1,
    //     d6: 1,
    //     d4: 1,
    //   });
    // }, 300);
  }

  enableDebugHotkey() {
    window.addEventListener("keydown", (ev) => {
      // Shift+Ctrl+Alt+I
      if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
        this.game.toggleDebugLayer();
      }
      // if (ev.key === "g") {
      //   this.roll({
      //     d20: 5,
      //     d12: 5,
      //     d10: 5,
      //     d8: 5,
      //     d6: 5,
      //     d4: 5,
      //   });
      // }
    });
  }

  async roll(dice: DiceRoll) {
    const result = await this.game.roll(dice);

    console.log("Result: ", result);
    this.alpineResult.addResult(result);
  }
}
