import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { QuizEngine } from "../core/QuizEngine";
import { QuizSchema } from "../types/schema";

interface QuizContextValue {
  engine: QuizEngine;
}

const QuizContext = createContext<QuizContextValue | null>(null);

interface QuizProviderProps {
  schema: QuizSchema;
  children: React.ReactNode;
}

export const QuizProvider: React.FC<QuizProviderProps> = ({ schema, children }) => {
  // Use a ref to store the engine instance so it survives re-renders without being recreated.
  // We cannot use useMemo for side-effects like initializing the engine (React strict mode constraints).
  const engineRef = useRef<QuizEngine | null>(null);
  
  // We use a dummy state to force a re-render once the engine is ready
  const [isReady, setIsReady] = useState(false);

  if (!engineRef.current) {
    engineRef.current = new QuizEngine(schema);
    setIsReady(true);
  }

  // Cleanup on unmount (optional, depending on if Engine holds resources like timers)
  useEffect(() => {
    return () => {
      // engineRef.current?.dispose(); // If we add cleanup logic later
    };
  }, []);

  if (!isReady || !engineRef.current) {
    return null; // Or a loading spinner
  }

  return (
    <QuizContext.Provider value={{ engine: engineRef.current }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuizContext = () => {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuizContext must be used within a QuizProvider");
  return ctx;
};