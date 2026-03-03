'use client';

import { useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export function AxiosInterceptor({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
          // Return a resolved promise so the error doesn't propagate to the UI
          return new Promise(() => {});
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [router]);

  return <>{children}</>;
}
