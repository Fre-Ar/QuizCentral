'use client';

import React, { useState, useEffect, useRef} from 'react';

import Header from '@/components/header';
import NavMenu from '@/components/nav-menu';
import DragHandle from '@/components/drag-handle';
import Sidebar from '@/components/sidebar';
import SideButton from '@/components/side-button';
import { parseQuizData, downloadQuizSession } from '@/lib/utils';

import { FaCog, FaCodeBranch, FaCss3Alt, FaFolder, FaDatabase } from "react-icons/fa";

import { promptFileUpload } from '@/lib/utils';
import { QuizSession } from '@/components/session-context';
import { useDragging } from '@/hooks/resizing';
import { useQuizSession } from '@/hooks/quiz';
import { saveQuizToSupabase } from '@/lib/utils';

export default function Page() {
  const  {quizSession, setQuizSession} = useQuizSession();
  const { leftSidebarWidth,  rightSidebarWidth,  selectedDivId, mainRef, handleMouseDown } = useDragging();

  const [leftTab, setLeftTab] = useState<'settings' | 'conditions' | 'styling'>('settings');

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    quizSession && setQuizSession({ ...quizSession, settings: { ...quizSession.settings, quizSettings: { ...quizSession.settings.quizSettings, title: e.target.value } } });

  const handleAllowBackChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    quizSession && setQuizSession({ ...quizSession, settings: { ...quizSession.settings, quizSettings: { ...quizSession.settings.quizSettings, allowBack: e.target.checked } } });

  const handleAutoCreatePagesChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    quizSession && setQuizSession({ ...quizSession, settings: { ...quizSession.settings, quizSettings: { ...quizSession.settings.quizSettings, blocksPerPage: e.target.checked ? (quizSession.settings.quizSettings.blocksPerPage || 5) : false } } });

  const handleBlocksPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    quizSession && setQuizSession({ ...quizSession, settings: { ...quizSession.settings, quizSettings: { ...quizSession.settings.quizSettings, blocksPerPage: e.target.valueAsNumber } } });

  const handlePromptFileUpload = () => {
    promptFileUpload(setQuizSession);
  };
  
  return (
    <div className="min-h-screen max-h-screen flex flex-col">
      <Header />
      <NavMenu tab="settings"/>
      <div className="flex grow overflow-hidden">


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
        <SideButton title='Import Quiz Session' chosen={false}  onClick={handlePromptFileUpload}>
            <FaFolder size="2em" className="p-1" />
        </SideButton>
        <SideButton title='Commit Changes to Database' chosen={false}  onClick={() => {if(quizSession) saveQuizToSupabase(quizSession)}}>
            <FaDatabase size="2em" className="p-1" />
        </SideButton>
        
      </Sidebar>


        <DragHandle onMouseDown={() => handleMouseDown('left')}/>


        <main className="grow flex center-fix overflow-auto text-nowrap"           
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





