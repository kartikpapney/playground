"use client";

import React, { useState, useEffect, useRef } from 'react';

const CodeExecutionEngine: React.FC = () => {
  const [code, setCode] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [language, setLanguage] = useState<string>('python');
  const [loading, setLoading] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  const languages = [
    { value: 'python', label: 'Python' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'java', label: 'Java' }
  ];

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const codeRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchDefaultCode();
  }, [language]);

  const fetchDefaultCode = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/default`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCode(data[language]);
    } catch (error: any) {
      setCode(`// Failed to fetch default code: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    setLoading(true);
    setOutput('');
    setHasError(false);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: language,
          code: code,
          input: input,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        setHasError(true);
        setOutput(data.error);
      } else {
        setOutput(data.output);
      }
    } catch (error: any) {
      setHasError(true);
      setOutput(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const selectLanguage = (value: string) => {
    setLanguage(value);
    setDropdownOpen(false);
  };

  // Fixed tab handling for input textarea
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      
      // Create new text with tab
      const newText = input.substring(0, start) + '    ' + input.substring(end);
      setInput(newText);
      
      // Need to use setTimeout to ensure state update before setting selection
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.selectionStart = inputRef.current.selectionEnd = start + 4;
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  // Fixed tab handling for code textarea
  const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      
      // Create new text with tab
      const newText = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newText);
      
      // Need to use setTimeout to ensure state update before setting selection
      setTimeout(() => {
        if (codeRef.current) {
          codeRef.current.selectionStart = codeRef.current.selectionEnd = start + 4;
          codeRef.current.focus();
        }
      }, 0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <h1 className="text-2xl font-mono font-bold mb-6 border-b pb-2">Playground</h1>

      <div className="grid grid-cols-1 gap-6">
        <div className="relative">
          <label htmlFor="language" className="block font-mono text-sm mb-2">
            Language
          </label>
          <div className="relative">
            <button
              type="button"
              className="w-full flex items-center justify-between border border-gray-900 rounded px-4 py-2 bg-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {languages.find((lang) => lang.value === language)?.label}
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-900 rounded shadow-lg">
                <ul className="py-1">
                  {languages.map((lang) => (
                    <li
                      key={lang.value}
                      className={`px-4 py-2 font-mono text-sm hover:bg-gray-100 cursor-pointer ${
                        lang.value === language ? 'bg-gray-100' : ''
                      }`}
                      onClick={() => selectLanguage(lang.value)}
                    >
                      {lang.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="code" className="block font-mono text-sm mb-2">
            Code
          </label>
          <textarea
            ref={codeRef}
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleCodeKeyDown}
            placeholder="// Enter your code"
            className="w-full h-64 border border-gray-900 rounded p-3 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 resize-none"
            spellCheck={false}
          />
        </div>

        <div>
          <label htmlFor="input" className="block font-mono text-sm mb-2">
            Input
          </label>
          <textarea
            ref={inputRef}
            id="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="// Enter your input"
            className="w-full h-32 border border-gray-900 rounded p-3 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 resize-none"
            spellCheck={false}
          />
        </div>

        <button
          onClick={handleRun}
          disabled={loading}
          className="w-full bg-black hover:bg-gray-800 text-white font-mono py-3 px-4 rounded focus:outline-none transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {loading ? 'Executing...' : 'Run Code'}
        </button>

        <div>
          <label htmlFor="output" className="block font-mono text-sm mb-2">
            Output
          </label>
          <div
            id="output"
            className={`w-full h-32 border border-gray-900 rounded p-3 font-mono text-sm overflow-auto whitespace-pre ${
              hasError ? 'bg-red-50 text-red-800' : output ? 'bg-green-50 text-green-800' : 'bg-gray-50'
            }`}
          >
            {output || <span className="text-gray-400">// Output will appear here</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeExecutionEngine;