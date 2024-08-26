import React from 'react';
import Link from 'next/link';
import { useQuiz } from '@/components/session-context';

import ToggleButton from './toggle-button';

interface NavProps {
  tab?: string
}

export default function NavMenu({tab}:NavProps) {
  const { quizSession } = useQuiz();

  return (
    <div className="bg-uni-red text-white">
        <div className="container mx-auto flex items-center ">
          <div className="flex-1" />
            <div className="flex space-x-4">
              <Link href={`/${quizSession?.hash}/create-quiz`}>
                <button className={`py-2 px-4 ${tab==='create'? "bg-uni-pink" : ""}`}>Create</button>
              </Link>
              <Link href={`/${quizSession?.hash}/create-ai`}>
                <button className={`py-2 px-4 ${tab==='ai'? "bg-uni-pink" : ""}`}>AI</button>
              </Link>
              <Link href={`/${quizSession?.hash}/settings`}>
                <button className={`py-2 px-4 ${tab==='settings'? "bg-uni-pink" : ""}`}>Settings</button>
              </Link>
              <Link href={`/${quizSession?.hash}/users`}>
                <button className={`py-2 px-4 ${tab==='users'? "bg-uni-pink" : ""}`}>Manage Users</button>
              </Link>
              <Link href={`/${quizSession?.hash}/launch`}>
                <button className={`py-2 px-4 ${tab==='launch'? "bg-uni-pink" : ""}`}>Launch</button>
              </Link>
            </div>
          <div className="flex-1 flex justify-end items-center">
            Preview Quiz  
            <div className="px-4"><ToggleButton /></div>   
          </div>
        </div>
    </div>
  );
};