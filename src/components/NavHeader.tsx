import React, {useState} from 'react';
import Link from 'next/link';
import { useQuiz } from '@/components/session-context';
import { useRouter } from 'next/navigation';

import ToggleButton from './toggle-button';

interface NavProps {
  tab?: string;
  id: string;
}

export default function NavMenu({tab, id}:NavProps) {
  const [isOn, setIsOn] = useState(tab === 'desktop');
  const router = useRouter()

  const handleToggle = (newIsOn: boolean) => {
    setIsOn(newIsOn);
    if (newIsOn) {
      router.push(`/quiz/${id}/preview`);
    } else {
      router.push(`/quiz/${id}`);
    }
  }

  return (
    <div className="bg-uni-red text-white">
      <div className="flex justify-between">

        {/* Navigation Header */}
        <nav className="px-8 flex flex-1 items-center justify-start py-0">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-sm font-medium hover:text-white/80 transition-colors"
          >
            <span>←</span> Back to Dashboard
          </button>
          <div className="h-6 w-px mx-2"></div>
          <span className="font-semibold text-white"></span>
          <span className="hidden md:block font-mono text-xs text-white/60 select-all">
            ID: {id}
          </span>
        </nav>

        <div className="flex flex-1 items-center gap-2 shrink-0 text-nowrap">
          {!isOn && (<>
            <Link href={`/quiz/${id}`}>
              <button className={`py-2 px-4  ${tab==='create'? "bg-uni-pink" : ""}`}>Create</button>
            </Link>
            <Link href={`/quiz/${id}`}>
              <button className={`py-2 px-4 ${tab==='ai'? "bg-uni-pink" : ""}`}>AI</button>
            </Link>
            <Link href={`/quiz/${id}`}>
              <button className={`py-2 px-4 ${tab==='settings'? "bg-uni-pink" : ""}`}>Settings</button>
            </Link>
            <Link href={`/quiz/${id}`}>
              <button className={`py-2 px-4 ${tab==='users'? "bg-uni-pink" : ""}`}>Manage Users</button>
            </Link>
            <Link href={`/quiz/${id}`}>
              <button className={`py-2 px-4 ${tab==='launch'? "bg-uni-pink" : ""}`}>Launch</button>
            </Link>
          </>)}
          {isOn && (<>
            <Link href={`/quiz/${id}/preview`}>
              <button className={`py-2 px-4 ${tab==='fridge'? "bg-uni-pink" : ""}`}>Samsung Fridge</button>
            </Link>
            <Link href={`/quiz/${id}/preview`}>
              <button className={`py-2 px-4 ${tab==='mobile'? "bg-uni-pink" : ""}`}>Mobile</button>
            </Link>
            <Link href={`/quiz/${id}/preview`}>
              <button className={`py-2 px-4 ${tab==='tablet'? "bg-uni-pink" : ""}`}>Tablet</button>
            </Link>
            <Link href={`/quiz/${id}/preview`}>
              <button className={`py-2 px-4 ${tab==='desktop'? "bg-uni-pink" : ""}`}>Desktop</button>
            </Link>
          </>)}
        </div>

        <div className="flex flex-1 justify-end items-center px-8">
          Preview Quiz  
          <div className="px-4">
            <ToggleButton isOn={isOn} onToggle={handleToggle}/>
          </div>  
        </div>

      </div>
    </div>
  );
};