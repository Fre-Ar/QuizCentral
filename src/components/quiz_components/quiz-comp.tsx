import React, { ReactNode } from 'react';
import { FaTrash } from "react-icons/fa";


export interface QuizCompProps {
    ID?: string
    ClassName?: string
    Selected?: string|null
}

export default function QuizComponent<T extends QuizCompProps>(WrappedComponent: React.ComponentType<T>) {
  return (props: T) => {
    const {ID, ClassName, Selected, ...rest } = props;
    return (
      <div className="flex flex-row">
      <WrappedComponent ClassName={`${ClassName} ${Selected==ID? 'border-uni-selec' : ''}`} Selected={Selected} ID={ID} {...(rest as T)} />
      <span className=""> {Selected==ID && ID!="main" && <button className="bg-uni-red"><FaTrash /></button>}</span>
      {/*Selected==ID && ID!="main" && <span className="ml-1 text-red-500 text-2xl text">*</span>*/}
      </div>
    );   
  };
}
