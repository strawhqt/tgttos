import {defs, tiny} from './examples/common.js';
import {Models} from './models.js';

const {
  Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

class Lane {
  constructor(model_transform, color, lane_x_width) {
    this.lane_transform = model_transform;
    this.color = color;
    this.obstacle_count = Math.floor(Math.random() * 8)
    this.obstacles = []
    for (let i = 0; i < this.obstacle_count; i++) {
      this.obstacles.push(new Moving_Obstacle(model_transform, lane_x_width, 1));
    }
  }

  collide() {
    if (this.obstacle_count <= 1) return;
    this.obstacles.forEach((obstacle1) => {
      this.obstacles.forEach((obstacle2) => {
        if (obstacle1.left_x < obstacle2.right_x && obstacle1.right_x > obstacle2.right_x) {
          [obstacle1.speed, obstacle1.direction, obstacle2.speed, obstacle2.direction]
          = [obstacle2.speed, obstacle2.direction, obstacle1.speed, obstacle1.direction]
        }
      })
    })
  }
}

class Moving_Obstacle {
  constructor(model_transform, x_bound, radius) {
    this.x_bound = x_bound
    this.radius = radius
    this.start_offset = Math.random() * 2 * this.x_bound - this.x_bound;
    this.transform = Mat4.identity().times(Mat4.translation(this.start_offset, 0, model_transform[2][3]));
    this.speed = Math.random() * (500 - 100) + 100;
    this.direction = Math.round(Math.random()) ? 1 : -1
    this.left_x = this.start_offset - radius
    this.right_x = this.start_offset + radius

  }

  setObstacleTransform(model_transform) {
    const x_pos = model_transform[0][3];
    this.left_x = x_pos - this.radius;
    this.right_x = x_pos + this.radius;
    this.transform = model_transform;
    if (x_pos <= -this.x_bound || x_pos >= this.x_bound) {
      this.direction = -this.direction;
    }
  }
}

export class Tgttos extends Scene {

  constructor() {
    super();
    this.moving_left = false;
    this.moving_right = false;
    this.moving_forward = false;
    this.moving_back = false;
    this.speed = 0.3;
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
    for(let i = 0; i < 16; i++) {
      this.lanes.push(new Lane(this.lane_transform, this.lane_colors[i % 2], this.x_bound));
      this.lane_transform = this.lane_transform.times(Mat4.translation(0, 0, -2));
    }
    this.moving = false;
    this.start_move_time = 0;
    this.tweak_angle = 0;
    this.first_clear_lanes = false;
    this.eggs = [];
    this.chicken_height = 0;
  }

  make_control_panel() {
    // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
    this.key_triggered_button("Forward", ["w"], () => this.moving_forward = true, '#6E6460', () => this.moving_forward = false);
    this.key_triggered_button("Left", ["a"], () => this.moving_left = true, '#6E6460', () => this.moving_left = false);
    this.key_triggered_button("Back", ["s"], () => this.moving_back = true, '#6E6460', () => this.moving_back = false);
    this.key_triggered_button("Right", ["d"], () => this.moving_right = true, '#6E6460', () => this.moving_right = false);
    this.key_triggered_button("Egg", [" "], () => { this.eggs.push(this.default_chicken_transform); this.eggs = this.eggs.slice(-10);}, '#6E6460');
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

    for (let i = 0; i < this.lanes.length; i++) {
      for (let j = 0; j < this.lanes[i].obstacles.length; j++) {
        let obstacle = this.lanes[i].obstacles[j];
        this.models.drawObstacle(context, program_state, obstacle.transform)
        obstacle.setObstacleTransform(obstacle.transform
          .times(Mat4.translation(50/obstacle.speed * obstacle.direction, 0, 0)));
      }

      this.lanes[i].collide();
      this.models.drawLane(context, program_state, this.lanes[i].lane_transform, this.lanes[i].color);
    }

    if (z > (this.chunks_rendered - 1) * 10 * 2 * this.lane_width + 2 * this.lane_width) {
      this.chunks_rendered++;
      for (let i = 0; i < 10; i++) {
        this.lanes.push(new Lane(this.lane_transform, this.lane_colors[i % 2], this.x_bound));
        this.lane_transform = this.lane_transform.times(Mat4.translation(0, 0, -2));
        if (this.first_clear_lanes) {
          this.lanes.shift();
        }
      }
      this.first_clear_lanes = true;
    }
  }
}