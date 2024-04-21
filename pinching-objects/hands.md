# Overzicht
Het vermogen om de vorm en beweging van handen waar te nemen is belangrijk voor het verbeteren van de gebruikerservaring in diverse technologische domeinen en platforms. Dit vermogen ondersteunt bijvoorbeeld het begrijpen van gebarentaal en handgebaarbesturing, en maakt het mogelijk om digitale content en informatie in augmented reality over de fysieke wereld te leggen. 

MediaPipe Hands biedt een hoogwaardige oplossing voor het volgen van handen en vingers. Het gebruikt machine learning (ML) om 21 3D-landmarken van een hand te infereren uit slechts één enkel frame. 
                    |

![hand_crops.png](https://mediapipe.dev/images/mobile/hand_crops.png)                          |
:-------------------------------------------------------------------------: |
*Top: Aligned hand crops passed to the tracking network with ground truth annotation. Bottom: Rendered synthetic hand images with ground truth annotation.* |


## Belangrijke Elementen in het HTML-document

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

## Scripts (javascript)

### Imports

De code begint met het importeren van de `vision` bibliotheek van de CDN. Hieruit worden specifieke klassen geëxtraheerd die nodig zijn voor het project:

- `HandLandmarker`: Voor handen landmarkdetectie.
- `FilesetResolver`: Voor het laden van de benodigde bestanden.

```javascript
import {
  HandLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
```

### Initialisatie van Hands Landmarker

```javascript
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
```

Dit script initialiseert de handen Landmarker door eerst de FilesetResolver te configureren die nodig is om de machine learning modellen te laden. De handen Landmarker wordt aangemaakt met configuraties zoals het pad naar het model, het gebruik van GPU voor snellere verwerking, en het aantal te detecteren handen.

## Configuratieopties

Deze taak heeft de volgende configuratieopties voor web- en JavaScript-toepassingen:

| Optienaam                     | Beschrijving                                                                                                                                                                                                                             | Waarde Bereik  | Standaardwaarde |
|-------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------|-----------------|
| `runningMode`                 | Stelt de werkmodus van de taak in. Er zijn twee modi:<br>**IMAGE**: De modus voor enkele afbeeldingsinvoer.<br>**VIDEO**: De modus voor gedecodeerde videoframes of voor een livestream van invoergegevens, zoals van een camera.        | {IMAGE, VIDEO} | IMAGE           |
| `numHands`                    | Het maximale aantal handen dat door de handlandmarkendetector wordt gedetecteerd.                                                                                                                                                       | Elk geheel getal > 0 | 1              |
| `minHandDetectionConfidence`  | De minimale betrouwbaarheidsscore voor de handdetectie om als succesvol te worden beschouwd in het handpalm detectiemodel.                                                                                                               | 0.0 - 1.0      | 0.5             |
| `minHandPresenceConfidence`   | De minimale betrouwbaarheidsscore voor de aanwezigheid van de hand in het handlandmarkendetectiemodel. In de VIDEO-modus en livestream-modus, als de score onder deze drempel valt, activeert de Hand Landmarker het handpalmdetectiemodel. | 0.0 - 1.0      | 0.5             |
| `minTrackingConfidence`       | De minimale betrouwbaarheidsscore voor het volgen van de hand om als succesvol te worden beschouwd. Dit is de drempelwaarde voor de IoU van de begrenzingskaders tussen handen in het huidige en het laatste frame.                       | 0.0 - 1.0      | 0.5             |

Deze tabel geeft duidelijk de verschillende configuratieopties weer die beschikbaar zijn voor het instellen van de MediaPipe Hands module, waardoor gebruikers de werking ervan kunnen aanpassen aan hun specifieke behoeften.

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
```

Wanneer de gebruiker de webcam inschakelt, wordt gecontroleerd of de FaceLandmarker is geladen. Vervolgens wordt de webcamstream geactiveerd en klaargezet om voorspellingen te doen met behulp van de predictWebcam functie.

### Voorspelling en Rendering

```javascript
let lastVideoTime = -1;
let results = undefined;

async function predictWebcam() {
  canvasElement.style.width = video.videoWidth;;
  canvasElement.style.height = video.videoHeight;
  canvasElement.width = video.videoWidth;
  canvasElement.height = video.videoHeight;
  
  // Start detection.
  let startTimeMs = performance.now();
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    results = handLandmarker.detectForVideo(video, startTimeMs);
  }

  // Render the results in the canvas.
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Draw the video frame to the canvas.
  // canvasCtx.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

  if (results.landmarks) {
    for (const landmarks of results.landmarks) {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 5
        
      });
      drawLandmarks(canvasCtx, landmarks, { color: "#FF0000", lineWidth: 2 });
    }
    
  }
  canvasCtx.restore();

  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
  
}
```

### Results

Console.log de `landmarks` variable `console.log(landmarks)` in de for of loop dan krijg je de 21 specifieke object landmarks gelogged in de console in een array. Hiermee kun je een specifieke landmark targeten. Wil je weten welke index welke landmark is? Kijk dan naar de afbeelding hieronder:

![hand_landmarks.png](https://mediapipe.dev/images/mobile/hand_landmarks.png) |
:--------------------------------------------------------: |
*Fig 1. 21 hand landmarks.*            

#### Belangrijke punten:

- Aspect Ratio Correctie: De code berekent de aspectratio van de video en past de hoogte van het videovenster aan om vervorming te voorkomen.

- Landmark Detection en Drawing: De functie detecteert gezichtslandmarken en tekent ze op het canvas. Elk type landmark wordt met een specifieke kleur en lijndikte getekend voor duidelijke visualisatie.

- Animatie Loop: De `window.requestAnimationFrame` roept predictWebcam opnieuw aan zolang de webcam actief is, waardoor een continue stroom van frames wordt verwerkt voor real-time tracking.
Deze functie zal nu effectief de gezichtslandmarken in real-time op het canvas visualiseren, gebruikmakend van de videofeed van de webcam.

## Documentatie

Voor meer gedetailleerde informatie over MediaPipe Hands landmarker en de configuratieopties, bezoek de [officiële MediaPipe Hands landmarker documentatie](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker/web_js).

## Verdere Referenties

- [MediaPipe Solutions](https://github.com/google/mediapipe/blob/master/docs/solutions/hands.md)
- [MediaPipe op GitHub](https://github.com/google/mediapipe)
