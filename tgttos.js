import {defs, tiny} from './examples/common.js';
import {Models} from './models.js';
import {Lane} from "./lane.js";

const {
  Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Tgttos extends Scene {

  constructor() {
    super();
    this.init();
  }

  init() {
    this.moving_left = false;
    this.moving_right = false;
    this.moving_forward = false;
    this.moving_back = false;
    this.speed = 40;
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
    for (let i = 1; i < 16; i++) {
      this.lanes.push(new Lane(this.lane_transform, this.lane_colors[i % 2], this.x_bound));
      this.lane_transform = this.lane_transform.times(Mat4.translation(0, 0, -2));
    }
    this.moving = false;
    this.start_move_time = 0;
    this.tweak_angle = 0;
    this.eggs = [];
    this.chicken_height = 0;
    this.highlight = false;
    this.score = 0;

    this.dead = false;
  }
  make_control_panel() {
    // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
    this.key_triggered_button("Forward", ["w"], () => this.moving_forward = true, '#6E6460', () => this.moving_forward = false);
    this.key_triggered_button("Left", ["a"], () => this.moving_left = true, '#6E6460', () => this.moving_left = false);
    this.key_triggered_button("Back", ["s"], () => this.moving_back = true, '#6E6460', () => this.moving_back = false);
    this.key_triggered_button("Right", ["d"], () => this.moving_right = true, '#6E6460', () => this.moving_right = false);
    this.key_triggered_button("Egg", [" "], () => {
      this.eggs.push(this.default_chicken_transform);
      this.eggs = this.eggs.slice(-10);
      const speed_change = 20;
      this.speed += speed_change;
      setTimeout(() => {
        this.speed -= speed_change;
      }, 500)
    }, '#6E6460');
    this.key_triggered_button("highlight checked lanes", ["h"], () => this.highlight = !this.highlight, '#6E6460');
    this.key_triggered_button("revive", ["e"], () => this.dead = false)
    this.key_triggered_button("restart", ["r"], () => {
      this.init();
    })
  }

  /*
    */
  handle_movement(model_transform, left, right, forward, back, x_pos, z_pos, t, dt) {
    const x_trans = (x_pos >= this.x_bound && right - left > 0) || (x_pos <= -this.x_bound && right - left < 0)
      ? 0 : (right - left) * this.speed * dt;
    const z_trans = (z_pos <= this.z_bound && forward - back < 0)
      ? 0 : (back - forward) * this.speed * dt;
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

    if (!context.scratchpad.controls) {
      this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
      // Define the global camera and projection matrices, which are stored in program_state.

      // program_state.set_camera(Mat4.translation(0, -4, -20).times(Mat4.rotation(Math.PI / 6, 1, 0, 0)));
    }

    const t = program_state.animation_time / 1000;
    const dt = program_state.animation_delta_time / 1000;
    if (dt > 0.1)
      console.log(dt)
    // position of the chicken
    const old_x = this.default_chicken_transform[0][3]; // +x on the right
    const old_z = -this.default_chicken_transform[2][3]; // +z into the page

    // attaches movement controls to cube
    if (!this.dead) {
      this.default_chicken_transform = this.handle_movement(this.default_chicken_transform, this.moving_left, this.moving_right, this.moving_forward, this.moving_back, old_x, old_z, t, dt);
    }
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
    this.models.drawChicken(context, program_state, chicken_model_transform, this.dead, this.tweak_angle);
    this.models.drawBackground(context, program_state, this.default_chicken_transform);
    this.eggs.forEach((egg_model_transform) => {
      this.models.drawEgg(context, program_state, egg_model_transform);
    })

    // score
    this.score = Math.max(this.score, Math.floor(z / (2 * this.lane_width)));
    this.models.drawScore(context, program_state, this.z_bound, this.score.toString())

    // draw lanes and obstacles
    const lane_end = (2 * this.lane_width) * ((this.chunks_rendered) * 10) + 6 * 2 * this.lane_width;
    const num_lanes = this.chunks_rendered === 1 ? 16 : 26;
    const first_lane_z = lane_end - num_lanes * 2 * this.lane_width;
    const current_lane_z = Math.ceil(this.chunks_rendered === 1 ? 1 : (z - first_lane_z) / (2 * this.lane_width))

    this.lanes.forEach((lane, i) => {
      const highlight_lane = this.highlight && (i === current_lane_z || i === current_lane_z - 1);
      lane.handle_obstacles(context, program_state, this.models, dt, highlight_lane);
    })

    // chicken collisions
    const chicken_x_rad = this.chicken_angle === 0 || this.chicken_angle === Math.PI ? 0.6 : 0.75;
    const chicken_z_rad = this.chicken_angle === 0 || this.chicken_angle === Math.PI ? 0.75 : 0.6;
    // checks current 2 lanes
    // if (this.lanes[1].check_collision(x, z, chicken_x_rad, chicken_z_rad, 1)) {
    //   console.log('hi');
    // }
    for (let i = current_lane_z; i >= current_lane_z - 1; i--) {
      const lane = this.lanes[i];
      const lane_z = first_lane_z + i * 2 * this.lane_width;
      if (lane.check_collision(x, z, chicken_x_rad, chicken_z_rad, lane_z)) {
        this.dead = true;
      }
    }

    // generates new lanes and deletes old ones
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