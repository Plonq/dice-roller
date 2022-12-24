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
  protected id: string;
  protected meshStore: DiceMeshStore;
  protected shadowGenerator: ShadowGenerator;
  protected scene: Scene;
  protected root: AbstractMesh | undefined;
  protected model: AbstractMesh | undefined;
  protected collider: AbstractMesh | undefined;

  abstract type: DieType;
  abstract meshFaceIndexToNumMap: number[];

  atRestFor: number = 0;

  protected constructor(
    id: string,
    meshStore: DiceMeshStore,
    shadowGenerator: ShadowGenerator,
    scene: Scene
  ) {
    this.id = id;
    this.meshStore = meshStore;
    this.shadowGenerator = shadowGenerator;
    this.scene = scene;
  }

  protected init() {
    this.createInstances(this.meshStore, this.id);

    this.root = new Mesh(`i_${this.type}`, this.scene);
    this.collider!.isVisible = false;
    this.root.addChild(this.model!);
    this.root.addChild(this.collider!);

    this.setupPhysics(this.root, this.collider!);

    this.shadowGenerator?.addShadowCaster(this.model!, true);
  }

  protected createInstances(meshStore: DiceMeshStore, id: string | number) {
    this.model = meshStore[this.type].model.createInstance(
      `${this.type}_modelInstance${id}`
    );
    this.collider = meshStore[this.type].collider.createInstance(
      `${this.type}_colliderInstance${id}`
    );
  }

  protected setupPhysics(root: AbstractMesh, collider: AbstractMesh) {
    const imposterType =
      this.type === "d6"
        ? PhysicsImpostor.BoxImpostor
        : PhysicsImpostor.ConvexHullImpostor;
    collider.physicsImpostor = new PhysicsImpostor(collider, imposterType, {
      mass: 0,
    });
    root.physicsImpostor = new PhysicsImpostor(
      root,
      PhysicsImpostor.NoImpostor,
      {
        mass: 50,
        restitution: 0,
        friction: 0.5,
      }
    );
  }

  get position() {
    return this.root!.position;
  }
  set position(position: Vector3) {
    this.root!.position = position;
  }

  dampen(amount: number) {
    this.applyForce(
      this.root?.physicsImpostor?.getLinearVelocity()?.negate().scale(amount)!
    );
  }

  setPosition(position: Vector3) {
    this.root!.position = position;
  }

  setRandomRotation() {
    this.root!.rotationQuaternion = new Quaternion(
      Math.random(),
      Math.random(),
      Math.random(),
      Math.random()
    );
  }

  setVelocity(velocity: Vector3) {
    this.root!.physicsImpostor?.setLinearVelocity(velocity);
  }

  applyForce(force: Vector3) {
    this.root!.physicsImpostor?.applyForce(force, this.position);
  }

  jiggle() {
    this.setVelocity(
      new Vector3(Utils.randRange(0.5, 2), 0.1, Utils.randRange(0.5, 2))
    );
  }

  updateAtRest(deltaTime: number) {
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

  getTopFace() {
    for (let i = 0; i < this.collider!.getFacetLocalNormals().length; i++) {
      if (Vector3.Dot(this.collider!.getFacetNormal(i), Vector3.Up()) > 0.999) {
        // @ts-ignore
        const result = this.meshFaceIndexToNumMap[i];
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
  meshFaceIndexToNumMap: number[] = [4, 3, 2, 1];

  constructor(
    id: string,
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
  meshFaceIndexToNumMap: number[] = [3, 2, 4, 5, 1, 6].flatMap((num) => [
    num,
    num,
  ]);

  constructor(
    id: string,
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
  meshFaceIndexToNumMap: number[] = [2, 7, 6, 3, 5, 4, 1, 8];

  constructor(
    id: string,
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
  meshFaceIndexToNumMap: number[] = [9, 1, 5, 7, 3, 2, 6, 4, 10, 8].flatMap(
    (num) => [num, num]
  );

  constructor(
    id: string,
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
  meshFaceIndexToNumMap: number[] = [
    2, 9, 12, 7, 3, 8, 10, 6, 5, 1, 4, 11,
  ].flatMap((num) => [num, num, num]);

  constructor(
    id: string,
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
  meshFaceIndexToNumMap: number[] = [
    12, 10, 2, 20, 8, 17, 15, 18, 14, 16, 7, 5, 4, 6, 3, 1, 13, 11, 9, 19,
  ];

  constructor(
    id: string,
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
  meshFaceIndexToNumMap: number[] = [
    70, 30, 50, 90, 10, 80, 100, 40, 60, 20,
  ].flatMap((num) => [num, num]);
  d10: D10;

  constructor(
    id: string,
    meshStore: DiceMeshStore,
    shadowGenerator: ShadowGenerator,
    scene: Scene
  ) {
    super(id, meshStore, shadowGenerator, scene);
    this.type = "d100";
    this.d10 = new D10(`${this.id}_1`, meshStore, shadowGenerator, scene);
    this.init();
  }

  override setPosition(position: Vector3) {
    // Offsets position perpendicular to the vector pointing towards the center,
    // (direction of roll) thereby moving the d100 and d10 dice away from each other.
    const toOrigin = position.clone().set(position.x, 0, position.z);
    let offsetVec = Vector3.Cross(toOrigin, Vector3.Up());
    offsetVec.normalize();
    offsetVec = offsetVec.multiplyByFloats(0.2, 0.2, 0.2);
    const rootPos = position.add(offsetVec);
    super.setPosition(rootPos);
    this.d10.setPosition(position.subtract(offsetVec));
  }

  override setVelocity(velocity: Vector3) {
    super.setVelocity(velocity);
    this.d10.setVelocity(velocity);
  }

  override setRandomRotation() {
    super.setRandomRotation();
    this.d10.setRandomRotation();
  }

  override updateAtRest(deltaTime: number) {
    super.updateAtRest(deltaTime);
    this.d10.updateAtRest(deltaTime);
    this.atRestFor = Math.min(this.atRestFor, this.d10.atRestFor);
  }

  override getTopFace(): number | null {
    const tens = super.getTopFace();
    const ones = this.d10.getTopFace();

    if (tens === null || ones === null) {
      return null;
    }

    // Make d100 0 - 90 and d10 0 - 9, which works for all cases except 100
    // which is 00 0 on the dice, so we need to manually handle that.
    let result = (tens % 100) + (ones % 10);
    if (result === 0) {
      result = 100;
    }
    return result;
  }
}

export class DieRoller {
  protected dice: Die[] = [];
  protected engine: Engine;
  protected scene: Scene;
  protected mode: "auto" | "manual" = "manual";
  protected cursorDieMagnetFn: () => void = () => {};

  constructor(engine: Engine, scene: Scene) {
    this.engine = engine;
    this.scene = scene;

    if (this.mode === "manual") {
      this.setUpManual();
    }
  }

  setMode(mode: "auto" | "manual") {
    if (mode === "auto" && this.mode === "manual") {
      this.mode = "auto";
      this.tearDownManual();
    } else if (mode === "manual" && this.mode === "auto") {
      this.mode = "manual";
      this.setUpManual();
    }
  }

  protected setUpManual() {
    this.cursorDieMagnetFn = () => {
      // For each die...
      for (let die of this.dice) {
        // Accelerate it towards the mouse cursor a little bit
        // with fixed Y coord
        const pickPredicate = (mesh: AbstractMesh) => mesh.name === "ground"; // Only pick ground mesh
        const mousePos = this.scene.pick(
          this.scene.pointerX,
          this.scene.pointerY,
          pickPredicate
        ).pickedPoint;
        if (!mousePos) {
          console.warn("mouse pick point is null");
        } else {
          mousePos.y = 1.3;

          const vecToMouse = mousePos.subtract(die.position);
          // vecToMouse.normalize();
          // vecToMouse.scaleInPlace(1.5);
          // console.log("applying force to die:", vecToMouse);
          die.applyForce(vecToMouse.scale(2000));
          die.dampen(300);
          // die.position = die.position.add(vecToMouse);
        }
      }
    };

    this.engine.runRenderLoop(this.cursorDieMagnetFn);
  }

  protected tearDownManual() {
    this.engine.stopRenderLoop(this.cursorDieMagnetFn);
  }

  setDice(dice: Die[]) {
    this.dice = dice;
  }

  addDie(die: Die) {
    if (this.mode === "manual") {
      const pickPredicate = (mesh: AbstractMesh) => mesh.name === "ground"; // Only pick ground mesh
      const mousePos = this.scene.pick(
        this.scene.pointerX,
        this.scene.pointerY,
        pickPredicate
      ).pickedPoint;
      if (mousePos) {
        mousePos.y = 3;
        die.position = mousePos;
      }
    }
    this.dice.push(die);
  }

  roll(onComplete: (results: DiceRollResult) => unknown) {
    if (this.mode === "manual") {
      throw new Error("DieRoller must be set to auto in order to call roll()");
    }
    if (!this.dice?.length) {
      throw new Error("Must call setDice before calling roll on DieRoller");
    }

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
      // position = new Vector3(0.5, 0, -1.1);
      position.y = 1.3;
      die.setPosition(position);
      die.setVelocity(
        Vector3.Zero().subtract(position).multiplyByFloats(3, 3, 3)
      );
      die.setRandomRotation();
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
            const result = die.getTopFace();
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
