import { useQuizContext } from "./useQuizContext";

export const useQuizEngine = () => {
  const { engine } = useQuizContext();
  
  return {
    dispatch: engine.dispatch.bind(engine),
    engine: engine,
    // Expose other engine methods if needed, e.g., engine.getMetadata()
  };
};