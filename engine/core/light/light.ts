import { Color } from "../../base/color";
import { Vec4 } from "../../base/vec4";

export class Light {
    /**光源位置 */
    protected _position: Vec4;
    public getPosition(): Vec4 {
        return this._position;
    }
    public setPosition(position: Vec4) {
        if (!this._position) this._position = position.clone()
        else this._position.set(position.x, position.y, position.z, position.w);
    }

    /**光源方向 */
    protected _direction: Vec4;
    public getDirection() {
        return this._direction;
    }
    public setDirection(direction: Vec4) {
        if (!this._direction) this._direction = direction.clone()
        else this._direction.set(direction.x, direction.y, direction.z, direction.w);
    }

    /**光源颜色 */
    protected _color: Color;
    public getColor() {
        return this._color.clone().mul3(this._intensity);
    }
    public setColor(color: Color) {
        if (!this._color) this._color = color.clone()
        else this._color.set(color.r, color.g, color.b, color.a);
    }

    /**漫反射颜色 */
    protected _diffuseColor: Color;
    public getDiffuseColor(): Color {
        return this._diffuseColor;
    }
    public setDiffuseColor(color: Color) {
        if (!this._diffuseColor) this._diffuseColor = color.clone()
        else this._diffuseColor.set(color.r, color.g, color.b, color.a);
    }

    /**镜面光颜色 */
    protected _specularColor: Color;
    public getSpecularColor(): Color {
        return this._specularColor;
    }
    public setSpecularColor(color: Color) {
        if (!this._specularColor) this._specularColor = color.clone()
        else this._specularColor.set(color.r, color.g, color.b, color.a);
    }

    /**强度 */
    protected _intensity: number;
    public getIntensity(): number {
        return this._intensity;
    }
    public setIntensity(intensity: number) {
        this._intensity = intensity;
    }

    public calc(): Color {
        return;
    }

    constructor() {
        this._position = new Vec4();
        this._direction = new Vec4();
        this._color = Color.WHITE.clone();
        this._diffuseColor = new Color();
        this._specularColor = new Color();
        this._intensity = 1;
    }
}