import {
  AbstractMesh,
  Engine,
  Mesh,
  PhysicsImpostor,
  Quaternion,
  Scene,
  ShadowGenerator,
  Vector3,
} from "@babylonjs/core";
import faceMaps from "./side-map";
import { DiceRollResult, DieType } from "./model";
import { Utils } from "./Utils";

export class Die {
  protected rootMesh: AbstractMesh;
  protected colliderMesh: AbstractMesh;
  public atRestFor: number = 0;
  public type: DieType;

  constructor(
    type: DieType,
    model: AbstractMesh,
    collider: AbstractMesh,
    shadowGenerator: ShadowGenerator,
    scene: Scene
  ) {
    this.type = type;
    this.colliderMesh = collider;
    const newRoot: Mesh = new Mesh(`i_${type}`, scene);
    newRoot.addChild(model);
    newRoot.addChild(collider);
    collider.isVisible = false;
    const imposterType =
      this.type === DieType.D6
        ? PhysicsImpostor.BoxImpostor
        : PhysicsImpostor.ConvexHullImpostor;
    collider.physicsImpostor = new PhysicsImpostor(collider, imposterType, {
      mass: 0,
    });
    collider.physicsImpostor.setDeltaPosition(Vector3.ZeroReadOnly);
    collider.physicsImpostor.setDeltaRotation(Quaternion.Identity());
    collider.physicsImpostor.setScalingUpdated();
    newRoot.physicsImpostor = new PhysicsImpostor(
      newRoot,
      PhysicsImpostor.NoImpostor,
      {
        mass: 1,
        restitution: 0,
        friction: 1,
        damping: 500,
        margin: 0,

        // disableBidirectionalTransformation: true,
      }
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
      angularVelSq < 0.01 &&
      linearVelSq &&
      linearVelSq < 0.01
    ) {
      this.atRestFor += deltaTime;
    } else {
      this.atRestFor = 0;
    }
  }

  public calculateResult() {
    console.log(
      this.type,
      "num facets:",
      this.colliderMesh.getFacetLocalNormals().length
    );
    for (let i = 0; i < this.colliderMesh.getFacetLocalNormals().length; i++) {
      if (
        Vector3.Dot(this.colliderMesh.getFacetNormal(i), Vector3.Up()) > 0.999
      ) {
        // @ts-ignore
        const result = faceMaps[this.type][i];
        if (result) {
          return result;
        } else {
          console.debug(this.type, "got result but not in map. index:", i);
        }
      }
    }
    return null;
  }

  convertToStaticObject() {
    this.rootMesh.physicsImpostor?.setMass(0);
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

    this.setRandomPositions();
    this.waitForResults(onComplete);
  }

  private setRandomPositions() {
    const predicate = (mesh: AbstractMesh) => mesh.name === "ground"; // Only pick ground mesh
    for (let die of this.dice) {
      let position: Vector3;
      const side = Utils.randIntRange(0, 3);
      if (side === 0 || side === 2) {
        // Top/bottom
        const windowY = Utils.randRange(0, innerHeight);
        const pick = this.scene.pick(
          side === 0 ? 0 : innerWidth,
          windowY,
          predicate
        );
        position = pick.pickedPoint!;
      } else {
        // Left/right
        const windowX = Utils.randRange(0, innerWidth);
        const pick = this.scene.pick(
          windowX,
          side === 1 ? 0 : innerHeight,
          predicate
        );
        position = pick.pickedPoint!;
      }
      position.y = 1.3;
      die.setPosition(position);
      die.setVelocity(
        Vector3.Zero().subtract(position).multiplyByFloats(4, 4, 4)
      );
    }
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
              die.convertToStaticObject();
            } else {
              console.warn(
                "Die at rest but couldn't determine result",
                die.type
              );
              //
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
