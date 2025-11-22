import { useState } from 'react';

export function useApiKey(){
    const [apiKey, setApiKey] = useState<string>('');
    if (!apiKey) {
      alert('Please set your OpenAI API key first.');
    }
    return { apiKey, setApiKey };

}