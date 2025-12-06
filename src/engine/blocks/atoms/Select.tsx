import React, { useMemo, useCallback } from "react";
import { SelectBlock, InteractionUnit } from "../../types/schema";
import { useInteractionContext } from "../../hooks/useInteractionContext";
import { useBlockState } from "../../hooks/useBlockState";
import { useQuizEngine } from "../../hooks/useQuizEngine";
import { useStyleResolver } from "@/engine/hooks/useStyleResolver";
import { DomainRegistry } from "../../domains/DomainRegistry";
import { QuizEngine } from "@/engine/core/QuizEngine";
import { MarkdownText } from "../../utils/MarkdownText";

interface SelectProps {
  block: SelectBlock;
}

export const Select: React.FC<SelectProps> = ({ block }) => {
  const { props } = block;
  const parentId = useInteractionContext();
  const { engine, dispatch } = useQuizEngine();
  const state = useBlockState(parentId || "");

  // 1. Resolve Domain & Options
  // We need to find the Static Schema of the parent IU to get the domain_id.
  const options = useMemo(() => {
    if (!parentId) return [];
    
    // Accessing internal schema map from engine (Assuming we add a public getter or use this workaround)
    // In a strict implementation, we would add public getBlockSchema(id) to QuizEngine.
    // For MVP, we assume we can access the schema map via the engine instance.
    const parentSchema = engine.getSchemaBlock(parentId) as InteractionUnit;
    
    if (!parentSchema || !parentSchema.domain_id) return [];

    try {
      return DomainRegistry.getInstance().generate(parentSchema.domain_id);
    } catch (e) {
      console.warn("Failed to generate options for Select", e);
      return [];
    }
  }, [engine, parentId]);

  // 2. Resolve Styles
  const { className, style } = useStyleResolver(props.styling);
  const isDisabled = state?.computed.disabled || props.disabled;
  const currentValue = state?.value;

  // 3. Selection Handler
  const handleSelect = useCallback((val: any) => {
    if (!parentId || isDisabled) return;
    dispatch({ type: "SET_VALUE", id: parentId, value: val });
    dispatch({ type: "SET_NODE_PROPERTY", id: parentId, property: "visited", value: true });
  }, [dispatch, parentId, isDisabled]);

  // ==========================================================================
  // RENDERERS (Variants)
  // ==========================================================================

  // Variant A: CHIPS (Horizontal Clickable Pills)
  if (props.variant === "chips") {
    return (
      <div id={block.id} className={`flex flex-wrap gap-2 ${className}`} style={style}>
        {options.map((opt, idx) => {
          const isSelected = currentValue === opt; // Simple equality for primitives
          return (
            <button
              key={idx}
              type="button"
              disabled={isDisabled}
              onClick={() => handleSelect(opt)}
              className={`
                px-4 py-1.5 rounded-full text-sm font-medium transition-colors border
                ${isSelected 
                  ? "bg-blue-600 text-white border-blue-600" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}
                ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              {String(opt)}
            </button>
          );
        })}
      </div>
    );
  }

  // Variant B: LISTBOX (Vertical Stack)
  if (props.variant === "listbox") {
    return (
      <div id={block.id} className={`flex flex-col gap-1 w-full ${className}`} style={style}>
        {options.map((opt, idx) => {
          const isSelected = currentValue === opt;
          return (
            <button
              key={idx}
              type="button"
              disabled={isDisabled}
              onClick={() => handleSelect(opt)}
              className={`
                px-4 py-3 text-left rounded-md border transition-all
                ${isSelected 
                  ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500 z-10" 
                  : "bg-white border-gray-300 hover:border-blue-300"}
                ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              {String(opt)}
            </button>
          );
        })}
      </div>
    );
  }

  // Variant C: DROPDOWN (Native Select - Default)
  // Note: HTML <select> only supports strings. Complex objects need serialization.
  return (
    <div className={`relative ${className}`} style={style}>
      <select
        id={block.id}
        disabled={isDisabled}
        value={JSON.stringify(currentValue) || ""}
        onChange={(e) => {
          if (!e.target.value) {
             // Handle clear (if nullable)
             return; 
          }
          try {
            // Parse back to original type (number, boolean, object)
            handleSelect(JSON.parse(e.target.value));
          } catch (e: any) {
            handleSelect(e.target.value); // Fallback string
          }
        }}
        className={`
          w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:text-gray-500
        `}
      >
        <option value="" disabled>
          <MarkdownText content= {props.placeholder || "Select an option..."} variant="inline" />
        </option>
        
        {options.map((opt, idx) => (
          <option key={idx} value={JSON.stringify(opt)}>
            {String(opt)}
          </option>
        ))}
      </select>
      
      {/* Clear Button (Optional) */}
      {props.clearable && currentValue !== null && !isDisabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // Prevent select open
            dispatch({ type: "SET_VALUE", id: parentId!, value: null });
          }}
          className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      )}
    </div>
  );
};