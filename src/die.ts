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
import { Utils } from "./utils";

export class Die {
  public rootMesh: AbstractMesh;
  public colliderMesh: AbstractMesh;
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
    collider.isVisible = false;
    // const colliderName = `${this.type}_collider`;
    // let collider: Mesh;
    // switch (this.type) {
    //   case DieType.D4:
    //     collider = MeshBuilder.CreatePolyhedron(
    //       colliderName,
    //       {
    //         type: 0,
    //         size: 0.11,
    //       },
    //       scene
    //     );
    //     break;
    //   case DieType.D6:
    //     collider = MeshBuilder.CreateBox(colliderName, { size: 0.22 }, scene);
    //     break;
    //   case DieType.D8:
    //     break;
    //   case DieType.D10:
    //     break;
    //   case DieType.D12:
    //     break;
    //   case DieType.D20:
    //     collider = MeshBuilder.CreatePolyhedron(
    //       colliderName,
    //       {
    //         type: 3,
    //         size: 0.14,
    //       },
    //       scene
    //     );
    //     collider.rotationQuaternion = new Quaternion(
    //       0.6724985119639573,
    //       0.21850801222441052,
    //       -0.2185080122244105,
    //       0.6724985119639574
    //     );
    //     break;
    // }
    this.colliderMesh = collider;
    const newRoot: Mesh = new Mesh(`i_${type}`, scene);
    newRoot.addChild(model);
    newRoot.addChild(collider!);
    // model.isVisible = false;
    // collider.isVisible = false;
    const imposterType =
      this.type === DieType.D6
        ? PhysicsImpostor.BoxImpostor
        : PhysicsImpostor.ConvexHullImpostor;
    collider!.physicsImpostor = new PhysicsImpostor(collider!, imposterType, {
      mass: 0,
    });
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
    shadowGenerator?.addShadowCaster(collider!, true);
  }

  public setPosition(position: Vector3) {
    this.rootMesh.position = position;
  }

  public setRotation(rotation: Quaternion) {
    this.rootMesh.rotationQuaternion = rotation;
  }

  public setVelocity(velocity: Vector3) {
    this.rootMesh.physicsImpostor?.setLinearVelocity(velocity);
  }

  public jiggle() {
    this.setVelocity(
      new Vector3(Utils.randRange(0.5, 2), 0.1, Utils.randRange(0.5, 2))
    );
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

    this.randomise();
    this.waitForResults(onComplete);
  }

  private randomise() {
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
        Vector3.Zero().subtract(position).multiplyByFloats(3, 3, 3)
      );
      die.setRotation(
        new Quaternion(
          Math.random(),
          Math.random(),
          Math.random(),
          Math.random()
        )
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
          if (die.atRestFor > 350) {
            const result = die.calculateResult();
            // console.log("resting, result is:", result);
            if (result) {
              rollResults[index] = result;
              // die.convertToStaticObject();
            } else {
              console.warn(
                // "Die at rest but couldn't determine result. JIGGLING",
                die.type
              );
              // die.jiggle();
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
    // intervalId = window.setInterval(diceResultFn, 1000);
    this.engine.runRenderLoop(diceResultFn);
  }
}
