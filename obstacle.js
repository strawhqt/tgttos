import {defs, tiny} from './examples/common.js';
import * as models from './models.js';

const {
  Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Obstacle {
  constructor(model_transform, x_bound, x_radius, z_radius, start_offset, z_offset) {
    this.x_bound = x_bound; // lane bound
    this.x_radius = x_radius;
    this.z_radius = z_radius;
    this.start_offset = start_offset;
    this.x_pos = this.start_offset;
    this.z_offset = z_offset;
    this.transform = Mat4.identity().times(Mat4.translation(this.start_offset, 0, model_transform[2][3] + z_offset));
    // const r = Math.random() * 127 + 127;
    // const g = Math.random() * 127 + 127;
    // const b = Math.random() * 127 + 127;
    // this.color = color(r / 255, g / 255, b / 255, 1);
  }

  handle_position(dt) {
  }

  on_obstacle_collision(other_x, other_z, other_speed, other_dir) {
  }

  on_bound_collision() {
  }

  on_chicken_collision(chicken, x_dist) {
  }

}

export class MovingObstacle extends Obstacle {
  constructor(model_transform, x_bound, x_radius, z_radius, start_offset, z_offset = 0) {
    super(model_transform, x_bound, x_radius, z_radius, start_offset, z_offset)
    this.speed = Math.random() * (20 - 10) + 10; // max speed = 30, min speed = 10
    this.direction = Math.round(Math.random()) ? 1 : -1;
    this.angle = this.direction === 1 ? 0 : Math.PI;
  }

  handle_position(dt) {
    this.x_pos += this.speed * dt * this.direction;
    // hitting sides of lane
    if (this.x_pos <= -this.x_bound + this.x_radius || this.x_pos >= this.x_bound - this.x_radius) {
      this.on_bound_collision(this.x_bound);
    }
  }

  on_obstacle_collision(other_obs) {
    const min_x_dist = this.x_radius + other_obs.x_radius;
    if (other_obs.x_pos < this.x_pos)
      this.x_pos = other_obs.x_pos + min_x_dist;
    else
      this.x_pos = other_obs.x_pos - min_x_dist; // force apart because buggy af otherwise

    if (other_obs instanceof MovingObstacle) {
      [this.speed, other_obs.speed, this.direction, other_obs.direction] =
        [other_obs.speed, this.speed, other_obs.direction, this.direction]
    }
  }

  on_bound_collision() {
    // outside left bound
    if (this.x_pos <= -this.x_bound + this.x_radius) {
      this.x_pos = -this.x_bound + this.x_radius;
      this.direction = 1;
    }
    // outside right bound
    else {
      this.x_pos = this.x_bound - this.x_radius;
      this.direction = -1;
    }
  }

  on_chicken_collision(chicken) {
    const x = chicken.transform[0][3];
    const min_x = chicken.x_rad + this.x_radius;
    if (this.x_pos - x < 0) {
      this.direction = -1;
      this.x_pos = x - min_x;
    } else {
      this.direction = 1;
      this.x_pos = x + min_x;
    }
    if (!chicken.invincible)
      chicken.dead = true;
  }
}

export class Car extends MovingObstacle {
  constructor(model_transform, x_bound, start_offset, z_offset = 0) {
    super(model_transform, x_bound, 3, 2, start_offset, z_offset);
    this.color_palettes = {
      0: [hex_color("#fd6e30"), hex_color("#ff4c2b")],
      1: [hex_color("#8077a2"), hex_color("#6b5c95")],
      2: [hex_color("#1ec3f4"), hex_color("#07a3e5")],
    }
    this.color = this.color_palettes[Math.floor(Math.random() * 3)];
  }
}