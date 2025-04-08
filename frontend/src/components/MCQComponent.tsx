
import React, { useState } from 'react';

const questions = [
  {
    question: "Which language runs in a web browser?",
    options: ["Java", "C", "Python", "JavaScript"],
    answer: "JavaScript"
  },
  {
    question: "What does CSS stand for?",
    options: ["Central Style Sheet", "Cascading Style Sheet", "Computer Style Sheet", "Colorful Style Sheet"],
    answer: "Cascading Style Sheet"
  }
];

export const MCQComponent = () => {
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [submitted, setSubmitted] = useState(false);

  const handleOptionChange = (questionIndex: number, option: string) => {
    setSelectedAnswers({ ...selectedAnswers, [questionIndex]: option });
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  return (
    <div className="p-4 bg-white rounded shadow-md my-6">
      <h3 className="text-lg font-semibold mb-4">MCQ Questions</h3>
      {questions.map((q, index) => (
        <div key={index} className="mb-4">
          <p className="font-medium">{index + 1}. {q.question}</p>
          {q.options.map((option) => (
            <label key={option} className="block ml-2">
              <input
                type="radio"
                name={`question-${index}`}
                value={option}
                disabled={submitted}
                checked={selectedAnswers[index] === option}
                onChange={() => handleOptionChange(index, option)}
              />
              {" "}{option}
            </label>
          ))}
          {submitted && (
            <p className={`mt-1 ${selectedAnswers[index] === q.answer ? 'text-green-600' : 'text-red-600'}`}>
              {selectedAnswers[index] === q.answer ? 'Correct!' : `Wrong! Correct answer: ${q.answer}`}
            </p>
          )}
        </div>
      ))}
      {!submitted && (
        <button
          onClick={handleSubmit}
          className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Submit
        </button>
      )}
    </div>
  );
};
