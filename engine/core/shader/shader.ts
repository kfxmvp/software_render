import { Color } from "../../base/color";
import { Mat4 } from "../../base/mat4";
import { CalcUtil } from "../../base/util/calc";
import { Vertex } from "../../base/vertex";
import { AmbientLight } from "../light/ambient_light";
import { Light } from "../light/light";
import { Loader } from "../loader/loader";
import { Texture } from "../texture";
import { Vert2Frag } from "./vertex_to_fragment";

export type ShaderUniform = Record<string, any>;
export class Shader {
    constructor(uniform?: ShaderUniform) {
        if (uniform) this._uniform = uniform;
        else this._uniform = {};
    }

    private _uniform: ShaderUniform;
    public addUniform(key: string, value: any) {
        if (this._uniform[key]) return;
        this._uniform[key] = value;
    }
    public getUniform(key: string) {
        return this._uniform[key];
    }
    public modifyUniform(key: string, value: any) {
        this._uniform[key] = value;
    }

    // 模型矩阵
    private _modelMatrix: Mat4;
    public set modelMatrix(matrix: Mat4) {
        this._modelMatrix = matrix;
    }
    public get modelMatrix(): Mat4 {
        return this._modelMatrix;
    }

    // 观察矩阵
    private _viewMatrix: Mat4;
    public set viewMatrix(matrix: Mat4) {
        this._viewMatrix = matrix;
    }
    public get viewMatrix(): Mat4 {
        return this._viewMatrix;
    }

    // 投影矩阵
    private _projectionMatrix: Mat4;
    public set projectionMatrix(matrix: Mat4) {
        this._projectionMatrix = matrix;
    }
    public get projectionMatrix(): Mat4 {
        return this._projectionMatrix;
    }

    private _texture: Texture;
    public async setTextureWithPath(path: string) {
        if (!this._texture) this._texture = new Texture();
        const imageData = await Loader.loadImage(path);
        this._texture.setImageData(imageData)
    }
    public setTexture(texture: Texture) {
        if (!this._texture) this._texture = new Texture();
        this._texture.setImageData(texture.imageData);
    }

    /**顶点着色 */
    public vertexShader(vertex: Vertex): Vert2Frag {
        const { modelMatrix, viewMatrix, projectionMatrix } = this;
        const { position, color, normal, u, v } = vertex;
        const v2f = new Vert2Frag();

        // mvp矩阵 左乘
        const mvpVertex = CalcUtil.mat4MulArr([
            projectionMatrix,
            viewMatrix,
            modelMatrix
        ]);

        // 世界坐标
        v2f.wordPosition = CalcUtil.vec4MulMat4(position, modelMatrix);
        // 裁切空间坐标
        v2f.windowPosition = CalcUtil.vec4MulMat4(position, mvpVertex);
        v2f.color = color?.clone();
        v2f.normal = normal?.clone();
        v2f.u = u;
        v2f.v = v;

        //投影之后 w=-z, 所以直接取Z=-1/w即可
        v2f.Z = -1 / v2f.windowPosition.w;
        v2f.wordPosition?.mul4(v2f.Z);
        v2f.color?.mul4(v2f.Z);
        v2f.normal?.mul3(v2f.Z);
        v2f.u *= v2f.Z;
        v2f.v *= v2f.Z;

        v2f.normal = CalcUtil.vec4MulMat4(v2f.normal.clone(), this._getNormalMatrix()).normalize();

        return v2f;
    }

    /**片源着色 */
    public fragmentShader(vert2frag: Vert2Frag): Color {
        const color = new Color();
        if (!!this._texture) color.setWithColor(this._texture.getColorWithUV(vert2frag.u, vert2frag.v))
        else color.setWithColor(vert2frag.color)

        const ambientLight = this.getUniform('ambient') as AmbientLight;
        let ambient: Color;
        let diffuse: Color;
        const light = this.getUniform('light') as Light;
        if (ambientLight) {
            ambient = ambientLight.getColor();
        }
        if (light) {
            //片元到光的反向，拿光的位置减去片元的位置即worldPos
            const lightDir = light.getPosition().sub(vert2frag.wordPosition).normalize();
            //用法向量 点乘 片元到光的方向 就是余弦值
            const cos = vert2frag.normal.dot(lightDir);
            //漫反射
            diffuse = light.getColor().clone().mul3(Math.max(cos, 0));
        }
        if (ambient && diffuse) {
            color.mul(ambient.add(diffuse), color)
        }
        else if (ambient) {
            color.mul(ambient, color);
        }
        return color;
    }

    private _getNormalMatrix(): Mat4 {
        const res = this._modelMatrix.invert();
        res.transpose();
        return res;
    }
}