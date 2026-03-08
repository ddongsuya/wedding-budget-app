import { useCallback, useRef, useEffect } from 'react';

interface UseInfiniteScrollOptions {
  /** Called when the sentinel element enters the viewport */
  onLoadMore: () => void;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Whether a load is currently in progress */
  isLoading: boolean;
  /** IntersectionObserver threshold (0–1). Defaults to 0.1 */
  threshold?: number;
}

/**
 * IntersectionObserver-based infinite scroll hook.
 *
 * Returns a ref callback to attach to a sentinel element at the bottom
 * of a list. When the sentinel becomes visible, `onLoadMore` is called
 * (provided `hasMore` is true and `isLoading` is false).
 *
 * @example
 * ```tsx
 * const sentinelRef = useInfiniteScroll({
 *   onLoadMore: () => fetchNextPage(),
 *   hasMore: data.hasNextPage,
 *   isLoading: isFetching,
 * });
 *
 * return (
 *   <div>
 *     {items.map(item => <Item key={item.id} {...item} />)}
 *     <div ref={sentinelRef} />
 *   </div>
 * );
 * ```
 */
export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 0.1,
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelNodeRef = useRef<HTMLElement | null>(null);

  // Keep a stable reference to the latest callback / flags so the
  // observer callback always sees current values without re-creating
  // the observer on every render.
  const stateRef = useRef({ onLoadMore, hasMore, isLoading });
  stateRef.current = { onLoadMore, hasMore, isLoading };

  // Clean up observer on unmount
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      // Disconnect previous observer if any
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      sentinelNodeRef.current = node;
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (
            entry?.isIntersecting &&
            stateRef.current.hasMore &&
            !stateRef.current.isLoading
          ) {
            stateRef.current.onLoadMore();
          }
        },
        { threshold },
      );

      observerRef.current.observe(node);
    },
    [threshold],
  );

  return sentinelRef;
}
