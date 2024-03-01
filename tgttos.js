import {defs, tiny} from './examples/common.js';
import {Models} from './models.js';

const {
  Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

class Lane {
  constructor(model_transform, color) {
    this.lane_transform = model_transform;
    this.color = color;
  }
}

export class Tgttos extends Scene {

  constructor() {
    super();
    this.moving_left = false;
    this.moving_right = false;
    this.moving_forward = false;
    this.moving_back = false;
    this.speed = 0.5;
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
    for(let i = 0; i < 10; i++) {
      this.lanes.push(new Lane(this.lane_transform, this.lane_colors[i % 2]));
      this.lane_transform = this.lane_transform.times(Mat4.translation(0, 0, -2));
    }
    this.moving = false;
  }

  make_control_panel() {
    // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
    this.key_triggered_button("Forward", ["w"], () => this.moving_forward = true, '#6E6460', () => this.moving_forward = false);
    this.key_triggered_button("Left", ["a"], () => this.moving_left = true, '#6E6460', () => this.moving_left = false);
    this.key_triggered_button("Back", ["s"], () => this.moving_back = true, '#6E6460', () => this.moving_back = false);
    this.key_triggered_button("Right", ["d"], () => this.moving_right = true, '#6E6460', () => this.moving_right = false);

  }

  handle_movement(model_transform, left, right, forward, back, speed, x_pos, z_pos) {
    const x_trans = (x_pos >= this.x_bound && right - left > 0) || (x_pos <= -this.x_bound && right - left < 0)
      ? 0 : (right - left) * speed;
    const z_trans = (z_pos <= this.z_bound && forward - back < 0)
        ? 0 : (back - forward) * speed;
    if (forward - back > 0) this.chicken_angle = 0;
    else if (back - forward > 0) this.chicken_angle = Math.PI;
    this.moving = left || right || forward || back;
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
    this.default_chicken_transform = this.handle_movement(this.default_chicken_transform, this.moving_left, this.moving_right, this.moving_forward, this.moving_back, this.speed, old_x, old_z);
    const x = this.default_chicken_transform[0][3]; // +x on the right
    const z = -this.default_chicken_transform[2][3]; // +z into the page
    this.z_bound = Math.max(this.z_bound, z - this.lane_width);
    this.camera_z_bound = Math.max(this.camera_z_bound, z);
    // attaches camera to cube
    program_state.set_camera(Mat4.translation(0, -4, -30)
      .times(Mat4.rotation(Math.PI / 4, 1, 0, 0))
      .times(Mat4.translation(0, 0, this.camera_z_bound)));

    program_state.projection_transform = Mat4.perspective(
      Math.PI / 4, context.width / context.height, 1, 100);

    // *** Lights: *** Values of vector or point lights.
    const light_position = vec4(x, 5, -z, 1);
    program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 10)];

    // main character
    this.models.drawChicken(context, program_state, this.default_chicken_transform.times(Mat4.rotation(this.chicken_angle, 0, 1, 0)));

    for (let i = 0; i < this.lanes.length; i++) {
      this.models.drawGround(context, program_state, this.lanes[i].lane_transform, this.lanes[i].color);
    }

    if (z > this.chunks_rendered * 10) {
      this.chunks_rendered++;
      for (let i = 0; i < 10; i++) {
        this.lanes.push(new Lane(this.lane_transform, this.lane_colors[i % 2]));
        this.lane_transform = this.lane_transform.times(Mat4.translation(0, 0, -2));
        // delete the old stuff
      }
    }
  }
}