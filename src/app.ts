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
  Quaternion,
  Scene,
  SceneLoader,
  ShadowGenerator,
  Vector3,
} from "@babylonjs/core";
import { ShadowOnlyMaterial } from "@babylonjs/materials/shadowOnly/shadowOnlyMaterial";
import * as rotationMaps from "./side-map";

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
      { mass: 0, friction: 0.5, restitution: 0 },
      scene
    );

    const shadowGenerator = new ShadowGenerator(1024, dirLight);
    shadowGenerator.usePoissonSampling = true;
    shadowGenerator.bias = 0.0001;
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurScale = 15;

    let die: AbstractMesh;
    let die_imposter: AbstractMesh;

    SceneLoader.ImportMeshAsync("", "/", "d20.glb", scene).then((model) => {
      die = model.meshes[0];
      die_imposter = model.meshes[1];
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
      canvas.addEventListener("keydown", (event) => {
        if (event.key === "r") {
          const rq = die.rotationQuaternion;
          console.log(
            "rotation quarternion",
            `new Quaternion(${rq?.x}, ${rq?.y}, ${rq?.z}, ${rq?.w}),`
          );
        } else if (event.key === "g") {
          die.position = new Vector3(2, 2.3, 2);
          die.physicsImpostor?.setLinearVelocity(new Vector3(-2.3, 0, -2.4));

          atRestFor = 0;
          announcedResult = false;
        }
      });

      // setInterval(() => {
      //   console.log("rotation quarternion", die.rotationQuaternion);
      // }, 1000);
    });

    engine.runRenderLoop(() => {
      if (die) {
        if (atRestFor > 300) {
          if (!announcedResult) {
          }
          return;
        }

        const linearVelSq = die.physicsImpostor
          ?.getLinearVelocity()
          ?.lengthSquared();
        const angularVelSq = die.physicsImpostor
          ?.getAngularVelocity()
          ?.lengthSquared();
        // console.log("linearVel", linearVelSq);
        // console.log("angularVel", angularVelSq);
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
}
