"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useGoogleId } from "@/hooks/googleId";
import { useEffect } from "react";  

export default function GoogleLoginButton() {
  const { googleId, setGoogleId } = useGoogleId();

  return (
    <GoogleLogin
      onSuccess={async (credentialResponse) => {
        const token = credentialResponse.credential;

        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const responseJson = await res.json();
        setGoogleId(responseJson.user.googleId);

        document.cookie = `googleId=${responseJson.user.googleId}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;

      }}
      onError={() => console.log("Login Failed")}
    />
  );
}
