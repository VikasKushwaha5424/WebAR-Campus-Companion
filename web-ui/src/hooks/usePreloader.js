import { useState, useRef, useCallback, useEffect } from 'react';

const PRELOAD_CACHE = 'maya-asset-cache';

export default function usePreloader() {
  const [loaded, setLoaded] = useState(0);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(false);

  const preload = useCallback(async (urls) => {
    if (!urls || urls.length === 0) {
      setDone(true);
      return;
    }

    abortRef.current = false;
    setTotal(urls.length);
    setLoaded(0);
    setError(null);
    setDone(false);

    let completed = 0;
    for (const url of urls) {
      if (abortRef.current) break;
      try {
        const cache = await caches.open(PRELOAD_CACHE);
        const existing = await cache.match(url);
        if (existing) {
          completed++;
          setLoaded(completed);
          continue;
        }
        const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
        if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
        await cache.put(url, res);
        completed++;
        setLoaded(completed);
      } catch (err) {
        if (!abortRef.current) {
          setError(err.message);
        }
        completed++;
        setLoaded(completed);
      }
    }

    if (!abortRef.current) {
      setDone(true);
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current = true;
  }, []);

  const clearCache = useCallback(async () => {
    try {
      await caches.delete(PRELOAD_CACHE);
    } catch {}
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current = true;
    };
  }, []);

  return { preload, cancel, clearCache, loaded, total, done, error, progress: total > 0 ? loaded / total : 1 };
}
