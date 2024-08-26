'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { QuizBlock } from './quiz_components/quiz-comp';
import { Time } from './time';

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


{/*export function asComp(block: QuizBlock, selectedDiv:string|null)  {
  if( typeof block)


  return (<ContainerComponent ID={block.id} ClassName={block.style} Selected={selectedDiv}/>);
};*/}
