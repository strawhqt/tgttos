import {defs, tiny} from './examples/common.js';
import * as models from './models.js';
import {Lane, Road, RestLane} from "./lane.js";
import {Chicken} from "./chicken.js";
import {TextCanvas} from "./text-canvas.js";

const {
  Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Tgttos extends Scene {
  constructor() {
    super();
    this.init();
    this.text_canvas = new TextCanvas();
  }

  init() {
    this.x_bound = 30; // how far left and right player can move
    this.z_bound = -100;
    this.chicken = new Chicken(23, -100);
    this.camera_z_bound = -100;
    this.camera_speed = 0;
    this.lane_depth = 4; // how wide each lane is (in terms of z)
    this.chunks_rendered = 1;
    this.lane_transform = Mat4.identity().times(Mat4.scale(this.x_bound, 1, this.lane_depth))
      .times(Mat4.translation(0, -2, 0));
    this.lane_colors = [hex_color('#ace065'), hex_color('#a0d15a')]
    this.lanes = []

    this.lanes.push(new RestLane(this.lane_transform, this.lane_colors[0], this.x_bound, this.lane_depth, true)); // first lane
    this.lane_transform = this.lane_transform.times(Mat4.translation(0, 0, -2));
    for (let i = 1; i < 16; i++) {
      if (Math.random() < 0.3) {
        this.lanes.at(-1).before_rest_lane = true;
        this.lanes.push(new RestLane(this.lane_transform, this.lane_colors[i % 2], this.x_bound, this.lane_depth));
      }
      else {
        this.lanes.push(new Road(this.lane_transform, this.x_bound, this.lane_depth));
      }
      this.lane_transform = this.lane_transform.times(Mat4.translation(0, 0, -2));
    }
    this.highlight = false;
    this.score = 0;
  }

  make_control_panel() {
    // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
    this.key_triggered_button("Forward", ["w"], () => this.chicken.moving_forward = true, '#6E6460', () => this.chicken.moving_forward = false);
    this.key_triggered_button("Left", ["a"], () => this.chicken.moving_left = true, '#6E6460', () => this.chicken.moving_left = false);
    this.key_triggered_button("Back", ["s"], () => this.chicken.moving_back = true, '#6E6460', () => this.chicken.moving_back = false);
    this.key_triggered_button("Right", ["d"], () => this.chicken.moving_right = true, '#6E6460', () => this.chicken.moving_right = false);
    this.key_triggered_button("Egg", [" "], () => {
      if (!this.chicken.dead) {
        const egg_transform = Mat4.translation(this.chicken.x_pos, 0, -this.chicken.z_pos);
        this.chicken.eggs.push(egg_transform);
        this.chicken.eggs = this.chicken.eggs.slice(-10);
        const speed_change = 20;
        this.chicken.speed += speed_change;
        setTimeout(() => {
          this.chicken.speed = Math.max(this.chicken.speed - 20, this.chicken.min_speed);
        }, 500)
    }
    }, '#6E6460');
    this.key_triggered_button("highlight checked lanes", ["h"], () => this.highlight = !this.highlight, '#6E6460');
    this.key_triggered_button("revive", ["e"], () => {
      this.chicken.dead = false;
    });
    this.key_triggered_button("restart", ["r"], this.init);
    this.key_triggered_button("invincibility", ["i"], () => this.chicken.invincible = !this.chicken.invincible)
  }

  display(context, program_state) {

    // if (!context.scratchpad.controls) {
    //   this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
    // }

    const t = program_state.animation_time / 1000;
    const dt = program_state.animation_delta_time / 1000;

    if (this.chicken.dead)
      this.camera_speed = 0;

    // move chicken
    this.chicken.handle_movement(t, dt);

    // position of the chicken
    const x = this.chicken.transform[0][3]; // +x on the right
    const z = -this.chicken.transform[2][3]; // +z into the page
    this.chicken.z_bound = Math.max(this.chicken.z_bound, z - this.lane_depth);
    this.camera_z_bound = Math.max(this.camera_z_bound + this.camera_speed * dt, z);
    if (z > 0)
      this.camera_speed = 2;
    if (this.camera_z_bound - z > 10)
      this.chicken.dead = true;

    // attaches camera to cube
    program_state.set_camera(Mat4.identity()
      .times(Mat4.translation(0, -4, -35))
      .times(Mat4.rotation(Math.PI / 6, 1, 0, 0))
      .times(Mat4.translation(0, 0, this.camera_z_bound))
    );

    program_state.projection_transform = Mat4.perspective(
      Math.PI / 4.5, context.width / context.height, 1, 200);

    // *** Lights: *** Values of vector or point lights.
    const light_position = vec4(0, 20, -z, 1);
    program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 100)];


    // score
    this.score = Math.max(this.score, Math.floor(z / (2 * this.lane_depth)));


    const draw_toast = x === 0 && z === 0 && !this.chicken.dead;
    this.text_canvas.handleCanvas
      (this.score, draw_toast, "WASD to move!", this.chicken.dead, () => this.init());


    // models.drawScore(context, program_state, this.chicken.z_bound, this.score.toString())


    // handle and draw lanes and obstacles
    const current_chicken_lane_index =
      Math.ceil(this.chunks_rendered === 1 ? 1 : (z - this.lanes[0].lane_z) / (2 * this.lane_depth))
    this.lanes.forEach((lane, i) => {
      const check_chicken = (i === current_chicken_lane_index || i === current_chicken_lane_index - 1);
      const highlight_lane = this.highlight && check_chicken;
      lane.handle_obstacles(dt);
      if (check_chicken) lane.check_chicken_collision(this.chicken);
      lane.draw(context, program_state, highlight_lane);
    })

    // main character
    this.chicken.draw(context, program_state);
    // models.drawBackground(context, program_state, this.chicken.transform);
    this.chicken.eggs.forEach((egg_model_transform) => {
      models.drawEgg(context, program_state, egg_model_transform);
    })

    // generates new lanes and deletes old ones
    if (z > (this.chunks_rendered - 1) * 10 * 2 * this.lane_depth + 2 * this.lane_depth) {
      this.chunks_rendered++;
      this.lanes = this.lanes.slice(-16);
      for (let i = 0; i < 10; i++) {
        if (Math.random() < 0.3) {
          if (this.lanes.length > 1) this.lanes.at(-1).before_rest_lane = true;
          this.lanes.push(new RestLane(this.lane_transform, this.lane_colors[i % 2], this.x_bound, this.lane_depth));
        }
        else {
          this.lanes.push(new Road(this.lane_transform, this.x_bound, this.lane_depth));
        }
        this.lane_transform = this.lane_transform.times(Mat4.translation(0, 0, -2));
      }
    }
  }
}