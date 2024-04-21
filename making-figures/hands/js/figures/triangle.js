export class Triangle {
    constructor(canvasCtx, x1, y1, x2, y2, x3, y3) {
      this.canvasCtx = canvasCtx;
      this.x1 = x1;
      this.y1 = y1;
      this.x2 = x2;
      this.y2 = y2;
      this.x3 = x3;
      this.y3 = y3;
    }
  
    draw() {
      this.canvasCtx.beginPath();
      this.canvasCtx.moveTo(this.x1, this.y1);
      this.canvasCtx.lineTo(this.x2, this.y2);
      this.canvasCtx.lineTo(this.x3, this.y3);
      this.canvasCtx.closePath();
      this.canvasCtx.strokeStyle = "#0000FF";
      this.canvasCtx.lineWidth = 2;
      this.canvasCtx.stroke();
    }
  }
