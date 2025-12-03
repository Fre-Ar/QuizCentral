import React, { useCallback } from "react";
import { TriggerBlock } from "../../types/schema";
import { useInteractionContext } from "../../hooks/useInteractionContext";
import { useQuizEngine } from "../../hooks/useQuizEngine";
import { useBlockState } from "../../hooks/useBlockState";
import { StyleResolver } from "../../styles/StyleResolver";
import { LogicEvaluator } from "../../core/LogicEvaluator";

interface TriggerButtonProps {
  block: TriggerBlock;
}

export const TriggerButton: React.FC<TriggerButtonProps> = ({ block }) => {
  const { props } = block;
  const parentId = useInteractionContext();
  const { dispatch, engine } = useQuizEngine(); // Assuming we expose engine for context access
  
  // Subscribe to state if inside an IU (for disabled/hidden logic updates)
  const state = useBlockState(parentId || "");

  // 1. Resolve Styles
  const { className, style } = StyleResolver.resolve(props.styling);
  
  // 2. Computed State
  const isDisabled = state?.computed.disabled || props.disabled;
  
  // Base Tailwind Button Styles
  const baseClasses = `
    px-4 py-2 rounded font-medium transition-all
    ${isDisabled 
      ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
      : "bg-blue-600 text-white hover:bg-blue-700 active:transform active:scale-95"
    } 
    ${className}
  `;

  // 3. The Action Interpreter
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }

    const eventLogic = props.events?.on_click;
    if (!eventLogic) return;

    // We manually inspect the root operator to determine the SIDE EFFECT.
    // JsonLogic is used only to calculate the VALUES.
    
    // Case A: SET VALUE
    // Schema: { "set": [ target, value ] }
    // Example: { "set": [ { "var": "value" }, 10 ] }
    if (typeof eventLogic === "object" && "set" in eventLogic) {
      const args = (eventLogic as any).set; // [Target, ValueExpr]
      if (!Array.isArray(args) || args.length < 2) return;

      const [targetExpr, valueExpr] = args;
      
      // A.1 Resolve Value
      // We need the current engine context to evaluate the value expression
      const context = {
        globals: engine.getStore().getState().variables,
        nodes: engine.getStore().getState().nodes
      };
      const resolvedValue = LogicEvaluator.getInstance().evaluate(valueExpr, context);

      // A.2 Resolve Target
      // If target is {"var": "value"}, it means "This Interaction Unit"
      let targetId = parentId;
      
      // If target is specific node: {"var": "q_other.value"} -> We parse ID
      // (Simplified logic for MVP: We assume it targets the parent IU)
      
      if (targetId) {
        dispatch({ type: "SET_VALUE", id: targetId, value: resolvedValue });
      }
    }

    // Case B: NAVIGATE (Custom convention for MVP)
    // Schema: { "navigate": "step_id" }
    if (typeof eventLogic === "object" && "navigate" in eventLogic) {
      const targetStep = (eventLogic as any).navigate;
      dispatch({ type: "NAVIGATE", targetId: targetStep });
    }

    // Case C: Fallback / Submit
    // If we want a generic "Submit" that moves to next page automatically:
    // This logic usually lives in the Engine or a specific "submit" operator.

  }, [isDisabled, props.events, parentId, dispatch, engine]);

  return (
    <button
      id={block.id}
      type="button"
      className={baseClasses}
      style={style}
      disabled={isDisabled}
      onClick={handleClick}
    >
      {props.label}
    </button>
  );
};