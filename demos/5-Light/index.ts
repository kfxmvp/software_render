import { Loader } from "./core/loader";
import { Raster } from "./core/raster";
import { Scene } from "./core/scene";
import { Node } from "./core/node";
// @ts-ignore
import Model1 from "./resources/model1.obj";
// @ts-ignore
import Model1Tex from "./resources/model1.png";
// @ts-ignore
import Model2 from "./resources/model2.obj";
// @ts-ignore
import Model2Tex from "./resources/model2.png";
// @ts-ignore
import Model3 from "./resources/model3.obj";
// @ts-ignore
import Model3Tex from "./resources/model3.png";
import { Material } from "./core/material";
import { Shader } from "./core/shader/shader";
import { Texture } from "./core/texture";
import { CalcUtil } from "./base/util/calc";
import { Mat4 } from "./base/mat4";
import { Light } from "./core/light/light";
import { Vec4 } from "./base/vec4";
import { Color } from "./base/color";

const scene = new Scene();
const camera = scene.camera;
camera.setPosition(0, 0, -10);
camera.lookAt(0, 0, -1);
camera.usePerspectiveCamera();
camera.fov = 30;
camera.near = 1;
camera.far = 100;

// 灯光
const light = new Light();
light.setColor(Color.RED.clone());
light.setPosition(new Vec4(10, 0, 0, 1));
light.setIntensity(0.6);

// 环境光
light.useAmbient();
light.setAmbientColor(Color.WHITE.clone());
light.setAmbientIntensity(0.3);

// 镜面高光
light.setSpecularColor(Color.WHITE.clone());
light.setSpecularIntensity(0.5);

const raster = new Raster();
const { width, height } = raster;

let angle = 0;
let autoRotation = true;
const dealAutoRotation = () => {
    angle += 1;
    scene.children.forEach(child => {
        const model = child.model;
        const objects = model.object;
        for (let i = 0; i < objects.length; ++i) {
            const object = objects[i];
            const shader = object.getMaterial()?.getShader();
            if (!shader) continue;
            // 更新model矩阵
            shader.modelMatrix = CalcUtil.mat4MulArr([
                child.positionMat4,
                Mat4.getRotationMat4X(angle)
            ])
        }
    })
}

let loaded = false;
const loadResource = async () => {
    const node = new Node();
    // 加载模型
    const model1 = await Loader.loadModel(Model1);
    node.model = model1;
    const { object: objects } = model1;

    for (let i = 0; i < objects.length; ++i) {
        const object = objects[i];
        const material = object.getMaterial() || new Material();
        const shader = material.getShader() || new Shader();
        if (!material.getShader()) material.setShader(shader);

        // 模型贴图
        const texture = new Texture();
        await texture.setImageDataWithSrc(Model1Tex);
        material?.setTexture(texture);

        // 材质参数
        shader.addUniform('camera', camera);
        shader.addUniform('light', light);

        // mvp矩阵
        shader.modelMatrix = CalcUtil.mat4MulArr([
            node.positionMat4,
            Mat4.getRotationMat4X(angle)
        ])

        shader.viewMatrix = camera.getViewMatrix();

        const { near, far, fov } = camera;
        const aspect = width / height;

        shader.projectionMatrix = camera.isOrthographicCamera()
            ? camera.getOrthographicMatrix(-width / 2, width / 2, height / 2, -height / 2, near, far)
            : camera.getPerspectiveMatrix(fov, aspect, near, far);
    }

    scene.addChild(node);
}

const update = () => {
    if (loaded) {
        if (autoRotation) dealAutoRotation();
        raster.render(scene);
    }
    requestAnimationFrame(update);
}

loadResource().then(() => loaded = true)

update();