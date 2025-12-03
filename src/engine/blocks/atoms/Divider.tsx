import React from "react";
import { DividerBlock } from "../../types/schema";
import { StyleResolver } from "../../styles/StyleResolver";

interface DividerProps {
  block: DividerBlock;
}

export const Divider: React.FC<DividerProps> = ({ block }) => {
  const { props } = block;

  // 1. Resolve Styles
  const { className, style } = StyleResolver.resolve(props.styling);

  // 2. Base Classes
  // We use a semantic <hr> tag.
  // We ensure it has a border defined so it's visible by default if no style is passed.
  const baseClasses = `w-full my-4 border-t border-gray-200 ${className}`;

  return (
    <hr 
      id={block.id}
      className={baseClasses}
      style={style}
    />
  );
};