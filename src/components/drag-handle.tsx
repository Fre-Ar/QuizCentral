import React from 'react';

interface DragHandleProps {
  onMouseDown: () => void;
}

export default function DragHandle ({onMouseDown}:DragHandleProps) {
  return (
    <div
    className="bg-uni-light cursor-col-resize"
    style={{ width: '5px' }}
    onMouseDown={onMouseDown}
    />
  );
};