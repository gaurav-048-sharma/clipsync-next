'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
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
    return null; // Or a loading spinner
  }

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
      <MsalProvider instance={msalInstance}>
        {children}
      </MsalProvider>
    </GoogleOAuthProvider>
  );
}
