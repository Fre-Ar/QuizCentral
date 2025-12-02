import React, { createContext, useContext } from "react";

// The ID of the current Interaction Unit we are rendering within.
// Inputs use this ID to know where to send their 'set_value' events.
const InteractionContext = createContext<string | null>(null);

export const InteractionProvider: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  return (
  <InteractionContext.Provider value={id}>
    {children}
  </InteractionContext.Provider>);
};

export const useInteractionContext = () => {
  const context = useContext(InteractionContext);
  // It's okay to be null (static blocks outside IUs), but inputs might warn.
  return context;
};