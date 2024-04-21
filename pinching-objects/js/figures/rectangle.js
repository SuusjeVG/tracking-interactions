export class DrawRectangel {
    constructor(x, y, height, width, color) {
      this.x = x;
      this.y = y;
      this.height = height;
      this.width = width;
      this.color = color;
    }
  
    createRectangle() {
      canvasCtx.fillStyle = this.color;
      canvasCtx.fillRect(this.x, this.y, this.height, this.width)
    }
  
    updatePosition(newX, newY) {
      this.x = newX - this.width / 2;  // Center the rectangle on the pinch
      this.y = newY - this.height / 2;
    }
  
}
  