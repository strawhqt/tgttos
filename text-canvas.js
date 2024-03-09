export class TextCanvas {
  constructor() {
    this.width = 1080;
    this.height = 600;

    const button = document.createElement("button");
    const button_wrapper = document.createElement("div");
    const canvas = document.createElement("canvas");
    const element = document.getElementById("main-canvas");
    element.append(canvas);
    element.append(button_wrapper);

    button_wrapper.append(button);
    button_wrapper.style.position = "absolute";
    button_wrapper.style.textAlign = "center";
    button_wrapper.style.width = `${this.width}px`;
    button_wrapper.style.height = `${this.height}px`;
    this.button = button;
    this.button.textContent = "Restart"
    this.button.disabled = true;
    this.button.hidden = true;
    canvas.id = 'score';
    this.canvas = document.getElementById("score");
    this.ctx = this.canvas.getContext("2d");
    this.canvas.width = this.width;
    this.canvas.height = this.height = 600;
    this.canvas.style.position = "absolute";
    this.canvas.style.left = "0px";
    this.canvas.style.right = "0px";
    this.canvas.style.margin = "auto";
    this.ctx.font = "4.4em Lilita One, sans-serif";
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 3;
    this.score = 0;
    this.death_drawn = false
  }

  handleCanvas(score, draw_toast, toast, dead, dead_callback) {
    // restarted after death
    if (this.death_drawn && !dead)
      this.score = -1;

    if (!dead) {
      this.death_drawn = false;
    }

    if (this.score < score) {
      this.score = score;
      this.resetCanvas();
      this.drawScore(this.score);
    }

    // draw score and toast
    if (this.score === 0 && !dead) {
      this.resetCanvas();
      this.drawScore(this.score);
      if (draw_toast)
        this.drawToast(toast, Date.now() / 1000);
    }

    if (dead && !this.death_drawn) {
      this.resetCanvas();
      this.death_drawn = true;
      this.drawDeath(this.score, dead_callback)
    }
  }

  brawlShadow(text, x, y, font_size = 4.4, offset = 3, outline = offset) {
    this.ctx.font = font_size.toString() + "em Lilita One, sans-serif";
    this.ctx.lineWidth = outline;
    this.ctx.fillStyle = "black";
    this.ctx.fillText(text, x, y + offset);
    this.ctx.strokeText(text, x, y + offset);
    this.ctx.fillStyle = "white";
    this.ctx.fillText(text, x, y);
    this.ctx.strokeText(text, x, y);
  }
  resetCanvas() {
    this.button.disabled = true;
    this.button.hidden = true;
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
  drawScore(score) {
    const x = 20;
    const y = 70;
    this.ctx.textAlign = "left";
    this.brawlShadow(score, x, y)
  }

  drawToast(toast, t) {
    const y_offset = 4 * Math.sin(16 * t);
    const x = this.width / 2;
    const y = 60 + y_offset;
    this.ctx.textAlign = "center";
    this.brawlShadow(toast, x, y, 3, 2, 2)

  }

  drawDeath(score, callback) {
    const x = this.width / 2;
    let y = this.height / 2;

    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "rgba(255,94,94,0.28)";
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.brawlShadow("You died!", x, y)
    y += 60;
    this.brawlShadow(score, x, y, 3, 2);
    this.button.style.marginTop = `${this.height - 60}px`;
    this.button.disabled = false;

    this.button.hidden = false;
    this.button.onclick = callback;
  }
}