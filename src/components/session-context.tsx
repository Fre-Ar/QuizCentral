'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { QuizBlock } from './quiz_components/quiz-comp';
import { Time } from './time';
import { TextBlock } from './quiz_components/info/text-comp';
import { InputBlock } from './quiz_components/variables/input-comp';
import { ContainerBlock } from './quiz_components/container-comp';
import { ButtonBlock } from './quiz_components/variables/button-comp';

interface QuizContextType {
  quizSession: QuizSession | null;
  setQuizSession: (data: QuizSession  | null) => void;
}

export interface QuizSession {
  hash: string;
  quiz: QuizBlock;
  groups: Group[];
  custom: QuizBlock[];
  settings: SessionSettings;
  nextId: number;
}

export interface Group {
  id: string;
  name: string;
  emails: User[];
  permission: string;
  settings: GroupSettings;
}

export interface User {
  email: string,
  accessId: string
}

export interface GroupSettings {
  submitResponse: boolean;
  startAt: Date|false;
  endAt: Date|false;
  lastFor: Time|false;
}

export interface SessionSettings {
  quizSettings: QuizSettings;
  conditions: Condition[];
  globalStyle: string;
}

export interface QuizSettings{
  title: string;
  blocksPerPage: number | false;
  allowBack: boolean;
}

export interface Condition {
  checks: Check[];
  actions: Action[];
}

export interface Check {
  If: string;
  State: string;
  Value: string;
}

export interface Action {
  Do: string;
  Field: string;
}




const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);

  return (
    <QuizContext.Provider value={{ quizSession, setQuizSession }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};


export function downloadQuizSession(quizSession: any, filename: string = 'quizSession.json') {
  // Convert the quizSession object to a JSON string
  const jsonString = JSON.stringify(quizSession, null, 2); // Pretty-print JSON with 2 spaces
  
  // Create a Blob from the JSON string
  const blob = new Blob([jsonString], { type: 'application/json' });
  
  // Create a link element
  const link = document.createElement('a');
  
  // Set the download attribute with a filename
  link.download = filename;
  
  // Create a URL for the Blob and set it as the href attribute
  link.href = URL.createObjectURL(blob);
  
  // Append the link to the body (it won't be visible)
  document.body.appendChild(link);
  
  // Programmatically click the link to trigger the download
  link.click();
  
  // Remove the link from the document
  document.body.removeChild(link);
}

// Function to identify the type of QuizBlock and instantiate it accordingly
export const parseQuizBlock = (block: any): QuizBlock => {
  if ('children' in block && Array.isArray(block.children)) {
    // Recursively parse children
    const children = block.children.map(parseQuizBlock);
    return new ContainerBlock(block.id, block.style || '', block.rows || 1, block.columns || 1, children);
  } else if (block.id === 'submit') {
    return new ButtonBlock(block.id, block.style || '', block.text || '');
  } else if ('text' in block && typeof block.text === 'string') {
    return new TextBlock(block.id, block.style || '', block.font || '', block.text);
  } else if ('def' in block && typeof block.def === 'string') {
    return new InputBlock(block.id, block.style || '', block.def, block.placeholder || '', block.font || '');
  }  else {
    throw new Error('Unknown block type');
  }
};

// Function to parse the quiz data
export const parseQuizData = (json: any): QuizSession | null => {
  if (
    json &&
    typeof json === 'object' &&
    typeof json.hash === 'string' &&
    typeof json.quiz === 'object' &&
    Array.isArray(json.groups) &&
    Array.isArray(json.custom) &&
    typeof json.settings === 'object'
  ) {
    try {
      const parsedQuiz = parseQuizBlock(json.quiz); // Parse the main quiz block
      return {
        ...json,
        quiz: parsedQuiz,
      };
    } catch (error) {
      console.error('Error parsing quiz blocks:', error);
      return null;
    }
  }
  return null;
};

export const getCookie = (name: string='quizHash'): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length); // Remove leading spaces
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};