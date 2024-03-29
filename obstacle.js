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
    this.z_pos = -(model_transform[2][3] + z_offset);
    this.transform = Mat4.identity().times(Mat4.translation(this.start_offset, 0, -this.z_pos));
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

  on_chicken_collision(chicken) {
  }

}

export class MovingObstacle extends Obstacle {
  constructor(model_transform, x_bound, x_radius, z_radius, start_offset, z_offset = 0, max_speed, min_speed) {
    super(model_transform, x_bound, x_radius, z_radius, start_offset, z_offset);
    this.speed = Math.random() * (max_speed - min_speed) + min_speed;
    this.direction = Math.round(Math.random()) ? 1 : -1;
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
      this.x_pos = other_obs.x_pos - min_x_dist;
    // force apart because buggy af otherwise
    // note that collision won't trigger for the other obstacle because they're no longer overlapping
    if (other_obs instanceof MovingObstacle) {
      [this.speed, other_obs.speed, this.direction, other_obs.direction] =
        [other_obs.speed, this.speed, other_obs.direction, this.direction]
    }
    else if (other_obs instanceof StationaryObstacle) {
      this.direction = -this.direction;
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
    // const x = chicken.transform[0][3];
    // const min_x = chicken.x_rad + this.x_radius;
    // if (this.x_pos - x < 0) {
    //   this.direction = -1;
    //   this.x_pos = x - min_x;
    // } else {
    //   this.direction = 1;
    //   this.x_pos = x + min_x;
    // }
    if (!chicken.invincible)
      chicken.dead = true;
  }
}

export class Car extends MovingObstacle {
  constructor(model_transform, x_bound, start_offset, z_offset = 0, max_speed, min_speed) {
    super(model_transform, x_bound, 3, 2.5, start_offset, z_offset, max_speed, min_speed);
    this.color_palettes = {
      0: [hex_color("#fd6e30"), hex_color("#ff4c2b")],
      1: [hex_color("#8077a2"), hex_color("#6b5c95")],
      2: [hex_color("#1ec3f4"), hex_color("#07a3e5")],
    }
    this.color = this.color_palettes[Math.floor(Math.random() * 3)];
  }
}

export class StationaryObstacle extends Obstacle {
  constructor(model_transform, x_bound, start_offset, z_offset) {
    super(model_transform, x_bound, 1.8, 1.8, start_offset, z_offset);
    const rand = Math.random();
    if (rand < 0.2)
      this.height = 1;
    else if (rand < 0.25)
      this.height = 3;
    else if (rand < 0.26)
      this.height = 4 + Math.random() * 5;
    else
      this.height = 2;
  }


  on_chicken_collision(chicken) {
    const min_x = this.x_radius + chicken.x_rad;
    const min_z = this.z_radius + chicken.z_rad;
    // console.log(Math.abs(this.x_pos - chicken.x_pos) - min_x);

    const left = chicken.moving_left > chicken.moving_right;
    const right = chicken.moving_left < chicken.moving_right;
    const down = chicken.angle === Math.PI;
    const up = chicken.angle === 0;

    if (right && (down || up) || left && (down || up)) { // if diagonal, use more advanced edge detection
      const chicken_old_x = chicken.transform[0][3];
      const chicken_old_z = -chicken.transform[2][3];
      // TL, TR, BL, BR
      const corner_x = [this.x_pos - this.x_radius, this.x_pos + this.x_radius, this.x_pos - this.x_radius, this.x_pos + this.x_radius];
      const corner_z = [this.z_pos + this.z_radius, this.z_pos + this.z_radius, this.z_pos - this.z_radius, this.z_pos - this.z_radius]
      let corner_dists = [];
      for (let i = 0; i < 4; i++) {
        const x = corner_x[i];
        const z = corner_z[i];
        const dist = Math.sqrt(Math.pow(chicken_old_z - z, 2) + Math.pow(chicken_old_x - x, 2));
        corner_dists.push({corner: i, dist: dist});
      }

      corner_dists.sort((a, b) => {return a.dist - b.dist});
      const corner_1 = corner_dists[0].corner;
      const corner_2 = corner_dists[1].corner;
      let edge = -1;
      // edges: L, R, T, B
      if ((corner_1 === 0 || corner_1 === 1) && (corner_2 === 0 || corner_2 === 1))
        edge = 2; // top edge
      if ((corner_1 === 0 || corner_1 === 2) && (corner_2 === 0 || corner_2 === 2))
        edge = 0; // left edge
      if ((corner_1 === 1 || corner_1 === 3) && (corner_2 === 1 || corner_2 === 3))
        edge = 1; // right edge
      if ((corner_1 === 2 || corner_1 === 3) && (corner_2 === 2 || corner_2 === 3))
        edge = 3; // bottom edge
      switch(edge) {
        case 0: // left edge
          chicken.x_pos = this.x_pos - min_x;
          break;
        case 1: // right edge
          chicken.x_pos = this.x_pos + min_x;
          break;
        case 2: // top edge
          chicken.z_pos = this.z_pos + min_z;
          break;
        case 3: // bottom edge
          chicken.z_pos = this.z_pos - min_z;
          break;
      }
      // const edges = ["left", "right", "top", "bottom"]
      // console.log(edges[edge])
    } else {
      switch(chicken.angle) {
        case 0:             // chicken moving forward
          chicken.z_pos = this.z_pos - min_z;
          break;
        case Math.PI / 2:   // chicken moving left
          chicken.x_pos = this.x_pos + min_x;
          break;
        case -Math.PI / 2:  // chicken moving right
          chicken.x_pos = this.x_pos - min_x;
          break;
        case Math.PI:       // chicken moving down
          chicken.z_pos = this.z_pos + min_z;
          break;
      }
    }


  }
}