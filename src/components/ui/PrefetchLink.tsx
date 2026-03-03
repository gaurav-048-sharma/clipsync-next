'use client';

import { useState, useCallback, ReactNode, CSSProperties } from 'react';
import { useRouter } from 'next/navigation';

// Cache to store prefetched data
const prefetchCache = new Map<string, { data: any; timestamp: number }>();

// Prefetch functions for different routes
const prefetchFunctions: Record<string, (token: string) => Promise<void>> = {
  '/events': async (token) => {
    if (prefetchCache.has('/events')) return;
    try {
      const response = await fetch('/api/events', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      prefetchCache.set('/events', { data, timestamp: Date.now() });
    } catch {
      console.log('Prefetch events failed silently');
    }
  },
  '/marketplace': async (token) => {
    if (prefetchCache.has('/marketplace')) return;
    try {
      const response = await fetch('/api/marketplace', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      prefetchCache.set('/marketplace', { data, timestamp: Date.now() });
    } catch {
      console.log('Prefetch marketplace failed silently');
    }
  },
  '/confessions': async (token) => {
    if (prefetchCache.has('/confessions')) return;
    try {
      const response = await fetch('/api/confessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      prefetchCache.set('/confessions', { data, timestamp: Date.now() });
    } catch {
      console.log('Prefetch confessions failed silently');
    }
  },
  '/dashboard': async (token) => {
    if (prefetchCache.has('/dashboard')) return;
    try {
      const response = await fetch('/api/users/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      prefetchCache.set('/dashboard', { data, timestamp: Date.now() });
    } catch {
      console.log('Prefetch dashboard failed silently');
    }
  },
};

// Get cached data (with 5 minute expiry)
export const getCachedData = (route: string) => {
  const cached = prefetchCache.get(route);
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    return cached.data;
  }
  prefetchCache.delete(route);
  return null;
};

// Clear cache for a specific route
export const clearCache = (route?: string) => {
  if (route) {
    prefetchCache.delete(route);
  } else {
    prefetchCache.clear();
  }
};

export interface PrefetchLinkProps {
  to?: string;
  href?: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

const PrefetchLink = ({
  to,
  href,
  children,
  className = '',
  style = {},
  onClick,
  disabled = false,
}: PrefetchLinkProps) => {
  const router = useRouter();
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [prefetched, setPrefetched] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const path = to || href || '/';

  const handleMouseEnter = useCallback(() => {
    if (prefetched || isPrefetching || !prefetchFunctions[path]) return;

    setIsPrefetching(true);

    const timeoutId = setTimeout(async () => {
      if (token) {
        await prefetchFunctions[path](token);
      }
      setPrefetched(true);
      setIsPrefetching(false);
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [path, token, prefetched, isPrefetching]);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    if (onClick) onClick(e);
    router.push(path);
  };

  return (
    <button
      className={`${className} ${isPrefetching ? 'cursor-wait' : ''}`}
      style={style}
      onMouseEnter={handleMouseEnter}
      onFocus={handleMouseEnter}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
      {isPrefetching && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
      )}
    </button>
  );
};

export default PrefetchLink;
