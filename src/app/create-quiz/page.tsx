'use client';

import React, { useState, useEffect, useRef} from 'react';
import Header from '@/components/header';
import NavMenu from '@/components/nav-menu';
import DragHandle from '@/components/drag-handle';
import Accordion from '@/components/accordion';
import Sidebar from '@/components/sidebar';
import SideButton from '@/components/side-button';
import { FaFolderOpen } from "react-icons/fa";

import ContainerComponent from '@/components/quiz_components/container-comp';
import InputComponent from '@/components/quiz_components/variables/input-comp';
import TextComponent from '@/components/quiz_components/info/text-comp';

const MIN_SIDEBAR_WIDTH = 0;
const DEFAULT_SIDEBAR_WIDTH = 20;
const MAX_SIDEBAR_WIDTH = 100;

export default function CreateQuiz() {
  const [leftTab, setLeftTab] = useState<'blocks' | 'settings'>('blocks');
  const [rightTab, setRightTab] = useState<'blocks' | 'settings'>('settings');
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [dragging, setDragging] = useState<string | null>(null);

  const [selectedDivId, setSelectedDivId] = useState<string | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

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


  const handleDivClick = (e: MouseEvent) => {
    if(mainRef.current && mainRef.current.contains(e.target as Node))
      if(!mainRef.current.isEqualNode(e.target as Node))
        setSelectedDivId((e.target as HTMLElement).id);
      else
        setSelectedDivId(null);

    
  };

  const isSelected = (id: string) => selectedDivId === id;

  interface SidebarProps{
    sidebar: 'left'|'right'
  }

  function BlockSideBar({ sidebar }: SidebarProps) {
    const width = sidebar === 'left' ? leftSidebarWidth : rightSidebarWidth;
    const tab = sidebar === 'left' ? leftTab : rightTab;
  
    return (
      <Sidebar width={`${width}%`}>
        <div className="flex flex-row mb-4 items-center w-full">
          <button
            className={`flex-grow p-1 ${tab === 'blocks' ? 'bg-uni-light text-white' : 'bg-uni-black text-uni-grey'}`}
            onClick={() => {
              if (sidebar === 'left') setLeftTab('blocks');
              else setRightTab('blocks');
            }}
          >
            Blocks
          </button>
          <button
            className={`flex-grow p-1 ${tab === 'settings' ? 'bg-uni-light text-white' : 'bg-uni-black text-uni-grey'}`}
            onClick={() => {
              if (sidebar === 'left') setLeftTab('settings');
              else setRightTab('settings');
            }}
          >
            Settings
          </button>
        </div>
  
        <div className={tab === 'blocks' ? '' : 'invisible max-h-0'}>
          <h2 className="text-lg font-bold mb-4 ml-2">Quiz Blocks</h2>

          <SideButton title='Import Group'>
            <FaFolderOpen size="2em" className="p-1" />
          </SideButton>

          <Accordion title="Custom">
            <div className="flex flex-col">
              <button className="w-full text-left p-2 bg-uni-grey text-white rounded mb-2">Import from Json</button>
              <button className="w-full text-left p-2 bg-uni-grey text-white rounded mb-2">New Block</button>
              <button className="w-full text-left p-2 bg-uni-grey text-white rounded">New Variable Field</button>
            </div>
          </Accordion>
          <Accordion title="Templates"></Accordion>
          <Accordion title="Styles"></Accordion>
        </div>
  
        <div className={tab === 'settings' ? '' : 'invisible max-h-0'}>
          <h2 className="text-lg font-bold mb-4 ml-2">Settings</h2>
          <Accordion title="General">
            <div className="flex flex-col">
              <button className="w-full text-left p-2 bg-uni-grey text-white rounded mb-2">Import from Json</button>
              <button className="w-full text-left p-2 bg-uni-grey text-white rounded mb-2">New Block</button>
              <button className="w-full text-left p-2 bg-uni-grey text-white rounded">New Variable Field</button>
            </div>
          </Accordion>
          <Accordion title="Advanced">
            <div className="flex flex-col">
              <button className="w-full text-left p-2 bg-uni-grey text-white rounded mb-2">Import from Json</button>
              <button className="w-full text-left p-2 bg-uni-grey text-white rounded mb-2">New Block</button>
              <button className="w-full text-left p-2 bg-uni-grey text-white rounded">New Variable Field</button>
            </div>
          </Accordion>
          <select className="w-full border border-uni-black bg-uni-light p-2">
            <option value="viewer">Viewer</option>
            <option value="player">Player</option>
            <option value="editor">Editor</option>
          </select>
        </div>
      </Sidebar>
    );
  }
  

  function SettingsSideBar({sidebar}: SidebarProps){
    const width = sidebar==='left'? leftSidebarWidth : rightSidebarWidth;
    const tab = sidebar==='left'? leftTab : rightTab;

    return (
      <Sidebar width={`${width}%`}>  

          <h2 className="text-lg font-bold mb-4 ml-2">Settings</h2>

          <div className='flex flex-row mb-4 items-center w-full'>
            <button
              className={`flex-grow p-1 ${tab === 'blocks' ? 'bg-uni-light text-white' : 'bg-uni-black text-uni-grey'}`}
              onClick={() => {
                if(sidebar==='left')
                  setLeftTab('blocks')
                else setRightTab('blocks')
              }}
            >Blocks</button>
            <button
              className={`flex-grow p-1 ${tab === 'settings' ? 'bg-uni-light text-white' : 'bg-uni-black text-uni-grey'}`}
              onClick={() => {
                if(sidebar==='left')
                  setLeftTab('settings')
                else setRightTab('settings')
              }}
            >Settings</button>
          </div> 
          
          <Accordion title = 'General'>
            <div className="flex flex-col">
              <button className="w-full text-left p-2 bg-uni-grey text-white rounded mb-2">
                Import from Json
              </button>
              <button className="w-full text-left p-2 bg-uni-grey text-white rounded mb-2">
                New Block
              </button>
              <button className="w-full text-left p-2 bg-uni-grey text-white rounded">
                New Variable Field
              </button>
            </div>
          </Accordion>

          <Accordion title = 'Advanced'>
            <div className="flex flex-col">
              <button className="w-full text-left p-2 bg-uni-grey text-white rounded mb-2">
                Import from Json
              </button>
              <button className="w-full text-left p-2 bg-uni-grey text-white rounded mb-2">
                New Block
              </button>
              <button className="w-full text-left p-2 bg-uni-grey text-white rounded">
                New Variable Field
              </button>
            </div>
          </Accordion>

          <select className="w-full border border-uni-black bg-uni-light p-2">
            <option value="viewer">Viewer</option>
            <option value="player">Player</option>
            <option value="editor">Editor</option>
          </select>
        </Sidebar>
    );
  }

  return (
    <div className="min-h-screen max-h-screen flex flex-col">
      <Header />
      <NavMenu />
      <div className="flex flex-grow overflow-hidden">

        <BlockSideBar sidebar='left'/>


        <DragHandle onMouseDown={() => handleMouseDown('left')}/>


        <main ref={mainRef} className="flex-grow flex center-fix overflow-auto text-nowrap"           
          style={{
            width: `calc(100% - ${leftSidebarWidth}% - ${rightSidebarWidth}% - 10px)`, // 10px for the resizers
          }}>

          <ContainerComponent ID="main" ClassName="p-4 border-x border-uni-grey gap-y-4 min-w-96" Selected={selectedDivId} >

            <InputComponent ID="title" Placeholder="Enter Quiz Title" Def="" Font="text-2xl font-bold" Selected={selectedDivId}/>
            
            <TextComponent ID="placeholder" Font="text-uni-grey text-nowrap text-center" ClassName="border border-dashed border-uni-black rounded p-4" Selected={selectedDivId}/>
            
            
            <div className="border border-dashed border-uni-black rounded p-4 flex items-center center-fix">
              <span className="text-uni-grey">+ Add blocks from the left</span>
            </div>
            <button className="bg-uni-blue text-white font-bold py-2 px-4 rounded">Submit</button>


          </ContainerComponent>

        </main>


        <DragHandle onMouseDown={() => handleMouseDown('right')}/>

        <BlockSideBar sidebar='right'/>
      </div>   
    </div> 
  );
};



