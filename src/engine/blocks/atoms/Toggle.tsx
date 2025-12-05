import React, { useCallback, useMemo } from "react";
import { ToggleBlock } from "../../types/schema";
import { useInteractionContext } from "../../hooks/useInteractionContext";
import { useBlockState } from "../../hooks/useBlockState";
import { useQuizEngine } from "../../hooks/useQuizEngine";
import { LogicEvaluator } from "../../core/LogicEvaluator";
import { useStyleResolver } from "@/engine/hooks/useStyleResolver";

interface ToggleProps {
  block: ToggleBlock;
}

export const Toggle: React.FC<ToggleProps> = ({ block }) => {
  const { props } = block;
  const parentId = useInteractionContext();
  const { engine, dispatch } = useQuizEngine();
  
  // Subscribe to state
  const state = useBlockState(parentId || "");

  // 1. Resolve Styles
  const { className, style } = useStyleResolver(props.styling);

  // 2. Computed "Checked" State
  // The engine doesn't auto-compute 'active' for us, so we calculate it here.
  const isChecked = useMemo(() => {
    // A. Priority: Custom Logic (e.g. for Rating Stars: value >= item)
    if (props.state_logic?.active) {
      const context = {
        globals: engine.getStore().getState().variables,
        nodes: engine.getStore().getState().nodes
      };
      return LogicEvaluator.getInstance().evaluate(props.state_logic.active, context);
    }
    
    // B. Fallback: Direct Boolean Binding
    return state?.value === true;
  }, [props.state_logic, engine, state?.value, state?.touched]); // Depend on value/touched to re-eval

  const isDisabled = state?.computed.disabled || props.disabled;

  // 3. Interaction Handler
  const handleClick = useCallback(() => {
    if (isDisabled || !parentId) return;

    // A. Priority: Custom Event (e.g. Set Value to 'Star Rating 5')
    if (props.events?.on_click) {
      // Execute Logic Action (Reusing TriggerButton logic pattern)
      const eventLogic = props.events.on_click;
      
      if (typeof eventLogic === "object" && "set" in eventLogic) {
        const args = (eventLogic as any).set;
        const [targetExpr, valueExpr] = args;

        const context = {
          globals: engine.getStore().getState().variables,
          nodes: engine.getStore().getState().nodes
        };
        const resolvedValue = LogicEvaluator.getInstance().evaluate(valueExpr, context);
        
        // Target is implicit (self) or explicit
        dispatch({ type: "SET_VALUE", id: parentId, value: resolvedValue });
      }
    } 
    // B. Fallback: Standard Boolean Toggle
    else {
      dispatch({ type: "SET_VALUE", id: parentId, value: !isChecked });
    }
    
    dispatch({ type: "SET_VISITED", id: parentId });
  }, [isDisabled, parentId, props.events, isChecked, dispatch, engine]);

  // 4. Variant Rendering
  const renderControl = () => {
    // SWITCH VARIANT
    if (props.variant === "switch") {
      return (
        <div className={`
          w-11 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out cursor-pointer
          ${isChecked ? "bg-blue-600" : "bg-gray-300"}
          ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
        `}>
          <div className={`
            bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out
            ${isChecked ? "translate-x-5" : "translate-x-0"}
          `} />
        </div>
      );
    }

    // CHECKBOX VARIANT (Default)
    return (
      <div className={`
        w-5 h-5 border-2 rounded flex items-center justify-center transition-colors
        ${isChecked ? "bg-blue-600 border-blue-600" : "border-gray-400 bg-white"}
        ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}>
        {isChecked && (
          <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 20 20">
            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
          </svg>
        )}
      </div>
    );

    // TODO: Add RADIO variant 
  };

  // 5. Layout (Label Position)
  const isLabelStart = props.label_position === "start";

  return (
    <div 
      id={block.id} 
      className={`flex items-center gap-3 ${className}`} 
      style={style}
      onClick={handleClick}
    >
      {isLabelStart && <span className="text-sm font-medium">{props.label}</span>}
      
      {renderControl()}
      
      {!isLabelStart && <span className="text-sm font-medium">{props.label}</span>}
    </div>
  );
};