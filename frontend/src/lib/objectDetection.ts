import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

// Class for detected objects
export interface DetectedObject {
  bbox: [number, number, number, number]; // [x, y, width, height]
  class: string;
  score: number;
}

// Available model options
type ModelVariant = 'lite_mobilenet_v2' | 'mobilenet_v2' | 'mobilenet_v1';

let model: cocoSsd.ObjectDetection | null = null;
let isModelLoading = false;
let modelLoadError: Error | null = null;

/**
 * Initialize the object detection model
 * @param modelVariant - Which model variant to use
 */
export async function initObjectDetection(
  modelVariant: ModelVariant = 'mobilenet_v2' // Using better model by default
): Promise<void> {
  // Don't try to load if already loading or if there was an error
  if (isModelLoading) {
    console.log('Model is already loading, please wait');
    return;
  }
  
  if (model) {
    console.log('Model already loaded');
    return;
  }
  
  try {
    isModelLoading = true;
    console.log(`Loading object detection model: ${modelVariant}`);
    
    // Ensure TensorFlow.js is ready
    await tf.ready();
    console.log('TensorFlow backend ready:', tf.getBackend());
    
    // Load the COCO-SSD model
    model = await cocoSsd.load({
      base: modelVariant
    });
    
    console.log('Object detection model loaded successfully');
    modelLoadError = null;
  } catch (error) {
    console.error('Failed to load object detection model:', error);
    modelLoadError = error instanceof Error ? error : new Error(String(error));
    throw error;
  } finally {
    isModelLoading = false;
  }
}

/**
 * Get the model loading status
 */
export function getModelStatus(): {
  loaded: boolean;
  loading: boolean;
  error: Error | null;
} {
  return {
    loaded: model !== null,
    loading: isModelLoading,
    error: modelLoadError
  };
}

/**
 * Detect objects in an image
 * @param imageElement - HTML image or video element
 * @param minimumScore - Minimum confidence threshold (0-1)
 * @returns Array of detected objects
 */
export async function detectObjects(
  imageElement: HTMLImageElement | HTMLVideoElement,
  minimumScore: number = 0.3 // Lower threshold to catch more potential objects
): Promise<DetectedObject[]> {
  if (!model && !isModelLoading) {
    console.log('Model not loaded, attempting to load now');
    await initObjectDetection();
  }

  if (!model) {
    if (modelLoadError) {
      throw modelLoadError;
    }
    throw new Error('Object detection model failed to initialize');
  }

  try {
    console.log('Running object detection...');
    
    // Perform prediction
    const predictions = await model.detect(imageElement, 20); // Detect up to 20 objects
    
    // Filter by confidence threshold and map predictions to our interface
    const filteredPredictions = predictions
      .filter(prediction => prediction.score >= minimumScore)
      .map(prediction => ({
        bbox: prediction.bbox as [number, number, number, number],
        class: prediction.class,
        score: prediction.score
      }));
    
    console.log(`Detected ${filteredPredictions.length} objects:`, 
      filteredPredictions.map(p => `${p.class} (${(p.score * 100).toFixed(1)}%)`).join(', '));
    
    return filteredPredictions;
  } catch (error) {
    console.error('Error during object detection:', error);
    throw error;
  }
}

/**
 * Check if a specific object type is detected (with synonyms support)
 * @param imageElement - HTML image or video element
 * @param objectClass - Class name to look for (e.g., 'cell phone')
 * @param confidenceThreshold - Minimum confidence score (0-1)
 * @returns Boolean indicating whether the object was detected
 */
export async function detectSpecificObject(
  imageElement: HTMLImageElement | HTMLVideoElement,
  objectClass: string,
  confidenceThreshold = 0.3 // Lower threshold
): Promise<boolean> {
  // Map of synonyms for common objects
  const synonymMap: Record<string, string[]> = {
    'phone': ['cell phone', 'mobile phone', 'smartphone'],
    'laptop': ['laptop', 'notebook', 'computer'],
    'book': ['book', 'books']
  };
  
  const detections = await detectObjects(imageElement, confidenceThreshold);
  
  // Check for direct match
  const directMatch = detections.some(
    detection => 
      detection.class.toLowerCase() === objectClass.toLowerCase() && 
      detection.score >= confidenceThreshold
  );
  
  if (directMatch) return true;
  
  // Check for synonym matches
  for (const [key, synonyms] of Object.entries(synonymMap)) {
    if (key === objectClass.toLowerCase() || synonyms.includes(objectClass.toLowerCase())) {
      const foundSynonym = detections.some(
        detection => 
          synonyms.includes(detection.class.toLowerCase()) && 
          detection.score >= confidenceThreshold
      );
      
      if (foundSynonym) return true;
    }
  }
  
  return false;
}

/**
 * Check for prohibited items in exam settings
 * @param imageElement - Video or image element
 * @returns Detection results
 */
export async function checkExamViolations(
  imageElement: HTMLImageElement | HTMLVideoElement
): Promise<{
  hasViolation: boolean;
  detectedItems: string[];
  detectionScores: Record<string, number>;
}> {
  const prohibitedItems = [
    'cell phone', 'mobile phone', 'smartphone',
    'book', 'laptop', 'tablet', 'person' // Detect additional people in frame
  ];
  
  try {
    const detections = await detectObjects(imageElement, 0.3);
    
    const detectedItems: string[] = [];
    const detectionScores: Record<string, number> = {};
    
    for (const detection of detections) {
      const itemClass = detection.class.toLowerCase();
      
      // Check if this item or a similar one is in our prohibited list
      const isProhibited = prohibitedItems.some(item => 
        itemClass.includes(item) || item.includes(itemClass)
      );
      
      if (isProhibited) {
        detectedItems.push(detection.class);
        detectionScores[detection.class] = detection.score;
      }
    }
    
    return {
      hasViolation: detectedItems.length > 0,
      detectedItems: [...new Set(detectedItems)], // Remove duplicates
      detectionScores
    };
  } catch (error) {
    console.error('Error checking exam violations:', error);
    return {
      hasViolation: false,
      detectedItems: [],
      detectionScores: {}
    };
  }
}

/**
 * Clean up resources used by the object detection model
 */
export function cleanup(): void {
  if (model) {
    try {
      // Dispose any tensors that might be in memory
      tf.dispose();
      model = null;
      console.log('Object detection resources released');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}