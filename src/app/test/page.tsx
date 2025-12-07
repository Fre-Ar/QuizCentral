"use client";

import React, { useEffect, useState } from "react";
import { useGoogleId } from "@/hooks/googleId";

import { QuizProvider} from "@/engine/hooks/useQuizContext";
import { MOCK_SCHEMA, MOCK_USER_STYLES, MOCK_USER_TEMPLATES }  from "@/engine/blocks/MockQuiz";
import { QuizRenderer }  from "@/engine/core/Renderer";

import { UserAccount, QuizContext } from "@/session/types";
import { MockService } from "@/session/MockService";

import Header from '@/components/header';
import { Dashboard } from "@/components/Dashboard";

export default function TestPage() {
  // 1. App State
  const [user, setUser] = useState<UserAccount | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<QuizContext | null>(null);
  const [loading, setLoading] = useState(true);

  // 2. Initial User Fetch (Simulate Login)
  const { googleId, setGoogleId } = useGoogleId();
  if (!googleId) {
    console.warn("No googleId, please Log In");
    // TODO: Add proper guardrails to fail gracefully
  }
  

  useEffect(() => {
    MockService.getUser(googleId!).then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  // 3. Handlers
  const handleSelectQuiz = async (quizId: string) => {
    if (!user) return;
    setLoading(true);
    const quizData = await MockService.getQuizContext(quizId, user);
    setActiveQuiz(quizData);
    setLoading(false);
  };

  const handleCreateQuiz = async (title: string) => {
    if (!user) return;
    setLoading(true);
    const quizData = await MockService.createQuiz(user, title);
    setActiveQuiz(quizData);
    setLoading(false);
  };

  const handleBackToDashboard = () => {
    setActiveQuiz(null);
  };

  // 4. Render Logic
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return <div>Error loading user.</div>;

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

  return (
    <QuizProvider schema={MOCK_SCHEMA} styleRegistry={MOCK_USER_STYLES} templateRegistry={MOCK_USER_TEMPLATES}>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="grow flex justify-center">
          <div className="flex flex-col min-w-full border-l border-r border-uni-grey mx-4 lg:mx-0">
            <QuizRenderer />
          </div>
        </main>
      </div>
    </QuizProvider>
  );
}