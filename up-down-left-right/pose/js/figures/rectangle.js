export class Rectangle {
    constructor(x, y, width, height, fillColor, imageUrl = null) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.fillColor = fillColor;
        this.imageUrl = imageUrl; // Nieuwe eigenschap voor de afbeelding
        this.image = null; // Dit zal het Image object houden

        // Als er een imageUrl is, laad de afbeelding
        if (this.imageUrl) {
            this.loadImage();
        }
    }

    loadImage() {
        this.image = new Image();
        this.image.src = this.imageUrl;
        // this.image.onload = () => {
        //     console.log("Afbeelding geladen");
        // };
    }

    drawRectangle(canvasCtx) {
        canvasCtx.fillStyle = this.fillColor;
        canvasCtx.fillRect(this.x, this.y, this.width, this.height);

        // Als de afbeelding geladen is, teken deze binnen de rechthoek
        if (this.image && this.image.complete) {
            canvasCtx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }

}