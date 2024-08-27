import React, { useState, useRef, useEffect } from 'react';
import QuizComponent, {QuizBlock, QuizCompProps, QuizDisplayProps}  from '../quiz-comp';
import { QuizSession } from '@/components/session-context';
import { ContainerBlock } from '../container-comp';



interface TextCompProps extends QuizCompProps{
  Font: string
  Text: string
}

interface TextDisplayProps extends QuizDisplayProps {
  Font: string
  Text: string
}

export class TextBlock extends QuizBlock{
  font: string
  text: string

  constructor(id: string, style: string = "", font: string = "", text: string="", hidden:boolean=false) {
    super(id, style, hidden);
    this.font = font;
    this.text = text;
  }

  asComp(selectedDiv:string|null, deleteHandler: (id?: string) => void,
  quizSession: Readonly<QuizSession | null>, setQuizSession: (data: QuizSession | null) => void): React.JSX.Element {
    return (<TextComponent ID={this.id} ClassName={this.style} Font={this.font} Text={this.text}
      Selected={selectedDiv} Delete={deleteHandler} QuizSession={quizSession} SetQuizSession={setQuizSession}/>);
  };

  asDisplay() {
    return (<TextDisplay ID={this.id} ClassName={this.style} Font={this.font} Text={this.text}/>);
  };

  changeProps(prop: string, value: any): TextBlock {
    return new TextBlock(this.id,
       prop === 'style' ? value : this.style,
       prop === 'font' ? value : this.font,
       prop === 'text' ? value : this.text,
       prop === 'hidden' ? value : this.hidden);
  }
}


const TextComp: React.FC<TextCompProps> = ({ID, ClassName, Font, Text, QuizSession, SetQuizSession}) => {
  const [text, setText] = useState(`${Text}`);

    // Update local state when the 'Text' prop changes
    useEffect(() => {
      setText(Text);
    }, [Text]);
  
  useEffect(() => {
    const block = QuizSession?.quiz as TextBlock;
    if (block && block.id === ID) {
      setText(block.text);
    }
  }, [ID, QuizSession]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setText(newText);

    // Update the quiz session's quiz block with the same ID
    if (QuizSession && SetQuizSession) {
      const updatedQuiz = (QuizSession.quiz as ContainerBlock).copy();

      // Assuming quiz is a container of blocks and we are searching for the block with the given ID
      const updateBlock = (block: QuizBlock) => {
        if (block.id === ID && block instanceof TextBlock) {
            block.text = newText; // Update the 'text' property
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
      className={`${Font} pl-2 w-full focus:outline-none ${ClassName}`}
    />
  );
};

const TextComponent = QuizComponent(TextComp);
export default TextComponent;


const TextDisplay: React.FC<TextDisplayProps> = ({ID, ClassName, Font, Text}) => {

  return (
    <p 
    id ={ID}
    className={`${Font} pl-2 w-full ${ClassName}`}>
      {Text}
    </p>
  );
};