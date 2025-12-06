import React from "react";
import { ContainerBlock } from "../../types/schema";
import { useStyleResolver } from "@/engine/hooks/useStyleResolver";
import { BlockFactory } from "../BlockFactory";
import { useBlockState } from "../../hooks/useBlockState";
import { useQuizEngine } from "../../hooks/useQuizEngine";

interface ContainerProps {
  block: ContainerBlock;
}

// TODO: Implement shuffle children logic
export const Container: React.FC<ContainerProps> = ({ block }) => {
  const { engine } = useQuizEngine();
  const state = useBlockState(block.id || "");
  
  // Resolve Styles
  const { className, style } = useStyleResolver(block.props.styling);
  // Default Layout Classes
  const baseClasses = `flex flex-col ${className}`;

  // Determine Children to Render
  // Priority: Runtime Order (shuffled/picked) > Static Schema Order
  const childrenIds = state?.childrenIds;

  return (
    <div 
      id={block.id} 
      className={baseClasses} 
      style={style}
      // Data attribute for debugging
      data-block-type="container"
    >
      {childrenIds 
        ? // A. Runtime Order (Shuffled)
          childrenIds.map((childId) => {
            // We look up the schema definition using the Runtime ID
            // thanks to the registration in hydrateState.
            const childBlock = engine.getSchemaBlock(childId);
            
            if (!childBlock) {
               console.warn(`Container: Could not resolve child block ${childId}`);
               return null;
            }

            return <BlockFactory key={childId} block={childBlock} />;
          })
        : // B. Fallback (Static Order - likely only before hydration completes)
          block.props.children.map((child, index) => {
             const key = child.id || `child-${index}`;
             return <BlockFactory key={key} block={child} />;
          })
      }
    </div>
  );
};