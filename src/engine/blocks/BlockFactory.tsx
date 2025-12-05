import React, { memo } from "react";
import { InteractionUnit, VisualBlock } from "../types/schema";
import { useBlockState } from "../hooks/useBlockState";
import { InteractionProvider } from "../hooks/useInteractionContext";

// Atoms
import { TextInput } from "./atoms/TextInput";
import { TriggerButton } from "./atoms/TriggerButton";
import { Toggle } from "./atoms/Toggle";
import { Slider } from "./atoms/Slider";
import { Select } from "./atoms/Select";
import { TextBlock } from "./atoms/TextBlock";
import { Divider } from "./atoms/Divider";
import { ImageBlock } from "./atoms/ImageBlock";

// Containers
import { Container } from "./containers/Container";

interface BlockFactoryProps {
  block: InteractionUnit | VisualBlock;
}

/**
 * Recursive Renderer.
 * Decides which component to mount based on block.type.
 * Handles Visibility logic (hidden blocks return null).
 */
export const BlockFactory = memo(({ block }: BlockFactoryProps) => {
  // 1. Visibility Check
  // Only blocks with IDs can be hidden by the Engine.
  // We hook into the state; if the node doesn't exist, we assume it's static/visible.
  const state = useBlockState(block.id || "");
  console.log("Block:", block.id, "Type:", block.type);
  console.log("State", state);
  
  if (state?.computed.hidden) {
    return null; 
  }

  // 2. Interaction Unit Wrapper
  // This is a logic node, not a visual one. 
  // We establish the Context for its children and render the View.
  if (block.type === "interaction_unit") {
    const iu = block as InteractionUnit;
    return (
      <InteractionProvider id={iu.id}>
        <BlockFactory block={iu.view} />
      </InteractionProvider>
    );
  }

  // 3. Visual Block Dispatcher
  switch (block.type) {
    // --- STRUCTURE ---
    case "container":
      return <Container block={block} />;

    // --- STATIC CONTENT ---
    case "text":
      return <TextBlock block={block} />;
    case "divider":
      return <Divider block={block} />;
    case "image":
      return <ImageBlock block={block} />;

    // --- INTERACTIVE METAPHORS ---
    case "input":
      return <TextInput block={block} />;
    case "trigger":
      return <TriggerButton block={block} />;

    case "toggle":
      return <Toggle block={block} />;
    case "slider":
      return <Slider block={block} />;
    case "select":
      return <Select block={block} />;
    
    default:
      console.warn(`Unknown block type: ${(block as any).type}`);
      return null;
  }
});

BlockFactory.displayName = "BlockFactory";