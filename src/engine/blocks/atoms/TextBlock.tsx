import React from "react";
import { TextBlock as TextBlockSchema } from "../../types/schema";
import { StyleResolver } from "../../styles/StyleResolver";

interface TextBlockProps {
  block: TextBlockSchema;
}

export const TextBlock: React.FC<TextBlockProps> = ({ block }) => {
  const { props } = block;

  // 1. Resolve Styles
  const { className, style } = StyleResolver.resolve(props.styling);
  
  // 2. Base Typography
  // We apply some defaults to ensure it looks like text if no classes are passed
  const baseClasses = `prose max-w-none ${className}`;

  return (
    <div 
      id={block.id}
      className={baseClasses}
      style={style}
    >
      {/* TODO: Integration Point for Markdown Parser.
         Example: <ReactMarkdown>{props.content}</ReactMarkdown> 
      */}
      {props.content}
    </div>
  );
};