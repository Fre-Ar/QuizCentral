import { useEffect, useRef } from "react";
import { useQuizEngine } from "./useQuizEngine";
import { useSessionState } from "./useGlobalState";
import { supabase } from "@/lib/supabaseClient";

export const useSessionPersistence = (sessionId: string) => {
  const { engine } = useQuizEngine();
  const state = useSessionState(s => s); // Subscribe to root changes
  
  // Ref to track last save to avoid saving identical states
  const lastSavedState = useRef<string>("");

  useEffect(() => {
    // Debounce Logic: Wait 2 seconds after last change before saving
    const handler = setTimeout(async () => {
      
      // 1. Extract Minimal Save State
      // We filter nodes to only save values, not the full runtime complexity
      const answers: Record<string, any> = {};
      Object.values(state.nodes).forEach(node => {
        if (node.value !== null && node.value !== undefined) {
          answers[node.id] = node.value;
        }
      });

      const payload = {
        current_step_id: state.currentStepId,
        variables: state.variables,
        answers: answers
      };

      const payloadString = JSON.stringify(payload);

      // 2. Diff Check
      if (payloadString === lastSavedState.current) return;

      // 3. Save to Supabase
      console.log(`[Persistence] Saving Session ${sessionId}...`);
      const { error } = await supabase
        .from('quiz_sessions')
        .update({
          current_step_id: payload.current_step_id,
          variables: payload.variables,
          answers: payload.answers,
          last_updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (!error) {
        lastSavedState.current = payloadString;
      } else {
        console.error("Save failed", error);
      }

    }, 2000); // 2 second debounce

    return () => clearTimeout(handler);
  }, [state, sessionId]);
};