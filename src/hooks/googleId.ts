'use client';

import { useState, useEffect, useMemo  } from 'react';
import { getCookie } from '@/lib/client-utils';

export function useGoogleId() {
  const [googleId, setGoogleId] = useState<string | null>(null);

  useEffect(() => {
    const googleIdCookie = getCookie("googleId");
    // We only want to set it if it's different to prevent redundant updates
    if (googleIdCookie) {
      setGoogleId(googleIdCookie);
      console.log("Google ID from cookie:", googleIdCookie);
    }
  }, []); 

  // Memoize the return object
  // This ensures the object reference remains stable across re-renders
  // unless googleId actually changes.
  const contextValue = useMemo(() => ({ 
    googleId, 
    setGoogleId 
  }), [googleId]);

  return contextValue;
}