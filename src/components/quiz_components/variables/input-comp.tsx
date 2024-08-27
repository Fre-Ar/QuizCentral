import React, { useState, useRef, useEffect } from 'react';
import QuizComponent, {QuizBlock, QuizCompProps, QuizDisplayProps}  from '../quiz-comp';
import { ContainerBlock } from '../container-comp';
import { QuizSession } from '@/components/session-context';


interface InputCompProps extends QuizCompProps{
    Def: string //default text
    Placeholder: string
    Font: string
}

interface InputDisplayProps extends QuizDisplayProps {
  Def: string //default text
  Placeholder: string
  Font: string
}


export class InputBlock extends QuizBlock {
  def: string //default text
  placeholder: string
  font: string
  
  constructor(id: string, style: string = "", def: string = "", placeholder: string = "", font: string = "", hidden:boolean=false) {
    super(id, style, hidden);
    this.def = def;
    this.placeholder = placeholder;
    this.font = font;
  }

  asComp(selectedDiv:string|null, deleteHandler: (id?: string) => void,
  quizSession: Readonly<QuizSession | null>, setQuizSession: (data: QuizSession | null) => void): React.JSX.Element {
    return (<InputComponent ID={this.id} ClassName={this.style} Def={this.def} Placeholder={this.placeholder} Font={this.font}
       Selected={selectedDiv} Delete={deleteHandler} QuizSession={quizSession} SetQuizSession={setQuizSession}/>);
  }

  asDisplay() {
    return (<InputDisplay ID={this.id} ClassName={this.style} Def={this.def} Placeholder={this.placeholder} Font={this.font}/>);
  };

  changeProps(prop: string, value: any): InputBlock {
    return new InputBlock(this.id,
       prop === 'style' ? value : this.style,
       prop === 'def' ? value : this.def,
       prop === 'placeholder' ? value : this.placeholder,
       prop === 'font' ? value : this.font,
       prop === 'hidden' ? value : this.hidden);
  }
}

const InputComp: React.FC<InputCompProps> = ({ID, ClassName, Def, Placeholder, Font, SetQuizSession, QuizSession}) => {
  const [text, setText] = useState(`${Def}`);

  
  useEffect(() => {
    setText(Def);
}, [Def]);

const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setText(newText);

    // Update the quiz session's quiz block with the same ID
    if (QuizSession && SetQuizSession) {
        const updatedQuiz = (QuizSession.quiz as ContainerBlock).copy();

        // Assuming quiz is a container of blocks and we are searching for the block with the given ID
        const updateBlock = (block: QuizBlock) => {
            if (block.id === ID && block instanceof InputBlock) {
                block.def = newText; // Update the 'def' property
            }
        };

        // Function to recursively update the block
        const recursiveUpdate = (block: QuizBlock) => {
            updateBlock(block);
            if (block instanceof ContainerBlock) {
                block.children.forEach(recursiveUpdate);
            }
        };

        recursiveUpdate(updatedQuiz);

        SetQuizSession({
            ...QuizSession,
            quiz: updatedQuiz,
        });
    }
};

  return (
    <input
      id={ID}
      type="text"
      value={text}
      onChange={handleTextChange}
      className={`${Font} pl-2 w-full border-2 border-uni-black rounded focus:outline-none ${ClassName}`}
      placeholder={Placeholder}
    />
  );
};

const InputComponent = QuizComponent(InputComp);
export default InputComponent;


const InputDisplay: React.FC<InputDisplayProps> = ({ID, ClassName, Def, Placeholder, Font}) => {
  const [text, setText] = useState(`${Def}`);
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  return (
    <input
      id={ID}
      type="text"
      value={text}
      onChange={handleTextChange}
      className={`${Font} pl-2 w-full border-2 border-uni-black rounded focus:outline-none ${ClassName}`}
      placeholder={Placeholder}
    />
  );
};