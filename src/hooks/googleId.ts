'use client';

import { useState, useEffect } from 'react';
import { getCookie } from '@/lib/client-utils';

export function useGoogleId() {
    const [googleId, setGoogleId] = useState<string | null>(null);
    
    useEffect(() => {
        const googleIdCookie = getCookie("googleId");
        if (googleIdCookie && googleIdCookie !== googleId) {
        setGoogleId(googleIdCookie);
        console.log("Google ID from cookie:", googleIdCookie);
        }
    }, []); // run once on mount

    return { googleId, setGoogleId };
}
