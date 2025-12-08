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
      router.push(`/quiz/${id}`); // TODO: add quiz preview
    } else {
      router.push(`/quiz/${id}`);
    }
  }

  

  return (
    <div className="bg-uni-red text-white">
        <div className="container mx-auto flex items-center ">
          <div className="flex-1" />
            
            {/* Navigation Header */}
            <nav className="border-b px-8 py-3 flex items-center justify-between">
              <button 
                onClick={() => router.push("/dashboard")}
                className="text-white hover:text-gray-900 flex items-center gap-2"
              >
                ← Back to Dashboard
              </button>
              <div className="h-6 w-px mx-2"></div>
              <span className="font-semibold text-white"></span>
              <span className="font-mono text-sm text-white">
                ID: {id}
              </span>
            </nav>

            <div className="flex space-x-4">
              {!isOn && (<>
                <Link href={`/quiz/${id}`}>
                  <button className={`py-2 px-4 ${tab==='create'? "bg-uni-pink" : ""}`}>Create</button>
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
            <div className="flex-1 flex justify-end items-center">
              Preview Quiz  
            <div className="px-4"><ToggleButton isOn={isOn} onToggle={handleToggle}/></div>   
          </div>
        </div>
    </div>
  );
};