'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Allow MSAL popup to process auth response before redirecting.
    // In a popup window, MSAL will handle the response and close the popup
    // automatically via AuthProvider/MsalProvider, so we skip the redirect.
    const isPopup = window.opener && window.opener !== window;
    if (!isPopup) {
      const token = localStorage.getItem('token');
      router.replace(token ? '/dashboard' : '/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
