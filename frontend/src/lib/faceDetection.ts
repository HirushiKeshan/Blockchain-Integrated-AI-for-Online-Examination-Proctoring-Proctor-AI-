import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import { FilesetResolver, FaceDetector } from '@mediapipe/tasks-vision';

let detector: FaceDetector | null = null;
let lastPhoneDetection = 0;
let consecutivePhoneFrames = 0;
let lastFacePosition = { x: 0, y: 0, width: 0, height: 0 };
const PHONE_DETECTION_COOLDOWN = 5000;
const CONSECUTIVE_FRAMES_THRESHOLD = 12;
const MOVEMENT_THRESHOLD = 0.15;
const POSITION_HISTORY_SIZE = 10;
const positionHistory: Array<{ y: number; time: number }> = [];

export async function initFaceDetection() {
  await tf.ready();
  await tf.setBackend('webgl');

  if (!detector) {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    detector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
    });
  }

  return detector;
}

export function cleanup() {
  detector = null;
  lastPhoneDetection = 0;
  consecutivePhoneFrames = 0;
  lastFacePosition = { x: 0, y: 0, width: 0, height: 0 };
  positionHistory.length = 0;
}

export async function detectFace(video: HTMLVideoElement) {
  if (!detector) {
    await initFaceDetection();
  }

  try {
    const detections = await detector!.detectForVideo(video, performance.now());
    const currentTime = Date.now();
    let phoneDetected = false;

    if (detections.detections.length > 0) {
      const detection = detections.detections[0];
      const boundingBox = detection.boundingBox;

      if (!boundingBox) {
        return {
          faceDetected: true,
          multipleFaces: detections.detections.length > 1,
          phoneDetected: false,
          predictions: detections.detections,
        };
      }

      // Normalize positions
      const { originX, originY, width, height } = boundingBox;

      positionHistory.push({ y: originY, time: currentTime });
      if (positionHistory.length > POSITION_HISTORY_SIZE) {
        positionHistory.shift();
      }

      const xMovement = Math.abs(originX - lastFacePosition.x);
      const yMovement = Math.abs(originY - lastFacePosition.y);

      lastFacePosition = {
        x: originX,
        y: originY,
        width: width,
        height: height,
      };

      const isConsistentlyLookingDown =
        positionHistory.length === POSITION_HISTORY_SIZE &&
        positionHistory.every((pos) => pos.y > 0.65);

      const hasRapidMovement =
        positionHistory.length > 2 &&
        positionHistory.some((pos, i) => {
          if (i === 0) return false;
          const timeDiff = pos.time - positionHistory[i - 1].time;
          const posDiff = Math.abs(pos.y - positionHistory[i - 1].y);
          return posDiff > 0.1 && timeDiff < 200;
        });

      const isLookingDown = originY > 0.75;
      const isPartiallyVisible = width < 0.1;
      const hasSignificantMovement = yMovement > MOVEMENT_THRESHOLD;
      const isOffCenter = Math.abs(originX - 0.5) > 0.3;

      const potentialPhoneUsage =
        isLookingDown &&
        isConsistentlyLookingDown &&
        ((isPartiallyVisible && hasSignificantMovement) ||
          (isOffCenter && hasRapidMovement));

      if (potentialPhoneUsage) {
        consecutivePhoneFrames++;
        if (consecutivePhoneFrames >= CONSECUTIVE_FRAMES_THRESHOLD) {
          if (currentTime - lastPhoneDetection > PHONE_DETECTION_COOLDOWN) {
            phoneDetected = true;
            lastPhoneDetection = currentTime;
            consecutivePhoneFrames = 0;
          }
        }
      } else {
        consecutivePhoneFrames = Math.max(0, consecutivePhoneFrames - 3);
      }
    } else {
      consecutivePhoneFrames = 0;
    }

    return {
      faceDetected: detections.detections.length > 0,
      multipleFaces: detections.detections.length > 1,
      phoneDetected,
      predictions: detections.detections,
    };
  } catch (error) {
    console.error('Error detecting faces:', error);
    return {
      faceDetected: false,
      multipleFaces: false,
      phoneDetected: false,
      predictions: [],
    };
  }
}
