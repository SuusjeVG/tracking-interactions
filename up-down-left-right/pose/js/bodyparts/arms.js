export class Arm {
    constructor(shoulder, elbow, wrist, facePoint) {
        this.shoulder = shoulder;
        this.elbow = elbow;
        this.wrist = wrist;
        this.facePoint = facePoint; 
    }

    isArmUp() {
        const armUp = (this.elbow.y <= this.shoulder.y || this.wrist.y <= this.shoulder.y);
        const notTooHigh = (this.elbow.y >= this.facePoint.y && this.wrist.y >= this.facePoint.y);
        return armUp && notTooHigh;
    }

    isArmStraightUp() {
        return this.wrist.y < this.elbow.y && this.elbow.y < this.shoulder.y;
    }
}
