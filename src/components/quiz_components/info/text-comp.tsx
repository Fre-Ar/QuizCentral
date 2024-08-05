import React, { useState, useRef, useEffect } from 'react';
import QuizComponent, {QuizCompProps}  from '../quiz-comp';



interface TextCompProps extends QuizCompProps{
    Font: string
}

const TextComponent: React.FC<TextCompProps> = ({ID, ClassName, Selected, Font}) => {
  const [text, setText] = useState(`Text`);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };
  return (
    <input
      id={ID}
      type="text"
      value={text}
      onChange={handleTextChange}
      className={`${Font} pl-2 w-full focus:outline-none ${ClassName}`}
    />
  );
};

export default QuizComponent(TextComponent);