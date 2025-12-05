import React, { useCallback } from "react";
import { InputBlock } from "../../types/schema";
import { useInteractionContext } from "../../hooks/useInteractionContext";
import { useBlockState } from "../../hooks/useBlockState";
import { useQuizEngine } from "../../hooks/useQuizEngine";
import { useStyleResolver } from "@/engine/hooks/useStyleResolver";

interface TextInputProps {
  block: InputBlock;
}

export const TextInput: React.FC<TextInputProps> = ({ block }) => {
  const { props } = block;
  
  // 1. Context Resolution
  // We need to know WHICH Interaction Unit controls this input.
  const parentId = useInteractionContext();
  
  // 2. State Subscription
  // Subscribe only to this specific node's updates.
  const state = useBlockState(parentId || "");
  const { dispatch } = useQuizEngine();

  // 3. Style Resolution
  const { className, style } = useStyleResolver(props.styling);
  const baseClasses = `w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none ${className}`;

  // 4. Computed Properties
  // Combine static props with dynamic engine state
  const isDisabled = state?.computed.disabled || props.disabled;
  const value = state?.value ?? ""; // Default to empty string if null

  // 5. Event Handlers
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!parentId) return;
    
    // For numeric modes, we might want to parse, but usually we keep it as string 
    // in the UI and let the Domain Validator handle the type check.
    dispatch({ 
      type: "SET_VALUE", 
      id: parentId, 
      value: e.target.value 
    });
  }, [dispatch, parentId]);

  const handleBlur = useCallback(() => {
    if (parentId) {
      dispatch({ type: "SET_NODE_PROPERTY", id: parentId, property: "visited", value: true });
    }
  }, [dispatch, parentId]);

  // 6. Render: Textarea vs Input
  if (props.lines && props.lines > 1) {
    return (
      <textarea
        id={block.id}
        rows={props.lines}
        disabled={isDisabled}
        placeholder={props.placeholder}
        className={baseClasses}
        style={style}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    );
  }

  // Map schema 'mode' to HTML input types
  const inputType = 
    props.mode === "numeric" || props.mode === "decimal" ? "number" :
    props.mode === "email" ? "email" :
    props.mode === "tel" ? "tel" : 
    "text";

  return (
    <input
      id={block.id}
      type={inputType}
      disabled={isDisabled}
      placeholder={props.placeholder}
      className={baseClasses}
      style={style}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      autoComplete="off"
    />
  );
};