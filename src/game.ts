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
import { Die, DieRoller } from "./die";
import { DiceRoll, DieType } from "./model";

export interface GameConfig {}

export class Game {
  private readonly canvas: HTMLCanvasElement;
  private engine: Engine | undefined;
  private scene: Scene | undefined;
  private diceMeshes: {
    [name: string]: { model: Mesh; collider: Mesh };
  } = {};
  private shadowGenerator: ShadowGenerator | undefined;

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
    const scene = await this.createScene(engine, this.canvas);

    const assetManager = new AssetsManager(scene);
    const d20Task = assetManager.addMeshTask("d20", "", "/", "d20.glb");
    d20Task.onSuccess = (task) => {
      this.diceMeshes.d20 = this.processDieModel(task.loadedMeshes);
    };
    d20Task.onError = () => {
      console.error("d20 failed to load");
    };
    await assetManager.loadAsync();

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
      scene.render();
    });

    this.engine = engine;
    this.scene = scene;
  }

  private async createScene(engine: Engine, canvas: HTMLCanvasElement) {
    const scene = new Scene(engine);
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

    const ground = MeshBuilder.CreateGround("ground", {
      width: 10,
      height: 10,
    });
    const material = new ShadowOnlyMaterial("shadowOnlyMaterial", scene);
    material.activeLight = dirLight;
    ground.material = material;
    ground.receiveShadows = true;
    ground.physicsImpostor = new PhysicsImpostor(
      ground,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 0.5, restitution: 0 },
      scene
    );

    // Walls
    this.setupOrAdjustWalls(scene);

    // Shadows
    const shadowGenerator = new ShadowGenerator(1024, dirLight);
    this.shadowGenerator = shadowGenerator;
    shadowGenerator.usePoissonSampling = true;
    shadowGenerator.bias = 0.0001;
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurScale = 15;

    return scene;
  }

  private processDieModel(meshes: AbstractMesh[]) {
    const model = meshes.find((m) => m.name.includes("model"))!;
    const collider = meshes.find((m) => m.name.includes("collider"))!;
    model.isVisible = false;
    collider.isVisible = false;
    return { model: model as Mesh, collider: collider as Mesh };
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
      width: 100,
      height: 1,
      depth: 0.1,
    });
    const leftWall = MeshBuilder.CreateBox("wallLeft", {
      width: 0.1,
      height: 1,
      depth: 100,
    });
    const rightWall = MeshBuilder.CreateBox("wallRight", {
      width: 0.1,
      height: 1,
      depth: 100,
    });
    const bottomWall = MeshBuilder.CreateBox("wallBottom", {
      width: 100,
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

  public async roll(rolls: DiceRoll) {
    if (!this.ready) {
      throw new Error("Must call init() before any other method");
    }

    const dice: Die[] = [];
    if (rolls.d20) {
      for (let i = 0; i < rolls.d20; i++) {
        const { modelInstance, colliderInstance } = this.createInstance(
          "d20",
          i
        );
        dice.push(
          new Die(
            "d20",
            DieType.D20,
            modelInstance,
            colliderInstance,
            this.shadowGenerator!,
            this.scene!
          )
        );
      }
    }
    new DieRoller(dice, this.engine!, this.scene!, (results) => {
      console.log("FINAL RESULTS:", results);
    });
  }

  public async clear() {}

  private createInstance(typeKey: string, id: string | number) {
    const modelInstance = this.diceMeshes[typeKey].model.createInstance(
      `${typeKey}_modelInstance${id}`
    );
    const colliderInstance = this.diceMeshes[typeKey].collider.createInstance(
      `${typeKey}_colliderInstance${id}`
    );
    return { modelInstance, colliderInstance };
  }

  public toggleDebugLayer() {
    if (this.scene?.debugLayer.isVisible()) {
      this.scene.debugLayer.hide();
    } else {
      this.scene?.debugLayer.show();
    }
  }
}
