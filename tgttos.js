import {defs, tiny} from './examples/common.js';
import {Models} from './models.js';

const {
  Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Tgttos extends Scene {

  constructor() {
    super();
    this.moving_left = false;
    this.moving_right = false;
    this.moving_forward = false;
    this.moving_back = false;
    this.models = new Models();
    this.default_chicken_transform = Mat4.identity();
  }

  make_control_panel() {
    // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
    this.key_triggered_button("Forward", ["w"], () => this.moving_forward = true, '#6E6460', () => this.moving_forward = false);
    this.key_triggered_button("Left", ["a"], () => this.moving_left = true, '#6E6460', () => this.moving_left = false);
    this.key_triggered_button("Back", ["s"], () => this.moving_back = true, '#6E6460', () => this.moving_back = false);
    this.key_triggered_button("Right", ["d"], () => this.moving_right = true, '#6E6460', () => this.moving_right = false);

  }

  handle_movement(model_transform, left, right, forward, back, speed) {
    const x = (right - left) * speed;
    const z = (back - forward) * speed;
    return Mat4.translation(x, 0, z).times(model_transform);
  }
  display(context, program_state) {
    // display():  Called once per frame of animation. Here, the base class's display only does
    // some initial setup.

    // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:

    if (!context.scratchpad.controls) {
      this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
      // Define the global camera and projection matrices, which are stored in program_state.
      // program_state.set_camera(Mat4.translation(0, -4, -20).times(Mat4.rotation(Math.PI / 6, 1, 0, 0)));
    }

    // attaches movement controls to cube
    this.default_chicken_transform = this.handle_movement(this.default_chicken_transform, this.moving_left, this.moving_right, this.moving_forward, this.moving_back, 0.1);
    // attaches camera to cube
    program_state.set_camera(Mat4.translation(0, -4, -20)
      .times(Mat4.rotation(Math.PI / 4, 1, 0, 0))
      .times(Mat4.inverse(this.default_chicken_transform)));
    const x = this.default_chicken_transform[0][3];
    const z = this.default_chicken_transform[2][3];


    program_state.projection_transform = Mat4.perspective(
      Math.PI / 4, context.width / context.height, 1, 100);

    // *** Lights: *** Values of vector or point lights.
    const light_position = vec4(0, 5, 2, 1);
    program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

    // main character
    this.models.drawChicken(context, program_state, this.default_chicken_transform);

    let ground_transform = Mat4.identity();
    ground_transform = ground_transform.times(Mat4.scale(10, 1, 10)).times(Mat4.translation(0, -2, 0));
    this.models.drawGround(context, program_state, ground_transform);
  }
}
