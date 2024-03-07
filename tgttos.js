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
    this.x_bound = 20; // how far left and right player can move
    this.z_bound = -100;
    this.chicken = new Chicken(20, -100);
    this.camera_z_bound = -100;
    this.lane_width = 5; // how wide each lane is (in terms of z)
    this.chunks_rendered = 1;
    this.lane_transform = Mat4.identity().times(Mat4.scale(this.x_bound, 1, this.lane_width))
      .times(Mat4.translation(0, -2, 0));
    this.lane_colors = [hex_color('#b2e644'), hex_color('#699e1c')]
    this.lanes = []

    // special first lane
    this.lanes.push(new RestLane(this.lane_transform, this.lane_colors[0], this.x_bound));
    this.lane_transform = this.lane_transform.times(Mat4.translation(0, 0, -2));
    for (let i = 1; i < 16; i++) {
      this.lanes.push(new Road(this.lane_transform, this.lane_colors[i % 2], this.x_bound));
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
      this.chicken.eggs.push(this.chicken.transform);
      this.chicken.eggs = this.chicken.eggs.slice(-10);
      const speed_change = 20;
      this.chicken.speed += speed_change;
      setTimeout(() => {
        this.chicken.speed -= speed_change;
      }, 500)
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

    // move chicken
    this.chicken.handle_movement(t, dt);

    // position of the chicken
    const x = this.chicken.transform[0][3]; // +x on the right
    const z = -this.chicken.transform[2][3]; // +z into the page
    this.chicken.z_bound = Math.max(this.chicken.z_bound, z - this.lane_width);
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
    this.chicken.draw(context, program_state);
    // models.drawBackground(context, program_state, this.chicken.transform);
    this.chicken.eggs.forEach((egg_model_transform) => {
      models.drawEgg(context, program_state, egg_model_transform);
    })

    // score
    this.score = Math.max(this.score, Math.floor(z / (2 * this.lane_width)));


    const draw_toast = x === 0 && z === 0;
    this.text_canvas.handleCanvas
      (this.score, draw_toast, "WASD to move!", this.chicken.dead, () => this.init());


    // models.drawScore(context, program_state, this.chicken.z_bound, this.score.toString())


    // handle and draw lanes and obstacles
    const current_chicken_lane_index =
      Math.ceil(this.chunks_rendered === 1 ? 1 : (z - this.lanes[0].lane_z) / (2 * this.lane_width))
    this.lanes.forEach((lane, i) => {
      const highlight_lane = this.highlight && (i === current_chicken_lane_index || i === current_chicken_lane_index - 1);
      const check_chicken =
        lane === this.lanes[current_chicken_lane_index] || lane === this.lanes[current_chicken_lane_index - 1]
      lane.handle_obstacles(dt);
      if (check_chicken) lane.check_chicken_collision(this.chicken);
      lane.draw(context, program_state, highlight_lane);
    })

    // generates new lanes and deletes old ones
    if (z > (this.chunks_rendered - 1) * 10 * 2 * this.lane_width + 2 * this.lane_width) {
      this.chunks_rendered++;
      this.lanes = this.lanes.slice(-16);
      for (let i = 0; i < 10; i++) {
        this.lanes.push(new Road(this.lane_transform, this.lane_colors[i % 2], this.x_bound));
        this.lane_transform = this.lane_transform.times(Mat4.translation(0, 0, -2));
      }
    }
  }
}