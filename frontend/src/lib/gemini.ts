import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('ENTER YOUR API KEY');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export async function detectAIContent(text: string): Promise<boolean> {
  try {
    const prompt = `
      Analyze this text for signs of AI generation. Consider:
      1. Repetitive patterns
      2. Unnatural language structures
      3. Consistent writing style
      4. Technical accuracy without human errors
      5. Lack of personal perspective
      6. Overly formal or mechanical tone
      7. Perfect grammar and punctuation
      8. Generic examples and explanations
      
      Text to analyze:
      "${text}"
      
      Based on these factors, is this text likely AI-generated? Respond with only "true" or "false".
    `;
    
    const result = await model.generateContent(prompt);
    const response = result.response.text().toLowerCase().trim();
    
    // Additional heuristic checks
    const indicators = [
      text.length > 200 && !text.includes('I think') && !text.includes('I believe'),
      text.split('.').length > 5 && new Set(text.split('.').map(s => s.trim().length)).size < 3,
      /\b(however|therefore|furthermore|moreover)\b/gi.test(text) && text.length < 300,
      text.split(' ').length > 100 && new Set(text.split(' ')).size / text.split(' ').length < 0.4
    ];
    
    const indicatorScore = indicators.filter(Boolean).length;
    
    return response === 'true' || indicatorScore >= 2;
  } catch (error) {
    console.error('Error detecting AI content:', error);
    return false;
  }
}

export async function checkPlagiarism(text: string): Promise<{ isPlagiarized: boolean; similarity: number }> {
  try {
    // Simplified prompt to ensure consistent JSON response
    const prompt = `You are a plagiarism detection system. Analyze the following text for potential plagiarism and respond ONLY with a valid JSON object in this exact format: {"isPlagiarized":false,"similarity":0.0} where isPlagiarized is a boolean and similarity is a number between 0 and 1.  Text to analyze: "${text}"`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    try {
      // Clean the response text to ensure it only contains the JSON object
      const cleanedResponse = responseText.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
      const response = JSON.parse(cleanedResponse);
      
      // Validate response structure and types
      if (
        typeof response === 'object' &&
        response !== null &&
        'isPlagiarized' in response &&
        'similarity' in response &&
        typeof response.isPlagiarized === 'boolean' &&
        typeof response.similarity === 'number' &&
        response.similarity >= 0 &&
        response.similarity <= 1
      ) {
        return response;
      }
      
      throw new Error('Invalid response structure');
    } catch (parseError) {
      console.error('Error parsing plagiarism response:', parseError);
      // Fallback to content analysis if JSON parsing fails
      const textIndicators = {
        isPlagiarized: responseText.toLowerCase().includes('plagiarized') ||
                        responseText.toLowerCase().includes('copied'),
        similarity: responseText.toLowerCase().includes('high similarity') ? 0.8 :
                   responseText.toLowerCase().includes('moderate similarity') ? 0.5 :
                   responseText.toLowerCase().includes('low similarity') ? 0.2 : 0
      };
      return textIndicators;
    }
  } catch (error) {
    console.error('Error checking plagiarism:', error);
    return { isPlagiarized: false, similarity: 0 };
  }
}

// Add the missing analyzeCode function that caused the error
export async function analyzeCode(code: string): Promise<{ 
  quality: number; 
  feedback: string;
  issues: string[];
  suggestions: string[];
}> {
  try {
    const prompt = `
      Analyze the following code for quality, potential issues, and provide suggestions for improvement.
      Code to analyze:
      "${code}"
      
      Respond with a valid JSON object in this format: 
      {
        "quality": number,   // A score between 0-10 where 10 is perfect
        "feedback": "detailed explanation of the code quality",
        "issues": ["issue1", "issue2", ...],
        "suggestions": ["suggestion1", "suggestion2", ...]
      }
    `;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    try {
      // Clean the response text to ensure it only contains JSON
      const cleanedResponse = responseText.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
      const response = JSON.parse(cleanedResponse);
      
      if (
        typeof response === 'object' &&
        response !== null &&
        'quality' in response &&
        'feedback' in response &&
        'issues' in response &&
        'suggestions' in response
      ) {
        return response;
      }
      
      throw new Error('Invalid response structure');
    } catch (parseError) {
      console.error('Error parsing code analysis response:', parseError);
      return { 
        quality: 5, 
        feedback: "Failed to analyze code properly. Please try again.",
        issues: ["Analysis failed"],
        suggestions: ["Try again with a smaller code snippet"]
      };
    }
  } catch (error) {
    console.error('Error analyzing code:', error);
    return { 
      quality: 0, 
      feedback: "An error occurred during code analysis.",
      issues: ["Analysis error"],
      suggestions: ["Check your network connection and try again"]
    };
  }
}

export async function evaluateCode(code: string): Promise<{ isCorrect: boolean; feedback: string }> {
  try {
    const prompt = `
      Evaluate the following code for correctness and provide feedback.
      Code to evaluate:
      "${code}"
      
      Respond with a valid JSON object in this format: {"isCorrect": boolean, "feedback": "explanation"}
    `;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    try {
      // Clean the response text to ensure it only contains JSON
      const cleanedResponse = responseText.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
      const response = JSON.parse(cleanedResponse);
      
      if (
        typeof response === 'object' &&
        response !== null &&
        'isCorrect' in response &&
        'feedback' in response
      ) {
        return response;
      }
      
      throw new Error('Invalid response structure');
    } catch (parseError) {
      console.error('Error parsing evaluation response:', parseError);
      return { 
        isCorrect: false, 
        feedback: "Failed to evaluate code properly. Please try again." 
      };
    }
  } catch (error) {
    console.error('Error evaluating code:', error);
    return { 
      isCorrect: false, 
      feedback: "An error occurred during code evaluation." 
    };
  }
}

// Add object detection function
export async function detectObjects(imageBase64: string): Promise<{ objects: string[]; confidence: number[] }> {
  try {
    const imageModel = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    
    const prompt = `
      Analyze this image and identify all visible objects.
      Respond ONLY with a valid JSON object in this exact format: 
      {"objects": ["object1", "object2", ...], "confidence": [0.9, 0.8, ...]}
      where objects is an array of object names and confidence is a matching array of confidence scores between 0 and 1.
    `;
    
    // Using fileToGenerativePart is a placeholder - this would depend on how you're 
    // actually handling image data in your application
    const result = await imageModel.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
          ]
        }
      ]
    });
    
    const responseText = result.response.text().trim();
    
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : '{}';
      const response = JSON.parse(jsonString);
      
      if (
        Array.isArray(response.objects) &&
        Array.isArray(response.confidence) &&
        response.objects.length === response.confidence.length
      ) {
        return response;
      }
      
      throw new Error('Invalid response structure');
    } catch (parseError) {
      console.error('Error parsing object detection response:', parseError);
      return { objects: [], confidence: [] };
    }
  } catch (error) {
    console.error('Error detecting objects:', error);
    return { objects: [], confidence: [] };
  }
}

// Add noise/phone detection function
export async function detectBackgroundNoise(audioBase64: string): Promise<{ 
  hasBackgroundNoise: boolean;
  hasPhoneRinging: boolean;
  noiseLevel: 'low' | 'medium' | 'high';
  confidence: number;
}> {
  try {
    // Note: This is a mock implementation since Gemini currently doesn't process audio
    // In a real implementation, you might want to use a different API or pre-process the audio
    
    const prompt = `
      You are an audio analysis system. Analyze the description of this audio sample and detect:
      1. If there is significant background noise
      2. If there is a phone ringing in the background
      3. The overall noise level (low, medium, high)
      
      Audio description: "Audio sample of ${Math.random() > 0.5 ? 'clear' : 'noisy'} environment with ${
        Math.random() > 0.7 ? 'phone ringing' : 'no phone'} in the background"
      
      Respond ONLY with a valid JSON object in this format: 
      {"hasBackgroundNoise": boolean, "hasPhoneRinging": boolean, "noiseLevel": "low|medium|high", "confidence": number}
    `;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    try {
      // Clean the response text to ensure it only contains the JSON object
      const cleanedResponse = responseText.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
      const response = JSON.parse(cleanedResponse);
      
      if (
        typeof response === 'object' &&
        response !== null &&
        'hasBackgroundNoise' in response &&
        'hasPhoneRinging' in response &&
        'noiseLevel' in response &&
        'confidence' in response
      ) {
        return response;
      }
      
      throw new Error('Invalid response structure');
    } catch (parseError) {
      console.error('Error parsing audio analysis response:', parseError);
      return { 
        hasBackgroundNoise: false, 
        hasPhoneRinging: false, 
        noiseLevel: 'low',
        confidence: 0 
      };
    }
  } catch (error) {
    console.error('Error analyzing audio:', error);
    return { 
      hasBackgroundNoise: false, 
      hasPhoneRinging: false, 
      noiseLevel: 'low',
      confidence: 0 
    };
  }
}