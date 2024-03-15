import {defs, tiny} from './examples/common.js';
import * as models from './models.js';
import {Lane, Road, RestLane, FirstLane, FinishLane} from "./lane.js";
import {Chicken} from "./chicken.js";
import {TextCanvas} from "./text-canvas.js";

const {
  Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Tgttos extends Scene {
  constructor() {
    super();
    this.text_canvas = new TextCanvas(
      (level = 0) => this.init(level),
      () => this.paused = !this.paused,
      () => this.init((this.level) ? 0 : 1));
    this.init();
  }

  init(level = 0) {
    const min_camera_speed = 4 * Math.pow(1.1, level);
    const max_camera_speed = 12 * Math.pow(1.2, level);
    const camera_speed_delta = 25 * Math.pow(0.9, level);
    const max_obstacle_speed = 25 * Math.pow(1.1, level);
    const min_obstacle_speed = 10 * Math.pow(1.05, level);
    const max_moving_obstacle_count = 2 * Math.pow(1.1, level / 2);
    const max_stationary_obstacle_count = 5 * Math.pow(1.1, level / 2);
    const rest_lane_chance = 0.3 * Math.pow(0.9, level);

    this.x_bound = 30; // how far left and right player can move
    this.lane_depth = 4; // how wide each lane is (in terms of z)
    this.chicken_min_speed = 40;
    this.chicken = new Chicken(this.chicken_min_speed, 23, -this.lane_depth);

    this.camera_z_bound = -100;
    this.camera_speed = 0;
    this.min_camera_speed = Math.min(this.chicken_min_speed * 0.8, min_camera_speed);
    this.max_camera_speed = Math.min(this.chicken_min_speed * 0.9, max_camera_speed);
    this.camera_speed_delta = Math.max(5, camera_speed_delta); // how many lanes per camera speed increase

    this.max_obstacle_speed = Math.min(40, max_obstacle_speed);
    this.min_obstacle_speed = Math.min(30, min_obstacle_speed);
    this.max_moving_obstacle_count = Math.min(4, max_moving_obstacle_count);
    this.max_stationary_obstacle_count = Math.min(7, max_stationary_obstacle_count);

    this.rest_lane_chance = Math.max(0.1, rest_lane_chance);

    this.chunks_rendered = 1;
    this.lane_transform = Mat4.identity().times(Mat4.scale(this.x_bound, 1, this.lane_depth))
      .times(Mat4.translation(0, -2, 0));
    this.lane_colors = [hex_color('#ace065'), hex_color('#a0d15a')];

    this.lanes = []
    this.lanes.push(new FirstLane(this.lane_transform, this.x_bound, this.lane_depth));
    this.lane_transform = this.lane_transform.times(Mat4.translation(0, 0, -2));
    for (let i = 1; i < 16; i++) {
      if (Math.random() < this.rest_lane_chance) {
        this.lanes.at(-1).before_rest_lane = true;
        this.lanes.push(new RestLane(this.lane_transform, this.lane_colors[i % 2], this.x_bound, this.lane_depth, false, this.max_stationary_obstacle_count));
      }
      else {
        this.lanes.push(new Road(this.lane_transform, this.x_bound, this.lane_depth, this.max_moving_obstacle_count, this.max_obstacle_speed, this.min_obstacle_speed));
      }
      this.lane_transform = this.lane_transform.times(Mat4.translation(0, 0, -2));
    }

    this.highlight = false;
    this.score = 0;
    this.text_canvas.score = -1;
    this.paused = false;

    this.level = level;
    this.printed_level_ending = false;
    this.printed_next_level = false;
  }

  make_control_panel() {
    // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
    this.key_triggered_button("Forward", ["w"], () => this.chicken.moving_forward = true, '#6E6460', () => this.chicken.moving_forward = false);
    this.key_triggered_button("Left", ["a"], () => this.chicken.moving_left = true, '#6E6460', () => this.chicken.moving_left = false);
    this.key_triggered_button("Back", ["s"], () => this.chicken.moving_back = true, '#6E6460', () => this.chicken.moving_back = false);
    this.key_triggered_button("Right", ["d"], () => this.chicken.moving_right = true, '#6E6460', () => this.chicken.moving_right = false);
    this.key_triggered_button("Egg", [" "], () => {
      if (!this.paused && !this.chicken.dead && this.chicken.active_egg_count < this.chicken.max_eggs) {
        const egg_transform = Mat4.translation(this.chicken.x_pos, 0, -this.chicken.z_pos);
        this.chicken.eggs.push(egg_transform);
        this.chicken.eggs = this.chicken.eggs.slice(-10);
        const speed_change = 30;
        this.chicken.speed += speed_change;
        this.chicken.active_egg_count += 1;
        setTimeout(() => {
          this.chicken.speed = Math.max(this.chicken.speed - speed_change, this.chicken.min_speed);
          this.chicken.active_egg_count = Math.max(0, this.chicken.active_egg_count - 1);
        }, 300)
    }
    }, '#6E6460');
    this.key_triggered_button("Revive", ["e"], () => {
      this.chicken.dead = false;
    });
    this.key_triggered_button("Restart", ["r"], () => this.init(this.level));
    this.key_triggered_button("Invincibility", ["i"], () => this.chicken.invincible = !this.chicken.invincible);
    this.key_triggered_button("Pause", ["p"], () => this.paused = !this.paused);
    this.key_triggered_button("Toggle mode", ["t"], () => {
      if (this.level === 0) {
        this.init(1);
        console.log("Level: " + this.level);
      }
      else if (this.level > 0) {
        this.init(0);
        console.log("endless mode now")
      }
    })
    this.key_triggered_button("Highlight checked lanes", ["h"], () => this.highlight = !this.highlight, '#6E6460');
  }

  display(context, program_state) {

    // if (!context.scratchpad.controls) {
    //   this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
    // }

    const t = program_state.animation_time / 1000;
    const dt = program_state.animation_delta_time / 1000;

    if (this.chicken.dead || this.paused)
      this.camera_speed = 0;

    // move chicken
    if (!this.paused)
      this.chicken.handle_movement(t, dt);

    // position of the chicken
    const x = this.chicken.transform[0][3]; // +x on the right
    const z = -this.chicken.transform[2][3]; // +z into the page
    this.chicken.min_z_bound = Math.max(this.chicken.min_z_bound, z - this.lane_depth);
    this.camera_z_bound = Math.max(this.camera_z_bound + this.camera_speed * dt, z);

    if (z > 0)
      this.camera_speed = Math.min(this.max_camera_speed, this.min_camera_speed + z / (this.lane_depth * 2 * this.camera_speed_delta));
    if (z > this.chunks_rendered * 10 * 2 * this.lane_depth + 5 * 2 * this.lane_depth)
      this.camera_speed = 0;
    if (this.camera_z_bound - z > 10)
      this.chicken.dead = true;

    // attaches camera to cube
    program_state.set_camera(Mat4.identity()
      .times(Mat4.translation(0, -4, -35))
      .times(Mat4.rotation(Math.PI / 6, 1, 0, 0))
      //.times(Mat4.rotation(0, 1, 0, 0))
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
    const toast = (this.level) ? "Get to the other side!" : "WASD to move!";
    this.text_canvas.handleCanvas
      (this.score, draw_toast, toast, this.chicken.dead, this.chicken.active_egg_count,
        this.chicken.max_eggs, this.paused, this.level);

    // handle and draw lanes and obstacles
    const current_chicken_lane_index =
      Math.ceil(this.chunks_rendered === 1 ? 1 : (z - this.lanes[0].lane_z) / (2 * this.lane_depth));
    this.lanes.forEach((lane, i) => {
      const check_chicken = (i === current_chicken_lane_index || i === current_chicken_lane_index - 1);
      const highlight_lane = this.highlight && check_chicken;
      const min_i = current_chicken_lane_index - 3;
      const max_i = current_chicken_lane_index + 14;
      // cut down number of lane checks from 26 to 16
      if (!this.paused && i > min_i && i < max_i)
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

    if (this.level > 0 && this.chunks_rendered > this.level + 3) { // every level is ten lanes longer
      if (!this.printed_level_ending) {
        if (this.lanes.length > 1) this.lanes.at(-1).before_rest_lane = true;
        for (let i = 0; i < 5; i++ ) {
          if (i === 1)
            this.lanes.push(new FinishLane(this.lane_transform, this.x_bound, this.lane_depth));
          else
            this.lanes.push(new RestLane(this.lane_transform, this.lane_colors[0], this.x_bound, this.lane_depth, true));
          this.lane_transform = this.lane_transform.times(Mat4.translation(0, 0, -2));
        }
        this.chicken.max_z_bound = -this.lane_transform[2][3] - 2 * this.lane_depth;
        this.printed_level_ending = true;
      }
      // if they beat the level
      if (z > this.chunks_rendered * 10 * 2 * this.lane_depth + 7 * 2 * this.lane_depth - this.lane_depth) { // if they beat the game
        if (!this.printed_next_level) {
          setTimeout(() => {
            this.init(this.level + 1);
          }, 750)
          this.printed_next_level = true;
        }
      }
    }
    else {
      if (z > (this.chunks_rendered - 1) * 10 * 2 * this.lane_depth + 2 * this.lane_depth) {
        this.chunks_rendered++;
        this.lanes = this.lanes.slice(-16);
        for (let i = 0; i < 10; i++) {
          if (Math.random() < this.rest_lane_chance) {
            if (this.lanes.length > 1) this.lanes.at(-1).before_rest_lane = true;
            this.lanes.push(new RestLane(this.lane_transform, this.lane_colors[i % 2], this.x_bound, this.lane_depth, false, this.max_stationary_obstacle_count));
          }
          else {
            this.lanes.push(new Road(this.lane_transform, this.x_bound, this.lane_depth, this.max_moving_obstacle_count, this.max_obstacle_speed, this.min_obstacle_speed));
          }
          this.lane_transform = this.lane_transform.times(Mat4.translation(0, 0, -2));
        }
      }
    }
  }
}