"use client";

import { useState} from "react";
import { useRouter } from "next/navigation";

import { QuizProvider} from "@/engine/hooks/useQuizContext";
import { QuizRenderer }  from "@/engine/core/Renderer";

import { QuizContext, UserAccount } from "@/engine/session/types";

import Header from '@/components/header';
import { Dashboard } from "@/components/Dashboard";
import { useUserContext } from "@/engine/hooks/useUserContext";
import { fetchQuizContext, createQuiz, saveQuizToDatabase } from "@/lib/db-utils";
import { MOCK_SCHEMA, MOCK_USER_STYLES, MOCK_USER_TEMPLATES } from "@/engine/blocks/MockQuiz";
import { logTest } from "@/lib/utils";
import GoogleLoginButton from "@/components/GoogleLoginButton";

export default function Page() {
  const router = useRouter();
  // 1. App State 
  // The Context provides 'isLoading' so we know if we are still checking cookies/DB
  const { user, isLoading: isUserLoading, setUser } = useUserContext();
  const [isCreating, setIsCreating] = useState(false);

  // 1. Navigation Handler
  const handleSelectQuiz = (quizId: string) => {
    // Simply push to the new route. The new page handles the fetching.
    router.push(`/quiz/${quizId}`);
  };

  const handleMockQuiz = async () => {
    if (!user) return;
    setIsCreating(true);

    // Update local cache so dashboard list is correct when we return
    const updatedUser: UserAccount = {
      googleId: user.googleId,
      email: user.email,
      userName: user.userName,
      createdAt: user.createdAt,
      quizzes: [
        ...user.quizzes, 
        { id: MOCK_SCHEMA.id, title: MOCK_SCHEMA.meta.title }
      ],
      styles: MOCK_USER_STYLES,
      templates: MOCK_USER_TEMPLATES,
      groups: user.groups
    };
    setUser(updatedUser);

    console.log('USER GOT THESE:', updatedUser)

    const newCtx: QuizContext = {
      quizId: MOCK_SCHEMA.id,
      quizCreator: updatedUser,
      quizSchema: MOCK_SCHEMA,

      groups: [],
      openSessions: [],
      submission: [],
    }
    
    await saveQuizToDatabase(newCtx);
    logTest('QUIZ SAVED!');

    // Redirect to the new quiz page
    router.push(`/quiz/${newCtx.quizId}`);
  };

  // 2. Creation Handler
  const handleCreateQuiz = async (title: string) => {
    if (!user) return;
    setIsCreating(true);
    
    // We create the quiz in DB first
    const newContext = await createQuiz(user, title);

    if (newContext) {
      // Update local cache so dashboard list is correct when we return
      const updatedUser = {
        ...user,
        quizzes: [
          ...user.quizzes, 
          { id: newContext.quizId, title: newContext.quizSchema.meta.title }
        ]
      };
      setUser(updatedUser);

      // Redirect to the new quiz page
      router.push(`/quiz/${newContext.quizId}`);
    } else {
      console.error("Could not create quiz");
      setIsCreating(false);
    }
  };

  // 3. Render Logic

  // A. Loading State (User or Quiz)
  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
        <div className="w-full max-w-sm">
          <GoogleLoginButton />
        </div>
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
        addMockQuiz={handleMockQuiz} 
      />
    </div>
  );
}