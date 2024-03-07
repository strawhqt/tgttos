import {defs, tiny} from './examples/common.js';
import * as models from './models.js';
import {Obstacle, MovingObstacle, Car} from "./obstacle.js";

const {
  Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Lane {
  constructor(model_transform, color, lane_x_width, no_obstacles = false) {
    this.lane_transform = model_transform;
    this.color = color;
  }

  draw(context, program_state, highlighted) {
    let lane_color = this.color;
    if (highlighted)
      lane_color = hex_color('#ffd400');
    models.drawLane(context, program_state, this.lane_transform, lane_color);
    this.draw_obstacles(context, program_state);
  }

  draw_obstacles(context, program_state) {
  }

  handle_obstacles() {
  }

  check_chicken_collision() {
  }

}

// for moving obstacles
export class Road extends Lane {
  constructor(model_transform, color = hex_color("#525866"), lane_x_width) {
    super(model_transform, color, lane_x_width);

    this.obstacle_count = Math.floor(Math.random() * 3);
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
      this.obstacles.push(new Car(model_transform, lane_x_width, start_offset, z_offset));
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

  draw_obstacles(context, program_state) {
    this.obstacles.forEach((obs) => {
      obs.transform[0][3] = obs.x_pos;
      obs.orientation = obs.direction === 1 ? 0 : Math.PI;
      if (obs instanceof Car) {
        models.drawCar(context, program_state, obs.transform.times(Mat4.rotation(obs.orientation, 0, 1, 0)), obs.color[0], obs.color[1]);
      }
    })
  }

}

// no moving obstacles
export class RestLane extends Lane {
  constructor(model_transform, color, lane_width) {
    super(model_transform, color, lane_width);

  }

}