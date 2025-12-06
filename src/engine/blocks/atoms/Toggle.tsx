import React, { useCallback, useMemo } from "react";
import { ToggleBlock } from "../../types/schema";
import { useInteractionContext } from "../../hooks/useInteractionContext";
import { useBlockState } from "../../hooks/useBlockState";
import { useQuizEngine } from "../../hooks/useQuizEngine";
import { LogicEvaluator } from "../../core/LogicEvaluator";
import { useStyleResolver } from "@/engine/hooks/useStyleResolver";
import { MarkdownText } from "@/engine/utils/MarkdownText";
import { logTest } from "@/lib/utils";

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
      const globalState = engine.getStore().getState();
      const context = {
        globals: globalState.variables,
        nodes: globalState.nodes,
        value: state?.value
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
      // let the engine interpret the logic 
      engine.executeLogicAction(props.events.on_click, parentId);
    } 
    // B. Fallback: Standard Boolean Toggle
    else {
      dispatch({ type: "SET_VALUE", id: parentId, value: !isChecked });
    }
    // Always mark as visited
    dispatch({ type: "SET_NODE_PROPERTY", id: parentId, property: "visited", value: true });
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

    // VARIANT: RADIO (New)
    if (props.variant === "radio") {
      return (
        <div className={`
          w-5 h-5 border-2 rounded-full flex items-center justify-center transition-all
          ${isChecked ? "border-blue-600" : "border-gray-400 bg-white"}
          ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-400"}
        `}>
          {isChecked && (
            <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
          )}
        </div>
      );
    }

    if (typeof props.variant === "object" && props.variant.icon_on && props.variant.icon_off) {
      // TODO: Add icon rendering logic here
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
      {isLabelStart && <span className="text-sm font-medium">
        <MarkdownText content={props.label} variant="inline" />
      </span>}
      
      {renderControl()}
      
      {!isLabelStart && <span className="text-sm font-medium">
        <MarkdownText content={props.label} variant="inline" />
      </span>}
    </div>
  );
};