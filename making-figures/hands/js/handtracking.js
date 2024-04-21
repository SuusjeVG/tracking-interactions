import {
  HandLandmarker,
  FilesetResolver,
  DrawingUtils
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

import { Rectangle } from "./figures/rectangle.js";

let handLandmarker = undefined;
let enableWebcamButton;
let webcamRunning= false;

// Before we can use HandLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
const createHandLandmarker = async () => {

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `./models/hand_landmarker.task`,
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numHands: 2
  });

};
createHandLandmarker();

const video = document.getElementById("webcam");
const canvasElement = document.getElementById(
  "output_canvas"
);
const canvasCtx = canvasElement.getContext("2d");

// Check if webcam access is supported.
const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById("webcamButton");
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

// Enable the live webcam view and start detection.
function enableCam(event) {
  if (!handLandmarker) {
    console.log("Wait! objectDetector not loaded yet.");
    return;
  }

  webcamRunning = !webcamRunning;
  enableWebcamButton.innerText = webcamRunning ? "DISABLE PREDICTIONS" : "ENABLE PREDICTIONS";

   // Activate or deactivate the webcam based on the current state
  if (webcamRunning) {
    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      video.srcObject = stream;
      video.addEventListener("loadeddata", predictWebcam);
    });
  } else {
    video.srcObject.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  }

}


let lastVideoTime = -1;
const drawingUtils = new DrawingUtils(canvasCtx);

let lastPlacementTime = performance.now();
const permanentShapes = []; 
// Main function to predict hand landmarks
async function predictWebcam() {

  // Adjust canvas size only if it has changed
  if (video.videoWidth !== canvasElement.width || video.videoHeight !== canvasElement.height) {
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;
  }

  // Start detection.
  let startTimeMs = performance.now();
  // Process new frame only if the video time has changed
  if (lastVideoTime !== video.currentTime) {

    lastVideoTime = video.currentTime;
    // Perform hand landmark detection asynchronously
    let results = await handLandmarker.detectForVideo(video, startTimeMs);

    // Draw results on the canvas
    if (results && results.landmarks) {
      for (const landmarks of results.landmarks) {

        // voor meer informatie over de landmarks zie: https://developers.google.com/mediapipe/solutions/vision/hand_landmarker en scroll naar onder
        const index_fingertip = landmarks[8]; // 8 is de index van de tip van de wijsvinger
        const thumb_fingertip = landmarks[4]; // 4 is de index van de tip van de duim
  
        // Zet de genormaliseerde coördinaten om naar canvas coördinaten
        const index_x = (1 - index_fingertip.x) * canvasElement.width; // Spiegelen van de X-coördinaat
        const index_y = index_fingertip.y * canvasElement.height;
        const thumb_x = (1 - thumb_fingertip .x) * canvasElement.width; // Spiegelen van de X-coördinaat
        const thumb_y = thumb_fingertip .y * canvasElement.height;
  
        // Bereken de breedte en hoogte van de rechthoek en de positie van de linkerbovenhoek
        const height = Math.sqrt((thumb_x - index_x) ** 2 + (thumb_y - index_y) ** 2);
        const width = 100;
        const radius = height / 2; 
        const rectX = Math.min(thumb_x, index_x);
        const rectY = Math.min(thumb_y, index_y);
    
        // Teken eerst de permanent geplaatste vormen
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        for (const shape of permanentShapes) {
          shape.draw();
        }
    
        // Teken de bewegende rechthoek
        const movingRect = new Rectangle(canvasCtx, rectX, rectY, width, height);
        movingRect.draw();
    
        // Controleer of 3 seconden zijn verstreken
        if (startTimeMs - lastPlacementTime >= 3000) {
          permanentShapes.push(movingRect);
          lastPlacementTime =  startTimeMs;
        }
      
  
      }
    }
  }

  // Request the next animation frame to keep the loop going
  if (webcamRunning) {
    window.requestAnimationFrame(predictWebcam);
  }
  
}
