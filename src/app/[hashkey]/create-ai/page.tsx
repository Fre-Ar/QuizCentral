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

import { FaCog, FaCodeBranch, FaCss3Alt } from "react-icons/fa";

import InputComponent from '@/components/quiz_components/variables/input-comp';
import TextComponent from '@/components/quiz_components/info/text-comp';

const MIN_SIDEBAR_WIDTH = 0;
const DEFAULT_SIDEBAR_WIDTH = 20;
const MAX_SIDEBAR_WIDTH = 100;

export default function Page() {
  const { quizSession, setQuizSession } = useQuiz();
  const router = useRouter()

  const [leftTab, setLeftTab] = useState<'settings' | 'conditions' | 'styling'>('settings');
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [dragging, setDragging] = useState<string | null>(null);

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
  };


  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging]);

  useEffect(() => {
    // If quizData doesn't exist, redirect to the homepage
    if (!quizSession) {
      router.push('/');
    }
  }, [quizSession, router]);

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



        </main>
      </div>   
    </div> 
  );
};



