import {defs, tiny} from './examples/common.js';
import {Models} from './models.js';

const {
  Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

class Lane {
  constructor(model_transform, color, lane_x_width, no_obstacles = false) {
    this.lane_transform = model_transform;
    this.color = color;
    this.obstacle_count = no_obstacles ? 0 : Math.floor(Math.random() * 3)
    this.obstacles = []
    for (let i = 0; i < this.obstacle_count; i++) {
      let overlap = false;
      let start_offset = 0;
      do {
        overlap = false;
        start_offset = Math.random() * 2 * lane_x_width - lane_x_width
        this.obstacles.forEach((obs) => {
          if (Math.abs(start_offset - obs.x_pos) < 2) // 2 from radius of 1
            overlap = true;
        })
      } while (overlap)
      this.obstacles.push(new Moving_Obstacle(model_transform, lane_x_width, 1, start_offset));
    }
  }

  obstacle_collisions() {
    if (this.obstacle_count <= 1) return;
    this.obstacles.forEach((obs1) => {
      this.obstacles.forEach((obs2) => {
        const dist = obs1.x_pos - obs2.x_pos;
        const min_dist = obs1.radius + obs2.radius;
        if (dist > 0 && dist <= min_dist && obs1 !== obs2) {
          [obs1.speed, obs2.speed, obs1.direction, obs2.direction] =
            [obs2.speed, obs1.speed, obs2.direction, obs1.direction]
          if (obs1.direction === obs2.direction)
            obs1.transform[0][3] = obs2.transform[0][3] + min_dist; // force apart because buggy af otherwise
          // alternate way of fixing wiggle bug, but sacrifices physics
          // obs1.direction = 1;
          // obs2.direction = -1;
          if(dist <= min_dist / 2)
            console.log('should not be happening (too often)')
        }
      })
    })
  }
}

class Moving_Obstacle {
  constructor(model_transform, x_bound, radius, start_offset) {
    this.x_bound = x_bound
    this.radius = radius
    this.start_offset = start_offset;
    this.x_pos = this.start_offset;
    this.transform = Mat4.identity().times(Mat4.translation(this.start_offset, 0, model_transform[2][3]));
    this.speed = Math.random() * (500 - 100) + 100;
    this.direction = Math.round(Math.random()) ? 1 : -1
    const r = Math.random() * 127 + 127;
    const g = Math.random() * 127 + 127;
    const b = Math.random() * 127 + 127;
    this.color = color(r / 255, g / 255, b / 255, 1);
    // this.left_x = this.start_offset - radius
    // this.right_x = this.start_offset + radius

  }

  setObstacleTransform(model_transform) {
    this.x_pos = model_transform[0][3];
    // this.left_x = x_pos - this.radius;
    // this.right_x = x_pos + this.radius;
    this.transform = model_transform;
    if (this.x_pos <= -this.x_bound)
      this.direction = 1;
    if( this.x_pos >= this.x_bound)
      this.direction = -1;

  }
}

export class Tgttos extends Scene {

  constructor() {
    super();
    this.moving_left = false;
    this.moving_right = false;
    this.moving_forward = false;
    this.moving_back = false;
    this.speed = 1;
    this.x_bound = 20; // how far left and right player can move
    this.z_bound = -100;
    this.camera_z_bound = -100;
    this.lane_width = 5; // how wide each lane is (in terms of z)
    this.chunks_rendered = 1;
    this.models = new Models();
    this.default_chicken_transform = Mat4.identity();
    this.chicken_angle = 0;
    this.lane_transform = Mat4.identity().times(Mat4.scale(this.x_bound, 1, this.lane_width))
      .times(Mat4.translation(0, -2, 0));
    this.lane_colors = [hex_color('#b2e644'), hex_color('#699e1c')]
    this.lanes = []

    // special first lane
    this.lanes.push(new Lane(this.lane_transform, this.lane_colors[0], this.x_bound, true));
    this.lane_transform = this.lane_transform.times(Mat4.translation(0, 0, -2));
    for(let i = 1; i < 16; i++) {
      this.lanes.push(new Lane(this.lane_transform, this.lane_colors[i % 2], this.x_bound));
      this.lane_transform = this.lane_transform.times(Mat4.translation(0, 0, -2));
    }
    this.moving = false;
    this.start_move_time = 0;
    this.tweak_angle = 0;
    this.eggs = [];
    this.chicken_height = 0;
    this.highlight = false;
  }

  make_control_panel() {
    // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
    this.key_triggered_button("Forward", ["w"], () => this.moving_forward = true, '#6E6460', () => this.moving_forward = false);
    this.key_triggered_button("Left", ["a"], () => this.moving_left = true, '#6E6460', () => this.moving_left = false);
    this.key_triggered_button("Back", ["s"], () => this.moving_back = true, '#6E6460', () => this.moving_back = false);
    this.key_triggered_button("Right", ["d"], () => this.moving_right = true, '#6E6460', () => this.moving_right = false);
    this.key_triggered_button("Egg", [" "], () => { this.eggs.push(this.default_chicken_transform); this.eggs = this.eggs.slice(-10);}, '#6E6460');
    this.key_triggered_button("highlight checked lanes", ["h"], () => this.highlight = !this.highlight, '#6E6460');
  }

  handle_movement(model_transform, left, right, forward, back, speed, x_pos, z_pos, t) {
    const x_trans = (x_pos >= this.x_bound && right - left > 0) || (x_pos <= -this.x_bound && right - left < 0)
      ? 0 : (right - left) * speed;
    const z_trans = (z_pos <= this.z_bound && forward - back < 0)
        ? 0 : (back - forward) * speed;
    if (left - right > 0) this.chicken_angle = Math.PI / 2;
    else if (right - left > 0) this.chicken_angle = -Math.PI / 2
    if (forward - back > 0) this.chicken_angle = 0;
    else if (back - forward > 0) this.chicken_angle = Math.PI;
    this.moving = left || right || forward || back;
    if (this.moving) {
      if (!this.start_move_time)
        this.start_move_time = t;
      this.tweak_angle = Math.PI / 3 * (Math.sin(60 * (t - this.start_move_time) - Math.PI / 2) + 2) / 2;
      this.chicken_height = 0.5 * (Math.sin(34 * (t - this.start_move_time) - Math.PI / 2) + 1)

    } else {
      this.start_move_time = 0;
      this.tweak_angle = 0;
      this.chicken_height = 0;
    }

    return Mat4.translation(x_trans, 0, z_trans).times(model_transform);
  }

  display(context, program_state) {
    // display():  Called once per frame of animation. Here, the base class's display only does some initial setup.

    // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:

    if (!context.scratchpad.controls) {
      this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
      // Define the global camera and projection matrices, which are stored in program_state.

      // program_state.set_camera(Mat4.translation(0, -4, -20).times(Mat4.rotation(Math.PI / 6, 1, 0, 0)));
    }

    const t = program_state.animation_time / 1000;

    // position of the chicken
    const old_x = this.default_chicken_transform[0][3]; // +x on the right
    const old_z = -this.default_chicken_transform[2][3]; // +z into the page

    // attaches movement controls to cube
    this.default_chicken_transform = this.handle_movement(this.default_chicken_transform, this.moving_left, this.moving_right, this.moving_forward, this.moving_back, this.speed, old_x, old_z, t);
    const x = this.default_chicken_transform[0][3]; // +x on the right
    const z = -this.default_chicken_transform[2][3]; // +z into the page
    this.z_bound = Math.max(this.z_bound, z - this.lane_width);
    this.camera_z_bound = Math.max(this.camera_z_bound, z);

      // attaches camera to cube
    program_state.set_camera(Mat4.identity()
      .times(Mat4.translation(0, -4, -35))
      .times(Mat4.rotation(Math.PI / 6, 1, 0, 0))
      .times(Mat4.translation(0, 0, this.camera_z_bound))
      );

    program_state.projection_transform = Mat4.perspective(
      Math.PI / 4.5, context.width / context.height, 1, 200);

    // *** Lights: *** Values of vector or point lights.
    const light_position = vec4(0, 5, -z, 1);
    program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 100)];

    // main character
    const chicken_model_transform = this.default_chicken_transform
      .times(Mat4.rotation(this.chicken_angle, 0, 1, 0))
      .times(Mat4.translation(0, this.chicken_height, 0));
    this.models.drawChicken(context, program_state, chicken_model_transform, this.moving, this.tweak_angle);
    this.models.drawBackground(context, program_state, this.default_chicken_transform);
    this.eggs.forEach((egg_model_transform) => {
      this.models.drawEgg(context, program_state, egg_model_transform);
    })


    // chicken collisions
    const lane_end = (2 * this.lane_width) * ((this.chunks_rendered) * 10) + 6 * 2 * this.lane_width;
    const num_lanes = this.chunks_rendered === 1 ? 16 : 26;
    const lane_start = lane_end - num_lanes * 2 * this.lane_width;
    const current_lane = Math.ceil(this.chunks_rendered === 1 ? 1 : (z - lane_start) / (2*this.lane_width))
    const chicken_x_rad = 0.6;
    const chicken_z_rad = 0.42;
    for (let i = current_lane; i >= current_lane - 1; i--) {
      const lane = this.lanes[i];
      lane.obstacles.forEach((obs) => {
        const min_x = chicken_x_rad + obs.radius;
        const min_z = chicken_z_rad + obs.radius;
        const obs_z_pos = lane_start + i * 2 * this.lane_width;
        const x_dist = Math.abs(obs.x_pos - x);
        const z_dist = Math.abs(obs_z_pos - z);
        if (x_dist < min_x && z_dist < min_z) {

          obs.color = color(1, 0, 0, 1);
        }
      })
    }

    for (let i = 0; i < this.lanes.length; i++) {
      for (let j = 0; j < this.lanes[i].obstacles.length; j++) {
        let obstacle = this.lanes[i].obstacles[j];
        this.models.drawObstacle(context, program_state, obstacle.transform, obstacle.color)
        obstacle.setObstacleTransform(obstacle.transform
          .times(Mat4.translation(50/obstacle.speed * obstacle.direction, 0, 0)));
      }

      this.lanes[i].obstacle_collisions();
      let lane_color = this.lanes[i].color;
      if (this.highlight && (i === current_lane || i === current_lane - 1))
        lane_color = hex_color('#ffd400');
      this.models.drawLane(context, program_state, this.lanes[i].lane_transform, lane_color);
    }

    if (z > (this.chunks_rendered - 1) * 10 * 2 * this.lane_width + 2 * this.lane_width) {
      this.chunks_rendered++;
      this.lanes = this.lanes.slice(-16);
      for (let i = 0; i < 10; i++) {
        this.lanes.push(new Lane(this.lane_transform, this.lane_colors[i % 2], this.x_bound));
        this.lane_transform = this.lane_transform.times(Mat4.translation(0, 0, -2));
      }
    }
  }
}