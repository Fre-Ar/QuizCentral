import React, { useState, useRef, useEffect } from 'react';
import QuizComponent, {QuizCompProps}  from '../quiz-comp';


interface InputCompProps extends QuizCompProps{
    Def: string //default text
    Placeholder: string
    Font: string
}

const InputComponent: React.FC<InputCompProps> = ({ID, ClassName, Def, Placeholder, Font, Selected}) => {
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

export default QuizComponent(InputComponent);