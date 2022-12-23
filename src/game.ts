import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import {
  AbstractMesh,
  AmmoJSPlugin,
  ArcRotateCamera,
  AssetsManager,
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PhysicsImpostor,
  Scene,
  ShadowGenerator,
  Vector3,
} from "@babylonjs/core";
import { ShadowOnlyMaterial } from "@babylonjs/materials/shadowOnly/shadowOnlyMaterial";
import { D10, D100, D12, D20, D6, D8, D4, Die, DieRoller } from "./die";
import { DiceRoll, DiceRollResult, DieType, DiceMeshStore } from "./model";

export class Game {
  private readonly canvas: HTMLCanvasElement;
  private engine: Engine | undefined;
  private scene: Scene | undefined;
  private diceMeshes: DiceMeshStore = {};
  private shadowGenerator: ShadowGenerator | undefined;
  private paused = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  get ready() {
    return this.scene !== undefined && this.engine !== undefined;
  }

  async init() {
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";

    const engine = new Engine(this.canvas, true);
    const scene = new Scene(engine);

    await this.fillScene(scene, this.canvas);
    await this.loadAssets(scene);

    let timeout: number;
    window.addEventListener("resize", () => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        engine.resize();
        this.onResize();
      }, 100);
    });

    // run the main render loop
    engine.runRenderLoop(() => {
      if (!this.paused) {
        scene.render();
      }
    });

    this.engine = engine;
    this.scene = scene;
  }

  private async loadAssets(scene: Scene) {
    const assetManager = new AssetsManager(scene);
    assetManager.useDefaultLoadingScreen = false;
    const d20Task = assetManager.addMeshTask("dice", "", "/", "devdice.glb");
    d20Task.onSuccess = (task) => {
      this.processDiceMeshes(task.loadedMeshes);
    };
    d20Task.onError = (task) => {
      console.error("Failed to load dice models: ", task.errorObject);
    };
    await assetManager.loadAsync();
  }

  private processDiceMeshes(meshes: AbstractMesh[]) {
    for (let dieType of Object.values(DieType)) {
      const filtered = meshes.filter((m) => m.name.includes(dieType));
      const model = filtered.find((m) => m.name.includes("model"));
      const collider = filtered.find((m) => m.name.includes("collider"));
      if (model && collider) {
        model.isVisible = false;
        collider.isVisible = false;
        this.diceMeshes[dieType] = {
          model: model as Mesh,
          collider: collider as Mesh,
        };
        console.debug("Models for", dieType, "loaded");
      } else {
        console.warn("Could not find models for", dieType);
      }
    }
  }

  private async fillScene(scene: Scene, canvas: HTMLCanvasElement) {
    scene.useRightHandedSystem = true;

    // "Game" state
    // let atRestFor = 0;
    // let announcedResult = false;

    // Physics
    await (window as any).Ammo();
    const gravityVector = new Vector3(0, -24, 0);
    const physicsPlugin = new AmmoJSPlugin();
    scene.enablePhysics(gravityVector, physicsPlugin);

    // Environment
    scene.clearColor = new Color4(0.0, 0.0, 0.0, 0.0);

    const camera: ArcRotateCamera = new ArcRotateCamera(
      "Camera",
      Math.PI / 2,
      0,
      5,
      Vector3.Zero(),
      scene
    );
    camera.fov = 0.4;
    camera.radius = 10;
    camera.attachControl(canvas, true);

    const hemLight: HemisphericLight = new HemisphericLight(
      "hemLight",
      new Vector3(1, 1, 0),
      scene
    );
    hemLight.intensity = 0.3;
    const dirLight = new DirectionalLight(
      "dirLight",
      Vector3.Zero().subtract(new Vector3(1, 2, 1)),
      scene
    );
    dirLight.position = new Vector3(5, 5, 5);
    dirLight.shadowEnabled = true;
    dirLight.intensity = 0.8;

    const ground = MeshBuilder.CreateBox("ground", {
      width: 20,
      depth: 20,
      height: 1,
    });
    ground.position.y -= 0.5;
    const material = new ShadowOnlyMaterial("shadowOnlyMaterial", scene);
    material.activeLight = dirLight;
    ground.material = material;
    // scene.defaultMaterial.backFaceCulling = false;
    ground.receiveShadows = true;
    ground.physicsImpostor = new PhysicsImpostor(
      ground,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 0.6, restitution: 0 },
      scene
    );

    // Walls
    this.setupOrAdjustWalls(scene);

    // Shadows
    const shadowGenerator = new ShadowGenerator(2048, dirLight);
    this.shadowGenerator = shadowGenerator;
    shadowGenerator.usePoissonSampling = true;
    shadowGenerator.bias = 0.0001;
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurScale = 15;

    return scene;
  }

  private onResize() {
    if (this.scene) {
      this.setupOrAdjustWalls(this.scene);
    }
  }

  private setupOrAdjustWalls(scene: Scene) {
    const positionWalls = (
      topWall: AbstractMesh,
      leftWall: AbstractMesh,
      rightWall: AbstractMesh,
      bottomWall: AbstractMesh
    ) => {
      const predicate = (mesh: AbstractMesh) => mesh.name === "ground"; // Only pick ground mesh
      const top = scene.pick(innerWidth / 2, 0, predicate);
      const left = scene.pick(0, innerHeight / 2, predicate);
      const right = scene.pick(innerWidth, innerHeight / 2, predicate);
      const bottom = scene.pick(innerWidth / 2, innerHeight, predicate);
      topWall.position = top.pickedPoint!;
      topWall.position.z -= 0.05;
      leftWall.position = left.pickedPoint!;
      leftWall.position.x += 0.05;
      rightWall.position = right.pickedPoint!;
      rightWall.position.x -= 0.05;
      bottomWall.position = bottom.pickedPoint!;
      bottomWall.position.z += 0.05;
    };

    if (scene.meshes.some((mesh) => mesh.name.startsWith("wall"))) {
      positionWalls(
        scene.meshes.find((mesh) => mesh.name === "wallTop")!,
        scene.meshes.find((mesh) => mesh.name === "wallLeft")!,
        scene.meshes.find((mesh) => mesh.name === "wallRight")!,
        scene.meshes.find((mesh) => mesh.name === "wallBottom")!
      );
      return;
    }

    const topWall = MeshBuilder.CreateBox("wallTop", {
      width: 20,
      height: 1,
      depth: 0.1,
    });
    const leftWall = MeshBuilder.CreateBox("wallLeft", {
      width: 0.1,
      height: 1,
      depth: 20,
    });
    const rightWall = MeshBuilder.CreateBox("wallRight", {
      width: 0.1,
      height: 1,
      depth: 20,
    });
    const bottomWall = MeshBuilder.CreateBox("wallBottom", {
      width: 20,
      height: 1,
      depth: 0.1,
    });

    topWall.physicsImpostor = new PhysicsImpostor(
      topWall,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 0 }
    );
    leftWall.physicsImpostor = new PhysicsImpostor(
      leftWall,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 0 }
    );
    rightWall.physicsImpostor = new PhysicsImpostor(
      rightWall,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 0 }
    );
    bottomWall.physicsImpostor = new PhysicsImpostor(
      bottomWall,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 0 }
    );

    topWall.isVisible = false;
    leftWall.isVisible = false;
    rightWall.isVisible = false;
    bottomWall.isVisible = false;

    positionWalls(topWall, leftWall, rightWall, bottomWall);
  }

  public async roll(roll: DiceRoll): Promise<DiceRollResult> {
    if (!this.ready) {
      throw new Error("Must call init() before any other method");
    }

    this.paused = false;
    this.clear();

    return new Promise<DiceRollResult>((resolve, _reject) => {
      const dice: Die[] = [];
      console.log("Rull", roll);
      for (let [type, count] of Object.entries(roll.rolls)) {
        for (let i = 0; i < count; i++) {
          dice.push(this.spawnDie(type as DieType, i.toString()));
        }
      }
      new DieRoller(dice, this.engine!, this.scene!, (results) => {
        console.log("FINAL RESULTS:", results);
        this.paused = true;
        resolve({ type: roll.type, ...results });
      });
    });
  }

  private spawnDie(type: DieType, id: string) {
    switch (type) {
      case "d4":
        return new D4(id, this.diceMeshes, this.shadowGenerator!, this.scene!);
      case "d6":
        return new D6(id, this.diceMeshes, this.shadowGenerator!, this.scene!);
      case "d8":
        return new D8(id, this.diceMeshes, this.shadowGenerator!, this.scene!);
      case "d10":
        return new D10(id, this.diceMeshes, this.shadowGenerator!, this.scene!);
      case "d12":
        return new D12(id, this.diceMeshes, this.shadowGenerator!, this.scene!);
      case "d20":
        return new D20(id, this.diceMeshes, this.shadowGenerator!, this.scene!);
      case "d100":
        return new D100(
          id,
          this.diceMeshes,
          this.shadowGenerator!,
          this.scene!
        );
    }
  }

  public async clear() {
    for (let mesh of this.scene!.meshes.filter((m) =>
      m.name.startsWith("i_")
    )) {
      mesh.dispose();
    }
  }

  public toggleDebugLayer() {
    if (this.scene?.debugLayer.isVisible()) {
      this.scene.debugLayer.hide();
    } else {
      this.scene?.debugLayer.show();
    }
  }
}
