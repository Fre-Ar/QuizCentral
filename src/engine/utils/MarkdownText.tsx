import React from "react";
import ReactMarkdown from "react-markdown";

interface MarkdownTextProps {
  content: string;
  variant?: "block" | "inline"; // 'block' for TextBlock, 'inline' for Labels
  className?: string; // Allow passing Tailwind classes for inheritance
}

export const MarkdownText: React.FC<MarkdownTextProps> = ({ 
  content, 
  variant = "block",
  className 
}) => {
  
  // Configuration to strip <p> tags for inline elements (labels/buttons)
  // preventing <div><p>...</p></div> inside a <button> or <span>
  const isInline = variant === "inline";
  
  return (
    <div className={`markdown-root ${className} ${isInline ? "inline-markdown" : ""}`}>
      <ReactMarkdown
        disallowedElements={isInline ? ["p"] : []}
        unwrapDisallowed={isInline}
        components={{
          // Basic Tailwind Mappings for standard elements
          strong: ({node, ...props}) => <span className="font-bold" {...props} />,
          em: ({node, ...props}) => <span className="italic" {...props} />,
          a: ({node, ...props}) => <a className="text-blue-600 hover:underline" target="_blank" {...props} />,
          // Only apply margin-bottom if it's a block context
          p: ({node, ...props}) => <p className={isInline ? "" : "mb-2 last:mb-0"} {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2" {...props} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};