'use client';

import React, { useState, useEffect, useRef} from 'react';
import { useQuiz } from '@/components/session-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

import Header from '@/components/header';
import NavMenu from '@/components/nav-menu';
import DragHandle from '@/components/drag-handle';
import Accordion from '@/components/accordion';
import Sidebar from '@/components/sidebar';
import SideButton from '@/components/side-button';

import { FaCog, FaCodeBranch, FaCss3Alt, FaFolder, FaDatabase } from "react-icons/fa";

import InputComponent, {InputBlock} from '@/components/quiz_components/variables/input-comp';
import TextComponent, {TextBlock} from '@/components/quiz_components/info/text-comp';
import { ButtonBlock } from '@/components/quiz_components/variables/button-comp';
import { ContainerBlock } from '@/components/quiz_components/container-comp';
import { QuizSession } from '@/components/session-context';
import { QuizBlock } from '@/components/quiz_components/quiz-comp';


const MIN_SIDEBAR_WIDTH = 0;
const DEFAULT_SIDEBAR_WIDTH = 20;
const MAX_SIDEBAR_WIDTH = 100;

export function downloadQuizSession(quizSession: any, filename: string = 'quizSession.json') {
  // Convert the quizSession object to a JSON string
  const jsonString = JSON.stringify(quizSession, null, 2); // Pretty-print JSON with 2 spaces
  
  // Create a Blob from the JSON string
  const blob = new Blob([jsonString], { type: 'application/json' });
  
  // Create a link element
  const link = document.createElement('a');
  
  // Set the download attribute with a filename
  link.download = filename;
  
  // Create a URL for the Blob and set it as the href attribute
  link.href = URL.createObjectURL(blob);
  
  // Append the link to the body (it won't be visible)
  document.body.appendChild(link);
  
  // Programmatically click the link to trigger the download
  link.click();
  
  // Remove the link from the document
  document.body.removeChild(link);
}

// Function to identify the type of QuizBlock and instantiate it accordingly
const parseQuizBlock = (block: any): QuizBlock => {
  if ('children' in block && Array.isArray(block.children)) {
    // Recursively parse children
    const children = block.children.map(parseQuizBlock);
    return new ContainerBlock(block.id, block.style || '', block.rows || 1, block.columns || 1, children);
  } else if (block.id === 'submit') {
    return new ButtonBlock(block.id, block.style || '', block.text || '');
  } else if ('text' in block && typeof block.text === 'string') {
    return new TextBlock(block.id, block.style || '', block.font || '', block.text);
  } else if ('def' in block && typeof block.def === 'string') {
    return new InputBlock(block.id, block.style || '', block.def, block.placeholder || '', block.font || '');
  }  else {
    throw new Error('Unknown block type');
  }
};

// Function to parse the quiz data
export const parseQuizData = (json: any): QuizSession | null => {
  if (
    json &&
    typeof json === 'object' &&
    typeof json.hash === 'string' &&
    typeof json.quiz === 'object' &&
    Array.isArray(json.groups) &&
    Array.isArray(json.custom) &&
    typeof json.settings === 'object'
  ) {
    try {
      const parsedQuiz = parseQuizBlock(json.quiz); // Parse the main quiz block
      return {
        ...json,
        quiz: parsedQuiz,
      };
    } catch (error) {
      console.error('Error parsing quiz blocks:', error);
      return null;
    }
  }
  return null;
};

export default function Page() {
  const { quizSession, setQuizSession } = useQuiz();
  const router = useRouter()

  const [leftTab, setLeftTab] = useState<'settings' | 'conditions' | 'styling'>('settings');
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [dragging, setDragging] = useState<string | null>(null);

  const saveQuizToSupabase = async (quizSession: QuizSession) => {
    try {

      // Insert the quiz into the quizzes table if it doesn't already exist
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .upsert({ hash: quizSession.hash, quiz_data: quizSession }, { onConflict: 'hash' })
        .select('id');

      if (quizError) throw quizError;

      document.cookie = `quizHash=${quizSession?.hash}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;

      alert(`Quiz "${quizSession.settings.quizSettings.title}" saved successfully!`);
    } catch (error) {
      console.error('Error saving launched group and users:', error);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    quizSession && setQuizSession({ ...quizSession, settings: { ...quizSession.settings, quizSettings: { ...quizSession.settings.quizSettings, title: e.target.value } } });

  const handleAllowBackChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    quizSession && setQuizSession({ ...quizSession, settings: { ...quizSession.settings, quizSettings: { ...quizSession.settings.quizSettings, allowBack: e.target.checked } } });

  const handleAutoCreatePagesChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    quizSession && setQuizSession({ ...quizSession, settings: { ...quizSession.settings, quizSettings: { ...quizSession.settings.quizSettings, blocksPerPage: e.target.checked ? (quizSession.settings.quizSettings.blocksPerPage || 5) : false } } });

  const handleBlocksPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    quizSession && setQuizSession({ ...quizSession, settings: { ...quizSession.settings, quizSettings: { ...quizSession.settings.quizSettings, blocksPerPage: e.target.valueAsNumber } } });





  // Function to handle the file upload and parse the JSON
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          const parsedQuizSession = parseQuizData(json);
          if (parsedQuizSession) {
            setQuizSession(parsedQuizSession); // Set the quiz session if valid
            alert('Quiz session successfully loaded.');
          } else {
            alert('Invalid quiz session format.');
          }
        } catch (error) {
          alert('Error reading JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Function to prompt file upload
  const promptFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => handleFileUpload(e as unknown as React.ChangeEvent<HTMLInputElement>);
    input.click();
  };
  

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
      <NavMenu tab="settings"/>
      <div className="flex flex-grow overflow-hidden">


      <Sidebar width={`${leftSidebarWidth}%`}>
        <SideButton title='Settings' chosen={leftTab==='settings'} onClick={() => setLeftTab('settings')}>
            <FaCog size="2em" className="p-1" />
        </SideButton>
        <SideButton title='Conditions' chosen={leftTab==='conditions'} onClick={() => setLeftTab('conditions')}>
            <FaCodeBranch size="2em" className="p-1" />
        </SideButton>
        <SideButton title='Global Styling' chosen={leftTab==='styling'} onClick={() => setLeftTab('styling')}>
            <FaCss3Alt size="2em" className="p-1" />
        </SideButton>
        <SideButton title='Import Quiz Session' chosen={false}  onClick={promptFileUpload}>
            <FaFolder size="2em" className="p-1" />
        </SideButton>
        <SideButton title='Commit Changes to Database' chosen={false}  onClick={() => {if(quizSession) saveQuizToSupabase(quizSession)}}>
            <FaDatabase size="2em" className="p-1" />
        </SideButton>
        
      </Sidebar>


        <DragHandle onMouseDown={() => handleMouseDown('left')}/>


        <main className="flex-grow flex center-fix overflow-auto text-nowrap"           
          style={{
            width: `calc(100% - ${leftSidebarWidth}%  - 5px)`, // 5px for the resizer
          }}>
            <div className="flex flex-col border-x border-uni-grey mx-4 p-4 gap-y-4 ">
              <span className="flex flex-row w-full gap-x-24 items-center">
                <span className="flex flex-row w-full gap-x-2 items-center">
                  <FaCog size="4em" className="text-white bg-uni-grey rounded p-2"/>
                  <div className="">
                    <h3 className="font-bold">
                      {leftTab === 'settings' ? "Settings" : ''}
                      {leftTab === 'conditions' ? "Conditions" : ''}
                      {leftTab === 'styling' ? "Global Styling" : ''}</h3>
                    <p className="text-xs">
                      {leftTab === 'settings' ? "Customize quiz properties." : ''}
                      {leftTab === 'conditions' ? "Add conditional logic to the quiz." : ''}
                      {leftTab === 'styling' ? "Customize the default look of the quiz." : ''}</p>
                  </div>
                </span>
                <div>
                  <h3 className="font-bold">Quiz Session Id: {quizSession?.hash}</h3>
                  <button className="bg-uni-blue w-full text-white py-2 px-4 rounded" onClick={() => downloadQuizSession(quizSession, quizSession?.settings.quizSettings.title)}>Export as JSON</button>
                </div>
              </span>
              <div>
                <div className="border-uni-grey border-2 p-4">
                  <h3 className="font-bold text-lg">Title</h3>
                  <p className="text-sm text-gray-300">Enter a name for your quiz.</p>
                  <input
                    type="text"
                    value={quizSession?.settings.quizSettings.title || ''}
                    onChange={handleTitleChange}
                    className="mt-2 p-2 w-full border-2 border-uni-black rounded focus:outline-none"
                    placeholder="Quiz Title"
                  />
                </div>

                <div className="border-uni-grey border-2 p-4">
                  <h3 className="font-bold text-lg">Blocks per page</h3>
                  <p className="text-sm text-gray-300">Automatically create new pages after the chosen number of blocks.</p>
                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      checked={quizSession?.settings.quizSettings.blocksPerPage !== false}
                      onChange={handleAutoCreatePagesChange}
                      className="mr-2 form-checkbox text-uni-red focus:ring-0"
                    />
                    <label className="mr-4">Auto-create pages</label>
                    {quizSession?.settings.quizSettings.blocksPerPage !== false && (
                      <input
                        type="number"
                        min={1}
                        max={50}
                        step={1}
                        value={quizSession?.settings.quizSettings.blocksPerPage || 5}
                        onChange={handleBlocksPerPageChange}
                        className="p-2 w-16 border-2 border-uni-black rounded focus:outline-none"
                      />
                    )}
                  </div>
                </div>

                <div className="border-uni-grey border-2 p-4">
                  <h3 className="font-bold text-lg">Use back button</h3>
                  <p className="text-sm text-gray-300">Allow users to return to previous quiz pages.</p>
                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      checked={quizSession?.settings.quizSettings.allowBack || false}
                      onChange={handleAllowBackChange}
                      className="mr-2 form-checkbox text-uni-red focus:ring-0"
                    />
                    <label>Allow back button</label>
                  </div>
                </div>
              </div>
            </div>
        </main>
      </div>   
    </div> 
  );
};



