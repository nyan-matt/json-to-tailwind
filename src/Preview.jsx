import React from 'react';
import JsxParser from 'react-jsx-parser';
import { componentRegistry } from './components/registry';

export default function Preview({ jsxCode }) {
  // Pass all registered components to JsxParser
  return (
    <div className="preview-pane">
      <JsxParser components={componentRegistry} jsx={jsxCode} />
    </div>
  );
}
