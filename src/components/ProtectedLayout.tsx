'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem('token');
      localStorage.removeItem('msalToken');
      router.replace('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  // Periodically check token expiry (every 60 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        localStorage.removeItem('token');
        localStorage.removeItem('msalToken');
        router.replace('/login');
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
