import {
  AbstractMesh,
  Engine,
  Mesh,
  PhysicsImpostor,
  Scene,
  ShadowGenerator,
  Vector3,
} from "@babylonjs/core";
import faceMaps from "./side-map";
import { DiceRollResult, DieType } from "./model";

export class Die {
  protected rootMesh: AbstractMesh;
  protected colliderMesh: AbstractMesh;
  public atRestFor: number = 0;
  public type: DieType;

  constructor(
    name: string,
    type: DieType,
    model: AbstractMesh,
    collider: AbstractMesh,
    shadowGenerator: ShadowGenerator,
    scene: Scene
  ) {
    this.type = type;
    this.colliderMesh = collider;
    const newRoot: Mesh = new Mesh(`${name}_physicsRoot`, scene);
    newRoot.addChild(model);
    newRoot.addChild(collider);
    collider.isVisible = false;
    collider.physicsImpostor = new PhysicsImpostor(
      collider,
      PhysicsImpostor.ConvexHullImpostor
    );
    newRoot.physicsImpostor = new PhysicsImpostor(
      newRoot,
      PhysicsImpostor.NoImpostor,
      { mass: 1, restitution: 0, friction: 1, damping: 500 }
    );
    this.rootMesh = newRoot;
    shadowGenerator?.addShadowCaster(model, true);
  }

  public setPosition(position: Vector3) {
    this.rootMesh.position = position;
  }

  public setVelocity(velocity: Vector3) {
    this.rootMesh.physicsImpostor?.setLinearVelocity(velocity);
  }

  public updateAtRest(deltaTime: number) {
    const linearVelSq = this.rootMesh.physicsImpostor
      ?.getLinearVelocity()
      ?.lengthSquared();
    const angularVelSq = this.rootMesh.physicsImpostor
      ?.getAngularVelocity()
      ?.lengthSquared();
    if (
      angularVelSq &&
      angularVelSq < 0.1 &&
      linearVelSq &&
      linearVelSq < 0.1
    ) {
      this.atRestFor += deltaTime;
    } else {
      this.atRestFor = 0;
    }
  }

  public calculateResult() {
    for (let i = 0; i < this.colliderMesh.getFacetLocalNormals().length; i++) {
      if (
        Vector3.Dot(this.colliderMesh.getFacetNormal(i), Vector3.Up()) > 0.999
      ) {
        // @ts-ignore
        return faceMaps[this.type][i];
      }
    }
    return null;
  }
}

export class DieRoller {
  dice: Die[];
  private engine: Engine;
  private scene: Scene;

  constructor(
    dice: Die[],
    engine: Engine,
    scene: Scene,
    onComplete: (results: DiceRollResult) => unknown
  ) {
    this.dice = dice;
    this.engine = engine;
    this.scene = scene;

    for (let die of this.dice) {
      die.setPosition(new Vector3(2, 1.3, 2));
      die.setVelocity(new Vector3(-5.3, 0, -5.4));
    }

    this.waitForResults(onComplete);
  }

  private waitForResults(onComplete: (results: DiceRollResult) => unknown) {
    const rollResults: { [index: number]: number } = {};
    // let intervalId: number;
    const diceResultFn = () => {
      for (let die of this.dice) {
        // console.log("checking die", die);
        const index = this.dice.indexOf(die);
        // console.log("index", index);
        if (index !== null && !(index in rollResults)) {
          // console.log("haven't got result yet");
          die.updateAtRest(this.scene.deltaTime);
          // console.log("updated rest value:", die.atRestFor);
          if (die.atRestFor > 50) {
            const result = die.calculateResult();
            // console.log("resting, result is:", result);
            if (result) {
              rollResults[index] = result;
            }
            // console.log("results:", rollResults);
          }
        }
      }

      if (Object.values(rollResults).length === this.dice.length) {
        // console.log("got all results");
        onComplete({
          total: Object.values(rollResults).reduce((sum, num) => sum + num, 0),
          results: Object.entries(rollResults).map(([index, result]) => {
            const die: Die = this.dice[parseInt(index)];
            // console.log("adding result for: ", die, "all dice:", this.dice);
            return {
              [die.type]: result,
            };
          }),
        });
        // console.log("Cancelling render loop");
        // window.clearInterval(intervalId);
        this.engine.stopRenderLoop(diceResultFn);
      }
    };
    // intervalId = window.setInterval(diceResultFn, 500);
    this.engine.runRenderLoop(diceResultFn);
  }
}
