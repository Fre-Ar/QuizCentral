import React, { useState } from 'react';

interface ToggleButtonProps {
  initialOn?: boolean;
  onToggle?: (on: boolean) => void;
}

export default function ToggleButton({ initialOn = false, onToggle }: ToggleButtonProps) {
  const [isOn, setIsOn] = useState(initialOn);

  const handleToggle = () => {
    const newIsOn = !isOn;
    setIsOn(newIsOn);
    if (onToggle) {
      onToggle(newIsOn);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`w-16 h-8 flex items-center rounded-full p-1 ${isOn ? 'bg-uni-blue' : 'bg-uni-light'}`}
    >
      <div
        className={`bg-white w-6 h-6 rounded-full shadow-md transform ${isOn ? 'translate-x-8' : 'translate-x-0'}`}
      ></div>
    </button>
  );
};
