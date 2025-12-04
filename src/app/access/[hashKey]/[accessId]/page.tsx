'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import { parseQuizDisplay } from '@/handlers/quiz-handler';
import { useQuiz } from '@/hooks/quiz';

interface QuizPageProps {
  params: {
    hashKey: string;
    accessId: string;
  };
}

const AccessQuizPage: React.FC<QuizPageProps> = ({ params }) => {
    const { hashKey, accessId } = params;
    const { quizData, loading, error } = useQuiz(hashKey, accessId);
     // Function to parse the quiz data
  
    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>Error: {error}</p>;
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />     
            <div className="grow flex center-fix overflow-auto text-nowrap">
              <main className="grow flex center-fix overflow-auto text-nowrap"
              style={{
                width: `50%`,
              }}>
                {parseQuizDisplay(quizData)}
              </main>
            </div>
        </div>
    );
};

export default AccessQuizPage;