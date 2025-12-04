'use client';

import React, { useState} from 'react';

import Header from '@/components/header';
import NavMenu from '@/components/nav-menu';
import DragHandle from '@/components/drag-handle'; 
import Sidebar from '@/components/sidebar';
import SideButton from '@/components/side-button';
import OpenAIKeyInput from '@/components/openAiKeyInput';
import { FaCog, FaCodeBranch, FaCss3Alt } from "react-icons/fa";
import { useDragging } from '@/hooks/resizing';
import { useQuizSession } from '@/hooks/quiz';
import { useOpenAPISending } from '@/hooks/ai';

export default function Page() {

  const { leftSidebarWidth, rightSidebarWidth, selectedDivId, mainRef, handleMouseDown } = useDragging();
  const { quizSession, setQuizSession }  = useQuizSession();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const { input, setInput, reply, isLoading, sendPrompt } = useOpenAPISending(apiKey);
  

  const handleSend = async () => { 
    await sendPrompt();
  };

  return (
    <div className="min-h-screen max-h-screen flex flex-col">
      <Header />
      <NavMenu tab="ai"/>
      <div className="flex grow overflow-hidden">


      <Sidebar width={`${leftSidebarWidth}%`}>
        <SideButton title='Settings' chosen={false}>
            <FaCog size="2em" className="p-1" />
        </SideButton>
        <SideButton title='Conditions' chosen={false}>
            <FaCodeBranch size="2em" className="p-1" />
        </SideButton>
        <SideButton title='Global Styling' chosen={false}>
            <FaCss3Alt size="2em" className="p-1" />
        </SideButton>
        


      </Sidebar>


        <DragHandle onMouseDown={() => handleMouseDown('left')}/>


        <main className="grow flex center-fix overflow-auto text-nowrap"           
          style={{
            width: `calc(100% - ${leftSidebarWidth}%  - 5px)`, // 5px for the resizer
          }}>

          <div className="p-4 space-y-4 flex flex-col w-1/2">
            <OpenAIKeyInput onKeyChange={setApiKey} />

            <textarea
              className="w-full border rounded p-2 bg-black resize-none min-h-lg"
              rows={4}
              cols={50}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something..."/>

            <button
              onClick={handleSend}
              disabled={isLoading || !input}
              className="bg-uni-blue disabled:bg-uni-grey text-white font-bold py-4 px-8 rounded"
            >
              {'Send'}
            </button>

            {isLoading ? 'Sending...' : ''}

            {reply && (
              <div className="border rounded p-2 whitespace-pre-wrap text-wrap">
                {reply}
              </div>
            )}
          </div>

        </main>
      </div>   
    </div> 
  );
};



