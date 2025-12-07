"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserAccount } from "@/engine/session/types"; 
import { getCookie } from "@/lib/client-utils";
import { fetchUserAccount } from "@/lib/db-utils";

interface UserContextType {
  user: UserAccount | null;
  setUser: (user: UserAccount | null) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate on mount if cookie exists
  useEffect(() => {
    const checkSession = async () => {
      const googleId = getCookie("googleId");
      if (googleId && !user) {
        // Fallback: If page reloads, fetch from DB
        const userData = await fetchUserAccount(googleId);
        setUser(userData);
      }
      setIsLoading(false);
    };
    checkSession();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
};