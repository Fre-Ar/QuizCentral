"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUserContext } from "@/engine/hooks/useUserContext";
import { fetchQuizContext } from "@/lib/db-utils";
import { QuizContext } from "@/engine/session/types";
import { QuizProvider } from "@/engine/hooks/useQuizContext";
import { QuizRenderer } from "@/engine/core/Renderer";

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUserContext();
  
  const [quizContext, setQuizContext] = useState<QuizContext | null>(null);
  const [isQuizLoading, setIsQuizLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Data on Mount (or when User loads)
  useEffect(() => {
    const loadQuiz = async () => {
      // Wait for user auth to settle
      if (isUserLoading) return;
      
      if (!user) {
        // Redirect to login if trying to access protected route without auth
        router.push("/"); 
        return;
      }

      const quizId = params.quizId as string;
      if (!quizId) return;

      try {
        setIsQuizLoading(true);
        // Fetch fresh data from DB
        const data = await fetchQuizContext(user.googleId, quizId);
        
        if (!data) throw new Error("Quiz not found or access denied");
        
        setQuizContext(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load quiz");
      } finally {
        setIsQuizLoading(false);
      }
    };

    loadQuiz();
  }, [user, isUserLoading, params.quizId, router]);

  // 2. Loading State
  if (isUserLoading || isQuizLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 3. Error State
  if (error || !quizContext) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Quiz</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button 
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // 4. Render Engine
  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <nav className="border-b px-8 py-3 flex items-center justify-between">
        <button 
          onClick={() => router.push("/dashboard")}
          className="text-gray-500 hover:text-gray-900 flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>
        <div className="h-6 w-px mx-2"></div>
        <span className="font-semibold text-gray-800"></span>
        <span className="font-mono text-sm text-gray-400">
          ID: {quizContext.quizId}
        </span>
      </nav>
    
      {/* The Engine */}
      <QuizProvider 
        schema={quizContext.quizSchema} 
        styleRegistry={user!.styles}
        templateRegistry={user!.templates}
      >
        <QuizRenderer renderDebug={true}/>
      </QuizProvider>
    </div>
  );
}