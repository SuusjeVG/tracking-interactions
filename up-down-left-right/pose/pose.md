# Overzicht
Menselijke pose-schatting uit video is belangrijk in diverse toepassingen zoals het kwantificeren van fysieke oefeningen, gebarentaalherkenning en volledige lichaamsgebaarbesturing. 

MediaPipe Pose is een machine learning-oplossing voor nauwkeurige lichaamspose-tracking, die 33 3D-landmarken en een achtergrondsegmentatiemasker op het hele lichaam kan infereren uit RGB-videoframes. 
                    |

![pose_tracking_example.gif](https://mediapipe.dev/images/mobile/pose_tracking_example.gif) |
:----------------------------------------------------------------------: |
*Fig 1. Example of MediaPipe Pose for pose tracking.*                    |


## Belangrijke Elementen in het HTML-document

`<head>`
- Link:
```html
<script type="module" src="js/handtracking.js" defer></script>
<link rel="stylesheet" href="style.css">
```
`</head>`

`<body>`
- Video element:
```html
<video id="webcam" playsinline autoplay></video>
```

- Canvas element:
```html
<canvas id="output_canvas" width="1280px" height="720px"></canvas>
```

- Button element:
```html
<button id="webcamButton">Enable webcam</button>
```
`</body>`

## Scripts (javascript)

### Imports

De code begint met het importeren van de `vision` bibliotheek van de CDN. Hieruit worden specifieke klassen geëxtraheerd die nodig zijn voor het project:

- `PoseLandmarker`: Voor pose landmarkdetectie.
- `FilesetResolver`: Voor het laden van de benodigde bestanden.
- `DrawingUtils`: Voor het tekenen van resultaten op het canvas.

```javascript
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils
} from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";

let poseLandmarker= undefined;
let enableWebcamButton;
let webcamRunning= false;
```

### Initialisatie van Pose Landmarker

```javascript
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
```

Dit script initialiseert de pose Landmarker door eerst de FilesetResolver te configureren die nodig is om de machine learning modellen te laden. De pose Landmarker wordt aangemaakt met configuraties zoals het pad naar het model en het gebruik van GPU voor snellere verwerking.

- **Model File Location and Naming:** Het getrainde model dat gespecificeerd wordt in de modelAssetPath bevindt zich in de `models/` map van je project. De bestandsnaam van het model moet het patroon `specifieke-tracking.task` volgen. Zorg ervoor dat je het juiste bestand in deze map plaatst en de juiste bestandsnaam in je configuratie gebruikt. Bijvoorbeeld, als je een pose-tracking model gebruikt, kan het bestand genaamd zijn als `pose_landmarker.task` en zou je `modelAssetPath: './models/pose_landmarker.task'` instellen.


## Configuratieopties

Deze taak heeft de volgende configuratieopties voor web- en JavaScript-toepassingen:

| Optienaam                     | Beschrijving                                                                                                                                                                   | Waarde Bereik   | Standaardwaarde |
|-------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------|-----------------|
| `runningMode`                 | Stelt de werkmodus van de taak in. Er zijn twee modi:<br>**IMAGE**: De modus voor enkele afbeeldingsinvoer.<br>**VIDEO**: De modus voor gedecodeerde frames van een video of een livestream van invoergegevens, zoals van een camera. | {IMAGE, VIDEO}  | IMAGE           |
| `numPoses`                    | Het maximale aantal poses dat door de Pose Landmarker kan worden gedetecteerd.                                                                                                 | Integer > 0     | 1               |
| `minPoseDetectionConfidence`  | De minimale betrouwbaarheidsscore voor de posedetectie om als succesvol te worden beschouwd.                                                                                   | Float [0.0,1.0] | 0.5             |
| `minPosePresenceConfidence`   | De minimale betrouwbaarheidsscore voor de aanwezigheidsscore van de pose in de pose landmark detectie.                                                                         | Float [0.0,1.0] | 0.5             |
| `minTrackingConfidence`       | De minimale betrouwbaarheidsscore voor de pose tracking om als succesvol te worden beschouwd.                                                                                  | Float [0.0,1.0] | 0.5             |
| `outputSegmentationMasks`     | Geeft aan of Pose Landmarker een segmentatiemasker voor de gedetecteerde pose uitvoert.                                                                                        | Boolean         | False           |

Deze tabel biedt een overzicht van alle beschikbare configuratieopties en stelt gebruikers in staat om de werking van de Pose Landmarker aan hun specifieke behoeften aan te passen.


### Configuratie van de Webcam en Canvas

```javascript
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
```

Dit deel van de code zorgt voor het instellen van de video- en canvas-elementen. Het controleert of de browser ondersteuning biedt voor getUserMedia voor toegang tot de webcam. Als dit ondersteund wordt, wordt een event listener toegevoegd aan de knop om de webcam in te schakelen.

### Webcam Activeren en Landmarks Detecteren

```javascript
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
```

Wanneer de gebruiker de webcam inschakelt, wordt gecontroleerd of de FaceLandmarker is geladen. Vervolgens wordt de webcamstream geactiveerd en klaargezet om voorspellingen te doen met behulp van de predictWebcam functie.

### Voorspelling en Rendering

```javascript
let lastVideoTime = -1;
const drawingUtils = new DrawingUtils(canvasCtx);

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

    // Draw the video frame to the canvas
    // canvasCtx.drawImage(video, 0, 0, canvasElement.width, canvasElement.height); // Draw the video frame to the canvas

    // Draw the detected pose landmarks and connectors on the canvas
    if (results && results.landmarks) {
      for (const landmark of results.landmarks) {
        drawingUtils.drawLandmarks(landmark, {
          radius: (data) => DrawingUtils.lerp(data.from.z, -0.15, 0.1, 5, 1)
        });
        drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);
      }
    }

    canvasCtx.restore();
  }

  // Request the next animation frame to keep the loop going
  if (webcamRunning) {
    window.requestAnimationFrame(predictWebcam);
  }
}
```

### Results

Console.log de `landmarks` variable `console.log(landmarks)` in de for of loop dan krijg je de 33 specifieke object landmarks gelogged in de console in een array. Hiermee kun je een specifieke landmark targeten. Wil je weten welke index welke landmark is? Kijk dan naar de afbeelding hieronder:

![pose_tracking_full_body_landmarks.png](https://mediapipe.dev/images/mobile/pose_tracking_full_body_landmarks.png) |
:----------------------------------------------------------------------------------------------: |
*Fig 2. 33 pose landmarks.*            

#### Belangrijke punten:

- Aspect Ratio Correctie: De code berekent de aspectratio van de video en past de hoogte van het videovenster aan om vervorming te voorkomen.

- Landmark Detection en Drawing: De functie detecteert gezichtslandmarken en tekent ze op het canvas. Elk type landmark wordt met een specifieke kleur en lijndikte getekend voor duidelijke visualisatie.

- Animatie Loop: De `window.requestAnimationFrame` roept predictWebcam opnieuw aan zolang de webcam actief is, waardoor een continue stroom van frames wordt verwerkt voor real-time tracking.
Deze functie zal nu effectief de gezichtslandmarken in real-time op het canvas visualiseren, gebruikmakend van de videofeed van de webcam.

## Documentatie

Voor meer gedetailleerde informatie over MediaPipe Pose landmarker en de configuratieopties, bezoek de [officiële MediaPipe Pose landmarker documentatie](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker/web_js).

## Verdere Referenties

- [MediaPipe Solutions](https://github.com/google/mediapipe/blob/master/docs/solutions/pose.md)
- [MediaPipe op GitHub](https://github.com/google/mediapipe)