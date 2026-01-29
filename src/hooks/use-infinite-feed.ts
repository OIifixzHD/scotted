import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api-client';
interface UseInfiniteFeedOptions<T> {
  endpoint: string;
  initialLimit?: number;
}
export function useInfiniteFeed<T extends { id: string }>({ endpoint, initialLimit = 10 }: UseInfiniteFeedOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  // Keep track of the current endpoint to avoid race conditions
  const currentEndpointRef = useRef(endpoint);
  const fetchItems = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
        const currentCursor = reset ? null : cursor;
        const separator = endpoint.includes('?') ? '&' : '?';
        const url = `${endpoint}${separator}limit=${initialLimit}${currentCursor ? `&cursor=${currentCursor}` : ''}`;
        const res = await api<{ items: T[], next: string | null }>(url);
        // Check if endpoint changed while fetching
        if (currentEndpointRef.current !== endpoint) return;
        setItems(prev => {
            if (reset) return res.items;
            // Deduplicate items based on ID
            const existingIds = new Set(prev.map(i => i.id));
            const newItems = res.items.filter(i => !existingIds.has(i.id));
            return [...prev, ...newItems];
        });
        setCursor(res.next);
        setHasMore(!!res.next);
    } catch (err) {
        if (currentEndpointRef.current === endpoint) {
            setError(err instanceof Error ? err.message : 'Failed to fetch');
        }
    } finally {
        if (currentEndpointRef.current === endpoint) {
            setLoading(false);
        }
    }
  }, [endpoint, cursor, loading, initialLimit]);
  // Reset and fetch when endpoint changes
  useEffect(() => {
      currentEndpointRef.current = endpoint;
      setItems([]);
      setCursor(null);
      setHasMore(true);
      setLoading(false);
      setError(null);
      // Trigger initial fetch
      // We use a self-contained async function to avoid dependency issues with fetchItems
      const initialFetch = async () => {
          setLoading(true);
          try {
              const separator = endpoint.includes('?') ? '&' : '?';
              const url = `${endpoint}${separator}limit=${initialLimit}`;
              const res = await api<{ items: T[], next: string | null }>(url);
              if (currentEndpointRef.current === endpoint) {
                  setItems(res.items);
                  setCursor(res.next);
                  setHasMore(!!res.next);
              }
          } catch (err) {
              if (currentEndpointRef.current === endpoint) {
                  setError(err instanceof Error ? err.message : 'Failed to fetch');
              }
          } finally {
              if (currentEndpointRef.current === endpoint) {
                  setLoading(false);
              }
          }
      };
      initialFetch();
  }, [endpoint, initialLimit]);
  const loadMore = () => {
      if (!loading && hasMore) {
          fetchItems(false);
      }
  };
  const refresh = () => {
      return fetchItems(true);
  };
  return { items, loading, error, loadMore, hasMore, refresh };
}