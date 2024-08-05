import React, { useState, useRef, useEffect } from 'react';
import QuizComponent, {QuizCompProps} from './quiz-comp';


interface ContainerCompProps extends QuizCompProps{
    children?: React.ReactNode
}

const ContainerComponent: React.FC<ContainerCompProps> = ({ID, ClassName, Selected, children}) => {
  return (
    <div 
    id={ID}
    className={`flex flex-col ${ClassName}`}>
        {children}
    </div>
  );
};

export default QuizComponent(ContainerComponent);