import { useSyncExternalStore } from "react";
import { useQuizContext } from "./useQuizContext";
import { QuizSessionState } from "../types/runtime";

/**
 * Subscribes to the root session state (Navigation, Globals).
 * Omit 'selector' to get the whole tree (Warning: frequent re-renders).
 */
export const useSessionState = <T>(
  selector: (state: QuizSessionState) => T
): T => {
  const { engine } = useQuizContext();
  const store = engine.getStore();

  return useSyncExternalStore(
    (callback) => store.subscribe(() => callback()),
    () => selector(store.getState())
  );
};