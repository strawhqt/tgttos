export class TextCanvas {
  constructor(death_callback, paused_callback, toggle_callback) {
    this.width = 1080 * 2;
    this.height = 600 * 2;
    const font = new FontFace("Lilita One", "url('./assets/LilitaOne-Regular.ttf')")
    document.fonts.add(font);
    this.font_ready = false;
    font.load().then(() => this.font_ready = true)
    this.level = 0;

    const restart_button = document.createElement("button");
    const restart_button_wrapper = document.createElement("div");
    const pause_button = document.createElement("button");
    const toggle_button = document.createElement("button");
    const score_canvas = document.createElement("canvas");
    const death_canvas = document.createElement("canvas");
    const egg_canvas = document.createElement("canvas");
    const toast_canvas = document.createElement("canvas");


    const egg_image = new Image();
    egg_image.src = "./assets/egg.png";
    this.egg_image = egg_image;
    const element = document.getElementById("main-canvas");
    element.append(score_canvas);
    element.append(death_canvas);
    element.append(egg_canvas);
    element.append(toast_canvas);
    element.append(restart_button_wrapper);

    restart_button_wrapper.append(restart_button);
    restart_button_wrapper.style.position = "absolute";
    restart_button_wrapper.style.textAlign = "center";
    restart_button_wrapper.style.width = `${this.width / 2}px`;
    restart_button_wrapper.style.height = `${this.height / 2}px`;
    this.restart_button = restart_button;
    this.restart_button.textContent = "Restart (r)";
    this.restart_button.onclick = () => death_callback(this.level);
    this.restart_button.type = "button";

    restart_button_wrapper.append(toggle_button);
    this.toggle_button = toggle_button;
    this.toggle_button.type = "button";
    this.toggle_button.onclick = toggle_callback;
    this.toggle_button.textContent = "Toggle mode (l)";

    [this.restart_button, this.toggle_button].forEach((butt) => {
      butt.style.margin = "10px";
      butt.style.marginTop = `${this.height/2 - 60}px`;
      butt.style.visibility = "hidden";
      butt.style.fontFamily = "Lilita One, sans-serif";
      butt.style.background = "rgba(83,159,190,0.94)";
      butt.style.borderRadius = "10px";
      butt.style.padding = "6px 12px 6px 12px";
      butt.style.fontSize = "1.2em";
      butt.style.cursor = "pointer";
      butt.style.color = "#FFFFFF";
      butt.style.border = "none";
    })


    restart_button_wrapper.append(pause_button);
    this.pause_svg = "<svg  pointer-events=\"none\" \"http://www.w3.org/2000/svg\"  width=\"28\"  height=\"28\"  viewBox=\"0 0 24 24\"  fill=\"rgba(255,255,255,0.9)\"><path stroke=\"none\" d=\"M0 0h24v24H0z\" fill=\"none\"/><path d=\"M9 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z\" /><path d=\"M17 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z\" /></svg>";
    this.play_svg = "<svg  pointer-events=\"none\" xmlns=\"http://www.w3.org/2000/svg\"  width=\"28\"  height=\"28\"  viewBox=\"0 0 24 24\"  fill=\"rgba(255,255,255,0.9)\"><path stroke=\"none\" d=\"M0 0h24v24H0z\" fill=\"none\"/><path d=\"M6 4v16a1 1 0 0 0 1.524 .852l13 -8a1 1 0 0 0 0 -1.704l-13 -8a1 1 0 0 0 -1.524 .852z\" /></svg>";
    this.pause_button = pause_button;
    this.pause_button.innerHTML = this.pause_svg;
    this.pause_button.style.position = `absolute`;
    this.pause_button.style.right = `10px`;
    this.pause_button.style.top = `10px`;
    this.pause_button.style.background = "rgba(255,255,255,0.30)";
    this.pause_button.style.borderRadius = "10px";
    this.pause_button.style.display = "flex";
    this.pause_button.style.alignItems = "center";
    this.pause_button.style.padding = "6px";
    this.pause_button.style.cursor = "pointer";
    this.pause_button.style.border = "none";
    this.pause_button.style.visibility = "visible";

    this.pause_button.onclick = paused_callback;
    this.pause_button.type = "button";

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
    this.level = 0;
  }

  handleCanvas(score, draw_toast, toast, dead, eggs, max_eggs, paused, level) {
    if (!this.font_ready) return;
    // restarted after death
    if (this.death_drawn && !dead) {
      this.score = -1;
      this.level = 0;
      this.toast_drawn = false;
      this.death_drawn = false;
      this.restart_button.style.visibility = "hidden";
      this.toggle_button.style.visibility = "hidden";
      this.pause_button.style.visibility = "visible";
      this.clearCanvas(this.death_ctx);
    }

    if (!dead) {
      this.pause_button.innerHTML = (paused) ? this.play_svg : this.pause_svg;
      if (this.score < score) {
        this.score = score;
        if (!level)
          this.drawScore(this.score);
      }
      if (this.level !== level) {
        this.level = level;
        if (level)
          this.drawLevel(`Level ${this.level}`);
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
      this.drawDeath(this.score)
    }
  }

  brawlShadow(ctx, text, x, y, font_size = 8.8, offset = 6, outline = offset) {
    ctx.font = font_size.toString() + "em Lilita One, sans-serif";
    ctx.lineWidth = outline;
    if (outline) {
      ctx.fillStyle = "black";
      ctx.fillText(text, x, y + offset);
      ctx.strokeText(text, x, y + offset);
    }
    ctx.fillStyle = "white";
    ctx.fillText(text, x, y);
    ctx.strokeText(text, x, y);
  }

  clearCanvas(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  drawScore(score) {
    const x = 40;
    let y = 140;
    let pb = localStorage.getItem("bestScore");
    if (!pb || pb < score) {
      localStorage.setItem("bestScore", score.toString());
    }
    this.score_ctx.textAlign = "left";
    this.clearCanvas(this.score_ctx);
    this.brawlShadow(this.score_ctx, score, x, y)
  }

  drawLevel(level) {
    const x = 40;
    const y = 110;
    this.score_ctx.textAlign = "left";
    this.clearCanvas(this.score_ctx);
    this.brawlShadow(this.score_ctx, level, x, y, 6, 4)
  }

  drawToast(toast, t) {
    const y_offset = 8 * Math.sin(16 * t);
    const x = this.width / 2;
    const y = 120 + y_offset;
    this.toast_ctx.textAlign = "center";
    this.clearCanvas(this.toast_ctx);
    this.brawlShadow(this.toast_ctx, toast, x, y, 6, 4)
    this.toast_drawn = true;
  }

  drawDeath(score) {
    let x = this.width / 2;
    let y = this.height / 2;
    this.death_ctx.textAlign = "center";
    this.death_ctx.fillStyle = "rgba(255,94,94,0.28)";
    this.death_ctx.fillRect(0, 0, this.death_ctx.canvas.width, this.death_ctx.canvas.height);
    this.brawlShadow(this.death_ctx, "You died!", x, y, 8, 6)
    y += 140;
    const pb = localStorage.getItem("bestScore");
    const offset = Math.max(40 + pb.length * 25, 100);
    x -= offset;
    if (!this.level) {
      this.brawlShadow(this.death_ctx, score, x, y, 6, 4);
      this.brawlShadow(this.death_ctx, "score", x, y+60, 4, 3);
      x += 2 * offset;
      this.brawlShadow(this.death_ctx, pb, x, y, 6, 4);
      this.brawlShadow(this.death_ctx, "best", x, y+60, 4, 3);
    }
    else {
      const ending = 46 + 10 * this.level;
      const percentage = Math.floor(this.score / ending * 100);
      this.brawlShadow(this.death_ctx, this.level, x, y, 6, 4);
      this.brawlShadow(this.death_ctx, "level", x, y+60, 4, 3);
      x += 2 * offset;
      this.brawlShadow(this.death_ctx, `${percentage}%`, x, y, 6, 4);
      this.brawlShadow(this.death_ctx, "progress", x, y+60, 4, 3);
    }

    this.restart_button.style.visibility = "visible";
    this.toggle_button.style.visibility = "visible";
    this.pause_button.style.visibility = "hidden";

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