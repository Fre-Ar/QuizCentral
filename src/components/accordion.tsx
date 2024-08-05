import React, { useState } from 'react';

import { RxCaretRight, RxCaretDown } from "react-icons/rx";
import { IconContext } from "react-icons";

interface AccordionProps {
  title: string;
  children?: React.ReactNode;
}

export default function Accordion({ title, children }: AccordionProps) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleAccordion = () => {
        setIsOpen(!isOpen);
    };

    return (
      <div className="mb-2">
        <button
          className={`w-full text-left bg-uni-black text-white font-bold ${isOpen ? 'rounded-t' : 'rounded'} flex items-center`}
          onClick={toggleAccordion}
        >
            <span className="mr-2 flex flex-row items-center">
                {isOpen ? <RxCaretDown size="2em"/> : <RxCaretRight size="2em"/>}
              <div className="p-2">
                {title}
              </div> 
            </span>

        </button>
        <div className={` ${isOpen? 'p-2' : ' overflow-hidden insivible max-h-0'} bg-uni-black text-white rounded-b`}>
          {children}
        </div>
      </div>
    );
  }