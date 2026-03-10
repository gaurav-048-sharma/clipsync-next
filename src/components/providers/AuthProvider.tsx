'use client';

// Google OAuth disabled — authentication is Microsoft-only
// import { GoogleOAuthProvider } from '@react-oauth/google';
import { MsalProvider } from '@azure/msal-react';
import { getMsalInstance } from '@/lib/config/msalConfig';
import { useEffect, useState } from 'react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [msalReady, setMsalReady] = useState(false);
  const msalInstance = getMsalInstance();

  useEffect(() => {
    msalInstance.initialize().then(() => {
      setMsalReady(true);
    });
  }, [msalInstance]);

  if (!msalReady) {
    return null;
  }

  return (
    <MsalProvider instance={msalInstance}>
      {children}
    </MsalProvider>
  );
}
