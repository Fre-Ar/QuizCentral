import { useState, useEffect } from 'react';
import { getCookie } from '@/lib/utils';

export function useGoogleId() {
    const [googleId, setGoogleId] = useState<string | null>(null);
    const googleIdCookie = getCookie('googleId');
    
    useEffect(() => {
        const googleIdCookie = getCookie("googleId");
        if (googleIdCookie && googleIdCookie !== googleId) {
        setGoogleId(googleIdCookie);
        console.log("Google ID from cookie:", googleIdCookie);
        }
    }, []); // run once on mount

    return { googleId, setGoogleId };
}
