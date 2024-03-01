import {defs, tiny} from './examples/common.js';
const {
  Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Models {
  constructor() {
    this.shapes = {
      cube: new defs.Cube(),
      triangle: new defs.Triangle(),
    }
    this.materials = {
      plastic: new Material(new defs.Phong_Shader(),
        {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
      cube: new Material(new defs.Phong_Shader(),
        {ambient: 0.2, diffusivity: 1, specularity: 1, color: hex_color("#ffffff")}),
      ground: new Material(new defs.Phong_Shader(),
        {ambient: 1, diffusivity: 0, specularity: 0, color: hex_color("#B5ED5D")}),
    };
  }

  drawChicken(context, program_state, model_transform) {
    this.shapes.cube.draw(context, program_state, model_transform, this.materials.cube);
  }

  drawGround(context, program_state, model_transform) {
    this.shapes.cube.draw(context, program_state, model_transform, this.materials.ground);
  }
}