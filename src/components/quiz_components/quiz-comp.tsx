import React, { ReactNode } from 'react';
import { FaTrash } from "react-icons/fa";
import { QuizSession } from '../session-context';


export interface QuizCompProps {
    ID?: string
    ClassName?: string
    Selected?: string|null
    Delete: (id?: string) => void
    QuizSession?: Readonly<QuizSession | null>
    SetQuizSession?: (data: QuizSession | null) => void
}

export interface QuizDisplayProps {
  ID: string
  ClassName: string
}

export abstract class QuizBlock {
  id: string;
  style: string;
  hidden: boolean;

  constructor(id: string, style: string = "", hidden: boolean=false) {
    this.id = id;
    this.style = style;
    this.hidden = hidden;
  }

  asString() {
    return this.id;
  }

  abstract asComp(selectedDiv: string|null, deleteHandler: (id?: string) => void,
   quizSession: Readonly<QuizSession | null>, setQuizSession: (data: QuizSession | null) => void): React.JSX.Element;

  abstract asDisplay(): React.JSX.Element;

  abstract changeProps(prop: string, value: any): QuizBlock;
}

export default function QuizComponent<T extends QuizCompProps>(WrappedComponent: React.ComponentType<T>) {
  return (props: T) => {
    const {ID, ClassName, Selected, Delete, QuizSession, SetQuizSession,  ...rest } = props;
    return (
      <div className="relative flex flex-row">
        <WrappedComponent ID={ID}  ClassName={`${ClassName} ${Selected==ID? 'border-uni-selec' : ''}`} 
        Selected={Selected} QuizSession={QuizSession} SetQuizSession={SetQuizSession} {...(rest as T)} />
        <span className="absolute right-0 transform translate-x-full"
              style={{ top: `calc((100% - 2em)/2)`}}> 
          {Selected==ID && ID!="main" && 
            <button 
              className="ml-2"
              onClick = {() => Delete(ID)}
              >
              <FaTrash className="text-white bg-uni-red rounded p-1" size="2em"/>
            </button>}
        </span>
        {/*Selected==ID && ID!="main" && <span className="ml-1 text-red-500 text-2xl text">*</span>*/}
      </div>
    );   
  };
}
