import React, { useCallback, useState } from "react";
import { SliderBlock } from "../../types/schema";
import { useInteractionContext } from "../../hooks/useInteractionContext";
import { useBlockState } from "../../hooks/useBlockState";
import { useQuizEngine } from "../../hooks/useQuizEngine";
import { useStyleResolver } from "@/engine/hooks/useStyleResolver";

interface SliderProps {
  block: SliderBlock;
}

export const Slider: React.FC<SliderProps> = ({ block }) => {
  const { props } = block;
  const parentId = useInteractionContext();
  const { dispatch } = useQuizEngine();
  const state = useBlockState(parentId || "");

  // 1. Resolve Styles
  const { className, style } = useStyleResolver(props.styling);

  // 2. State Management
  // We need local state for the "drag" effect to be smooth, 
  // dispatching to engine on 'commit' (mouse up) or throttled.
  // For MVP, we bind directly to engine state.
  const value = typeof state?.value === "number" ? state.value : 0;
  const isDisabled = state?.computed.disabled || props.disabled;

  // 3. Constraints (Defaults for MVP - strictly should come from Domain/Schema)
  // TODO: Implement min, max, step from domain
  const min = 0;
  const max = 100;
  const step = 1;

  // 4. Handlers
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!parentId) return;
    const val = parseFloat(e.target.value);
    dispatch({ type: "SET_VALUE", id: parentId, value: val });
  }, [dispatch, parentId]);

  const handleBlur = useCallback(() => {
    if (parentId) dispatch({ type: "SET_VISITED", id: parentId });
  }, [dispatch, parentId]);

  // 5. Visual Logic
  const percentage = ((value - min) * 100) / (max - min);
  const isVertical = props.orientation === "vertical";

  // Base classes for the track/thumb styling
  const baseClasses = `
    w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
    focus:outline-none focus:ring-2 focus:ring-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed
    ${className}
  `;

  return (
    <div 
      id={block.id}
      className={`relative flex ${isVertical ? "h-64" : "w-full items-center"} py-4`} 
      style={style}
    >
      {/* Value Tooltip */}
      {props.show_value_tooltip && (
        <div 
          className="absolute -top-6 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded"
          style={{ left: `${percentage}%` }}
        >
          {value}
        </div>
      )}

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={isDisabled}
        onChange={handleChange}
        onBlur={handleBlur}
        className={baseClasses}
        // Inline style for progress fill visualization
        style={{
          backgroundSize: `${percentage}% 100%`,
          backgroundImage: `linear-gradient(#2563eb, #2563eb)`,
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* Ticks (Optional Datalist) */}
      {props.show_ticks && (
        <div className="absolute w-full flex justify-between px-1 top-6 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="h-1 w-0.5 bg-gray-400"></div>
              <span className="text-[10px] text-gray-500 mt-0.5">
                {min + ((max - min) / 4) * i}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};