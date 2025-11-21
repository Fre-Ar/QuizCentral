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
  nextGroup: number;
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

/**
 * QuizProvider component
 *
 * Provides quiz session state to descendant components via QuizContext.
 * Internally, it manages a piece of state "quizSession" (initially null) and
 * its updater "setQuizSession" using React's useState, and supplies both through
 * the QuizContext.Provider value.
 *
 * @remarks
 * - The context value shape is expected to be:
 *   { quizSession: QuizSession | null; setQuizSession: React.Dispatch<React.SetStateAction<QuizSession | null>> }
 * - Intended to wrap the part of the component tree that needs access to the current
 *   quiz session and the ability to update it.
 *
 * @param props.children - The React node(s) that will have access to the quiz context.
 *
 * @returns A JSX element that renders children within the QuizContext.Provider.
 *
 * @example
 * // Wrap your application (or a subtree) so descendants can read/update the quiz session
 * <QuizProvider>
 *   <App />
 * </QuizProvider>
 *
 * @example
 * // Consume the context in a descendant component
 * const { quizSession, setQuizSession } = useContext(QuizContext);
 */
export const QuizProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);

  return (
    <QuizContext.Provider value={{ quizSession, setQuizSession }}>
      {children}
    </QuizContext.Provider>
  );
};

/**
 * Custom hook that returns the current value of the QuizContext.
 *
 * This hook ensures it is called within a QuizProvider. If no provider is found
 * in the React component tree, it throws an error to help catch incorrect usage.
 *
 * @returns The value exposed by QuizProvider (quiz state and actions).
 *
 * @throws {Error} If the hook is used outside of a QuizProvider.
 *
 * @example
 * // inside a component rendered within <QuizProvider>
 * const { questions, currentQuestionIndex, submitAnswer } = useQuiz();
 *
 * @public
 */
export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};

