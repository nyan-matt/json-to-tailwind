import React from 'react';

export default function InputText({ label = '', value = '', help = '', showLabel = true, showHelp = false }) {
  return (
    <div className="flex flex-col gap-1">
      {showLabel && <label className="font-semibold">{label}</label>}
      <input className="border px-2 py-1 rounded" value={value} readOnly />
      {showHelp && <div className="text-xs text-gray-500">{help}</div>}
    </div>
  );
}
