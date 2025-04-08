
// Simulated noise and object detection module

export const detectNoiseAndObjects = () => {
  const randomNoiseDetected = Math.random() < 0.3;
  const randomObjectDetected = Math.random() < 0.2;

  if (randomNoiseDetected) {
    console.warn("Noise detected in environment!");
  }

  if (randomObjectDetected) {
    console.warn("Suspicious object detected!");
  }

  return {
    noise: randomNoiseDetected,
    object: randomObjectDetected
  };
};
