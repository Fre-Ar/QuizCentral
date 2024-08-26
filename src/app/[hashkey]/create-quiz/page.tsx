'use client';

import React, { useState, useEffect, useRef} from 'react';
import { useQuiz } from '@/components/session-context';
import { useRouter } from 'next/navigation';

import Header from '@/components/header';
import NavMenu from '@/components/nav-menu';
import DragHandle from '@/components/drag-handle';
import SidePanel from '@/components/side-panel';

import ContainerComponent, { ContainerBlock } from '@/components/quiz_components/container-comp';
import InputComponent, { InputBlock} from '@/components/quiz_components/variables/input-comp';
import ButtonComponent, { ButtonBlock } from '@/components/quiz_components/variables/button-comp';
import TextComponent, { TextBlock } from '@/components/quiz_components/info/text-comp';
import { QuizBlock } from '@/components/quiz_components/quiz-comp';



const MIN_SIDEBAR_WIDTH = 0;
const DEFAULT_SIDEBAR_WIDTH = 20;
const MAX_SIDEBAR_WIDTH = 100;

export default function Page() {
  const { quizSession, setQuizSession } = useQuiz();
  const router = useRouter()

  const [leftSidebarWidth, setLeftSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [dragging, setDragging] = useState<string | null>(null);

  const [selectedDivId, setSelectedDivId] = useState<string | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const [nextId, setNextId] = useState<number>(quizSession?.nextId || 0);

  const updateNext = () => {
    setNextId(nextId + 1);
    if(quizSession){
      setQuizSession({ ...quizSession, nextId: nextId+1});
    }
    
  }

  const handleMouseDown = (sidebar: string) => {
    setDragging(sidebar);
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging) return;

    const totalWidth = window.innerWidth;

    if (dragging === 'left') {
      const newWidth = (e.clientX / totalWidth) * 100;
      if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
        setLeftSidebarWidth(newWidth);
      }
    }

    if (dragging === 'right') {
      const newWidth = ((totalWidth - e.clientX) / totalWidth) * 100;
      if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
        setRightSidebarWidth(newWidth);
      }
    }
  };

  const deleteBlock = (id?: string) => {
    if (quizSession && id) {
      const updatedQuiz = (quizSession.quiz as ContainerBlock).copy();

      // Filter out the block with the given id
      updatedQuiz.children = updatedQuiz.children.filter(block => block.id !== id);

      // Update the quiz session
      setQuizSession({ ...quizSession, quiz: updatedQuiz });
    }
  };

  const addBlock = (block: QuizBlock) => {
    if (!quizSession) return;
  
    if (!block.id) {
      block.id = nextId.toString();
    }
  
    const updatedQuiz = (quizSession.quiz as ContainerBlock).copy();
  
    if (!selectedDivId) {
      // If no block is selected, add the new block to the end of the root container's children
      updatedQuiz.children.push(block);
    } else {
      const findAndAddBlock = (container: ContainerBlock): ContainerBlock => {
        const newContainer = container.copy();

        if(container.id === selectedDivId) {
          newContainer.children.push(block);
          return newContainer;
        }
  
        for (let i = 0; i < newContainer.children.length; i++) {
          const child = newContainer.children[i];
  
          if (child.id === selectedDivId) {
              if (child instanceof ContainerBlock) {
                newContainer.children[i] = child.copy();
                (newContainer.children[i] as ContainerBlock).children.push(block);
              } else {
                // Otherwise, add the new container after the selected block
                newContainer.children.splice(i + 1, 0, block);
              }
            return newContainer;
          }
  
          if (child instanceof ContainerBlock) {
            newContainer.children[i] = findAndAddBlock(child);
          }
        }
  
        return newContainer;
      };
  
      const updatedQuizWithNewBlock = findAndAddBlock(updatedQuiz);
      setQuizSession({ ...quizSession, quiz: updatedQuizWithNewBlock });
    }
  
    updateNext();
    
  };
  
  


  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('click', handleDivClick);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('click', handleDivClick);
    };
  }, [dragging]);

  useEffect(() => {
    // If quizData doesn't exist, redirect to the homepage
    if (!quizSession) {
      router.push('/');
    }
  }, [quizSession, router]);


  const handleDivClick = (e: MouseEvent) => {
    if(mainRef.current && mainRef.current.contains(e.target as Node))
      if(!mainRef.current.isEqualNode(e.target as Node))
        setSelectedDivId((e.target as HTMLElement).id);
      else
        setSelectedDivId(null);

    
  };

  const isSelected = (id: string) => selectedDivId === id;

  return (
    <div className="min-h-screen max-h-screen flex flex-col">
      <Header />
      <NavMenu tab="create" />
      <div className="flex flex-grow overflow-hidden">

        <SidePanel Width={`${leftSidebarWidth}%`} Tab='blocks' Position='left' AddBlock={addBlock} 
        Selected={selectedDivId} QuizSession={quizSession} SetQuizSession={setQuizSession}/>


        <DragHandle onMouseDown={() => handleMouseDown('left')}/>


        <main ref={mainRef} className="flex-grow flex center-fix overflow-auto text-nowrap"           
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



