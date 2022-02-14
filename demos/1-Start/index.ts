export class Color {
    r: number;
    g: number;
    b: number;
    a: number;
    constructor(r: number = 255, g: number = 255, b: number = 255, a: number = 255) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
}

export class Vec4 {
    x: number;
    y: number;
    z: number;
    w: number;
    constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
}

// canvas画布
export function getCanvas(): HTMLCanvasElement {
    const canvas: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
    return canvas;
}

// canvas 2d上下文
export function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d');
    return ctx;
}

// canvas像素数据 
export function createFrameBuffer(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): ImageData {
    const imageData: ImageData = ctx.createImageData(canvas.width, canvas.height);
    return imageData;
}

// canvas像素数据数组
export function getFrameBufferData(imageData: ImageData) {
    return imageData?.data;
}

// 根据x列+y行,获取像素值在imageData中的真实index
export function getIndex(x: number, y: number, width: number): number {
    return (x + y * width) * 4;
}

// 将像素数据放回canvas 达到渲染到canvas的效果
export function render(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, imageData: ImageData) {
    ctx.putImageData(imageData, 0, 0);
}

// 清除canvas颜色
export function clear(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, imageData: ImageData) {
    const frameData = getFrameBufferData(imageData);
    const { width, height } = canvas;
    for (let x = 0; x < width; ++x) {
        for (let y = 0; y < height; ++y) {
            const index = getIndex(x, y, width);
            frameData[index] = 255;
            frameData[index + 1] = 255;
            frameData[index + 2] = 255;
            frameData[index + 3] = 255;
        }
    }
}



export function readColor(frameBufferData: Uint8ClampedArray, x: number, y: number, width: number): Color {
    const index = getIndex(x, y, width);
    return new Color(
        frameBufferData[index],
        frameBufferData[index + 1],
        frameBufferData[index + 2],
        frameBufferData[index + 3])
}

export function writeColor(frameBufferData: Uint8ClampedArray, x: number, y: number, width: number, color: Color) {
    const index = getIndex(x, y, width);
    const { r, g, b, a } = color;
    frameBufferData[index] = r;
    frameBufferData[index + 1] = g;
    frameBufferData[index + 2] = b;
    frameBufferData[index + 3] = a;
}

// 向量叉乘
export function vectorCross2Num(pos1: Vec4, pos2: Vec4) {
    return pos1.x * pos2.y - pos2.x * pos1.y;
}

// 向量1减向量2 得到向量21
export function vectorSub(vec1: Vec4, vec2: Vec4) {
    return new Vec4(vec1.x - vec2.x, vec1.y - vec2.y);
}

// 计算屏幕任意点(x,y,z)的重心坐标
export function barycentric(x: number, y: number, pos1: Vec4, pos2: Vec4, pos3: Vec4): Vec4 {
    // 向量12
    const v12 = vectorSub(pos2, pos1);
    // 向量13
    const v13 = vectorSub(pos3, pos1);
    // 整个三角形的面积
    const s = vectorCross2Num(v12, v13) / 2;
    // 如果面积为0 表示至少有两个点共线 返回
    if (s === 0) return new Vec4(-1, -1, -1);

    // 向量p1
    const vp1 = new Vec4(x - pos1.x, y - pos1.y);
    // 向量p2
    const vp2 = new Vec4(x - pos2.x, y - pos2.y);
    // 向量p3
    const vp3 = new Vec4(x - pos3.x, y - pos3.y);

    const alpha = vectorCross2Num(vp2, vp3) / 2 / s;
    const beta = vectorCross2Num(vp3, vp1) / 2 / s;

    // alpha + beta + gamma = 1 重心坐标的定义
    const gamma = 1 - alpha - beta;

    return new Vec4(alpha, beta, gamma, 0);
}

export function lerp(barycentricCoord: Vec4, color1: Color, color2: Color, color3: Color): Color {
    return new Color(
        color1.r * barycentricCoord.x + color2.r * barycentricCoord.x + color3.r * barycentricCoord.x,
        color1.g * barycentricCoord.y + color2.g * barycentricCoord.y + color3.g * barycentricCoord.y,
        color1.b * barycentricCoord.z + color2.b * barycentricCoord.z + color3.b * barycentricCoord.z,
        255
    )
}

// 获取AABB包围盒
export function getBoundingBox(pos1: Vec4, pos2: Vec4, pos3: Vec4, width: number, height: number) {
    return {
        xMin: Math.round(Math.max(0, Math.min(pos1.x, pos2.x, pos3.x))),
        xMax: Math.round(Math.min(Math.max(pos1.x, pos2.x, pos3.x), width)),
        yMin: Math.round(Math.max(0, Math.min(pos1.y, pos2.y, pos3.y))),
        yMax: Math.round(Math.min(Math.max(pos1.y, pos2.y, pos3.y), height))
    }
}


const canvas = getCanvas();
const ctx = getContext(canvas);
const frameBuffer = createFrameBuffer(canvas, ctx);
const frameData = getFrameBufferData(frameBuffer);
clear(canvas, ctx, frameBuffer);

const { width, height } = canvas;

// 画坐标系
// for (let x = 0; x < width; ++x) {
//     for (let y = 0; y < height; ++y) {
//         const index = getIndex(x, y, width);
//         // x轴
//         if (y == 0) {
//             writeColor(frameData, x, y, width, new Color(255 * x / width, 0, 0, 255));
//         }
//         // y轴
//         if (x == 0) {
//             writeColor(frameData, x, y, width, new Color(0, 255 * y / height, 0, 255));
//         }
//     }
// }

// 画渐变三角形
const v1 = new Vec4(0, 0);
const v2 = new Vec4(300, 0);
const v3 = new Vec4(150, 150);
const RED = new Color(255, 0, 0, 255);
const GREEN = new Color(0, 255, 0, 255);
const BLUE = new Color(0, 0, 255, 255);
const { xMin, xMax, yMin, yMax } = getBoundingBox(v1, v2, v3, width, height);
for (let x = xMin; x < xMax; ++x) {
    for (let y = yMin; y < yMax; ++y) {
        const barycentricCoord = barycentric(x, y, v1, v2, v3);
        if (barycentricCoord.x < 0 ||
            barycentricCoord.y < 0 ||
            barycentricCoord.z < 0
        )
            continue;
        writeColor(frameData, x, y, width, lerp(barycentricCoord, RED, GREEN, BLUE));
    }
}

render(canvas, ctx, frameBuffer);
