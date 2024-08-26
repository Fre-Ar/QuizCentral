'use client';

import React from 'react';

import Link from 'next/link';
import Header from '../components/header';
import { v4 as uuidv4 } from 'uuid';
import { useQuiz } from '@/components/session-context';
import { QuizSettings } from '@/components/session-context';
import { ContainerBlock } from '@/components/quiz_components/container-comp';
import { ButtonBlock } from '@/components/quiz_components/variables/button-comp';
import { InputBlock } from '@/components/quiz_components/variables/input-comp';
import { TextBlock } from '@/components/quiz_components/info/text-comp';
import { useRouter } from 'next/navigation';
import { QuizSession } from '@/components/session-context';
import { QuizBlock } from '@/components/quiz_components/quiz-comp';
import { parseQuizData } from '@/lib/utils';
import { getCookie } from '@/lib/utils';

export default function Home() {

  const { setQuizSession } = useQuiz();
  const router = useRouter()

  const createQuiz = (): QuizSession => {
    const uniqueHash = uuidv4();

    const titleInput = new InputBlock("title", "", "", "Enter Quiz Title", "text-2xl font-bold");
    const placeholderInfo = new TextBlock("placeholder", "border border-dashed border-uni-black rounded p-4", "text-uni-grey text-nowrap text-center", "+ Add Blocks From The Left");
    const submitButton = new ButtonBlock("submit", "", "Submit");
    const mainBlock = new ContainerBlock("main", "p-4 border-x border-uni-grey gap-y-4 min-w-96", -1, 1, [titleInput, placeholderInfo, submitButton]);

    const quizSettings: QuizSettings = {
      title: `Quiz-${uniqueHash}`,
      blocksPerPage: false,
      allowBack: false
    }

    const settings  = {
      quizSettings: quizSettings,
      conditions: [],
      globalStyle: "",
    }

    const newQuizSession: QuizSession = {
      hash: uniqueHash,
      quiz: mainBlock,
      groups: [],
      custom: [],
      settings: settings,
      nextId: 0
    };
    return newQuizSession;
  };

  const handleCreateQuiz = () => {
    const newQuizSession = createQuiz();
    setQuizSession(newQuizSession);
    router.push(`/${newQuizSession.hash}/create-quiz`);
  };

  const handleLoadQuiz = async () => {
    const existingHash = getCookie('quizHash');
    let loadedQuizSession;

    if (existingHash) {
      const shouldLoad = window.confirm(`A quiz with id: ${existingHash} is already in progress. Do you want to load it?`);
      if (shouldLoad) {
        const response = await fetch('/api/quiz/load-quiz', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({hashKey: existingHash}),
        });
        const result = await response.json();

        if (result.error) {
          alert(result.error);
          return;  // Exit if there's an error loading the quiz
        } else {
          loadedQuizSession = parseQuizData(result.quizData.quiz_data);
        }

        setQuizSession(loadedQuizSession);
        router.push(`/${loadedQuizSession?.hash}/create-quiz`);
      }
      else {
        handleCreateQuiz();
      }
    } else {
      alert('No existing quiz found.');
      handleCreateQuiz();
    }
  };
  


  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex justify-center">
        <div className="flex flex-col w-full max-w-md border-l border-r border-uni-grey mx-4 lg:mx-0">
          <div className="flex-grow flex flex-col justify-center space-y-4 items-center p-4">

            <Link href="/access">
              <button className="bg-uni-red text-white font-bold py-4 px-8 rounded">Access Quiz</button>
            </Link>
            
              <button className="bg-uni-blue text-white font-bold py-4 px-8 rounded" onClick={handleCreateQuiz}>Create Quiz</button>
            
              <button className="bg-uni-blue text-white font-bold py-4 px-8 rounded" onClick={handleLoadQuiz}>Load Quiz</button>
            

          </div>
        </div>
      </main>
    </div>
  );
}

