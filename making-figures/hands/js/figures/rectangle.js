export class Rectangle {
    constructor(canvasCtx, x, y, width, height, fillColor = '#FF0000') {
      this.canvasCtx = canvasCtx;
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.fillColor = fillColor;
    }
  
    draw() {
      this.canvasCtx.beginPath();
      this.canvasCtx.rect(this.x, this.y, this.width, this.height);

      // Update de vulling elke keer als draw wordt aangeroepen
      this.updateColor();
      
      this.canvasCtx.fillStyle = this.fillColor;
      this.canvasCtx.fill();

      this.canvasCtx.strokeStyle = "#FF0000";
      this.canvasCtx.lineWidth = 2;
      this.canvasCtx.stroke();
    }

    updateColor() {
      // Willekeurige kleur generatie
      this.fillColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    }
}