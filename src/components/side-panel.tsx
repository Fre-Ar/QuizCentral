import React, {useState, useEffect} from 'react';

import Accordion from '@/components/accordion';
import Sidebar from '@/components/sidebar';
import SideButton from '@/components/side-button';
import { FaFolderOpen, FaPlus } from "react-icons/fa";
import { QuizBlock } from './quiz_components/quiz-comp';
import { ContainerBlock } from './quiz_components/container-comp';
import { InputBlock } from './quiz_components/variables/input-comp';
import { TextBlock } from './quiz_components/info/text-comp';
import { ButtonBlock } from './quiz_components/variables/button-comp';
import { QuizSession } from './session-context';
import ToggleButton from './toggle-button';

interface SidePanelProps{
    Position: 'left'|'right',
    Width: string,
    Tab: 'blocks'|'settings',
    AddBlock: (block: QuizBlock) => void
    Selected?: string|null
    QuizSession?: Readonly<QuizSession | null>
    SetQuizSession?: (data: QuizSession | null) => void
  }

export default function SidePanel({ Position, Width, Tab, AddBlock, Selected, QuizSession, SetQuizSession }: SidePanelProps) {
    const [tab, setTab] = useState<'blocks' | 'settings'>(Tab);
    const [selectedBlock, setSelectedBlock] = useState<QuizBlock | null>(null);

    // Update selectedBlock whenever Selected changes
    useEffect(() => {
      if (QuizSession && Selected) {
        const findBlock = (block: QuizBlock): QuizBlock | null => {
          if (block.id === Selected) {
            return block;
          }
          if (block instanceof ContainerBlock) {
            for (const child of block.children) {
              const found = findBlock(child);
              if (found) return found;
            }
          }
          return null;
        };

        const block = findBlock(QuizSession.quiz);
        setSelectedBlock(block);
      } else {
        setSelectedBlock(null);
      }
    }, [QuizSession, Selected]);


    const handleInputChange = (field: string, value: any) => {
      if (selectedBlock && QuizSession && SetQuizSession) {
        let updatedBlock: QuizBlock;


        updatedBlock = selectedBlock.changeProps(field, value);
  
        const updateBlock = (block: QuizBlock): QuizBlock => {
          if (block.id === selectedBlock.id) {
            return updatedBlock;
          }
          if (block instanceof ContainerBlock) {
            const updated = (block as ContainerBlock).copy();
            let inside: QuizBlock[] = (updated as ContainerBlock).children.map(child => updateBlock(child));
            updated.children = inside;
            return updated;
          }
          return block;
        };
  
        const updatedQuiz = updateBlock(QuizSession.quiz);
  
        SetQuizSession({ ...QuizSession, quiz: updatedQuiz });
        setSelectedBlock(updatedBlock);
      }
    };

    return (
        <Sidebar width={Width}>
          <div className="flex flex-row mb-4 items-center w-full">
            <button
              className={`flex-grow p-1 ${tab === 'blocks' ? 'bg-uni-light text-white' : 'bg-uni-black text-uni-grey'}`}
              onClick={() => {
                setTab('blocks');
              }}
            >
              Blocks
            </button>
            <button
              className={`flex-grow p-1 ${tab === 'settings' ? 'bg-uni-light text-white' : 'bg-uni-black text-uni-grey'}`}
              onClick={() => {
                setTab('settings');
              }}
            >
              Settings
            </button>
          </div>

        {/*------------ BLOCKS TAB HERE ------------*/}
    
          <div className={tab === 'blocks' ? '' : 'invisible h-0 overflow-hidden'}>
            <h2 className="text-lg font-bold mb-4 ml-2">Quiz Blocks</h2>
  
            <Accordion title="Custom">
              <div className="flex flex-col gap-y-2">

                <SideButton title='Import from JSON' chosen={false}>
                  <FaFolderOpen size="2em" className="p-1" />
                </SideButton>

              </div>
            </Accordion>

            <Accordion title="Basic Blocks">
              <div className="flex flex-col gap-y-2">

                <SideButton title='Container Block' chosen={false} onClick={() => AddBlock(new ContainerBlock(""))}>
                  <FaPlus size="2em" className="p-1" />
                </SideButton>

                <SideButton title='Input Block' chosen={false} onClick={() => AddBlock(new InputBlock(""))}>
                  <FaPlus size="2em" className="p-1" />
                </SideButton>

                <SideButton title='Info Block' chosen={false} onClick={() => AddBlock(new TextBlock(""))}>
                  <FaPlus size="2em" className="p-1" />
                </SideButton>

              </div>
            </Accordion>

            <Accordion title="Templates">
              <div className="flex flex-col gap-y-2">
                <SideButton title='Button Block' chosen={false} onClick={() => AddBlock(new ButtonBlock(""))}>
                  <FaPlus size="2em" className="p-1" />
                </SideButton>
              </div>
            </Accordion>
            
            <Accordion title="Styles"></Accordion>
          </div>


        {/*------------ SETTINGS TAB HERE ------------*/}

    
          <div className={tab === 'settings' ? '' : 'invisible h-0  overflow-hidden'}>
            <h2 className="text-lg font-bold mb-4 ml-2">Settings</h2>
            <Accordion title="General">
              <div className="flex flex-col gap-y-2">
                {selectedBlock instanceof InputBlock && (
                  <>
                    <label className="text-white">Style:</label>
                    <input
                      type="text"
                      value={selectedBlock.style}
                      onChange={(e) => handleInputChange('style', e.target.value)}
                      className="p-2 rounded bg-uni-light text-white"
                    />
                    <label className="text-white">Default Text:</label>
                    <input
                      type="text"
                      value={selectedBlock.def}
                      onChange={(e) => handleInputChange('def', e.target.value)}
                      className="p-2 rounded bg-uni-light text-white"
                    />
                    <label className="text-white">Placeholder:</label>
                    <input
                      type="text"
                      value={selectedBlock.placeholder}
                      onChange={(e) => handleInputChange('placeholder', e.target.value)}
                      className="p-2 rounded bg-uni-light text-white"
                    />
                    <label className="text-white">Font:</label>
                    <input
                      type="text"
                      value={selectedBlock.font}
                      onChange={(e) => handleInputChange('font', e.target.value)}
                      className="p-2 rounded bg-uni-light text-white"
                    />
                  </>
                )}
                {selectedBlock instanceof TextBlock && (
                  <>
                    <label className="text-white">Text:</label>
                    <input
                      type="text"
                      value={selectedBlock.text}
                      onChange={(e) => handleInputChange('text', e.target.value)}
                      className="p-2 rounded bg-uni-light text-white"
                    />
                    <label className="text-white">Style:</label>
                    <input
                      type="text"
                      value={selectedBlock.style}
                      onChange={(e) => handleInputChange('style', e.target.value)}
                      className="p-2 rounded bg-uni-light text-white"
                    />
                    <label className="text-white">Font:</label>
                    <input
                      type="text"
                      value={selectedBlock.font}
                      onChange={(e) => handleInputChange('font', e.target.value)}
                      className="p-2 rounded bg-uni-light text-white"
                    />
                  </>
                )}
                {selectedBlock instanceof ButtonBlock && (
                  <>
                    <label className="text-white">Style:</label>
                    <input
                      type="text"
                      value={selectedBlock.style}
                      onChange={(e) => handleInputChange('style', e.target.value)}
                      className="p-2 rounded bg-uni-light text-white"
                    />
                    <label className="text-white">Text:</label>
                    <input
                      type="text"
                      value={selectedBlock.text}
                      onChange={(e) => handleInputChange('text', e.target.value)}
                      className="p-2 rounded bg-uni-light text-white"
                    />
                  </>
                )}
                {selectedBlock instanceof ContainerBlock && (
                  <>
                    <label className="text-white">Style:</label>
                    <input
                      type="text"
                      value={selectedBlock.style}
                      onChange={(e) => handleInputChange('style', e.target.value)}
                      className="p-2 rounded bg-uni-light text-white"
                    />
                    <label className="text-white">Rows:</label>
                    <input
                      type="number"
                      value={selectedBlock.rows}
                      onChange={(e) => handleInputChange('rows', e.target.value)}
                      className="p-2 rounded bg-uni-light text-white"
                    />
                    <label className="text-white">Columns:</label>
                    <input
                      type="number"
                      value={selectedBlock.columns}
                      onChange={(e) => handleInputChange('columns', e.target.value)}
                      className="p-2 rounded bg-uni-light text-white"
                    />
                  </>
                )}
              </div>
            </Accordion>
            <Accordion title="Advanced">
              <div className="flex flex-col">
                <div className="flex-col justify-left items-center gap-y-4">
                  {selectedBlock && (<>
                    <h3 className='font-bold'>Hide</h3>
                    <div className=""><ToggleButton initialOn={selectedBlock?.hidden} black={true} onToggle={() => handleInputChange('hidden', !selectedBlock?.hidden)}/></div>   
                    <p className='italic'>Hide from non-editors</p>
                  </>)}

                </div>
              </div>
            </Accordion>
          </div>
        </Sidebar>
      );
    };