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
    {ambient: 1, diffusivity: .6, color: hex_color("#ffffff")}),
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
    texture: new Texture("assets/text.png")
  }),
}


function backAndForth(model_transform, x, y, z) {
  return Mat4.translation(-x, -y, -z).times(model_transform).times(Mat4.translation(x, y, z));
}

export function drawChicken(context, program_state, model_transform, dead, wing_angle) {

  const dead_transform = dead ? Mat4.rotation(Math.PI / 2, 0, 0, 1) : Mat4.identity();
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

export function drawCar(context, program_state, model_transform, color1 = hex_color("#ffffff"), color2 = hex_color("#ffffff")) {
  let height = 0.4; // height of the middle portion
  let length = 3;
  let width = 2;
  let ground_pos = -2 * height;

  const body_transform = Mat4.identity()
    .times(Mat4.translation(0, 3.5 * height + ground_pos, 0))
    .times(Mat4.scale(length, height, width));

  const middle_body_transform = body_transform
    .times(Mat4.scale(1.001, 1.001, 0.4));

  const light_transform = body_transform
    .times(Mat4.scale(1.002, 0.6, 0.125));

  const light_transform_left = Mat4.translation(0, -0.4 * height, 0.53 * width).times(light_transform);
  const light_transform_right = Mat4.translation(0, -0.4 * height, -0.53 * width).times(light_transform);

  const lower_body_1 = Mat4.identity()
    .times(Mat4.translation(0, 2 * height + ground_pos, 0))
    .times(Mat4.scale(length, 0.5 * height, width));

  const lower_body_2 = Mat4.identity()
    .times(Mat4.translation(0, height + ground_pos,0))
    .times(Mat4.scale(length, 0.5 * height, 0.3 * width));

  const lower_body_2_right = Mat4.translation(0, 0, 0.7 * width).times(lower_body_2);
  const lower_body_2_left = Mat4.translation(0, 0, -0.7 * width).times(lower_body_2);

  const upper_body_transform = Mat4.identity()
    .times(Mat4.translation(-0.15 * length, 6.25 * height + ground_pos, 0))
    .times(Mat4.scale(0.5 * length, 1.75 * height, width));

  const side_window_transform = Mat4.translation(0, -0.52 * height, 0)
    .times(upper_body_transform)
    .times(Mat4.scale(0.8, 0.7, 1.001));

  const front_back_window_transform = Mat4.translation(0, -0.52 * height, 0)
    .times(upper_body_transform)
    .times(Mat4.scale(1.001, 0.7, 0.8));

  const mirror_transform = Mat4.translation(0.05 * length,0.3 * height,0)
    .times(body_transform)
    .times(Mat4.scale(0.15, 0.6, 1.2));

  const wheel_transform = body_transform
    .times(Mat4.scale(0.2, 1.5, 0.301));

  const wheel_front_right_transform = Mat4.translation(0.5 * length, -height * 2.5, 0.7 * width).times(wheel_transform);
  const wheel_front_right_aux_transform = wheel_front_right_transform.times(Mat4.scale(0.33, 0.33, 1.01));
  const wheel_front_left_transform = Mat4.translation(0.5 * length, -height * 2.5, -0.7 * width).times(wheel_transform);
  const wheel_front_left_aux_transform = wheel_front_left_transform.times(Mat4.scale(0.33, 0.33, 1.01));
  const wheel_back_right_transform = Mat4.translation(-0.5 * length, -height * 2.5, 0.7 * width).times(wheel_transform);
  const wheel_back_right_aux_transform = wheel_back_right_transform.times(Mat4.scale(0.33, 0.33, 1.01));
  const wheel_back_left_transform = Mat4.translation(-0.5 * length, -height * 2.5, -0.7 * width).times(wheel_transform);
  const wheel_back_left_aux_transform = wheel_back_left_transform.times(Mat4.scale(0.33, 0.33, 1.01));

  shapes.cube.draw(context, program_state, model_transform.times(body_transform), materials.plastic.override({color: color1}));
  shapes.cube.draw(context, program_state, model_transform.times(middle_body_transform), materials.plastic.override({color: color2}));
  shapes.cube.draw(context, program_state, model_transform.times(light_transform_right), materials.plastic.override({color: hex_color("#ffffff")}));
  shapes.cube.draw(context, program_state, model_transform.times(light_transform_left), materials.plastic.override({color: hex_color("#ffffff")}));
  shapes.cube.draw(context, program_state, model_transform.times(lower_body_1), materials.plastic.override({color: color2}));
  shapes.cube.draw(context, program_state, model_transform.times(lower_body_2_left), materials.plastic.override({color: hex_color("#645a8b")}));
  shapes.cube.draw(context, program_state, model_transform.times(lower_body_2_right), materials.plastic.override({color: hex_color("#645a8b")}));
  shapes.cube.draw(context, program_state, model_transform.times(upper_body_transform), materials.plastic.override({color: hex_color("#ffffff")}));
  shapes.cube.draw(context, program_state, model_transform.times(mirror_transform), materials.plastic.override({color: color2}));
  shapes.cube.draw(context, program_state, model_transform.times(side_window_transform), materials.plastic.override({color: hex_color("#000000")}));
  shapes.cube.draw(context, program_state, model_transform.times(front_back_window_transform), materials.plastic.override({color: hex_color("#000000")}));
  shapes.cube.draw(context, program_state, model_transform.times(wheel_front_right_transform), materials.plastic.override({color: hex_color("#000000")}));
  shapes.cube.draw(context, program_state, model_transform.times(wheel_front_left_transform), materials.plastic.override({color: hex_color("#000000")}));
  shapes.cube.draw(context, program_state, model_transform.times(wheel_back_right_transform), materials.plastic.override({color: hex_color("#000000")}));
  shapes.cube.draw(context, program_state, model_transform.times(wheel_back_left_transform), materials.plastic.override({color: hex_color("#000000")}));
  shapes.cube.draw(context, program_state, model_transform.times(wheel_front_right_aux_transform), materials.plastic.override({color: hex_color("#ffffff")}));
  shapes.cube.draw(context, program_state, model_transform.times(wheel_front_left_aux_transform), materials.plastic.override({color: hex_color("#ffffff")}));
  shapes.cube.draw(context, program_state, model_transform.times(wheel_back_right_aux_transform), materials.plastic.override({color: hex_color("#ffffff")}));
  shapes.cube.draw(context, program_state, model_transform.times(wheel_back_left_aux_transform), materials.plastic.override({color: hex_color("#ffffff")}));
}

export function drawLane(context, program_state, model_transform, color) {
  // shapes.score.set_string("sadaf", context);
  // shapes.score.draw(context, program_state, model_transform, materials.text_image);
  shapes.cube.draw(context, program_state, model_transform, materials.ground.override({color: color}));
}

export function drawObstacle(context, program_state, model_transform, color) {
  shapes.cube.draw(context, program_state, model_transform, materials.obstacle.override({color: color}));
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

// export function drawScore(context, program_state, z, score) {
//   const text_model_transform = Mat4.translation(0, 0, -z)
//     .times(Mat4.translation(-14, 15.5, 0))
//     .times(Mat4.rotation(-Math.PI / 6.5, 1, 0, 0))
//   ;
//   shapes.text.set_string(score, context.context);
//   shapes.text.draw(context, program_state, text_model_transform, materials.text_image);
// }