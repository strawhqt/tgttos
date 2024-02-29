import {defs, tiny} from './examples/common.js';

const {
  Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

class Cube extends Shape {
  constructor() {
    super("position", "normal",);
    // Loop 3 times (for each axis), and inside loop twice (for opposing cube sides):
    this.arrays.position = Vector3.cast(
      [-1, -1, -1], [1, -1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, -1], [-1, 1, -1], [1, 1, 1], [-1, 1, 1],
      [-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1], [1, -1, 1], [1, -1, -1], [1, 1, 1], [1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1], [1, -1, -1], [-1, -1, -1], [1, 1, -1], [-1, 1, -1]);
    this.arrays.normal = Vector3.cast(
      [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0],
      [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0],
      [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]);
    // Arrange the vertices into a square shape in texture space too:
    this.indices.push(0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6, 8, 9, 10, 9, 11, 10, 12, 13,
      14, 13, 15, 14, 16, 17, 18, 17, 19, 18, 20, 21, 22, 21, 23, 22);
  }
}

export class Tgttos extends Scene {

  constructor() {
    super();
    this.default_cube_transform = Mat4.identity();
    this.shapes = {
      cube: new Cube(),
    }
    this.materials = {
      plastic: new Material(new defs.Phong_Shader(),
        {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
      cube: new Material(new defs.Phong_Shader(),
        {ambient: 0.2, diffusivity: 1, specularity: 1, color: hex_color("#ffffff")}),
      ground: new Material(new defs.Phong_Shader(),
        {ambient: 1, diffusivity: 0, specularity: 0, color: hex_color("#B5ED5D")}),
    };
  }

  make_control_panel() {
    // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
    this.key_triggered_button("Change Colors", ["c"], this.set_colors);
    // Add a button for controlling the scene.
    this.key_triggered_button("Outline", ["o"], () => {
    });
    this.key_triggered_button("Sit still", ["m"], () => {
    });
  }

  display(context, program_state) {
    // display():  Called once per frame of animation. Here, the base class's display only does
    // some initial setup.

    // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:

    if (!context.scratchpad.controls) {
      this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
      // Define the global camera and projection matrices, which are stored in program_state.
      program_state.set_camera(Mat4.translation(0, -4, -20).times(Mat4.rotation(Math.PI / 6, 1, 0, 0)));
    }

    // attaches movement controls to cube
    context.scratchpad.controls.set_recipient(() => this.default_cube_transform,
      () => Mat4.inverse(this.default_cube_transform));
    // attaches camera to cube
    program_state.set_camera(Mat4.translation(0, -4, -20)
      .times(Mat4.rotation(Math.PI / 4, 1, 0, 0))
      .times(Mat4.inverse(this.default_cube_transform)));


    program_state.projection_transform = Mat4.perspective(
      Math.PI / 4, context.width / context.height, 1, 100);

    // *** Lights: *** Values of vector or point lights.
    const light_position = vec4(0, 5, 2, 1);
    program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

    this.shapes.cube.draw(context, program_state, this.default_cube_transform, this.materials.cube.override({color: hex_color("#1a9ffa")}));


    let ground_transform = Mat4.identity();
    ground_transform = ground_transform.times(Mat4.scale(10, 1, 10)).times(Mat4.translation(0, -2, 0));
    this.shapes.cube.draw(context, program_state, ground_transform, this.materials.ground);
  }
}
