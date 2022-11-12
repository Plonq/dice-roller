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
  MeshBuilder,
  PhysicsImpostor,
  Scene,
  SceneLoader,
  ShadowGenerator,
  Vector3,
} from "@babylonjs/core";
import { ShadowOnlyMaterial } from "@babylonjs/materials/shadowOnly/shadowOnlyMaterial";

export class App {
  constructor(canvas: HTMLCanvasElement) {
    // create the canvas html element and attach it to the webpage
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.id = "gameCanvas";

    // initialize babylon scene and engine
    const engine = new Engine(canvas, true);
    this.createScene(engine, canvas).then((scene) => {
      scene.debugLayer.show();
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
    camera.lowerRadiusLimit = 0.2;
    camera.upperRadiusLimit = 10;
    camera.minZ = 0.1;
    // camera.attachControl(canvas, true);

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
      { mass: 0, friction: 0.5, restitution: 0.7 },
      scene
    );

    const shadowGenerator = new ShadowGenerator(1024, dirLight);
    shadowGenerator.usePoissonSampling = true;
    shadowGenerator.bias = 0.0001;
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurScale = 15;

    let die: AbstractMesh;

    SceneLoader.ImportMeshAsync("", "/", "d20.babylon", scene).then((mesh) => {
      die = mesh.meshes[0];
      die.position = new Vector3(2, 3.3, 2);
      shadowGenerator.addShadowCaster(die, true);
      // Physics
      die.physicsImpostor = new PhysicsImpostor(
        die,
        PhysicsImpostor.ConvexHullImpostor,
        {
          mass: 1,
          restitution: 0,
          friction: 1,
          damping: 500,
        },
        scene
      );
      die.physicsImpostor.setLinearVelocity(new Vector3(-2.3, 0, -2.4));
      canvas.addEventListener("click", (event) => {
        event.preventDefault();
        die.position = new Vector3(2, 2.3, 2);

        die.physicsImpostor?.setLinearVelocity(new Vector3(-2.3, 0, -2.4));
      });
    });

    return scene;
  }
}
