import { useMemo } from "react";
import { useQuizContext } from "./useQuizContext";
import { StyleResolver } from "../styles/StyleResolver";
import { StylingProps } from "../types/schema";

/**
 * A hook that automatically pulls the User's Style Registry 
 * and resolves the block's styling props into Tailwind/CSS.
 */
export const useStyleResolver = (props?: StylingProps) => {
  const { styleRegistry } = useQuizContext();

  return useMemo(() => {
    return StyleResolver.resolve(props, styleRegistry);
  }, [props, styleRegistry]);
};