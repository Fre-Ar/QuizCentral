import { useSyncExternalStore, useCallback } from "react";
import { useQuizContext } from "./useQuizContext";
import { BlockRuntimeState } from "../types/runtime";

/**
 * Subscribes a React component to a specific Block's state in the Engine.
 * Only re-renders if *this specific block's* data changes.
 */
export const useBlockState = (nodeId: string): BlockRuntimeState | undefined => {
  const { engine } = useQuizContext();
  const store = engine.getStore();

  // Selector: extract only the specific node from the full state tree
  const selector = useCallback(
    (state: any) => state.nodes[nodeId],
    [nodeId]
  );

  // Subscribe to the store
  const nodeState = useSyncExternalStore(
    (callback) => store.subscribe(() => callback()), // Subscribe
    () => selector(store.getState()) // Get Snapshot
  );

  return nodeState;
};