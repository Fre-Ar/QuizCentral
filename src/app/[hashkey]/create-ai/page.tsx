'use client';

import React, { useState, useEffect, useRef} from 'react';
import { useQuiz } from '@/components/session-context';
import { useRouter } from 'next/navigation';

import Header from '@/components/header';
import NavMenu from '@/components/nav-menu';
import DragHandle from '@/components/drag-handle';
import Accordion from '@/components/accordion';
import Sidebar from '@/components/sidebar';
import SideButton from '@/components/side-button';
import ContainerComponent from '@/components/quiz_components/container-comp';
import OpenAIKeyInput from '@/components/openAiKeyInput';
import { FaCog, FaCodeBranch, FaCss3Alt } from "react-icons/fa";
import { useApiKey } from '@/hooks/ai';
import InputComponent from '@/components/quiz_components/variables/input-comp';
import TextComponent from '@/components/quiz_components/info/text-comp';
import { useDragging } from '@/hooks/resizing';
import { useQuizSession } from '@/hooks/quiz';

export default function Page() {

  const { leftSidebarWidth, rightSidebarWidth, selectedDivId, mainRef, handleMouseDown } = useDragging();
  const { quizSession, setQuizSession }  = useQuizSession();
  const { apiKey, setApiKey } = useApiKey();
  const [input, setInput] = useState('');
  const [reply, setReply] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen max-h-screen flex flex-col">
      <Header />
      <NavMenu tab="ai"/>
      <div className="flex flex-grow overflow-hidden">


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


        <main className="flex-grow flex center-fix overflow-auto text-nowrap"           
          style={{
            width: `calc(100% - ${leftSidebarWidth}%  - 5px)`, // 5px for the resizer
          }}>
            <OpenAIKeyInput onKeyChange={setApiKey} />

        </main>
      </div>   
    </div> 
  );
};



