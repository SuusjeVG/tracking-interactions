import {
  HandLandmarker,
  FilesetResolver,
  DrawingUtils
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

import { DrawRectangel } from './figures/rectangle.js';

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

  if (webcamRunning === true) {
    webcamRunning = false;
    enableWebcamButton.innerText = "ENABLE PREDICTIONS";
  } else {
    webcamRunning = true;
    enableWebcamButton.innerText = "DISABLE PREDICTIONS";
  }

  // getUsermedia parameters.
  const constraints = {
    video: true
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });
  
}

const rectangle = new DrawRectangel(350, 100, 50, 50, 'rgba(255, 0, 0, 0.5)');


let detected = false;

function collision(landmarks) {
  const rectX = rectangle.x;
  const rectY = rectangle.y;

  const thumbTip = landmarks[4];
  const indexFingerTip = landmarks[8];

  const thumb_x = thumbTip.x * canvasElement.width;
  const thumb_y = thumbTip.y * canvasElement.height;
  const index_x = indexFingerTip.x * canvasElement.width;
  const index_y = indexFingerTip.y * canvasElement.height;
  
  if ((thumb_x > rectX && thumb_x < rectX + rectangle.width) && (thumb_y > rectY && thumb_y < rectY + rectangle.height)) {
    // console.log('Collision detected');
    detected = true;
    return detected;
  } else {
    detected = false;
    return detected;
  }
}


let pinched = false;
function detectPinch(landmarks) {
  const thumbTip = landmarks[4];  // Tip of the thumb
  const indexFingerTip = landmarks[8];  // Tip of the index finger
  
  // Convert normalized coordinates to canvas coordinates using mirroring
  const index_x = (1 - indexFingerTip.x) * canvasElement.width;
  const index_y = indexFingerTip.y * canvasElement.height;
  const thumb_x = (1 - thumbTip.x) * canvasElement.width;
  const thumb_y = thumbTip.y * canvasElement.height;

  // Calculate the Euclidean distance
  const distance = Math.sqrt(Math.pow(index_x - thumb_x, 2) + Math.pow(index_y - thumb_y, 2));
 console.log(distance);
  // Check if the distance is less than a threshold (e.g., 50 pixels)
  if (distance < 60) {
      // console.log('Pinching');
      pinched =  true;
      return pinched;
  } else {
    pinched = false;
    return pinched;
  }
}


let lastVideoTime = -1;
const drawingUtils = new DrawingUtils(canvasCtx);

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

    canvasCtx.save();
    // Clear the canvas for new drawing
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Draw the video frame to the canvas
    // canvasCtx.drawImage(video, 0, 0, canvasElement.width, canvasElement.height); // Draw the video frame to the canvas

    // Draw results on the canvas
    if (results && results.landmarks) {
      for (const landmarks of results.landmarks) {
        detectPinch(landmarks)

        let isCollision = collision(landmarks);
  
        if (isCollision && pinched) {
          const midpoint_x = (landmarks[4].x + landmarks[8].x) / 2 * canvasElement.width;
          const midpoint_y = (landmarks[4].y + landmarks[8].y) / 2 * canvasElement.height;
          rectangle.updatePosition(midpoint_x, midpoint_y);
          rectangle.color = 'green';
        } else {
          rectangle.color = 'red';
        }
  
        rectangle.createRectangle();

        drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 5 });
        drawingUtils.drawLandmarks(landmarks, { color: "#FF0000", lineWidth: 2 });
      }
    }
  }

  // Request the next animation frame to keep the loop going
  if (webcamRunning) {
    window.requestAnimationFrame(predictWebcam);
  }
  
}
