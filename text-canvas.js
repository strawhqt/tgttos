export class TextCanvas {
  constructor() {
    this.width = 1080;
    this.height = 600;
    const font = new FontFace("Lilita One", "url('./assets/LilitaOne-Regular.ttf')")
    document.fonts.add(font);
    this.font_ready = false;
    font.load().then(() => this.font_ready = true)

    const button = document.createElement("button");
    const button_wrapper = document.createElement("div");
    const score_canvas = document.createElement("canvas");
    const death_canvas = document.createElement("canvas");
    const egg_canvas = document.createElement("canvas");
    const toast_canvas = document.createElement("canvas");

    const x_dim = 600;
    const y_dim = 788;
    const egg_image = new Image();
    egg_image.src = "./assets/egg.png";
    this.egg_image = egg_image;
    const element = document.getElementById("main-canvas");
    element.append(score_canvas);
    element.append(death_canvas);
    element.append(egg_canvas);
    element.append(toast_canvas);


    element.append(button_wrapper);
    button_wrapper.append(button);
    button_wrapper.style.position = "absolute";
    button_wrapper.style.textAlign = "center";
    button_wrapper.style.width = `${this.width}px`;
    button_wrapper.style.height = `${this.height}px`;
    this.button = button;
    this.button.textContent = "Restart"
    this.button.style.marginTop = `${this.height - 60}px`;
    this.button.disabled = true;
    this.button.hidden = true;

    this.score_ctx = score_canvas.getContext("2d");
    this.death_ctx = death_canvas.getContext("2d");

    this.egg_ctx = egg_canvas.getContext("2d");
    this.toast_ctx = egg_canvas.getContext("2d");


    [score_canvas, death_canvas, egg_canvas, toast_canvas].forEach((c) =>  {
      c.style.position = "absolute";
      c.style.left = "0px";
      c.style.right = "0px";
      c.style.margin = "auto";
      c.height = this.height;
      c.width = this.width;
    });

    [this.score_ctx, this.death_ctx, this.egg_ctx, this.toast_ctx].forEach((ctx) =>  {
      ctx.strokeStyle = 'black';
    });

    this.score = -1;

    this.eggs = 0;
    this.death_drawn = false;
    this.toast_drawn = false;
  }

  handleCanvas(score, draw_toast, toast, dead, dead_callback, eggs, max_eggs) {
    if (!this.font_ready) return;
    // restarted after death
    if (this.death_drawn && !dead) {
      this.score = -1;
      this.toast_drawn = false;
      this.death_drawn = false;
      this.button.disabled = true;
      this.button.hidden = true;
      this.clearCanvas(this.death_ctx);
    }

    if (!dead) {
      if (this.score < score) {
        this.score = score;
        this.drawScore(this.score);
      }

      if (this.eggs !== eggs) {
        this.eggs = eggs;
        this.drawEggs(eggs, max_eggs);
      }

      if (draw_toast)
        this.drawToast(toast, Date.now() / 1000);
      else if (this.toast_drawn) {
        this.toast_drawn = false;
        this.clearCanvas(this.toast_ctx);
      }
    }

    if (dead && !this.death_drawn) {
      this.clearCanvas(this.score_ctx);
      this.clearCanvas(this.egg_ctx);
      this.clearCanvas(this.toast_ctx);
      this.death_drawn = true;
      this.drawDeath(this.score, dead_callback)
    }
  }

  brawlShadow(ctx, text, x, y, font_size = 4.4, offset = 3, outline = offset) {
    ctx.font = font_size.toString() + "em Lilita One, sans-serif";
    ctx.lineWidth = outline;
    ctx.fillStyle = "black";
    ctx.fillText(text, x, y + offset);
    ctx.strokeText(text, x, y + offset);
    ctx.fillStyle = "white";
    ctx.fillText(text, x, y);
    ctx.strokeText(text, x, y);
  }

  clearCanvas(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  drawScore(score) {
    const x = 20;
    const y = 70;
    this.score_ctx.textAlign = "left";
    this.clearCanvas(this.score_ctx);
    this.brawlShadow(this.score_ctx, score, x, y)
  }

  drawToast(toast, t) {
    const y_offset = 4 * Math.sin(16 * t);
    const x = this.width / 2;
    const y = 60 + y_offset;
    this.toast_ctx.textAlign = "center";
    this.clearCanvas(this.toast_ctx);
    this.brawlShadow(this.toast_ctx, toast, x, y, 3, 2, 2)
    this.toast_drawn = true;
  }

  drawDeath(score, callback) {
    const x = this.width / 2;
    let y = this.height / 2;
    this.death_ctx.textAlign = "center";
    this.death_ctx.fillStyle = "rgba(255,94,94,0.28)";
    this.death_ctx.fillRect(0, 0, this.width, this.height);
    this.brawlShadow(this.death_ctx, "You died!", x, y)
    y += 60;
    this.brawlShadow(this.death_ctx, score, x, y, 3, 2);
    this.button.disabled = false;
    this.button.hidden = false;
    this.button.onclick = callback;
  }

  drawEggs(eggs, max_eggs) {
    console.log('egg')

    const x = 500;
    const y = 70;
    // this.clearCanvas(this.egg_ctx);
    const scale = 10;
    // this.egg_ctx.drawImage(this.egg_image, x, y)

  }
}