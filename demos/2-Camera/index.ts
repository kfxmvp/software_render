import { Color } from "./color";
import { Vec4 } from "./vec4";
import {
    getCanvas,
    getContext,
    createFrameBuffer,
    getFrameBufferData,
    clear,
    writeColor,
    render,
} from "./raster";
import { getBoundingBox, barycentric, lerp, mat4MulArr, vec4MulMat4, getViewPortVertex } from "./util";
import { Mesh } from "./mesh";
import { Camera } from "./camera";
import { Mat4 } from "./mat4";

const canvas = getCanvas();
const ctx = getContext(canvas);
const frameBuffer = createFrameBuffer(canvas, ctx);
const frameData = getFrameBufferData(frameBuffer);

const { width, height } = canvas;

// 摄像机
const near = 1;
const far = 100;
const fov = 30;
const aspect = width / height;
const camera = new Camera();
camera.setPosition(0, 0, -10);
camera.lookAt(0, 0, -1);
// 使用正交摄像机
camera.useOrthographicCamera();
// 使用透视摄像机
camera.usePerspectiveCamera();

const viewMat = camera.getViewMatrix();
const projectionMat = camera.isOrthographicCamera()
    ? camera.getOrthographicMatrix(-width / 2, width / 2, height / 2, -height / 2, near, far)
    : camera.getPerspectiveMatrix(fov, aspect, near, far);

// 网格
const mesh = new Mesh();
if (camera.isOrthographicCamera()) {
    mesh.createBox(new Vec4(0, 0, -1), 100);
}
else {
    mesh.createBox(new Vec4(0, 0, -1), 1);
}

// 画渐变三角形
function drawTriangle(vertex1: Vec4, vertex2: Vec4, vertex3: Vec4) {
    const { xMin, xMax, yMin, yMax } = getBoundingBox(vertex1, vertex2, vertex3, width, height);
    for (let x = xMin; x < xMax; ++x) {
        for (let y = yMin; y < yMax; ++y) {
            const barycentricCoord = barycentric(x, y, vertex1, vertex2, vertex3);
            if (barycentricCoord.x < 0 ||
                barycentricCoord.y < 0 ||
                barycentricCoord.z < 0
            )
                continue;
            writeColor(frameData, x, y, width, lerp(barycentricCoord, Color.RED, Color.GREEN, Color.BLUE));
        }
    }
}

// 画网格
function drawMesh(modelMat: Mat4) {
    for (let i = 0; i < mesh.EBO.length; i += 3) {
        const v1 = mesh.VBO[mesh.EBO[i]];
        const v2 = mesh.VBO[mesh.EBO[i + 1]];
        const v3 = mesh.VBO[mesh.EBO[i + 2]];

        const mvp = mat4MulArr([projectionMat, viewMat, modelMat]);

        // local空间转换到clip空间
        // mvp变换
        const windowPos1 = vec4MulMat4(v1.position, mvp);
        const windowPos2 = vec4MulMat4(v2.position, mvp);
        const windowPos3 = vec4MulMat4(v3.position, mvp);

        NDC(windowPos1);
        NDC(windowPos2);
        NDC(windowPos3);

        const viewportMat = getViewPortVertex(width, height);

        // 视口变换
        vec4MulMat4(windowPos1, viewportMat, windowPos1);
        vec4MulMat4(windowPos2, viewportMat, windowPos2);
        vec4MulMat4(windowPos3, viewportMat, windowPos3);

        // 画三角形
        drawTriangle(windowPos1, windowPos2, windowPos3);
    }
}

// 屏幕坐标标准化
function NDC(position: Vec4) {
    position.standardize();
    position.z = (position.z + 1) * 0.5;
}

let angle = 0;
const update = () => {
    angle += 1;
    // 旋转
    const modelMat = mat4MulArr([
        Mat4.getRotationMat4X(angle),
        Mat4.getRotationMat4Y(angle),
        Mat4.getRotationMat4Z(angle),
    ]);
    clear(canvas, ctx, frameBuffer, Color.BLACK);
    drawMesh(modelMat);
    render(canvas, ctx, frameBuffer);
    requestAnimationFrame(update);
}
update();

