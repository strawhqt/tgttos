import {defs, tiny} from './examples/common.js';
import * as models from './models.js';

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
      const obs_x_rad = 1;
      const obs_z_rad = 1;
      const z_offset = 0;
      do {
        overlap = false;
        const spawn_width = lane_x_width - obs_x_rad;
        start_offset = Math.random() * 2 * spawn_width - spawn_width;
        this.obstacles.forEach((obs) => {
          const x_dist = Math.abs(start_offset - obs.x_pos);
          const z_dist = Math.abs(z_offset - obs.z_offset);
          const min_x_dist = obs_x_rad + obs.x_radius;
          const min_z_dist = obs_z_rad + obs.z_radius;
          if (x_dist < min_x_dist && z_dist < min_z_dist)
            overlap = true;
        })
      } while (overlap)
      this.obstacles.push(new MovingObstacle(model_transform, lane_x_width, obs_x_rad, obs_z_rad, start_offset, z_offset));
    }
  }

  obstacle_collisions() {
    if (this.obstacle_count <= 1) return;
    this.obstacles.forEach((obs1) => {
      this.obstacles.forEach((obs2) => {
        const x_dist = Math.abs(obs1.x_pos - obs2.x_pos);
        const z_dist = Math.abs(obs1.z_offset - obs2.z_offset);
        const min_x_dist = obs1.x_radius + obs2.x_radius;
        const min_z_dist = obs1.z_radius + obs2.z_radius;

        if (z_dist < min_z_dist && x_dist < min_x_dist && obs1 !== obs2) {
          obs1.on_obstacle_collision(obs2);
          if (x_dist <= min_x_dist / 2)
            console.log('should not be happening (too often)')
        }
      })
    })
  }

  handle_obstacles(dt) {
    this.obstacles.forEach((obstacle) => {
      obstacle.handle_position(dt);
    })
    this.obstacle_collisions();
  }

  check_chicken_collision(chicken, lane_z) {
    const x = chicken.transform[0][3];
    const z = -chicken.transform[2][3];
    const x_rad = chicken.x_rad;
    const z_rad = chicken.z_rad;
    for (let obs of this.obstacles) {
      const min_x = x_rad + obs.x_radius;
      const min_z = z_rad + obs.z_radius;
      const obs_z_pos = lane_z - obs.z_offset;
      const x_dist = (obs.x_pos - x);
      const z_dist = Math.abs(z - obs_z_pos); // don't care about sign for z
      if (z_dist < min_z && Math.abs(x_dist) < min_x) {
        obs.on_chicken_collision(chicken, x_dist);
      }
    }
  }

  draw(context, program_state, highlighted) {
    let lane_color = this.color;
    if (highlighted)
      lane_color = hex_color('#ffd400');
    models.drawLane(context, program_state, this.lane_transform, lane_color);
    this.obstacles.forEach((obs) => {
      obs.transform[0][3] = obs.x_pos;
      models.drawObstacle(context, program_state, obs.transform, obs.color)
    })
  }
}

class Obstacle {
  constructor(model_transform, x_bound, x_radius, z_radius, start_offset, z_offset) {
    this.x_bound = x_bound
    this.x_radius = x_radius;
    this.z_radius = z_radius;
    this.start_offset = start_offset;
    this.x_pos = this.start_offset;
    this.transform = Mat4.identity().times(Mat4.translation(this.start_offset, 0, model_transform[2][3] + z_offset));
    const r = Math.random() * 127 + 127;
    const g = Math.random() * 127 + 127;
    const b = Math.random() * 127 + 127;
    this.color = color(r / 255, g / 255, b / 255, 1);
    this.z_offset = z_offset;
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

class MovingObstacle extends Obstacle {
  constructor(model_transform, x_bound, x_radius, z_radius, start_offset, z_offset = 0) {
    super(model_transform, x_bound, x_radius, z_radius, start_offset, z_offset)
    this.speed = Math.random() * (50 - 10) + 10;
    this.direction = Math.round(Math.random()) ? 1 : -1
  }

  handle_position(dt) {
    this.x_pos += this.speed * dt * this.direction;
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

  on_chicken_collision(chicken, x_dist) {
    const x = chicken.transform[0][3];
    const x_rad = chicken.x_rad;
    const min_x = x_rad + this.x_radius;
    if (x_dist < 0) {
      this.direction = -1;
      this.x_pos = x - min_x;
    } else {
      this.direction = 1;
      this.x_pos = x + min_x;
    }
    this.color = color(1, 0, 0, 1);
    if (!chicken.invincible)
      chicken.dead = true;
  }

}