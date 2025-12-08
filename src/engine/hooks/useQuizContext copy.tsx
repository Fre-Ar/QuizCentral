import React, { createContext, useContext, useEffect, useRef, useState, useMemo } from "react";
import { QuizEngine } from "../core/QuizEngine";
import { QuizSchema, StyleRegistry, TemplateRegistry } from "../types/schema";
import { TemplateCompiler } from "../core/TemplateCompiler";
import { logTest } from "@/lib/utils";
import { QuizContext } from "../session/types";

interface QuizContextValue {
  ctx: QuizContext;
  engine: QuizEngine;
  styleRegistry: StyleRegistry;
}

const QuizContextVal = createContext<QuizContextValue | null>(null);

interface QuizProviderProps {
  ctx: QuizContext;
  children: React.ReactNode;
}

export const QuizProvider: React.FC<QuizProviderProps> = ({ ctx, children }) => {
  // Use a ref to store the engine instance so it survives re-renders without being recreated.
  // We cannot use useMemo for side-effects like initializing the engine (React strict mode constraints).
  const engineRef = useRef<QuizEngine | null>(null);
  
  // We use a dummy state to force a re-render once the engine is ready
  const [isReady, setIsReady] = useState(false);

  // 1. COMPILE (Standardized)
  const runtimeSchema = useMemo(() => {
    // If no registry is provided, use the raw schema
    if (!ctx.quizCreator.templates || ctx.quizCreator.templates.size === 0) return ctx.quizSchema;
    

    const compiler = new TemplateCompiler(ctx.quizCreator.templates);
    const newSchema = compiler.compile(ctx.quizSchema);
    return newSchema

  }, [ctx]);

  // 2. INIT ENGINE
  if (!engineRef.current) {
    engineRef.current = new QuizEngine(runtimeSchema);
    setIsReady(true);
  }

  // 3. LIFECYCLE
  useEffect(() => {
    const engine = engineRef.current;
    if (engine) engine.mount(); // Start timers/listeners
    return () => engine?.unmount(); // Pause timers/listeners
  }, []); // Empty dependency array = Run once on mount
  // 2. Lifecycle Binding (Run on Mount/Unmount)

  if (!isReady || !engineRef.current) {
    return null; // Or a loading spinner
  }

  return (
    <QuizContextVal.Provider value={{ engine: engineRef.current, ctx: ctx, styleRegistry: ctx.quizCreator.styles || new Map() }}>
      {children}
    </QuizContextVal.Provider>
  );
};

export const useQuizContext = () => {
  const ctx = useContext(QuizContextVal);
  if (!ctx) throw new Error("useQuizContext must be used within a QuizProvider");
  return ctx;
};