import React, { useState, useRef, useEffect } from 'react';
import QuizComponent, {QuizBlock, QuizCompProps, QuizDisplayProps} from './quiz-comp';
import { QuizSession } from '../session-context';


interface ContainerCompProps extends QuizCompProps{
    children?: React.ReactNode
}

interface ContainerDisplayProps extends QuizDisplayProps {
  children?: React.ReactNode
}

export class ContainerBlock extends QuizBlock {
  // if either row/columns is negative, then there's no limit. Both can't be negative.
  rows: number; //m
  columns: number; //n
  
  children: QuizBlock[];

  constructor(id: string, style: string = "", rows: number = 1, columns: number = 1, children: QuizBlock[] = []) {
    super(id, style);
    this.rows = rows;
    this.columns = columns;
    this.children = children;
  }

  asComp(selectedDiv:string|null, deleteHandler: (id?: string) => void,
  quizSession: Readonly<QuizSession | null>, setQuizSession: (data: QuizSession | null) => void): React.JSX.Element {
    return (
      <ContainerComponent ID={this.id} ClassName={this.style} Selected={selectedDiv} Delete={deleteHandler}  QuizSession={quizSession} SetQuizSession={setQuizSession}>
        {this.children.map(child =>(
          child.asComp(selectedDiv, deleteHandler, quizSession, setQuizSession)
        ))}
      </ContainerComponent>);
  }

  asDisplay() {
    return (
    <ContainerDisplay ID={this.id} ClassName={this.style}> 
      {this.children.map(child =>(
        (!child.hidden) && child.asDisplay()
      ))}
    </ContainerDisplay>);
  }

  copy() { 
    return new ContainerBlock(this.id, this.style, this.rows, this.columns, this.children);
  }

  changeProps(prop: string, value: any): ContainerBlock {
    return new ContainerBlock(this.id,
       prop === 'style' ? value : this.style,
       prop === 'rows' ? value : this.rows,
       prop === 'columns' ? value : this.columns,
      this.children);
  }
}

const ContainerComp: React.FC<ContainerCompProps> = ({ID, ClassName, children}) => {
  return (
    <div 
    id={ID}
    className={`flex flex-col border-uni-grey border min-h-5 w-full ${ClassName==='' ? 'gap-y-1 m-2' : ClassName}`}
    >
        {children}
    </div>
  );
};

const ContainerComponent = QuizComponent(ContainerComp);
export default ContainerComponent;


const ContainerDisplay: React.FC<ContainerDisplayProps> = ({ID, ClassName, children}) => {

  return (
    <div 
    id={ID}
    className={`flex flex-col border-uni-grey border min-h-5 w-full ${ClassName==='' ? 'gap-y-1 m-2' : ClassName}`}>
      {children}
    </div>
  );
};