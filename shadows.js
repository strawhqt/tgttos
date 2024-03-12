import {defs, tiny} from './examples/common.js';

const {
  Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

function drawShadowHelper(light_x, light_y, light_z, point_x, point_y, point_z) {
  let shadow_transform = Mat4.identity();
  shadow_transform[2][0] = -light_x / light_y;
  shadow_transform[2][1] = -light_z / light_z;
  shadow_transform[2][2] = 0;

  let point = vec4(point_x, point_y, point_z, 1);
  return point.times(shadow_transform);
}
export function drawShadow(light_x, light_y, light_z, model_transform, radius) {
  const center = [model_transform[0][3], model_transform[1][3], model_transform[2][3]];
  drawShadow(0, 20, 10)
}