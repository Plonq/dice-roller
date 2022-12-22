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
import { DiceMeshStore, DiceRollResult, DieType } from "./model";
import { Utils } from "./utils";

export abstract class Die {
  protected id: number;
  protected meshStore: DiceMeshStore;
  protected shadowGenerator: ShadowGenerator;
  protected scene: Scene;
  protected root: AbstractMesh | undefined;
  protected model: AbstractMesh | undefined;
  protected collider: AbstractMesh | undefined;

  abstract type: DieType;
  abstract sideMap: number[];

  atRestFor: number = 0;

  protected constructor(
    id: number,
    meshStore: DiceMeshStore,
    shadowGenerator: ShadowGenerator,
    scene: Scene
  ) {
    this.id = id;
    this.meshStore = meshStore;
    this.shadowGenerator = shadowGenerator;
    this.scene = scene;
  }

  init() {
    const { model, collider } = this.createInstances(this.meshStore, this.id);
    this.model = model;
    this.collider = collider;
    this.root = new Mesh(`i_${this.type}`, this.scene);
    this.collider.isVisible = false;
    this.root.addChild(this.model);
    this.root.addChild(this.collider);

    const imposterType =
      this.type === "d6"
        ? PhysicsImpostor.BoxImpostor
        : PhysicsImpostor.ConvexHullImpostor;
    this.collider.physicsImpostor = new PhysicsImpostor(
      this.collider,
      imposterType,
      {
        mass: 0,
      }
    );
    this.root.physicsImpostor = new PhysicsImpostor(
      this.root,
      PhysicsImpostor.NoImpostor,
      {
        mass: 50,
        restitution: 0,
        friction: 0.5,
        damping: 500,
      }
    );

    this.shadowGenerator?.addShadowCaster(this.model, true);
  }

  protected createInstances(meshStore: DiceMeshStore, id: string | number) {
    const model = meshStore[this.type].model.createInstance(
      `${this.type}_modelInstance${id}`
    );
    const collider = meshStore[this.type].collider.createInstance(
      `${this.type}_colliderInstance${id}`
    );
    return { model, collider };
  }

  public setPosition(position: Vector3) {
    this.root!.position = position;
  }

  public setRotation(rotation: Quaternion) {
    this.root!.rotationQuaternion = rotation;
  }

  public setVelocity(velocity: Vector3) {
    this.root!.physicsImpostor?.setLinearVelocity(velocity);
  }

  public jiggle() {
    this.setVelocity(
      new Vector3(Utils.randRange(0.5, 2), 0.1, Utils.randRange(0.5, 2))
    );
  }

  public updateAtRest(deltaTime: number) {
    const linearVelSq =
      this.root!.physicsImpostor?.getLinearVelocity()?.lengthSquared();
    const angularVelSq =
      this.root!.physicsImpostor?.getAngularVelocity()?.lengthSquared();
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
    for (let i = 0; i < this.collider!.getFacetLocalNormals().length; i++) {
      if (Vector3.Dot(this.collider!.getFacetNormal(i), Vector3.Up()) > 0.999) {
        // @ts-ignore
        const result = this.sideMap[i];
        if (result) {
          return result;
        } else {
          console.debug(this.type, "got result but not in map. index:", i);
        }
      }
    }
    return null;
  }
}

export class D4 extends Die {
  type: DieType;
  sideMap: number[] = [4, 3, 2, 1];

  constructor(
    id: number,
    meshStore: DiceMeshStore,
    shadowGenerator: ShadowGenerator,
    scene: Scene
  ) {
    super(id, meshStore, shadowGenerator, scene);
    this.type = "d4";
    this.init();
  }
}

export class D6 extends Die {
  type: DieType;
  sideMap: number[] = [3, 2, 4, 5, 1, 6].flatMap((num) => [num, num]);

  constructor(
    id: number,
    meshStore: DiceMeshStore,
    shadowGenerator: ShadowGenerator,
    scene: Scene
  ) {
    super(id, meshStore, shadowGenerator, scene);
    this.type = "d6";
    this.init();
  }
}

export class D8 extends Die {
  type: DieType;
  sideMap: number[] = [2, 7, 6, 3, 5, 4, 1, 8];

  constructor(
    id: number,
    meshStore: DiceMeshStore,
    shadowGenerator: ShadowGenerator,
    scene: Scene
  ) {
    super(id, meshStore, shadowGenerator, scene);
    this.type = "d8";
    this.init();
  }
}

export class D10 extends Die {
  type: DieType;
  sideMap: number[] = [9, 1, 5, 7, 3, 2, 6, 4, 10, 8].flatMap((num) => [
    num,
    num,
  ]);

  constructor(
    id: number,
    meshStore: DiceMeshStore,
    shadowGenerator: ShadowGenerator,
    scene: Scene
  ) {
    super(id, meshStore, shadowGenerator, scene);
    this.type = "d10";
    this.init();
  }
}

export class D12 extends Die {
  type: DieType;
  sideMap: number[] = [2, 9, 12, 7, 3, 8, 10, 6, 5, 1, 4, 11].flatMap((num) => [
    num,
    num,
    num,
  ]);

  constructor(
    id: number,
    meshStore: DiceMeshStore,
    shadowGenerator: ShadowGenerator,
    scene: Scene
  ) {
    super(id, meshStore, shadowGenerator, scene);
    this.type = "d12";
    this.init();
  }
}

export class D20 extends Die {
  type: DieType;
  sideMap: number[] = [
    12, 10, 2, 20, 8, 17, 15, 18, 14, 16, 7, 5, 4, 6, 3, 1, 13, 11, 9, 19,
  ];

  constructor(
    id: number,
    meshStore: DiceMeshStore,
    shadowGenerator: ShadowGenerator,
    scene: Scene
  ) {
    super(id, meshStore, shadowGenerator, scene);
    this.type = "d20";
    this.init();
  }
}

export class D100 extends Die {
  type: DieType;
  sideMap: number[] = []; // TODO

  constructor(
    id: number,
    meshStore: DiceMeshStore,
    shadowGenerator: ShadowGenerator,
    scene: Scene
  ) {
    super(id, meshStore, shadowGenerator, scene);
    this.type = "d4";
    this.init();
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
    let timeout: number;
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
          if (die.atRestFor > 250) {
            const result = die.calculateResult();
            // console.log("resting, result is:", result);
            if (result) {
              rollResults[index] = result;
              // die.convertToStaticObject();
            } else {
              console.warn(
                "Die at rest but couldn't determine result. JIGGLING",
                die.type
              );
              die.jiggle();
            }
            // console.log("results:", rollResults);
          }
        }
      }

      if (Object.values(rollResults).length === this.dice.length) {
        // console.log("got all results");
        onComplete({
          total: Object.values(rollResults).reduce((sum, num) => sum + num, 0),
          rolls: Object.entries(rollResults).map(([index, num]) => {
            const die: Die = this.dice[parseInt(index)];
            return { type: die.type, num: num };
          }),
        });
        // console.log("Cancelling render loop");
        // window.clearInterval(intervalId);
        this.engine.stopRenderLoop(diceResultFn);
        window.clearTimeout(timeout);
      }
    };
    // intervalId = window.setInterval(diceResultFn, 1000);
    this.engine.runRenderLoop(diceResultFn);
    timeout = window.setTimeout(() => {
      console.warn("Timed out waiting for results (15s)");
      this.engine.stopRenderLoop(diceResultFn);
    }, 15000);
  }
}
