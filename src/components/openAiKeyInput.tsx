'use client';

import { useEffect, useState } from 'react';

interface Props {
  onKeyChange: (key: string | null) => void;
}

export default function OpenAIKeyInput({ onKeyChange }: Props) {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('openai_api_key');
    if (saved) {
      setApiKey(saved);
      onKeyChange(saved);
    }
  }, [onKeyChange]);

  const handleSave = () => {
    const value = apiKey.trim();
    if (!value) {
      localStorage.removeItem('openai_api_key');
      onKeyChange(null);
    } else {
      localStorage.setItem('openai_api_key', value);
      onKeyChange(value);
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Paste your OpenAI API key"
        className="border rounded px-2 py-1 flex-1"
      />
      <button onClick={handleSave} className="border rounded px-3 py-1">
        Save
      </button>
    </div>
  );
}