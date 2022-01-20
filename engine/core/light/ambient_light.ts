import { Color } from "../../base/color";
import { Light } from "./light";

export class AmbientLight extends Light {
    private _strength: number;
    public getAmbientStrength(): number {
        return this._strength;
    }
    public setAmbientStrength(strength: number) {
        this._strength = strength;
    }

    public getColor(): Color {
        const { _color, _strength } = this;
        return _color.clone().mul3(_strength);
    }
}