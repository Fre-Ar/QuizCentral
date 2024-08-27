import { QuizBlock } from "@/components/quiz_components/quiz-comp";
import { ContainerBlock } from "@/components/quiz_components/container-comp";
import { TextBlock } from "@/components/quiz_components/info/text-comp";
import { ButtonBlock } from "@/components/quiz_components/variables/button-comp";
import { InputBlock } from "@/components/quiz_components/variables/input-comp";
import { QuizSession } from "@/components/session-context";
import { types, VarBlock } from "@/components/quiz_components/variables/var-comp";


export function downloadQuizSession(quizSession: any, filename: string = 'quizSession.json') {
    // Convert the quizSession object to a JSON string
    const jsonString = JSON.stringify(quizSession, null, 2); // Pretty-print JSON with 2 spaces
    
    // Create a Blob from the JSON string
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create a link element
    const link = document.createElement('a');
    
    // Set the download attribute with a filename
    link.download = filename;
    
    // Create a URL for the Blob and set it as the href attribute
    link.href = URL.createObjectURL(blob);
    
    // Append the link to the body (it won't be visible)
    document.body.appendChild(link);
    
    // Programmatically click the link to trigger the download
    link.click();
    
    // Remove the link from the document
    document.body.removeChild(link);
  }
  
  // Function to identify the type of QuizBlock and instantiate it accordingly
  export const parseQuizBlock = (block: any): QuizBlock => {
    if ('children' in block && Array.isArray(block.children)) {
      // Recursively parse children
      const children = block.children.map(parseQuizBlock);
      return new ContainerBlock(block.id, block.style || '', block.rows || 1, block.columns || 1, children, block.hidden || false);
    } else if (block.id === 'submit') {
      return new ButtonBlock(block.id, block.style || '', block.text || '', block.hidden || false);
    } else if ('type' in block && typeof block.type === 'string' && (types.includes(block.type) || block.type==='')) {
      return new VarBlock(
        block.id,
        block.type || 'button',
        block.style || '',
        block.value || '',
        block.name || '',
        block.options || [],
        block.maxlength || undefined,
        block.pattern || '',
        block.placeholder || '',
        block.min || undefined,
        block.max || undefined,
        block.step || undefined,
        block.width || undefined,
        block.height || undefined,
        block.required || false,
        block.disabled || false,
        block.readonly || false,
        block.tooltip || '',
        block.central || false,
        block.neutral || false,
        block.incomplete || false,
        block.hidden || false
      );
    } else if ('text' in block && typeof block.text === 'string') {
      return new TextBlock(block.id, block.style || '', block.font || '', block.text, block.hidden || false);
    } else if ('def' in block && typeof block.def === 'string') {
      return new InputBlock(block.id, block.style || '', block.def, block.placeholder || '', block.font || '', block.hidden || false);
    }  else {
      throw new Error('Unknown block type');
    }
  };
  
  // Function to parse the quiz data
  export const parseQuizData = (json: any): QuizSession | null => {
    if (
      json &&
      typeof json === 'object' &&
      typeof json.hash === 'string' &&
      typeof json.quiz === 'object' &&
      Array.isArray(json.groups) &&
      Array.isArray(json.custom) &&
      typeof json.settings === 'object'
    ) {
      try {
        const parsedQuiz = parseQuizBlock(json.quiz); // Parse the main quiz block
        return {
          ...json,
          quiz: parsedQuiz,
        };
      } catch (error) {
        console.error('Error parsing quiz blocks:', error);
        return null;
      }
    }
    return null;
  };

  
  export const getCookie = (name: string='quizHash'): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length); // Remove leading spaces
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };