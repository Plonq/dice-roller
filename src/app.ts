import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import {
  AbstractMesh,
  AmmoJSPlugin,
  ArcRotateCamera,
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PhysicsImpostor,
  Scene,
  SceneLoader,
  ShadowGenerator,
  Vector3,
} from "@babylonjs/core";
import { ShadowOnlyMaterial } from "@babylonjs/materials/shadowOnly/shadowOnlyMaterial";
import * as faceMaps from "./side-map";

export class App {
  canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    // create the canvas html element and attach it to the webpage
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.id = "gameCanvas";

    // initialize babylon scene and engine
    const engine = new Engine(canvas, true);
    this.createScene(engine, canvas).then((scene) => {
      // scene.debugLayer.show();
      // hide/show the Inspector
      window.addEventListener("keydown", (ev) => {
        // Shift+Ctrl+Alt+I
        if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
          if (scene.debugLayer.isVisible()) {
            scene.debugLayer.hide();
          } else {
            scene.debugLayer.show();
          }
        }
      });

      let timeout: number;
      window.addEventListener("resize", () => {
        window.clearTimeout(timeout);
        timeout = window.setTimeout(() => {
          engine.resize();
          this.setupWalls(scene);
        }, 100);
      });

      // run the main render loop
      engine.runRenderLoop(() => {
        scene.render();
      });
    });
  }

  async createScene(engine: Engine, canvas: HTMLCanvasElement) {
    const scene = new Scene(engine);

    // "Game" state
    let atRestFor = 0;
    let announcedResult = false;

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
    this.setupWalls(scene);

    // Shadows
    const shadowGenerator = new ShadowGenerator(1024, dirLight);
    shadowGenerator.usePoissonSampling = true;
    shadowGenerator.bias = 0.0001;
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurScale = 15;

    // Dice
    let die: AbstractMesh;
    let dieCollider: AbstractMesh;
    let physicsRoot: Mesh = new Mesh("diePhysicsRoot", scene);

    SceneLoader.ImportMeshAsync("", "/", "d20.glb", scene).then((model) => {
      const root = model.meshes.find((m) => m.parent === null)!;
      die = model.meshes.find((m) => m.name === "d20")!;
      dieCollider = model.meshes.find((m) => m.name === "d20_imposter")!;
      dieCollider.isVisible = false;
      physicsRoot.addChild(dieCollider);
      physicsRoot.addChild(root);
      dieCollider.physicsImpostor = new PhysicsImpostor(
        dieCollider,
        PhysicsImpostor.ConvexHullImpostor,
        { mass: 1 }
      );
      physicsRoot.physicsImpostor = new PhysicsImpostor(
        physicsRoot,
        PhysicsImpostor.NoImpostor,
        { mass: 1, restitution: 0, friction: 1, damping: 500 }
      );
      shadowGenerator.addShadowCaster(die, true);

      physicsRoot.position = new Vector3(2, 1.3, 2);
      physicsRoot.physicsImpostor.setLinearVelocity(new Vector3(-5.3, 0, -5.4));

      canvas.addEventListener("keydown", (event) => {
        if (event.key === "g") {
          physicsRoot.position = new Vector3(2, 1.3, 2);
          physicsRoot.physicsImpostor?.setLinearVelocity(
            new Vector3(-5.3, 0, -5.4)
          );

          atRestFor = 0;
          announcedResult = false;
        }
      });
    });

    engine.runRenderLoop(() => {
      if (physicsRoot) {
        if (atRestFor > 350) {
          if (!announcedResult) {
            for (
              let i = 0;
              i < dieCollider.getFacetLocalNormals().length;
              i++
            ) {
              if (
                Vector3.Dot(dieCollider.getFacetNormal(i), Vector3.Up()) > 0.999
              ) {
                console.log("NUMBER:", faceMaps.d20[i], "index:", i);
                break;
              }
            }
            announcedResult = true;
          }
          return;
        }

        const linearVelSq = physicsRoot.physicsImpostor
          ?.getLinearVelocity()
          ?.lengthSquared();
        const angularVelSq = physicsRoot.physicsImpostor
          ?.getAngularVelocity()
          ?.lengthSquared();
        if (
          angularVelSq &&
          angularVelSq < 0.1 &&
          linearVelSq &&
          linearVelSq < 0.1
        ) {
          atRestFor += scene.deltaTime;
        } else {
          atRestFor = 0;
        }
      }
    });

    return scene;
  }

  private setupWalls(scene: Scene) {
    scene.meshes
      .filter((mesh) => mesh.name.startsWith("wall"))
      .forEach((mesh) => mesh.dispose(false, true));

    const predicate = (mesh: AbstractMesh) => mesh.name === "ground"; // Only pick ground mesh

    const top = scene.pick(innerWidth / 2, 0, predicate);
    const left = scene.pick(0, innerHeight / 2, predicate);
    const right = scene.pick(innerWidth, innerHeight / 2, predicate);
    const bottom = scene.pick(innerWidth / 2, innerHeight, predicate);

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

    topWall.position = top.pickedPoint!;
    topWall.position.z -= 0.05;
    leftWall.position = left.pickedPoint!;
    leftWall.position.x += 0.05;
    rightWall.position = right.pickedPoint!;
    rightWall.position.x -= 0.05;
    bottomWall.position = bottom.pickedPoint!;
    bottomWall.position.z += 0.05;

    topWall.physicsImpostor = new PhysicsImpostor(
      topWall,
      PhysicsImpostor.BoxImpostor,
      { mass: 0 }
    );
    leftWall.physicsImpostor = new PhysicsImpostor(
      leftWall,
      PhysicsImpostor.BoxImpostor,
      { mass: 0 }
    );
    rightWall.physicsImpostor = new PhysicsImpostor(
      rightWall,
      PhysicsImpostor.BoxImpostor,
      { mass: 0 }
    );
    bottomWall.physicsImpostor = new PhysicsImpostor(
      bottomWall,
      PhysicsImpostor.BoxImpostor,
      { mass: 0 }
    );

    topWall.isVisible = false;
    leftWall.isVisible = false;
    rightWall.isVisible = false;
    bottomWall.isVisible = false;
  }
}
