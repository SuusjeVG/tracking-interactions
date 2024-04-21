export class Circle {
    constructor(canvasCtx, x, y, radius) {
      this.canvasCtx = canvasCtx;
      this.x = x;
      this.y = y;
      this.radius = radius;
    }
  
    draw() {
      this.canvasCtx.beginPath();
      this.canvasCtx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
      this.canvasCtx.strokeStyle = "#00FF00";
      this.canvasCtx.lineWidth = 2;
      this.canvasCtx.stroke();
    }
  }