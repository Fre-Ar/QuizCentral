import React from 'react';

interface SideButtonProps {
  title: string
  children?: React.ReactNode
}

export default function SideButton({ title, children }: SideButtonProps) {
  return (
    <button className={`w-full text-left bg-uni-grey text-white font-bold flex mb-4 items-center border-uni-black border-y-2`}>
        <span className="flex flex-row items-center">
            <div className="bg-uni-black">
                {children}
            </div>
            <div className="px-2">{title}</div>
        </span>
    </button>
  );
};