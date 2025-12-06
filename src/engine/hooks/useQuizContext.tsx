import React, { createContext, useContext, useEffect, useRef, useState, useMemo } from "react";
import { QuizEngine } from "../core/QuizEngine";
import { QuizSchema, StyleRegistry, TemplateRegistry } from "../types/schema";
import { TemplateCompiler } from "../core/TemplateCompiler";
import { logTest } from "@/lib/utils";

interface QuizContextValue {
  engine: QuizEngine;
  styleRegistry: StyleRegistry;
}

const QuizContext = createContext<QuizContextValue | null>(null);

interface QuizProviderProps {
  schema: QuizSchema;
  // TODO:  Make this come from useUser().styleRegistry
  styleRegistry?: StyleRegistry;    
  templateRegistry?: TemplateRegistry;
  children: React.ReactNode;
}

export const QuizProvider: React.FC<QuizProviderProps> = ({ schema, styleRegistry, templateRegistry, children }) => {
  // Use a ref to store the engine instance so it survives re-renders without being recreated.
  // We cannot use useMemo for side-effects like initializing the engine (React strict mode constraints).
  const engineRef = useRef<QuizEngine | null>(null);
  
  // We use a dummy state to force a re-render once the engine is ready
  const [isReady, setIsReady] = useState(false);

  // 1. COMPILE (Standardized)
  const runtimeSchema = useMemo(() => {
    // If no registry is provided, use the raw schema
    if (!templateRegistry || templateRegistry.size === 0) return schema;
    
    console.log("[QuizProvider] Compiling with Registry...");
    const compiler = new TemplateCompiler(templateRegistry);
    const newSchema = compiler.compile(schema);
    logTest("[QuizProvider] Compilation Result:", newSchema);
    return newSchema

  }, [schema, templateRegistry]);

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
    <QuizContext.Provider value={{ engine: engineRef.current, styleRegistry: styleRegistry || new Map() }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuizContext = () => {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuizContext must be used within a QuizProvider");
  return ctx;
};