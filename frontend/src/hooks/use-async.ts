'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/api/client';

export interface AsyncState<T> { data: T | null; loading: boolean; error: string | null }

/** Minimal SWR-like hook: fetch on mount/deps, expose refresh. */
export function useAsync<T>(fetcher: () => Promise<T>, deps: unknown[], opts: { skip?: boolean } = {}) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: !opts.skip, error: null });
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const run = useCallback(async () => {
    if (opts.skip) { setState({ data: null, loading: false, error: null }); return; }
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetcher();
      if (mounted.current) setState({ data, loading: false, error: null });
    } catch (e) {
      if (mounted.current) setState({ data: null, loading: false, error: e instanceof ApiError ? e.message : 'Something went wrong' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { void run(); }, [run]);
  return { ...state, refresh: run };
}
