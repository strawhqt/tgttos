import {defs, tiny} from './examples/common.js';
import {Text_Line} from "./examples/text-demo.js";
const {
  Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const shapes = {
  cube: new defs.Cube(),
  triangle: new defs.Triangle(),
  egg: new defs.Subdivision_Sphere(4),
  text: new Text_Line(8),
}

const materials = {
  plastic: new Material(new defs.Phong_Shader(),
    {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
  cube: new Material(new defs.Phong_Shader(),
    {ambient: 0.8, diffusivity: 1, specularity: 0, color: hex_color("#ffffff")}),
  obstacle: new Material(new defs.Phong_Shader(),
    {ambient: 0.9, diffusivity: 1, specularity: 0, color: hex_color("#FFC0CB")}),
  ground: new Material(new defs.Phong_Shader(),
    {ambient: 1, diffusivity: 0, specularity: 0, color: hex_color("#B5ED5D")}),
  background: new Material(new defs.Phong_Shader(),
    {ambient: 1, diffusivity: 0, specularity: 0, color: hex_color("#009dc4")}),
  egg: new Material(new defs.Phong_Shader(),
    {ambient: 0.8, diffusivity: 1, specularity: 0, color: hex_color("#ffffff")}),
  text_image: new Material(new defs.Textured_Phong(1), {
    ambient: 1, diffusivity: 0, specularity: 0,
    texture: new Texture("assets/text.png")}),
}


function backAndForth(model_transform, x, y, z) {
  return Mat4.translation(-x, -y, -z).times(model_transform).times(Mat4.translation(x, y, z));
}
export function drawChicken(context, program_state, model_transform, dead, wing_angle) {

  const dead_transform = dead ? Mat4.rotation(Math.PI / 2, 0, 0,  1) : Mat4.identity();
  if (dead) wing_angle = 0;

  const body_transform = backAndForth(Mat4.scale(0.6, 0.6, 0.75), 0, 1, 0).times(dead_transform);

  const head_transform = body_transform
    .times(Mat4.translation(0, 1, -1))
    .times(Mat4.scale(1, 0.7, 0.7))
    .times(Mat4.translation(0, 1, 1));
  // const wing_angle = moving ? Math.PI / 2 : 0;
  const right_wing_transform = body_transform
    .times(Mat4.translation(1, -0.2, 0.1))
    .times(Mat4.scale(1, 0.6, 0.7))
    .times(backAndForth(Mat4.rotation(wing_angle, 0, 0, 1), 0.2, -1, 0))
    .times(Mat4.scale(0.2, 1, 1))
  ;
  const left_wing_transform = body_transform
    .times(Mat4.translation(-1, -0.2, -0.1))
    .times(Mat4.scale(1, 0.6, 0.7))
    .times(backAndForth(Mat4.rotation(-wing_angle, 0, 0, 1), -0.2, -1, 0))
    .times(Mat4.scale(0.2, 1, 1))
  ;
  const eye_transform = head_transform
    .times(Mat4.translation(0, 0.1, -0.2))
    .times(Mat4.scale(1.04, 0.2, 0.2));
  const hat_transform = body_transform
    .times(Mat4.translation(0, 3.4, 0.2))
    .times(backAndForth(Mat4.scale(0.3, 0.2, 0.4), 0, 1, 1))
  const beak_transform = body_transform
    .times(Mat4.translation(0, 1.7, -2))
    .times(backAndForth(Mat4.scale(1, 1, 0.2), 0, 0, -1))
    .times(Mat4.scale(0.3, 0.4, 1));
  const wattle_transform = body_transform
    .times(Mat4.translation(0, 0.8, -2))
    .times(backAndForth(Mat4.scale(0.2, 0.8, 0.13), 0, -1, -1))
  shapes.cube.draw(context, program_state, model_transform.times(body_transform), materials.cube);
  shapes.cube.draw(context, program_state, model_transform.times(head_transform), materials.cube);
  shapes.cube.draw(context, program_state, model_transform.times(right_wing_transform), materials.cube);
  shapes.cube.draw(context, program_state, model_transform.times(left_wing_transform), materials.cube);
  shapes.cube.draw(context, program_state, model_transform.times(eye_transform), materials.cube.override({color: vec4(0, 0, 0, 1)}));
  shapes.cube.draw(context, program_state, model_transform.times(hat_transform), materials.cube.override({color: vec4(1, 0, 0, 1)}));
  shapes.cube.draw(context, program_state, model_transform.times(beak_transform), materials.cube.override({color: hex_color('#FFA500')}));
  shapes.cube.draw(context, program_state, model_transform.times(wattle_transform), materials.cube.override({color: vec4(1, 0, 0, 1)}));
}

export function drawLane(context, program_state, model_transform, color) {
  // shapes.score.set_string("sadaf", context);
  // shapes.score.draw(context, program_state, model_transform, materials.text_image);
  shapes.cube.draw(context, program_state, model_transform, materials.ground.override({color: color}));
}

export function drawObstacle(context, program_state, model_transform, color) {
  shapes.cube.draw(context, program_state, model_transform, materials.obstacle.override({color: color}));
}

export function drawBackground(context, program_state, model_transform) {
  model_transform = Mat4.translation(0, -4, 0)
    .times(model_transform)
    .times(Mat4.scale(120, 1, 120))
  ;
  shapes.cube.draw(context, program_state, model_transform, materials.background);
}

export function drawEgg(context, program_state, model_transform) {
  // model_transform = model_transform
  //   .times(Mat4.translation(0, 0, 1));
  const egg_model = model_transform
    .times(Mat4.scale(0.8, 1, 0.8))
    .times(Mat4.translation(0, 0, 1));
  // shapes.egg.draw(context, program_state, egg_base_model, materials.egg);
  shapes.egg.draw(context, program_state, egg_model, materials.egg);
}

export function drawScore(context, program_state, z, score) {
  const text_model_transform = Mat4.translation(0, 0, -z)
    .times(Mat4.translation(-14, 15.5, 0))
    .times(Mat4.rotation(-Math.PI / 6.5, 1, 0, 0))
  ;
  shapes.text.set_string(score, context.context);
  shapes.text.draw(context, program_state, text_model_transform, materials.text_image);
}