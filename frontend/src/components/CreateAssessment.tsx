import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Save, X, Check, Type, List, Code } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  type: 'text' | 'mcq' | 'code';
  timeLimit?: number;
  options?: Option[];
  codeTemplate?: string;
  programmingLanguage?: string;
  expectedOutput?: string;
  testCases?: TestCase[];
}

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
}

export function CreateAssessment() {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [questions, setQuestions] = useState<Question[]>([{ id: '1', text: '', type: 'text' }]);
  const [totalTime, setTotalTime] = useState(60);
  const navigate = useNavigate();
  const programmingLanguages = ['JavaScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'PHP'];

  const handleAddQuestion = (type: 'text' | 'mcq' | 'code') => {
    const newQuestion: Question = {
      id: String(questions.length + 1),
      text: '',
      type: type
    };
    
    if (type === 'mcq') {
      newQuestion.options = [
        { id: '1', text: '', isCorrect: false },
        { id: '2', text: '', isCorrect: false },
        { id: '3', text: '', isCorrect: false },
        { id: '4', text: '', isCorrect: false }
      ];
    } else if (type === 'code') {
      newQuestion.programmingLanguage = 'Python';
      newQuestion.codeTemplate = '# Write your code here\n\n';
      newQuestion.testCases = [
        { id: '1', input: '', expectedOutput: '' }
      ];
    }
    
    setQuestions([...questions, newQuestion]);
  };

  const handleRemoveQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const handleQuestionChange = (id: string, text: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, text } : q));
  };

  const handleOptionChange = (questionId: string, optionId: string, text: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        return {
          ...q,
          options: q.options.map(opt => 
            opt.id === optionId ? { ...opt, text } : opt
          )
        };
      }
      return q;
    }));
  };

  const handleCorrectOptionChange = (questionId: string, optionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        return {
          ...q,
          options: q.options.map(opt => 
            ({ ...opt, isCorrect: opt.id === optionId })
          )
        };
      }
      return q;
    }));
  };

  const handleAddOption = (questionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        const newOptionId = String(q.options.length + 1);
        return {
          ...q,
          options: [...q.options, { id: newOptionId, text: '', isCorrect: false }]
        };
      }
      return q;
    }));
  };

  const handleRemoveOption = (questionId: string, optionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options && q.options.length > 2) {
        return {
          ...q,
          options: q.options.filter(opt => opt.id !== optionId)
        };
      }
      return q;
    }));
  };

  const handleCodeLanguageChange = (questionId: string, programmingLanguage: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, programmingLanguage } : q
    ));
  };

  const handleCodeTemplateChange = (questionId: string, codeTemplate: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, codeTemplate } : q
    ));
  };

  const handleAddTestCase = (questionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.type === 'code') {
        const newTestCases = [...(q.testCases || [])];
        const newTestCaseId = String((q.testCases?.length || 0) + 1);
        newTestCases.push({ id: newTestCaseId, input: '', expectedOutput: '' });
        return { ...q, testCases: newTestCases };
      }
      return q;
    }));
  };

  const handleRemoveTestCase = (questionId: string, testCaseId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.testCases && q.testCases.length > 1) {
        return {
          ...q,
          testCases: q.testCases.filter(tc => tc.id !== testCaseId)
        };
      }
      return q;
    }));
  };

  const handleTestCaseChange = (questionId: string, testCaseId: string, field: 'input' | 'expectedOutput', value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.testCases) {
        return {
          ...q,
          testCases: q.testCases.map(tc => 
            tc.id === testCaseId ? { ...tc, [field]: value } : tc
          )
        };
      }
      return q;
    }));
  };

  const handleSubmit = () => {
    const assessment = {
      id: Date.now().toString(),
      title,
      subject,
      questions,
      totalTime,
      createdAt: new Date(),
      status: 'Active',
      participants: '0/0'
    };

    // Get existing assessments from localStorage or initialize empty array
    const existingAssessments = JSON.parse(localStorage.getItem('assessments') || '[]');
    localStorage.setItem('assessments', JSON.stringify([...existingAssessments, assessment]));

    // Update recent activity
    const activity = {
      id: Date.now().toString(),
      type: 'Assessment Created',
      description: `New assessment "${title}" created`,
      timestamp: new Date(),
      severity: 'info'
    };
    const existingActivities = JSON.parse(localStorage.getItem('recentActivities') || '[]');
    localStorage.setItem('recentActivities', JSON.stringify([activity, ...existingActivities.slice(0, 9)]));

    navigate('/assessments');
  };

  const isFormValid = () => {
    if (!title || !subject) return false;
    
    return questions.every(q => {
      if (!q.text.trim()) return false;
      
      if (q.type === 'mcq' && q.options) {
        // Check if all options have text and exactly one option is marked correct
        const hasEmptyOption = q.options.some(opt => !opt.text.trim());
        const correctOptionsCount = q.options.filter(opt => opt.isCorrect).length;
        
        return !hasEmptyOption && correctOptionsCount === 1;
      }

      if (q.type === 'code') {
        // Check if programming language and code template are set
        if (!q.programmingLanguage || !q.codeTemplate) return false;
        
        // Check if test cases are valid (not empty)
        if (!q.testCases || q.testCases.length === 0) return false;
        
        // Check if all test cases have expected output
        return q.testCases.every(tc => tc.expectedOutput.trim() !== '');
      }
      
      return true;
    });
  };

  return (
    <motion.div
      className="max-w-4xl mx-auto space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Create New Assessment</h1>
        <button
          onClick={() => navigate('/assessments')}
          className="p-2 text-gray-500 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assessment Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter assessment title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter subject"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Time (minutes)
          </label>
          <input
            type="number"
            value={totalTime}
            onChange={(e) => setTotalTime(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="1"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
            <div className="flex flex-wrap gap-3">
              <motion.button
                onClick={() => handleAddQuestion('text')}
                className="px-4 py-2 bg-blue-100 text-blue-600 rounded-xl flex items-center space-x-2 hover:bg-blue-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Type className="w-4 h-4" />
                <span>Add Text Question</span>
              </motion.button>
              <motion.button
                onClick={() => handleAddQuestion('mcq')}
                className="px-4 py-2 bg-purple-100 text-purple-600 rounded-xl flex items-center space-x-2 hover:bg-purple-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <List className="w-4 h-4" />
                <span>Add MCQ</span>
              </motion.button>
              <motion.button
                onClick={() => handleAddQuestion('code')}
                className="px-4 py-2 bg-green-100 text-green-600 rounded-xl flex items-center space-x-2 hover:bg-green-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Code className="w-4 h-4" />
                <span>Add Code Question</span>
              </motion.button>
            </div>
          </div>

          {questions.map((question, index) => (
            <motion.div
              key={question.id}
              className="p-6 border border-gray-200 rounded-2xl space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    Question {index + 1}
                  </h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    question.type === 'text' ? 'bg-blue-100 text-blue-800' : 
                    question.type === 'mcq' ? 'bg-purple-100 text-purple-800' : 
                    'bg-green-100 text-green-800'
                  }`}>
                    {question.type === 'text' ? 'Text' : 
                     question.type === 'mcq' ? 'MCQ' : 'Code'}
                  </span>
                </div>
                {questions.length > 1 && (
                  <button
                    onClick={() => handleRemoveQuestion(question.id)}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <textarea
                value={question.text}
                onChange={(e) => handleQuestionChange(question.id, e.target.value)}
                className="w-full h-24 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Enter your question here..."
              />
              
              {question.type === 'mcq' && question.options && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700">Options (select correct answer)</h4>
                    {question.options.length < 6 && (
                      <motion.button
                        onClick={() => handleAddOption(question.id)}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg flex items-center space-x-1 hover:bg-gray-200"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Option</span>
                      </motion.button>
                    )}
                  </div>
                  
                  {question.options.map((option) => (
                    <div key={option.id} className="flex items-center space-x-3">
                      <button
                        onClick={() => handleCorrectOptionChange(question.id, option.id)}
                        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                          option.isCorrect 
                            ? 'bg-green-500 text-white' 
                            : 'border border-gray-300 text-transparent hover:bg-gray-100'
                        }`}
                      >
                        {option.isCorrect && <Check className="w-4 h-4" />}
                      </button>
                      
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => handleOptionChange(question.id, option.id, e.target.value)}
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`Option ${option.id}`}
                      />
                      
                      {question.options.length > 2 && (
                        <button
                          onClick={() => handleRemoveOption(question.id, option.id)}
                          className="flex-shrink-0 p-1 text-red-500 hover:text-red-700"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {question.type === 'code' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Programming Language
                    </label>
                    <select
                      value={question.programmingLanguage}
                      onChange={(e) => handleCodeLanguageChange(question.id, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {programmingLanguages.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code Template (starting code for students)
                    </label>
                    <textarea
                      value={question.codeTemplate}
                      onChange={(e) => handleCodeTemplateChange(question.id, e.target.value)}
                      className="w-full h-32 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="Provide starting code template here..."
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700">Test Cases</h4>
                      <motion.button
                        onClick={() => handleAddTestCase(question.id)}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg flex items-center space-x-1 hover:bg-gray-200"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Test Case</span>
                      </motion.button>
                    </div>
                    
                    {question.testCases && question.testCases.map((testCase) => (
                      <div key={testCase.id} className="p-4 border border-gray-200 rounded-xl space-y-3 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-medium text-gray-700">Test Case {testCase.id}</h5>
                          {question.testCases && question.testCases.length > 1 && (
                            <button
                              onClick={() => handleRemoveTestCase(question.id, testCase.id)}
                              className="p-1 text-red-500 hover:text-red-700"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Input
                          </label>
                          <textarea
                            value={testCase.input}
                            onChange={(e) => handleTestCaseChange(question.id, testCase.id, 'input', e.target.value)}
                            className="w-full h-16 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                            placeholder="Test case input"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Expected Output
                          </label>
                          <textarea
                            value={testCase.expectedOutput}
                            onChange={(e) => handleTestCaseChange(question.id, testCase.id, 'expectedOutput', e.target.value)}
                            className="w-full h-16 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                            placeholder="Expected output"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="flex justify-end">
          <motion.button
            onClick={handleSubmit}
            className={`px-6 py-3 ${
              !isFormValid() 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200/50'
            } rounded-xl flex items-center space-x-2`}
            whileHover={isFormValid() ? { scale: 1.02 } : {}}
            whileTap={isFormValid() ? { scale: 0.98 } : {}}
            disabled={!isFormValid()}
          >
            <Save className="w-5 h-5" />
            <span>Save Assessment</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}