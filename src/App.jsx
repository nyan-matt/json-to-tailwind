import React, { useState } from 'react';
import Preview from './Preview';
import { mapFigmaNodeToHtml } from './main.js'; // Use your mapping logic

export default function App() {
  const [jsonInput, setJsonInput] = useState('');
  const [jsxCode, setJsxCode] = useState('');
  const [error, setError] = useState('');

  function handleGenerate() {
    try {
      const json = JSON.parse(jsonInput);
      const jsx = mapFigmaNodeToHtml(json);
      setJsxCode(jsx);
      setError('');
    } catch (e) {
      setError('Invalid JSON: ' + e.message);
      setJsxCode('');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-4">Figma JSON to Tailwind/React PoC</h1>
      <div className="flex gap-8">
        <div className="flex-1 flex flex-col gap-2">
          <textarea
            className="w-full h-64 border p-2 rounded font-mono"
            placeholder="Paste Figma JSON here..."
            value={jsonInput}
            onChange={e => setJsonInput(e.target.value)}
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleGenerate}>
            Generate
          </button>
          {error && <div className="text-red-600 mt-2">{error}</div>}
          <div className="mt-4">
            <h2 className="font-semibold mb-2">Generated JSX</h2>
            <pre className="bg-gray-100 border p-2 rounded overflow-x-auto text-xs whitespace-pre-wrap">{jsxCode}</pre>
          </div>
        </div>
        <div className="flex-1">
          <h2 className="font-semibold mb-2">Preview code</h2>
          <Preview jsxCode={jsxCode} />
        </div>
      </div>
    </div>
  );
}
