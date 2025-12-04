'use client';

import { useState} from 'react';

import Header from '@/components/header';
import NavMenu from '@/components/nav-menu';
import DragHandle from '@/components/drag-handle';
import SidePanel from '@/components/side-panel';
import { deleteBlockHandler } from '@/handlers/quiz-handler';
import { ContainerBlock } from '@/components/quiz_components/container-comp';
import { QuizBlock } from '@/components/quiz_components/quiz-comp';
import { addBlockHandler } from '@/handlers/quiz-handler';
import { useDragging } from '@/hooks/resizing';
import { useQuizSession } from '@/hooks/quiz';

export default function Page() {
  
  const { quizSession, setQuizSession }  = useQuizSession(); 
  const [nextId, setNextId] = useState<number>(quizSession?.nextId || 0);
  const { leftSidebarWidth, rightSidebarWidth, selectedDivId, mainRef, handleMouseDown } = useDragging();

  const deleteBlock = (id?: string) => {
    deleteBlockHandler(quizSession, setQuizSession, id);
  };

  const addBlock = (block: QuizBlock) => {
    addBlockHandler(block, quizSession, setQuizSession, selectedDivId, nextId, setNextId);
  };


  return (
    <div className="min-h-screen max-h-screen flex flex-col">
      <Header />
      <NavMenu tab="create" />
      <div className="flex grow overflow-hidden">

        <SidePanel Width={`${leftSidebarWidth}%`} Tab='blocks' Position='left' AddBlock={addBlock} 
        Selected={selectedDivId} QuizSession={quizSession} SetQuizSession={setQuizSession}/>


        <DragHandle onMouseDown={() => handleMouseDown('left')}/>


        <main ref={mainRef} className="grow flex center-fix overflow-auto text-nowrap"           
          style={{
            width: `calc(100% - ${leftSidebarWidth}% - ${rightSidebarWidth}% - 10px)`, // 10px for the resizers
          }}>

            {(quizSession?.quiz as ContainerBlock).asComp(selectedDivId, deleteBlock, quizSession, setQuizSession)}

        </main>


        <DragHandle onMouseDown={() => handleMouseDown('right')}/>

        <SidePanel Width={`${rightSidebarWidth}%`} Tab='settings' Position='right' AddBlock={addBlock} 
        Selected={selectedDivId} QuizSession={quizSession} SetQuizSession={setQuizSession}/>
      </div>   
    </div> 
  );
};



