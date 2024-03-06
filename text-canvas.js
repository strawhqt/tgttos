export class Score {
  constructor() {
    this.width = 1080;
    this.height = 600;


    const canvas = document.createElement("canvas");
    const element = document.getElementById("main-canvas");
    element.append(canvas);
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
  }

  drawScore(score) {
    const x = 20;
    const y = 70;
    const offset = 3;
    this.ctx.textAlign = "left";
    this.ctx.font = "4.4em Lilita One, sans-serif";
    this.ctx.lineWidth = 3;

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = "black";
    this.ctx.fillText(score, x, y + offset);
    this.ctx.strokeText(score, x, y + offset);
    this.ctx.fillStyle = "white";
    this.ctx.fillText(score, x, y);
    this.ctx.strokeText(score, x, y);
  }

  drawToast(toast, t) {
    this.y_offset = 4 * Math.sin(16 * t);
    const x = this.width / 2;
    const y = 60 + this.y_offset;

    this.ctx.textAlign = "center";
    this.ctx.font = "2.5em Lilita One, sans-serif";
    this.ctx.lineWidth = 1.8;
    const offset = 2;

    this.ctx.fillStyle = "black";
    this.ctx.fillText(toast, x, y + offset);
    this.ctx.strokeText(toast, x, y + offset);
    this.ctx.fillStyle = "white";
    this.ctx.fillText(toast, x, y);
    this.ctx.strokeText(toast, x, y);
  }
}