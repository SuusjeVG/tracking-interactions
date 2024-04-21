import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils
} from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";

import { Rectangle } from "./figures/rectangle.js"; 
import { Arm } from "./bodyparts/arms.js";

let poseLandmarker= undefined;
let enableWebcamButton;
let webcamRunning= false;

// Before we can use PoseLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
const createPoseLandmarker = async () => {

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `./models/pose_landmarker_full.task`,
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numPoses: 2,
  });

};
createPoseLandmarker();

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
  if (!poseLandmarker) {
    console.log("Wait! poseLandmaker not loaded yet.");
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

// get the images from the images folder
const imageUrls = [
  "./images/arrow-right-solid.svg",
  "./images/arrow-left-solid.svg",
  "./images/arrow-down-solid.svg",
  "./images/arrow-up-solid.svg"
];

async function predictWebcam() {

  // Get the current time of the video in seconds.
  // Process new frame only if the video time has changed
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    let startTimeMs = performance.now();

    // Perform pose detection asynchronously
    let results = await poseLandmarker.detectForVideo(video, startTimeMs);

    canvasCtx.save();
    // Clear the canvas for new drawing
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Draw the detected pose landmarks and connectors on the canvas
    if (results && results.landmarks) {
      let bothArmsUp = false;

      for (const landmark of results.landmarks) {
        const leftArm = new Arm(landmark[11], landmark[13], landmark[15], landmark[2]);
        const rightArm = new Arm(landmark[12], landmark[14], landmark[16], landmark[5]);

        const rectangleWidth = 300;
        if (leftArm.isArmStraightUp() && rightArm.isArmStraightUp()) {
          bothArmsUp = true;
          const rectangleUp = new Rectangle((canvasElement.width - rectangleWidth) / 2, 10, rectangleWidth, 300, "yellow", imageUrls[3]);
          rectangleUp.drawRectangle(canvasCtx);
          break; 
        }

        if (leftArm.isArmUp()) {
          const rectangleLeft = new Rectangle(canvasElement.width - rectangleWidth, 300, rectangleWidth, 100, "green", imageUrls[0]);
          rectangleLeft.drawRectangle(canvasCtx);
        }

        if (rightArm.isArmUp()) {
          const rectangleRight = new Rectangle(10, 300, rectangleWidth, 100, "red", imageUrls[1]);
          rectangleRight.drawRectangle(canvasCtx);
        }
      }
    }

    canvasCtx.restore();
  }

  // Request the next animation frame to keep the loop going
  if (webcamRunning) {
    window.requestAnimationFrame(predictWebcam);
  }
}

