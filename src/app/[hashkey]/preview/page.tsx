'use client';

import React from 'react';
import { useQuiz } from '@/components/session-context';


import Header from '@/components/header';
import NavMenu from '@/components/nav-menu';


export default function Page() {
  const { quizSession, setQuizSession } = useQuiz();


  return (
    <div className="min-h-screen max-h-screen flex flex-col">
      <Header />
      <NavMenu tab="desktop" />
        <div className="flex-grow flex center-fix overflow-auto text-nowrap">
              <main className="flex-grow flex center-fix overflow-auto text-nowrap"
              style={{
                width: `50%`,
              }}>
                {quizSession?.quiz.asDisplay()}
              </main>
        </div>

    </div> 
  );
};



