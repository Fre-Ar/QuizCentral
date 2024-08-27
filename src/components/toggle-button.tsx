import React, { useState } from 'react';

interface ToggleButtonProps {
  isOn: boolean;
  onToggle: (on: boolean) => void;
  black?: boolean;
}

export default function ToggleButton({ isOn = false, black=false, onToggle }: ToggleButtonProps) {
  
  const handleToggle = () => {
    onToggle(!isOn);
  };

  return (
    <button
      onClick={handleToggle}
      className={`w-16 h-8 flex items-center rounded-full p-1 ${isOn ? 'bg-uni-blue' : (black? 'bg-black' : 'bg-uni-light')}`}
    >
      <div
        className={`bg-white w-6 h-6 rounded-full shadow-md transform ${isOn ? 'translate-x-8' : 'translate-x-0'}`}
      ></div>
    </button>
  );
};
