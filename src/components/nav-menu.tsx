import React, {useState} from 'react';
import Link from 'next/link';
import { useQuiz } from '@/components/session-context';
import { useRouter } from 'next/navigation';

import ToggleButton from './toggle-button';

interface NavProps {
  tab?: string
}

export default function NavMenu({tab}:NavProps) {
  const { quizSession } = useQuiz();
  const [isOn, setIsOn] = useState(tab === 'desktop');
  const router = useRouter()

  const handleToggle = (newIsOn: boolean) => {
    setIsOn(newIsOn);
    if (newIsOn) {
      router.push(`/${quizSession?.hash}/preview`);
    } else {
      router.push(`/${quizSession?.hash}/create-quiz`);
    }
  }

  return (
    <div className="bg-uni-red text-white">
        <div className="container mx-auto flex items-center ">
          <div className="flex-1" />
            <div className="flex space-x-4">
              {!isOn && (<>
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
              </>)}
              {isOn && (<>
                <Link href={`/${quizSession?.hash}/preview`}>
                  <button className={`py-2 px-4 ${tab==='fridge'? "bg-uni-pink" : ""}`}>Samsung Fridge</button>
                </Link>
                <Link href={`/${quizSession?.hash}/preview`}>
                  <button className={`py-2 px-4 ${tab==='mobile'? "bg-uni-pink" : ""}`}>Mobile</button>
                </Link>
                <Link href={`/${quizSession?.hash}/preview`}>
                  <button className={`py-2 px-4 ${tab==='tablet'? "bg-uni-pink" : ""}`}>Tablet</button>
                </Link>
                <Link href={`/${quizSession?.hash}/preview`}>
                  <button className={`py-2 px-4 ${tab==='desktop'? "bg-uni-pink" : ""}`}>Desktop</button>
                </Link>
              </>)}
            </div>
            <div className="flex-1 flex justify-end items-center">
              Preview Quiz  
            <div className="px-4"><ToggleButton isOn={isOn} onToggle={handleToggle}/></div>   
          </div>
        </div>
    </div>
  );
};