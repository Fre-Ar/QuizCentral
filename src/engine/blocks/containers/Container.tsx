import React from "react";
import { ContainerBlock } from "../../types/schema";
import { StyleResolver } from "../../styles/StyleResolver";
import { BlockFactory } from "../BlockFactory";

interface ContainerProps {
  block: ContainerBlock;
}

// TODO: Implement shuffle children logic
export const Container: React.FC<ContainerProps> = ({ block }) => {
  // 1. Resolve Styles
  // We resolve the styling props directly into Tailwind classes and inline styles
  const { className, style } = StyleResolver.resolve(block.props.styling);

  // 2. Default Layout Classes
  // If the user didn't specify display type, we default to a vertical flex column
  // to ensure standard document flow behavior.
  const baseClasses = `flex flex-col ${className}`;

  return (
    <div 
      id={block.id} 
      className={baseClasses} 
      style={style}
      // Data attribute for debugging
      data-block-type="container"
    >
      {block.props.children.map((child, index) => {
        // Use the child's ID as key if available, otherwise index (for static text)
        const key = child.id || `child-${index}`;
        return <BlockFactory key={key} block={child} />;
      })}
    </div>
  );
};