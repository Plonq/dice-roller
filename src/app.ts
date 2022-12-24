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
      const diceRoll = (event as CustomEvent).detail as DiceRoll;
      console.log("Rolling with...", diceRoll);

      this.roll(diceRoll);
    });

    window.addEventListener("addDie", (event: Event) => {
      // @ts-ignore
      console.log("Adding die", event.detail);
      // this.game.setRollType((event as CustomEvent).detail.type);
      this.game.addDieToRoll((event as CustomEvent).detail.die);
    });
  }

  enableDebugHotkey() {
    window.addEventListener("keydown", (ev) => {
      // Shift+Ctrl+Alt+I
      if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
        this.game.toggleDebugLayer();
      }
    });
  }

  async roll(dice: DiceRoll) {
    const result = await this.game.autoRoll(dice);

    console.log("Result: ", result);
    this.alpineResult.addResult(result);
  }
}
