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
import { types, VarBlock } from './quiz_components/variables/var-comp';

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
    const [isOn, setIsOn] = useState(false);

    const handleToggle = (newIsOn: boolean) => {
      setIsOn(newIsOn);
    };

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

    const sharedStyle = 'p-2 rounded bg-uni-grey text-white';

    return (
        <Sidebar width={Width}>
          <div className="flex flex-row mb-4 items-center w-full">
            <button
              className={`grow p-1 ${tab === 'blocks' ? 'bg-uni-light text-white' : 'bg-uni-black text-uni-grey'}`}
              onClick={() => {
                setTab('blocks');
              }}
            >
              Blocks
            </button>
            <button
              className={`grow p-1 ${tab === 'settings' ? 'bg-uni-light text-white' : 'bg-uni-black text-uni-grey'}`}
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

                <SideButton title='Variable Block' chosen={false} onClick={() => AddBlock(new VarBlock("", "text"))}>
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
                      className={sharedStyle}
                    />
                    <label className="text-white">Default Text:</label>
                    <input
                      type="text"
                      value={selectedBlock.def}
                      onChange={(e) => handleInputChange('def', e.target.value)}
                      className={sharedStyle}
                    />
                    <label className="text-white">Placeholder:</label>
                    <input
                      type="text"
                      value={selectedBlock.placeholder}
                      onChange={(e) => handleInputChange('placeholder', e.target.value)}
                      className={sharedStyle}
                    />
                    <label className="text-white">Font:</label>
                    <input
                      type="text"
                      value={selectedBlock.font}
                      onChange={(e) => handleInputChange('font', e.target.value)}
                      className={sharedStyle}
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
                      className={sharedStyle}
                    />
                    <label className="text-white">Style:</label>
                    <input
                      type="text"
                      value={selectedBlock.style}
                      onChange={(e) => handleInputChange('style', e.target.value)}
                      className={sharedStyle}
                    />
                    <label className="text-white">Font:</label>
                    <input
                      type="text"
                      value={selectedBlock.font}
                      onChange={(e) => handleInputChange('font', e.target.value)}
                      className={sharedStyle}
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
                      className={sharedStyle}
                    />
                    <label className="text-white">Text:</label>
                    <input
                      type="text"
                      value={selectedBlock.text}
                      onChange={(e) => handleInputChange('text', e.target.value)}
                      className={sharedStyle}
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
                      className={sharedStyle}
                    />
                    <label className="text-white">Rows:</label>
                    <input
                      type="number"
                      value={selectedBlock.rows}
                      onChange={(e) => handleInputChange('rows', e.target.value)}
                      className={sharedStyle}
                    />
                    <label className="text-white">Columns:</label>
                    <input
                      type="number"
                      value={selectedBlock.columns}
                      onChange={(e) => handleInputChange('columns', e.target.value)}
                      className={sharedStyle}
                    />
                  </>
                )}
                {selectedBlock instanceof VarBlock && (
                  <>
                    {/* Common Attributes */}
                    <label className="text-white">Type:</label>
                    <select
                      value={selectedBlock.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className={sharedStyle}
                    >
                      {types.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>

                    <label className="text-white">Value:</label>
                    <input
                      type="text"
                      value={typeof selectedBlock.value === 'boolean' ? String(selectedBlock.value) : selectedBlock.value}
                      onChange={(e) => handleInputChange('value', e.target.value)}
                      className={sharedStyle}
                    />

                    <label className="text-white">Name:</label>
                    <input
                      type="text"
                      value={selectedBlock.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={sharedStyle}
                    />

                    <label className="text-white">Style:</label>
                    <input
                      type="text"
                      value={selectedBlock.style}
                      onChange={(e) => handleInputChange('style', e.target.value)}
                      className={sharedStyle}
                    />

                    {/* Specific Attributes */}
                    {selectedBlock.type === 'select' && !(selectedBlock.options === undefined) && (
                      <>
                        <label className="text-white">Options:</label>
                        <textarea
                          value={selectedBlock.options.join('\n')}
                          onChange={(e) => handleInputChange('options', e.target.value.split('\n'))}
                          className={sharedStyle}
                        />
                      </>
                    )}

                    {(selectedBlock.type === 'text') && (
                      <>
                        <label className="text-white">Max Length:</label>
                        <input
                          type="number"
                          value={selectedBlock.maxlength}
                          onChange={(e) => handleInputChange('maxlength', e.target.value)}
                          className={sharedStyle}
                        />
                        <label className="text-white">Pattern:</label>
                        <input
                          type="text"
                          value={selectedBlock.pattern}
                          onChange={(e) => handleInputChange('pattern', e.target.value)}
                          className={sharedStyle}
                        />
                        <label className="text-white">Placeholder:</label>
                        <input
                          type="text"
                          value={selectedBlock.placeholder}
                          onChange={(e) => handleInputChange('placeholder', e.target.value)}
                          className={sharedStyle}
                        />
                      </>
                    )}

                    {['number', 'range', 'date', 'datetime-local', 'time', 'week', 'month'].includes(selectedBlock.type) && (
                      <>
                        <label className="text-white">Min:</label>
                        <input
                          type="number"
                          value={selectedBlock.min}
                          onChange={(e) => handleInputChange('min', e.target.value)}
                          className={sharedStyle}
                        />
                        <label className="text-white">Max:</label>
                        <input
                          type="number"
                          value={selectedBlock.max}
                          onChange={(e) => handleInputChange('max', e.target.value)}
                          className={sharedStyle}
                        />
                        <label className="text-white">Step:</label>
                        <input
                          type="number"
                          value={selectedBlock.step}
                          onChange={(e) => handleInputChange('step', e.target.value)}
                          className={sharedStyle}
                        />
                      </>
                    )}

                    {['image', 'button', 'submit', 'reset'].includes(selectedBlock.type) && (
                      <>
                        <label className="text-white">Width:</label>
                        <input
                          type="number"
                          value={selectedBlock.width}
                          onChange={(e) => handleInputChange('width', e.target.value)}
                          className={sharedStyle}
                        />
                        <label className="text-white">Height:</label>
                        <input
                          type="number"
                          value={selectedBlock.height}
                          onChange={(e) => handleInputChange('height', e.target.value)}
                          className={sharedStyle}
                        />
                      </>
                    )}

                    {/* Boolean Attributes */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedBlock.required}
                        onChange={(e) => handleInputChange('required', e.target.checked)}
                        className={`mr-2 ${sharedStyle}`}
                      />
                      <label className="text-white">Required</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedBlock.disabled}
                        onChange={(e) => handleInputChange('disabled', e.target.checked)}
                        className={`mr-2 ${sharedStyle}`}
                      />
                      <label className="text-white">Disabled</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedBlock.readonly}
                        onChange={(e) => handleInputChange('readonly', e.target.checked)}
                        className={`mr-2 ${sharedStyle}`}
                      />
                      <label className="text-white">Read Only</label>
                    </div>

                    {/* Tooltip */}
                    <label className="text-white">Tooltip:</label>
                    <input
                      type="text"
                      value={selectedBlock.tooltip}
                      onChange={(e) => handleInputChange('tooltip', e.target.value)}
                      className={sharedStyle}
                    />

                    {/* Central, Neutral, Incomplete */}
                    <label className="text-white">Central:</label>
                    <input
                      type="text"
                      value={selectedBlock.central === false ? '' : selectedBlock.central}
                      onChange={(e) => handleInputChange('central', e.target.value)}
                      className={sharedStyle}
                    />
                    <label className="text-white">Neutral:</label>
                    <input
                      type="text"
                      value={selectedBlock.neutral === false ? '' : selectedBlock.neutral}
                      onChange={(e) => handleInputChange('neutral', e.target.value)}
                      className={sharedStyle}
                    />
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedBlock.incomplete}
                        onChange={(e) => handleInputChange('incomplete', e.target.checked)}
                        className={`mr-2 ${sharedStyle}`}
                      />
                      <label className="text-white">Incomplete</label>
                    </div>
                  </>
                )}
              </div>
            </Accordion>
            <Accordion title="Advanced">
              <div className="flex flex-col">
                <div className="flex-col justify-left items-center gap-y-4">
                  {selectedBlock && (
                    <div className='space-y-4'>
                      <div className='min-w-fit'>
                        <h3 className='font-bold'>Unique ID</h3>
                        <p className='italic'>Unique IDs can be used to refer to a specific block.</p>
                        <div className="border-uni-grey border py-4 px-2 w-full"><p className='bg-uni-grey rounded px-2 py-1'>{selectedBlock.id}</p></div>   
                      </div>

                      <div>
                        <h3 className='font-bold'>Hide</h3>
                        <div className=""><ToggleButton isOn={selectedBlock.hidden} black={true} onToggle={(on: boolean) => {handleToggle; handleInputChange('hidden', !selectedBlock?.hidden);}}/></div>   
                        <p className='italic'>Hide from non-editors</p>
                      </div>
                      
                    </div>)}

                </div>
              </div>
            </Accordion>
          </div>
        </Sidebar>
      );
    };