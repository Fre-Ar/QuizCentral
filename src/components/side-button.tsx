import React from 'react';

interface SideButtonProps {
  title: string
  children?: React.ReactNode
  onClick?: ()=> void
  chosen: boolean
}

export default function SideButton({ title, children, onClick, chosen }: SideButtonProps) {
  return (
    <button 
      className={`w-full text-left ${chosen ? ' bg-uni-light text-uni-black' : ' bg-uni-grey  text-white'} font-bold flex items-center border-uni-black border-y-2`}
      onClick={onClick}>
        <span className="flex flex-row items-center">
            <div className={`${chosen ? 'bg-uni-light' : 'bg-uni-black'}`}>
                {children}
            </div>
            <div className="px-2">{title}</div>
        </span>
    </button>
  );
};