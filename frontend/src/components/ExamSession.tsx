import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { AlertTriangle, Eye, MessageSquare, Send, Camera, ShieldAlert, Clock, CheckCircle, XCircle, Smartphone, MonitorX, Home, ArrowLeft, ArrowRight, Book, Coffee, Code, Play, FileCode, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { detectFace, cleanup } from '../lib/faceDetection';
import { detectAIContent, checkPlagiarism } from '../lib/gemini';
import { detectObjects } from '../lib/objectDetection';

const socket = io('http://localhost:3000');

interface Option {
  id: string;
  text: string;
}

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  hidden?: boolean;
}

interface Question {
  id: string;
  text: string;
  type: 'text' | 'mcq' | 'code';
  options?: Option[];
  answer: string;
  language?: string; // For code questions to specify the programming language
  starterCode?: string; // Starter code provided to the student
  testCases?: TestCase[]; // Test cases for code questions
  solution?: string; // Reference solution (for evaluation purposes)
}

interface TestResult {
  testCaseId: string;
  passed: boolean;
  output?: string;
  error?: string;
}

interface Anomaly {
  type: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: Date;
}

interface DetectedObject {
  class: string;
  confidence: number;
  timestamp: Date;
}

export function ExamSession() {
  const location = useLocation();
  const navigate = useNavigate();
  const assessment = location.state?.assessment;
  const [questions, setQuestions] = useState<Question[]>(
    assessment?.questions.map((q: Question) => ({ 
      ...q, 
      answer: q.starterCode || '' 
    })) || []
  );
  
  const webcamRef = useRef<Webcam>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isAIDetected, setIsAIDetected] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [hasWebcamAccess, setHasWebcamAccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(assessment?.totalTime * 60 || 3600);
  const [examStarted, setExamStarted] = useState(false);
  const [examCompleted, setExamCompleted] = useState(false);
  const [examId] = useState('exam-123');
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [outOfFrameCount, setOutOfFrameCount] = useState(0);
  const [phoneUsageCount, setPhoneUsageCount] = useState(0);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [faceDetectionInterval, setFaceDetectionInterval] = useState<NodeJS.Timeout | null>(null);
  const [objectDetectionInterval, setObjectDetectionInterval] = useState<NodeJS.Timeout | null>(null);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [prohibitedObjectsCount, setProhibitedObjectsCount] = useState(0);
  const [testResults, setTestResults] = useState<Record<string, TestResult[]>>({});
  const [isRunningTests, setIsRunningTests] = useState(false);
  
  // Enhanced object detection with more accurate models
  const [prohibitedObjectsList] = useState([
    'cell phone', 'mobile phone', 'smartphone', 'phone', 'cellular phone', 'book', 'laptop', 
    'tablet', 'ipad', 'kindle', 'notebook', 'paper', 'textbook', 'person', 'human', 'face',
    'calculator', 'electronic device', 'headphone', 'earphone', 'airpod', 'earbud',
    'smart watch', 'watch', 'paper', 'note', 'cheat sheet'
  ]);

  // Check for prohibited objects with improved accuracy
  const checkForProhibitedObjects = (objects: {class: string, confidence: number}[]) => {
    // Lower confidence threshold for phones specifically to increase detection sensitivity
    const phoneThreshold = 0.45;
    const otherObjectsThreshold = 0.55;
    
    const prohibited = objects.filter(obj => {
      // Normalized class name for easier matching
      const normalizedClass = obj.class.toLowerCase();
      
      // More sensitive detection for phones
      if (normalizedClass.includes('phone') || 
          normalizedClass.includes('smart') ||
          normalizedClass.includes('cell') || 
          normalizedClass.includes('mobile')) {
        return obj.confidence > phoneThreshold;
      }
      
      // Check against the full list with regular threshold
      return prohibitedObjectsList.some(item => 
        normalizedClass.includes(item.toLowerCase())) && 
        obj.confidence > otherObjectsThreshold;
    });
    
    return prohibited;
  };

  // Enhanced phone detection with moving window
  const [recentPhoneConfidences, setRecentPhoneConfidences] = useState<number[]>([]);
  const updatePhoneDetection = (detections: {class: string, confidence: number}[]) => {
    // Extract phone-related confidence scores
    const phoneDetections = detections.filter(obj => {
      const normalizedClass = obj.class.toLowerCase();
      return normalizedClass.includes('phone') || 
             normalizedClass.includes('smart') ||
             normalizedClass.includes('cell') || 
             normalizedClass.includes('mobile');
    });
    
    // Get the highest confidence if any phone objects detected
    const highestConfidence = phoneDetections.length > 0 
      ? Math.max(...phoneDetections.map(obj => obj.confidence))
      : 0;
      
    // Keep a sliding window of the last 5 confidence scores
    const updatedConfidences = [...recentPhoneConfidences, highestConfidence].slice(-5);
    setRecentPhoneConfidences(updatedConfidences);
    
    // If 3 out of the last 5 frames had a confidence > 0.4, consider a phone detected
    const phoneDetectedFrames = updatedConfidences.filter(conf => conf > 0.4).length;
    if (phoneDetectedFrames >= 3 && !examCompleted) {
      setPhoneUsageCount(prev => prev + 1);
      socket.emit('suspicious-activity', {
        type: 'phone-detected',
        message: 'Phone usage detected'
      });
      setWarnings(prev => [...prev, 'Phone usage detected']);
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && examStarted && !examCompleted) {
        setTabSwitchCount(prev => prev + 1);
        setWarnings(prev => [...prev, 'Tab switching detected']);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (faceDetectionInterval) {
        clearInterval(faceDetectionInterval);
      }
      if (objectDetectionInterval) {
        clearInterval(objectDetectionInterval);
      }
      cleanup();
    };
  }, [examStarted, examCompleted, faceDetectionInterval, objectDetectionInterval]);

  useEffect(() => {
    if (examStarted && timeLeft > 0 && !examCompleted) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft <= 0 && !examCompleted) {
      handleSubmit();
    }
  }, [examStarted, timeLeft, examCompleted]);

  useEffect(() => {
    socket.emit('join-exam', examId);

    socket.on('activity-alert', (data) => {
      if (!examCompleted) {
        setWarnings(prev => [...prev, data.message]);
      }
    });

    return () => {
      socket.off('activity-alert');
    };
  }, [examId, examCompleted]);

  useEffect(() => {
    if (hasWebcamAccess && examStarted && !examCompleted) {
      // Face detection interval
      const faceInterval = setInterval(async () => {
        if (webcamRef.current?.video && !examCompleted) {
          const result = await detectFace(webcamRef.current.video);
          
          if (!result.faceDetected && faceDetected) {
            setOutOfFrameCount(prev => prev + 1);
            socket.emit('suspicious-activity', {
              type: 'face-not-detected',
              message: 'No face detected in frame'
            });
            setFaceDetected(false);
          } else if (result.multipleFaces) {
            socket.emit('suspicious-activity', {
              type: 'multiple-faces',
              message: 'Multiple faces detected'
            });
          }

          if (result.phoneDetected) {
            setPhoneUsageCount(prev => prev + 1);
            socket.emit('suspicious-activity', {
              type: 'phone-detected',
              message: 'Phone usage detected'
            });
            setWarnings(prev => [...prev, 'Phone usage detected']);
          }
          
          setFaceDetected(result.faceDetected);
        }
      }, 1000);

      // Object detection interval with higher frequency for improved accuracy
      const objectInterval = setInterval(async () => {
        if (webcamRef.current?.video && !examCompleted) {
          try {
            const detectedItems = await detectObjects(webcamRef.current.video);
            
            // Update phone detection with temporal consistency
            updatePhoneDetection(detectedItems);
            
            const prohibitedItems = checkForProhibitedObjects(detectedItems);
            
            if (prohibitedItems.length > 0) {
              const newDetectedObjects = prohibitedItems.map(obj => ({
                class: obj.class,
                confidence: obj.confidence,
                timestamp: new Date()
              }));
              
              setDetectedObjects(prev => [...prev, ...newDetectedObjects]);
              setProhibitedObjectsCount(prev => prev + prohibitedItems.length);
              
              // Add warnings for each prohibited object
              prohibitedItems.forEach(item => {
                const warningMessage = `Prohibited object detected: ${item.class} (${(item.confidence * 100).toFixed(1)}% confidence)`;
                setWarnings(prev => [...prev, warningMessage]);
                
                socket.emit('suspicious-activity', {
                  type: 'prohibited-object',
                  message: warningMessage
                });
              });
            }
          } catch (error) {
            console.error('Object detection error:', error);
          }
        }
      }, 1500); // Run object detection more frequently for better accuracy

      setFaceDetectionInterval(faceInterval);
      setObjectDetectionInterval(objectInterval);
      
      return () => {
        clearInterval(faceInterval);
        clearInterval(objectInterval);
        setFaceDetectionInterval(null);
        setObjectDetectionInterval(null);
      };
    }
  }, [faceDetected, hasWebcamAccess, examStarted, examCompleted, prohibitedObjectsList]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleTextChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex].answer = text;
    setQuestions(updatedQuestions);
    
    if (text.length > 30 && !examCompleted) {
      const [aiResult, plagiarismResult] = await Promise.all([
        detectAIContent(text),
        checkPlagiarism(text)
      ]);

      if (aiResult) {
        setIsAIDetected(true);
        socket.emit('suspicious-activity', {
          type: 'ai-content',
          message: 'Potential AI-generated content detected'
        });
        setWarnings(prev => [...prev, 'AI-generated content detected']);
      }

      if (plagiarismResult.isPlagiarized) {
        socket.emit('suspicious-activity', {
          type: 'plagiarism',
          message: `Potential plagiarism detected (${Math.round(plagiarismResult.similarity * 100)}% similarity)`
        });
        setWarnings(prev => [...prev, `Plagiarism detected (${Math.round(plagiarismResult.similarity * 100)}% similarity)`]);
      }
    }
  };

  // Handle code changes
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const code = e.target.value;
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex].answer = code;
    setQuestions(updatedQuestions);
  };

  const handleOptionSelect = (optionId: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex].answer = optionId;
    setQuestions(updatedQuestions);
  };

  const handleWebcamAccess = (stream: MediaStream | null) => {
    setWebcamStream(stream);
    setHasWebcamAccess(!!stream);
    if (stream) {
      setExamStarted(true);
    }
  };

  // Simulated code execution function
  const executeCode = async (code: string, testCase: TestCase, language: string): Promise<TestResult> => {
    // This would normally call your backend API to execute the code securely
    // For this example, we'll simulate test passing/failing
    setIsRunningTests(true);
    
    // Simulate an API call with a delay
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          // This is just a simulation - in a real implementation you'd send the code to a backend for execution
          const testPassed = Math.random() > 0.3; // 70% chance of passing for demonstration
          
          if (testPassed) {
            resolve({
              testCaseId: testCase.id,
              passed: true,
              output: testCase.expectedOutput
            });
          } else {
            resolve({
              testCaseId: testCase.id,
              passed: false,
              output: "Different output than expected",
              error: Math.random() > 0.5 ? undefined : "Runtime error occurred"
            });
          }
        } catch (error) {
          resolve({
            testCaseId: testCase.id,
            passed: false,
            error: "Execution error"
          });
        }
      }, 1000); // Simulate network delay
    });
  };

  // Run tests for code questions
  const runTests = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion.type !== 'code' || !currentQuestion.testCases) {
      return;
    }
    
    setIsRunningTests(true);
    
    try {
      const code = currentQuestion.answer;
      const language = currentQuestion.language || 'javascript';
      
      const results = await Promise.all(
        currentQuestion.testCases.map(testCase => 
          executeCode(code, testCase, language)
        )
      );
      
      const newTestResults = {...testResults};
      newTestResults[currentQuestion.id] = results;
      setTestResults(newTestResults);
    } catch (error) {
      console.error('Error running tests:', error);
      setWarnings(prev => [...prev, 'Error running code tests']);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleSubmit = () => {
    const hasEmptyAnswers = questions.some(q => !q.answer.trim());
    if (hasEmptyAnswers) {
      setSubmitAttempted(true);
      setWarnings(prev => [...prev, 'Please answer all questions before submitting']);
      return;
    }

    setExamCompleted(true);
    
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
    if (faceDetectionInterval) {
      clearInterval(faceDetectionInterval);
      setFaceDetectionInterval(null);
    }
    if (objectDetectionInterval) {
      clearInterval(objectDetectionInterval);
      setObjectDetectionInterval(null);
    }
    cleanup();

    let aiAnomaly: Anomaly | undefined;
    if (isAIDetected) {
      aiAnomaly = {
        type: 'AI Content',
        count: 1,
        severity: 'high',
        description: 'Potential use of AI-generated content',
        timestamp: new Date()
      };
    }

    if (tabSwitchCount > 0 || isAIDetected || prohibitedObjectsCount > 0) {
      const activity = {
        id: Date.now().toString(),
        type: 'High Risk Activity Detected',
        description: [
          tabSwitchCount > 0 ? `Tab switching detected (${tabSwitchCount} times).` : '',
          isAIDetected ? 'AI-generated content detected.' : '',
          prohibitedObjectsCount > 0 ? `Prohibited objects detected (${prohibitedObjectsCount} instances).` : '',
          phoneUsageCount > 0 ? `Phone usage detected (${phoneUsageCount} instances).` : ''
        ].filter(Boolean).join(' '),
        timestamp: new Date(),
        severity: 'high'
      };
      const existingActivities = JSON.parse(localStorage.getItem('recentActivities') || '[]');
      localStorage.setItem('recentActivities', JSON.stringify([activity, ...existingActivities.slice(0, 9)]));
    }
    
    const finalAnomalies: Anomaly[] = [
      {
        type: 'Tab Switching',
        count: tabSwitchCount,
        severity: tabSwitchCount > 5 ? 'high' : tabSwitchCount > 2 ? 'medium' : 'low',
        description: 'Switched between browser tabs during exam',
        timestamp: new Date()
      },
      {
        type: 'Face Detection',
        count: outOfFrameCount,
        severity: outOfFrameCount > 10 ? 'high' : outOfFrameCount > 5 ? 'medium' : 'low',
        description: 'Face not detected in camera frame',
        timestamp: new Date()
      },
      {
        type: 'Prohibited Objects',
        count: prohibitedObjectsCount,
        severity: prohibitedObjectsCount > 3 ? 'high' : prohibitedObjectsCount > 1 ? 'medium' : prohibitedObjectsCount > 0 ? 'low' : 'low',
        description: 'Prohibited objects detected during exam',
        timestamp: new Date()
      },
      {
        type: 'Phone Usage',
        count: phoneUsageCount,
        severity: phoneUsageCount > 2 ? 'high' : phoneUsageCount > 0 ? 'medium' : 'low',
        description: 'Phone usage detected during exam',
        timestamp: new Date()
      },
      ...(aiAnomaly ? [aiAnomaly] : []),
    ];
    setAnomalies(finalAnomalies);

    // Store exam results including answers and anomalies
    const examResult = {
      id: Date.now().toString(),
      examId: examId,
      assessmentId: assessment?.id,
      assessmentName: assessment?.name,
      timestamp: new Date(),
      anomalies: finalAnomalies,
      warnings: warnings,
      tabSwitches: tabSwitchCount,
      aiDetected: isAIDetected,
      phoneUsage: phoneUsageCount,
      outOfFrame: outOfFrameCount,
      prohibitedObjects: detectedObjects,
      prohibitedObjectsCount: prohibitedObjectsCount,
      userAnswers: questions.map(q => ({
        questionId: q.id,
        questionText: q.text.substring(0, 100), // Store truncated question for preview
        answer: q.answer,
        type: q.type,
        testResults: testResults[q.id] || []
      })),
      totalTime: assessment?.totalTime * 60 - timeLeft, // Time taken in seconds
      submitted: true
    };
    
    // Save to localStorage for retrieval in admin panel
    const existingResults = JSON.parse(localStorage.getItem('examResults') || '[]');
    localStorage.setItem('examResults', JSON.stringify([examResult, ...existingResults]));
    
    // Notify server about exam completion
    socket.emit('exam-completed', {
      examId: examId,
      assessmentId: assessment?.id,
      userId: 'current-user-id', // Replace with actual user ID
      timestamp: new Date(),
      status: 'completed'
    });
    
    // Redirect to thank you page after a brief delay
    setTimeout(() => {
      navigate('/exam-complete', { state: { assessmentName: assessment?.name } });
    }, 1000);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Object detection visualization component
  const ObjectDetectionDisplay = ({ objects }: { objects: DetectedObject[] }) => {
    const recentObjects = objects.slice(-3); // Show only the 3 most recent detections
    
    return (
      <div className="space-y-2">
        {recentObjects.length > 0 ? recentObjects.map((obj, idx) => (
          <motion.div 
            key={idx}
            className="flex items-center justify-between p-3 bg-red-50 rounded-xl"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center space-x-2">
              {obj.class.toLowerCase().includes('phone') ? (
                <Smartphone className="w-4 h-4 text-red-500" />
              ) : obj.class.toLowerCase().includes('book') ? (
                <Book className="w-4 h-4 text-red-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm font-medium">{obj.class}</span>
            </div>
            <span className="text-xs text-red-700">
              {new Date(obj.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          </motion.div>
        )) : (
          <div className="text-sm text-gray-500 italic">No prohibited objects detected recently</div>
        )}
      </div>
    );
  };

  // Enhanced coding editor component with test cases
  const CodeEditor = ({ question }: { question: Question }) => {
    const questionResults = testResults[question.id] || [];
    const passedTestsCount = questionResults.filter(result => result.passed).length;
    const totalTestsCount = question.testCases?.length || 0;
    const visibleTestCases = question.testCases?.filter(tc => !tc.hidden) || [];
    
    return (
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Code className="text-indigo-500 w-5 h-5" />
            <span className="text-sm font-medium text-gray-700">
              {question.language || 'Code'} Editor
            </span>
          </div>
          {totalTestsCount > 0 && questionResults.length > 0 && (
            <span className={`text-sm font-medium ${
              passedTestsCount === totalTestsCount ? 'text-green-600' : 'text-amber-600'
            }`}>
              {passedTestsCount}/{totalTestsCount} Tests Passed
            </span>
          )}
        </div>
        <div className="relative rounded-xl overflow-hidden border border-indigo-200">
          <textarea
            className="w-full h-80 p-6 bg-gray-900 text-gray-100 font-mono text-sm resize-none focus:outline-none"
            placeholder={`Write your ${question.language || 'code'} here...`}
            value={question.answer}
            onChange={handleCodeChange}
            spellCheck="false"
          />
          {submitAttempted && !question.answer.trim() && (
            <p className="text-red-500 text-sm mt-2 px-4">This question requires code</p>
          )}
        </div>

        {/* Test case section */}
        {visibleTestCases.length > 0 && (
          <div className="bg-indigo-50 rounded-xl border border-indigo-100 overflow-hidden">
            <div className="bg-indigo-100 p-3 border-b border-indigo-200">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-indigo-800 flex items-center space-x-2">
                  <FileCode className="w-4 h-4" />
                  <span>Test Cases</span>
                </h3>
                <motion.button
                  onClick={runTests}
                  disabled={isRunningTests}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-2
                    ${isRunningTests 
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  whileHover={!isRunningTests ? { scale: 1.03 } : {}}
                  whileTap={!isRunningTests ? { scale: 0.97 } : {}}
                >
                  <Play className="w-4 h-4" />
                  <span>{isRunningTests ? 'Running...' : 'Run Tests'}</span>
                </motion.button>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              {visibleTestCases.map((testCase, index) => {
                const result = questionResults.find(r => r.testCaseId === testCase.id);
                const hasResult = !!result;
                
                return (
                  <div key={testCase.id} className="border rounded-lg overflow-hidden">
                    <div className={`p-3 flex justify-between items-center ${
                      !hasResult ? 'bg-white' 
                      : result.passed ? 'bg-green-50 border-b border-green-100' 
                      : 'bg-red-50 border-b border-red-100'
                    }`}>
                      <span className="font-medium text-sm">Test Case {index + 1}</span>
                      {hasResult && (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          result.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {result.passed ? 'Passed' : 'Failed'}
                        </span>
                      )}
                    </div>
                    <div className="p-3 space-y-2 bg-white">
                      <div>
                        <span className="text-xs font-medium text-gray-500">Input:</span>
                        <div className="mt-1 p-2 bg-gray-50 rounded text-xs font-mono break-all">
                          {testCase.input}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Expected Output:</span>
                        <div className="mt-1 p-2 bg-gray-50 rounded text-xs font-mono break-all">
                          {testCase.expectedOutput}
                        </div>
                      </div>
                      {hasResult && result.output && (
                        <div>
                          <span className="text-xs font-medium text-gray-500">Your Output:</span>
                          <div className="mt-1 p-2 bg-gray-50 rounded text-xs font-mono break-all">
                            {result.output}
                          </div>
                        </div>
                      )}
                      {hasResult && result.error && (
                        <div>
                          <span className="text-xs font-medium text-red-500">Error:</span>
                          <div className="mt-1 p-2 bg-red-50 rounded text-xs font-mono text-red-600 break-all">
                            {result.error}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <div className="p-4 bg-indigo-50 rounded-xl">
          <p className="text-sm text-indigo-700">
            <span className="font-semibold">Tips:</span> Remember to consider edge cases and optimize your solution.
            Your code will be evaluated for correctness, efficiency, and style.
            {question.testCases && question.testCases.length > 0 && 
              ` ${question.testCases.filter(tc => tc.hidden).length} hidden test cases will be used for final grading.`}
          </p>
        </div>
      </div>
    );
  };

  // Render question content based on question type
  const renderQuestionContent = () => {
    const currentQuestion = questions[currentQuestionIndex];
    
    if (currentQuestion.type === 'code') {
      return <CodeEditor question={currentQuestion} />;
    } else if (currentQuestion.type === 'mcq' && currentQuestion.options) {
      return (
        <div className="mt-6 space-y-4">
          <div className="grid gap-4">
            {currentQuestion.options?.map((option) => (
              <motion.div
                key={option.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleOptionSelect(option.id)}
                className={`p-4 border rounded-xl cursor-pointer ${
                  currentQuestion.answer === option.id 
                    ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500 ring-opacity-50' 
                    : 'bg-white hover:bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start">
                  <div className={`h-5 w-5 flex-shrink-0 rounded-full border ${
                    currentQuestion.answer === option.id
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'border-gray-300'
                  } mr-3 mt-0.5`}>
                    {currentQuestion.answer === option.id && (
                      <CheckCircle className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <span className="text-gray-700">{option.text}</span>
                </div>
              </motion.div>
            ))}
          </div>
          {submitAttempted && !currentQuestion.answer && (
            <p className="text-red-500 text-sm mt-2">Please select an answer</p>
          )}
        </div>
      );
    } else {
      // Text question type
      return (
        <div className="mt-6">
          <textarea
            className="w-full h-64 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Type your answer here..."
            value={currentQuestion.answer}
            onChange={handleTextChange}
          />
          {submitAttempted && !currentQuestion.answer.trim() && (
            <p className="text-red-500 text-sm mt-2">Please provide an answer</p>
          )}
        </div>
      );
    }
  };

  // If webcam access hasn't been granted
  if (!examStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-center mb-8">
            <ShieldAlert className="h-12 w-12 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">{assessment?.name || 'Online Assessment'}</h1>
          <p className="text-gray-600 text-center mb-8">
            This secure assessment requires webcam access for proctoring.
          </p>

          <div className="space-y-6">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="font-medium text-indigo-800 mb-2 flex items-center">
                <Eye className="h-5 w-5 mr-2" /> Proctoring Requirements
              </h3>
              <ul className="text-sm space-y-2 text-gray-700">
                <li className="flex items-start">
                  <CheckSquare className="h-4 w-4 text-indigo-600 mr-2 mt-0.5" /> 
                  Webcam must remain on throughout the assessment
                </li>
                <li className="flex items-start">
                  <CheckSquare className="h-4 w-4 text-indigo-600 mr-2 mt-0.5" /> 
                  Stay visible in the camera frame at all times
                </li>
                <li className="flex items-start">
                  <CheckSquare className="h-4 w-4 text-indigo-600 mr-2 mt-0.5" /> 
                  No phones, books, or other prohibited items
                </li>
                <li className="flex items-start">
                  <CheckSquare className="h-4 w-4 text-indigo-600 mr-2 mt-0.5" /> 
                  No tab switching or opening additional windows
                </li>
              </ul>
            </div>

            {!hasWebcamAccess && (
              <div className="flex justify-center">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  height={240}
                  width={320}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    width: 1280,
                    height: 720,
                    facingMode: "user"
                  }}
                  onUserMedia={handleWebcamAccess}
                  onUserMediaError={() => {
                    setWarnings(prev => [...prev, 'Failed to access webcam']);
                  }}
                  className="rounded-lg shadow-md"
                />
              </div>
            )}

            <div className="flex flex-col space-y-3">
              <motion.button
                onClick={() => setExamStarted(true)}
                disabled={!hasWebcamAccess}
                className={`py-3 px-6 rounded-xl font-medium flex items-center justify-center space-x-2 ${
                  hasWebcamAccess 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
                whileHover={hasWebcamAccess ? { scale: 1.02 } : {}}
                whileTap={hasWebcamAccess ? { scale: 0.98 } : {}}
              >
                <Play className="h-5 w-5" />
                <span>Start Assessment</span>
              </motion.button>
              <Link to="/dashboard" className="text-center text-sm text-indigo-600 hover:text-indigo-800">
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
                <Home className="h-5 w-5" />
              </Link>
              <h1 className="text-lg font-medium text-gray-900 truncate max-w-md">
                {assessment?.name || 'Online Assessment'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {timeLeft > 0 && !examCompleted && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 rounded-full">
                  <Clock className="h-5 w-5 text-indigo-600" />
                  <span className="font-medium text-indigo-800">{formatTime(timeLeft)}</span>
                </div>
              )}
              <motion.button
                onClick={handleSubmit}
                className="py-2 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={examCompleted}
              >
                <CheckCircle className="h-5 w-5" />
                <span>Submit</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Main content area */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <span className="text-xl font-medium text-gray-900">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full">
                    {questions[currentQuestionIndex].type === 'mcq' ? 'Multiple Choice' : 
                     questions[currentQuestionIndex].type === 'code' ? 'Coding' : 'Text Response'}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <motion.button
                    onClick={handlePrevQuestion}
                    disabled={currentQuestionIndex === 0}
                    className={`p-2 rounded-lg ${
                      currentQuestionIndex === 0 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-indigo-600 hover:bg-indigo-50'
                    }`}
                    whileHover={currentQuestionIndex !== 0 ? { scale: 1.1 } : {}}
                    whileTap={currentQuestionIndex !== 0 ? { scale: 0.9 } : {}}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </motion.button>
                  <motion.button
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className={`p-2 rounded-lg ${
                      currentQuestionIndex === questions.length - 1 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-indigo-600 hover:bg-indigo-50'
                    }`}
                    whileHover={currentQuestionIndex !== questions.length - 1 ? { scale: 1.1 } : {}}
                    whileTap={currentQuestionIndex !== questions.length - 1 ? { scale: 0.9 } : {}}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>

              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: questions[currentQuestionIndex].text }} />
              </div>

              {renderQuestionContent()}
            </div>

            <div className="flex justify-between">
              <motion.button
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
                className={`py-2 px-4 rounded-lg font-medium flex items-center space-x-2 ${
                  currentQuestionIndex === 0 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-indigo-600 hover:bg-indigo-50'
                }`}
                whileHover={currentQuestionIndex !== 0 ? { scale: 1.02 } : {}}
                whileTap={currentQuestionIndex !== 0 ? { scale: 0.98 } : {}}
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Previous</span>
              </motion.button>
              
              {currentQuestionIndex === questions.length - 1 ? (
                <motion.button
                  onClick={handleSubmit}
                  className="py-2 px-6 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Submit Assessment</span>
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleNextQuestion}
                  className="py-2 px-4 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 flex items-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Next</span>
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-4 lg:sticky lg:top-24 self-start">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Webcam Feed</h2>
                <div className={`h-2 w-2 rounded-full ${faceDetected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
              <div className="relative rounded-lg overflow-hidden bg-gray-100 mb-4">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  height={720}
                  width={1280}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    width: 1280,
                    height: 720,
                    facingMode: "user"
                  }}
                  style={{ width: '100%', height: 'auto' }}
                />
                {!faceDetected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="text-white text-center p-4">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-red-500" />
                      <p className="font-medium">Face not detected!</p>
                      <p className="text-sm">Please position yourself in front of the camera</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Question navigation */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Question Navigation</h3>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => (
                    <motion.button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`h-10 w-full rounded-lg flex items-center justify-center font-medium ${
                        currentQuestionIndex === idx 
                          ? 'bg-indigo-600 text-white' 
                          : q.answer && q.answer.trim() 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {idx + 1}
                    </motion.button>
                  ))}
                </div>
              </div>
              
              {/* Warnings section */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>Warnings</span>
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  <AnimatePresence>
                    {warnings.length > 0 ? (
                      warnings.slice(-5).map((warning, index) => (
                        <motion.div
                          key={index}
                          className="flex items-start space-x-2 p-2 bg-amber-50 rounded-lg text-sm"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                          <span className="text-amber-800">{warning}</span>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 italic p-2">No warnings yet</div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              {/* Object detection display */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
                  <MonitorX className="h-4 w-4 text-red-500" />
                  <span>Prohibited Objects</span>
                </h3>
                <ObjectDetectionDisplay objects={detectedObjects} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}