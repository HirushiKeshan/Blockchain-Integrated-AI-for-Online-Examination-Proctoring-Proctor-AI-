
import React, { useState } from 'react';

export const DetectionComponent = () => {
  const [status, setStatus] = useState('');

  const simulateDetection = () => {
    const noiseDetected = Math.random() < 0.4;
    const objectDetected = Math.random() < 0.3;

    let result = '';
    if (noiseDetected) result += '🔊 Noise detected. ';
    if (objectDetected) result += '🧍 Object detected. ';
    if (!noiseDetected && !objectDetected) result = '✅ Environment clear.';

    setStatus(result);
  };

  return (
    <div className="p-4 bg-white rounded shadow-md my-6">
      <h3 className="text-lg font-semibold mb-2">Environment Detection</h3>
      <button
        onClick={simulateDetection}
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
      >
        Run Detection
      </button>
      <p className="mt-3 font-medium">{status}</p>
    </div>
  );
};
