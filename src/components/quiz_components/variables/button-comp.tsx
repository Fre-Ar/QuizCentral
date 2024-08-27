import React, { useState, useRef, useEffect } from 'react';
import QuizComponent, {QuizBlock, QuizCompProps, QuizDisplayProps}  from '../quiz-comp';
import { QuizSession } from '@/components/session-context';


interface ButtonCompProps extends QuizCompProps{
    Text?: string
}

interface ButtonDisplayProps extends QuizDisplayProps {
  Text?: string
}

export class ButtonBlock extends QuizBlock{
  text: string

   constructor(id: string, style: string = "", text: string = "", hidden:boolean=false) {
    super(id, style, hidden);
    this.text = text;
  }

  asComp(selectedDiv: string | null, deleteHandler: (id?: string) => void,
  quizSession: Readonly<QuizSession | null>, setQuizSession: (data: QuizSession | null) => void): React.JSX.Element {
    return (<ButtonComponent ID={this.id} ClassName={this.style} Text={this.text} 
      Selected={selectedDiv} Delete={deleteHandler} QuizSession={quizSession} SetQuizSession={setQuizSession}/>);
  }

  asDisplay() {
    return (<ButtonDisplay ID={this.id} ClassName={this.style} Text={this.text}/>);
  };

  changeProps(prop: string, value: any): ButtonBlock {
    return new ButtonBlock(this.id,
       prop === 'style' ? value : this.style,
       prop === 'text' ? value : this.text,
       prop === 'hidden' ? value : this.hidden);
  }

}


const ButtonComp: React.FC<ButtonCompProps> = ({ID, ClassName, Text}) => {

  return (
    <button
        id={ID}
        type="button"
        className={`bg-uni-blue text-white font-bold py-2 px-4 rounded w-full ${ClassName}`}
    >{Text}</button>
  );
};

const ButtonComponent =  QuizComponent(ButtonComp);
export default ButtonComponent;

const ButtonDisplay: React.FC<ButtonDisplayProps> = ({ID, ClassName, Text}) => {

  return (
    <button
        id={ID}
        type="button"
        className={`bg-uni-blue text-white font-bold py-2 px-4 rounded w-full ${ClassName}`}
    >{Text}</button>
  );
};