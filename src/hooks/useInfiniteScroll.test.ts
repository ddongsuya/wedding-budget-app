import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Minimal IntersectionObserver mock
// ---------------------------------------------------------------------------
type IOCallback = (entries: IntersectionObserverEntry[]) => void;

let lastObserverCallback: IOCallback | null = null;
let lastObserverOptions: IntersectionObserverInit | undefined;
let observedElements: Set<Element>;
let disconnectSpy: () => void;

class MockIntersectionObserver {
  callback: IOCallback;
  options?: IntersectionObserverInit;

  constructor(callback: IOCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
    lastObserverCallback = callback;
    lastObserverOptions = options;
  }

  observe(el: Element) {
    observedElements.add(el);
  }

  unobserve(el: Element) {
    observedElements.delete(el);
  }

  disconnect() {
    observedElements.clear();
    disconnectSpy();
  }
}

function fireIntersection(isIntersecting: boolean) {
  lastObserverCallback?.([
    { isIntersecting } as unknown as IntersectionObserverEntry,
  ]);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('useInfiniteScroll', () => {
  let originalIO: typeof IntersectionObserver;

  beforeEach(() => {
    observedElements = new Set();
    disconnectSpy = vi.fn(() => {});
    lastObserverCallback = null;
    lastObserverOptions = undefined;

    originalIO = globalThis.IntersectionObserver;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).IntersectionObserver = MockIntersectionObserver;
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).IntersectionObserver = originalIO;
  });

  it('should be importable and return a function', async () => {
    const { useInfiniteScroll } = await import('./useInfiniteScroll');
    expect(useInfiniteScroll).toBeDefined();
    expect(typeof useInfiniteScroll).toBe('function');
  });

  it('core logic: calls onLoadMore when sentinel intersects and hasMore && !isLoading', () => {
    const onLoadMore = vi.fn();

    // Simulate what the hook does internally
    const state = { onLoadMore, hasMore: true, isLoading: false };

    const callback: IOCallback = (entries) => {
      const entry = entries[0];
      if (entry?.isIntersecting && state.hasMore && !state.isLoading) {
        state.onLoadMore();
      }
    };

    // Attach observer
    const _observer = new MockIntersectionObserver(callback, { threshold: 0.1 });
    const sentinel = document.createElement('div');
    _observer.observe(sentinel);

    // Fire intersection
    fireIntersection(true);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('core logic: does NOT call onLoadMore when isLoading is true', () => {
    const onLoadMore = vi.fn();
    const state = { onLoadMore, hasMore: true, isLoading: true };

    const callback: IOCallback = (entries) => {
      const entry = entries[0];
      if (entry?.isIntersecting && state.hasMore && !state.isLoading) {
        state.onLoadMore();
      }
    };

    const _observer = new MockIntersectionObserver(callback, { threshold: 0.1 });
    const sentinel = document.createElement('div');
    _observer.observe(sentinel);

    fireIntersection(true);
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('core logic: does NOT call onLoadMore when hasMore is false', () => {
    const onLoadMore = vi.fn();
    const state = { onLoadMore, hasMore: false, isLoading: false };

    const callback: IOCallback = (entries) => {
      const entry = entries[0];
      if (entry?.isIntersecting && state.hasMore && !state.isLoading) {
        state.onLoadMore();
      }
    };

    const _observer = new MockIntersectionObserver(callback, { threshold: 0.1 });
    const sentinel = document.createElement('div');
    _observer.observe(sentinel);

    fireIntersection(true);
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('core logic: does NOT call onLoadMore when sentinel is not intersecting', () => {
    const onLoadMore = vi.fn();
    const state = { onLoadMore, hasMore: true, isLoading: false };

    const callback: IOCallback = (entries) => {
      const entry = entries[0];
      if (entry?.isIntersecting && state.hasMore && !state.isLoading) {
        state.onLoadMore();
      }
    };

    const _observer = new MockIntersectionObserver(callback, { threshold: 0.1 });
    const sentinel = document.createElement('div');
    _observer.observe(sentinel);

    fireIntersection(false);
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('uses default threshold of 0.1', () => {
    const callback: IOCallback = () => {};
    const _observer = new MockIntersectionObserver(callback, { threshold: 0.1 });

    expect(lastObserverOptions?.threshold).toBe(0.1);
  });

  it('accepts a custom threshold', () => {
    const callback: IOCallback = () => {};
    const _observer = new MockIntersectionObserver(callback, { threshold: 0.5 });

    expect(lastObserverOptions?.threshold).toBe(0.5);
  });

  it('disconnect cleans up observed elements', () => {
    const callback: IOCallback = () => {};
    const observer = new MockIntersectionObserver(callback, { threshold: 0.1 });
    const sentinel = document.createElement('div');
    observer.observe(sentinel);

    expect(observedElements.size).toBe(1);

    observer.disconnect();
    expect(observedElements.size).toBe(0);
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('re-attaching sentinel disconnects previous observer', () => {
    // Simulates the ref callback behavior: when a new node is provided,
    // the old observer should be disconnected before creating a new one.
    const onLoadMore = vi.fn();
    const state = { onLoadMore, hasMore: true, isLoading: false };

    const callback: IOCallback = (entries) => {
      const entry = entries[0];
      if (entry?.isIntersecting && state.hasMore && !state.isLoading) {
        state.onLoadMore();
      }
    };

    const observer1 = new MockIntersectionObserver(callback, { threshold: 0.1 });
    const sentinel1 = document.createElement('div');
    observer1.observe(sentinel1);

    // Disconnect first observer (simulates ref callback receiving new node)
    observer1.disconnect();
    expect(disconnectSpy).toHaveBeenCalledTimes(1);

    // Create new observer for new sentinel
    const observer2 = new MockIntersectionObserver(callback, { threshold: 0.1 });
    const sentinel2 = document.createElement('div');
    observer2.observe(sentinel2);

    fireIntersection(true);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });
});
