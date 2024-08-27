import React, { useState, useEffect } from 'react';
import QuizComponent, { QuizBlock, QuizCompProps, QuizDisplayProps } from '../quiz-comp';
import { ContainerBlock } from '../container-comp';
import { QuizSession } from '@/components/session-context';

interface VarCompProps extends QuizCompProps {
    type: string;
    value?: string | number | boolean;
    name?: string;
    options?: string[];
    maxlength?: number;
    pattern?: string;
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
    width?: number;
    height?: number;
    required?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    tooltip?: string;
    central?: string | number | false;
    neutral?: string | number | false;
    incomplete?: boolean;
  }
  
  interface VarDisplayProps extends QuizDisplayProps {
    type: string;
    value?: string | number | boolean;
    name?: string;
    options?: string[];
    maxlength?: number;
    pattern?: string;
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
    width?: number;
    height?: number;
    required?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    tooltip?: string;
    central?: string | number | false;
    neutral?: string | number | false;
    incomplete?: boolean;
  }
  
  export class VarBlock extends QuizBlock {
    type: string;
    value?: string | number | boolean;
    name?: string;
    options?: string[];
    maxlength?: number;
    pattern?: string;
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
    width?: number;
    height?: number;
    required?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    tooltip?: string;
    central?: string | number | false;
    neutral?: string | number | false;
    incomplete?: boolean;
  
    constructor(
      id: string,
      type: string,
      style: string = "",
      value: string | number | boolean = "",
      name?: string,
      options?: string[],
      maxlength?: number,
      pattern?: string,
      placeholder?: string,
      min?: number,
      max?: number,
      step?: number,
      width?: number,
      height?: number,
      required?: boolean,
      disabled?: boolean,
      readonly?: boolean,
      tooltip?: string,
      central?: string | number | false,
      neutral?: string | number | false,
      incomplete?: boolean,
      hidden: boolean=false,
    ) {
      super(id, style, hidden);
      this.type = type;
      this.value = value;
      this.name = name;
      this.options = options;
      this.maxlength = maxlength;
      this.pattern = pattern;
      this.placeholder = placeholder;
      this.min = min;
      this.max = max;
      this.step = step;
      this.width = width;
      this.height = height;
      this.required = required;
      this.disabled = disabled;
      this.readonly = readonly;
      this.tooltip = tooltip;
      this.central = central;
      this.neutral = neutral;
      this.incomplete = incomplete;
    }
  
    asComp(selectedDiv: string | null, deleteHandler: (id?: string) => void,
      quizSession: Readonly<QuizSession | null>, setQuizSession: (data: QuizSession | null) => void): React.JSX.Element {
      return (<VarComponent
        ID={this.id}
        ClassName={this.style}
        type={this.type}
        value={this.value}
        name={this.name}
        options={this.options}
        maxlength={this.maxlength}
        pattern={this.pattern}
        placeholder={this.placeholder}
        min={this.min}
        max={this.max}
        step={this.step}
        width={this.width}
        height={this.height}
        required={this.required}
        disabled={this.disabled}
        readonly={this.readonly}
        tooltip={this.tooltip}
        central={this.central}
        neutral={this.neutral}
        incomplete={this.incomplete}
        Selected={selectedDiv}
        Delete={deleteHandler}
        QuizSession={quizSession}
        SetQuizSession={setQuizSession}
      />);
    }
  
    asDisplay() {
      return (<VarDisplay
        ID={this.id}
        ClassName={this.style}
        type={this.type}
        value={this.value}
        name={this.name}
        options={this.options}
        maxlength={this.maxlength}
        pattern={this.pattern}
        placeholder={this.placeholder}
        min={this.min}
        max={this.max}
        step={this.step}
        width={this.width}
        height={this.height}
        required={this.required}
        disabled={this.disabled}
        readonly={this.readonly}
        tooltip={this.tooltip}
        central={this.central}
        neutral={this.neutral}
        incomplete={this.incomplete}
      />);
    }
  
    changeProps(prop: string, value: any): VarBlock {
      const updatedProps = { ...this, [prop]: value };
      return new VarBlock(
        updatedProps.id,
        updatedProps.type,
        updatedProps.style, 
        updatedProps.value,
        updatedProps.name,
        updatedProps.options,
        updatedProps.maxlength,
        updatedProps.pattern,
        updatedProps.placeholder,
        updatedProps.min,
        updatedProps.max,
        updatedProps.step,
        updatedProps.width,
        updatedProps.height,
        updatedProps.required,
        updatedProps.disabled,
        updatedProps.readonly,
        updatedProps.tooltip,
        updatedProps.central,
        updatedProps.neutral,
        updatedProps.incomplete,
        updatedProps.hidden,
      );
    }
  }

  const VarComp: React.FC<VarCompProps> = ({ ID, ClassName, type, value, name, options, maxlength, pattern, placeholder, min, max, step, width, height, required, disabled, readonly, tooltip, central, neutral, incomplete, SetQuizSession, QuizSession }) => {
    const [inputValue, setInputValue] = useState(value);
    const [isChecked, setIsChecked] = useState(typeof value === 'boolean' ? value : false);
  
    useEffect(() => {
      setInputValue(value);
      setIsChecked(typeof value === 'boolean' ? value : false);
    }, [value]);
  
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        let newValue: string | number | boolean;
      
        if (e.target instanceof HTMLInputElement && (type === 'checkbox' || type === 'radio')) {
          newValue = e.target.checked;
          setIsChecked(e.target.checked); // Update the state for checkbox or radio
        } else {
          newValue = e.target.value;
          setInputValue(newValue);
        }
      
        if (QuizSession && SetQuizSession) {
          const updatedQuiz = (QuizSession.quiz as ContainerBlock).copy();
      
          const updateBlock = (block: QuizBlock) => {
            if (block.id === ID && block instanceof VarBlock) {
              block.value = newValue;
            }
          };
      
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
      
  
    if (type === "select" && options) {
      return (
        <select
          id={ID}
          name={name}
          value={inputValue as string}
          onChange={handleChange}
          required={required}
          disabled={disabled}
          className={`${ClassName}`}
          title={tooltip}
        >
          {options.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }
  
    return (
      <input
        id={ID}
        type={type}
        value={inputValue as string}
        src = {type==='image' ? inputValue as string : ''}
        checked={isChecked}
        name={name}
        onChange={handleChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        maxLength={maxlength}
        pattern={pattern}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        title={tooltip}
        width={width}
        height={height}
        className={`${ClassName}`}
      />
    );
  };
  
  const VarComponent = QuizComponent(VarComp);
  export default VarComponent;

  const VarDisplay: React.FC<VarDisplayProps> = ({ ID, ClassName, type, value, name, options, maxlength, pattern, placeholder, min, max, step, width, height, required, disabled, readonly, tooltip }) => {
    if (type === "select" && options) {
      return (
        <select
          id={ID}
          name={name}
          value={value as string}
          required={required}
          disabled={disabled}
          className={`${ClassName}`}
          title={tooltip}
        >
          {options.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }
  
    return (
      <input
        id={ID}
        type={type}
        value={value as string}
        checked={typeof value === 'boolean' ? value : undefined}
        name={name}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        maxLength={maxlength}
        pattern={pattern}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        title={tooltip}
        width={width}
        height={height}
        className={`${ClassName}`}
      />
    );
  };
  
  

  export const types = [
    "button", 
    "image",

    "select", // if the type is select, then the react component should be a select div, not an input div

    "checkbox",
    "radio",

    "color",

    "file",

    "date",
    "datetime-local",
    "time",
    "week",
    "month",
    
    "text",
    "number", 
    "range"
  ];
  
  // type (see types array);
  // value (string, number or boolean);
  // name (string);

  // options (array) for select

  // maxlength (number) for text;
  // pattern (string) for text;
  // placeholder (string) for text;
  
  // min/max (number) for number, range, dates; 
  // step (number) for number, range, dates; 

  // width/height(numbers) for images;

  // required, disabled, readonly (booleans) for all

  // possibly tooltip (string)

  // central (string or number or false), neutral (string or number or false), incomplete(boolean)  for all