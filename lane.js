import {defs, tiny} from './examples/common.js';
import {Models} from './models.js';

const {
  Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Lane {
  constructor(model_transform, color, lane_x_width, no_obstacles = false) {
    this.lane_transform = model_transform;
    this.color = color;
    this.obstacle_count = no_obstacles ? 0 : Math.floor(Math.random() * 3);
    this.obstacles = [];

    for (let i = 0; i < this.obstacle_count; i++) {
      let overlap = false;
      let start_offset = 0;
      const obs_rad = 1;
      const z_offset = 0;
      do {
        overlap = false;
        start_offset = Math.random() * 2 * lane_x_width - lane_x_width
        this.obstacles.forEach((obs) => {
          const x_dist = Math.abs(start_offset - obs.x_pos);
          const z_dist = Math.abs(z_offset - obs.z_offset);
          const min_dist = obs_rad + obs.radius;
          if (x_dist < min_dist && z_dist < min_dist)
            overlap = true;
        })
      } while (overlap)
      this.obstacles.push(new MovingObstacle(model_transform, lane_x_width, obs_rad, start_offset, z_offset));
    }
  }

  obstacle_collisions() {
    if (this.obstacle_count <= 1) return;
    this.obstacles.forEach((obs1) => {
      this.obstacles.forEach((obs2) => {
        const x_dist = obs1.x_pos - obs2.x_pos;
        const z_dist = Math.abs(obs1.z_offset - obs2.z_offset);
        const min_dist = obs1.radius + obs2.radius;
        if (z_dist < min_dist && x_dist > 0 && x_dist <= min_dist && obs1 !== obs2) {
          [obs1.speed, obs2.speed, obs1.direction, obs2.direction] =
            [obs2.speed, obs1.speed, obs2.direction, obs1.direction]
          obs1.transform[0][3] = obs2.transform[0][3] + min_dist; // force apart because buggy af otherwise
          // alternate way of fixing wiggle bug, but sacrifices physics
          // obs1.direction = 1;
          // obs2.direction = -1;
          if (x_dist <= min_dist / 2)
            console.log('should not be happening (too often)')
        }
      })
    })
  }

  handle_obstacles(context, program_state, models, dt, highlighted = false) {
    this.obstacles.forEach((obstacle) => {
      obstacle.handle_position(dt);
      models.drawObstacle(context, program_state, obstacle.transform, obstacle.color)
    })
    this.obstacle_collisions();
    let lane_color = this.color;
    if (highlighted)
      lane_color = hex_color('#ffd400');
    models.drawLane(context, program_state, this.lane_transform, lane_color);
  }

  check_collision(x, z, x_rad, z_rad, lane_z) {
    for (let obs of this.obstacles) {
      const min_x = x_rad + obs.radius;
      const min_z = z_rad + obs.radius;
      const obs_z_pos = lane_z - obs.z_offset;
      const x_dist = (obs.x_pos - x);
      const z_dist = Math.abs(z - obs_z_pos);
      if (z_dist < min_z && Math.abs(x_dist) < min_x) {
        if (x_dist < 0) {
          obs.direction = -1;
          obs.transform[0][3] = x - min_x;
        } else {
          obs.direction = 1;
          obs.transform[0][3] = x + min_x;

        }
        obs.color = color(1, 0, 0, 1);
        return true;
      }
    }
    return false;
  }
}


class MovingObstacle {
  constructor(model_transform, x_bound, radius, start_offset, z_offset= 0) {
    this.x_bound = x_bound
    this.radius = radius
    this.start_offset = start_offset;
    this.x_pos = this.start_offset;
    this.transform = Mat4.identity().times(Mat4.translation(this.start_offset, 0, model_transform[2][3] + z_offset));
    this.speed = Math.random() * (50 - 10) + 10;
    this.direction = Math.round(Math.random()) ? 1 : -1
    const r = Math.random() * 127 + 127;
    const g = Math.random() * 127 + 127;
    const b = Math.random() * 127 + 127;
    this.color = color(r / 255, g / 255, b / 255, 1);
    this.z_offset = z_offset;
    // this.left_x = this.start_offset - radius
    // this.right_x = this.start_offset + radius

  }

  handle_position(dt) {
    const new_transform = this.transform
      .times(Mat4.translation(this.speed * dt * this.direction, 0, 0));
    const new_x = new_transform[0][3];
    if (new_x <= -this.x_bound) {
      new_transform[0][3] = -this.x_bound;
      this.direction = 1;
    }
    if (new_x >= this.x_bound) {
      new_transform[0][3] = this.x_bound;
      this.direction = -1;
    }
    this.transform = new_transform;
    this.x_pos = new_transform[0][3];
  }
}