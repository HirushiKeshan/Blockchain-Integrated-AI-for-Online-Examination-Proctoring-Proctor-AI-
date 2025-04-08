
import React, { useState } from 'react';

export const CodingInterpreter = () => {
  const [code, setCode] = useState('// Write JS code\nconsole.log(1 + 1);');
  const [output, setOutput] = useState('');

  const runCode = () => {
    try {
      const result = eval(code);
      setOutput(String(result));
    } catch (err) {
      setOutput('Error: ' + err.message);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow-md my-6">
      <h3 className="text-lg font-semibold mb-2">Coding Interpreter (JavaScript)</h3>
      <textarea
        className="w-full h-40 border p-2 font-mono"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button
        onClick={runCode}
        className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Run Code
      </button>
      <pre className="mt-4 bg-gray-100 p-2 rounded">{output}</pre>
    </div>
  );
};
