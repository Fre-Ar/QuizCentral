"use client";

import { useEffect, useState} from "react";
import { useRouter } from "next/navigation";

import { useGoogleId } from "@/hooks/googleId";
import { QuizProvider} from "@/engine/hooks/useQuizContext";
import { QuizRenderer }  from "@/engine/core/Renderer";

import { UserAccount, QuizContext } from "@/engine/session/types";
import { MockService } from "@/engine/session/MockService";

import Header from '@/components/header';
import { Dashboard } from "@/components/Dashboard";
import { useUserContext } from "@/engine/hooks/useUserContext";
import { fetchUserAccount, fetchQuizContext } from "@/lib/db-utils";

export default function Page() {
  const router = useRouter();
  // 1. App State 
  // The Context provides 'isLoading' so we know if we are still checking cookies/DB
  const { user, isLoading: isUserLoading } = useUserContext();

  const [activeQuiz, setActiveQuiz] = useState<QuizContext | null>(null);
  const [isQuizLoading, setIsQuizLoading] = useState(false);

  // 2. Handlers
  const handleSelectQuiz = async (quizId: string) => {
    if (!user) return;
    setIsQuizLoading(true);
    
    // Switch to Real DB Utility
    const quizData = await fetchQuizContext(user.googleId, quizId);
    
    if (quizData) {
      setActiveQuiz(quizData);
    } else {
      console.error("Failed to load quiz");
    }
    setIsQuizLoading(false);
  };

  const handleCreateQuiz = async (title: string) => {
    if (!user) return;
    setIsQuizLoading(true);
    
    // Call your API to create a quiz
    try {
        const res = await fetch('/api/quizzes', { // You need to ensure this endpoint handles creation
            method: 'POST',
            body: JSON.stringify({ 
                quizJson: { 
                    // ... minimal context to trigger creation ...
                    // Usually creation happens via a lighter endpoint than the full context save
                    // For MVP, if MockService works for now, keep it, but plan to move to API.
                } 
            })
        });
        // For now, let's assume we reload or fetch the new context
        setIsQuizLoading(false);
    } catch (e) {
        console.error(e);
        setIsQuizLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    setActiveQuiz(null);
  };

  /*// 3. Handlers
  const handleSelectQuiz = async (quizId: string) => {
    if (!user) return;
    setIsQuizLoading(true);
    const quizData = await MockService.getQuizContext(quizId, user);
    setActiveQuiz(quizData);
    setIsQuizLoading(false);
  };

  const handleCreateQuiz = async (title: string) => {
    if (!user) return;
    setIsQuizLoading(true);
    const quizData = await MockService.createQuiz(user, title);
    setActiveQuiz(quizData);
    setIsQuizLoading(false);
  };*/

  // 3. Render Logic

  // A. Loading State (User or Quiz)
  if (isUserLoading || isQuizLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // B. Not Logged In
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold mb-4">Please Log In</h2>
        <p className="text-gray-500 mb-6">You need an account to view the dashboard.</p>
        {/* You could render <GoogleLoginButton /> here directly */}
        <button 
            onClick={() => router.push("/login")} // Assuming you have a login page
            className="px-4 py-2 bg-blue-600 text-white rounded"
        >
            Go to Login
        </button>
      </div>
    );
  }

  // VIEW: QUIZ ACTIVE
  if (activeQuiz) {
    return (
      <div className="min-h-screen">
        <nav className="border-b px-8 py-3 flex items-center justify-between">
          <button 
            onClick={handleBackToDashboard}
            className="text-gray-500 hover:text-gray-900 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <span className="font-mono text-sm text-gray-400">
            Session: {activeQuiz.quizId}
          </span>
        </nav>

        <QuizProvider 
          schema={activeQuiz.quizSchema} 
          styleRegistry={user.styles}
          templateRegistry={user.templates}
        >
          <QuizRenderer />
        </QuizProvider>
      </div>
    );
  }

  // VIEW: DASHBOARD
  return (
    <div className="min-h-screen">
      <Header />
      <Dashboard 
        user={user} 
        onSelectQuiz={handleSelectQuiz} 
        onCreateQuiz={handleCreateQuiz} 
      />
    </div>
  );
}