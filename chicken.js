import {defs, tiny} from './examples/common.js';
import * as models from './models.js';

const {
  Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;
export class Chicken {
  constructor(x_bound, z_bound) {
    this.moving_left = false;
    this.moving_right = false;
    this.moving_forward = false;
    this.moving_back = false;
    this.speed = 40;
    this.x_bound = x_bound; // how far left and right player can move
    this.z_bound = -100;
    this.transform = Mat4.identity();
    this.angle = 0;
    this.start_move_time = 0;
    this.tweak_angle = 0;
    this.eggs = [];
    this.height = 0;
    this.invincible = false;
    this.dead = false;
    this.x_rad = 0.6;
    this.z_rad = 0.75;
  }

  draw(context, program_state) {
    const chicken_model_transform = this.transform
      .times(Mat4.rotation(this.angle, 0, 1, 0))
      .times(Mat4.translation(0, this.height, 0));
    models.drawChicken(context, program_state, chicken_model_transform, this.dead, this.tweak_angle)
  }

  handle_movement(t, dt) {
    if (this.dead) return;
    const x_pos = this.transform[0][3];
    const z_pos = -this.transform[2][3];

    const x_trans = (x_pos >= this.x_bound && this.moving_right - this.moving_left > 0) || (x_pos <= -this.x_bound && this.moving_right - this.moving_left < 0)
      ? 0 : (this.moving_right - this.moving_left) * this.speed * dt;
    const z_trans = (z_pos <= this.z_bound && this.moving_forward - this.moving_back < 0)
      ? 0 : (this.moving_back - this.moving_forward) * this.speed * dt;

    if (this.moving_left - this.moving_right > 0) this.angle = Math.PI / 2;
    else if (this.moving_right - this.moving_left > 0) this.angle = -Math.PI / 2
    if (this.moving_forward - this.moving_back > 0) this.angle = 0;
    else if (this.moving_back - this.moving_forward > 0) this.angle = Math.PI;
    this.x_rad = this.angle === 0 || this.angle === Math.PI ? 0.6 : 0.75;
    this.z_rad = this.angle === 0 || this.angle === Math.PI ? 0.75 : 0.6;

    const moving = this.moving_left || this.moving_right || this.moving_forward || this.moving_back;
    if (moving) {
      if (!this.start_move_time)
        this.start_move_time = t;
      this.tweak_angle = Math.PI / 3 * (Math.sin(60 * (t - this.start_move_time) - Math.PI / 2) + 2) / 2;
      this.height = 0.5 * (Math.sin(34 * (t - this.start_move_time) - Math.PI / 2) + 1)
    } else {
      this.start_move_time = 0;
      this.tweak_angle = 0;
      this.height = 0;
    }

    this.transform = Mat4.translation(x_trans, 0, z_trans)
      .times(this.transform);
  }
}
