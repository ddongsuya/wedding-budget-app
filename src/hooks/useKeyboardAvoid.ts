import { useEffect, type RefObject } from 'react';

/**
 * Detects mobile keyboard appearance via the visualViewport API
 * and auto-scrolls the container so the focused input stays visible.
 *
 * On desktop (or when visualViewport is unavailable) this is a no-op.
 *
 * @param containerRef - ref to the scrollable container (e.g. modal div)
 */
export function useKeyboardAvoid(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return; // no-op: browser doesn't support visualViewport

    const KEYBOARD_THRESHOLD = 100; // px – ignore tiny viewport changes (desktop resize, toolbar)

    let initialHeight = viewport.height;

    const handleResize = () => {
      const container = containerRef.current;
      if (!container) return;

      const heightDiff = initialHeight - viewport.height;

      // Only act when the viewport shrank significantly (keyboard opened)
      if (heightDiff < KEYBOARD_THRESHOLD) return;

      const focused = document.activeElement;
      if (
        !focused ||
        !(focused instanceof HTMLElement) ||
        !container.contains(focused)
      ) {
        return;
      }

      // Check if the focused element is an input-like element
      const tag = focused.tagName.toLowerCase();
      const isInput =
        tag === 'input' || tag === 'textarea' || tag === 'select' || focused.isContentEditable;
      if (!isInput) return;

      // Scroll the focused element into view within the container
      focused.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handleScroll = () => {
      // Update initial height when viewport scrolls (orientation change, etc.)
      initialHeight = viewport.height;
    };

    viewport.addEventListener('resize', handleResize);
    viewport.addEventListener('scroll', handleScroll);

    return () => {
      viewport.removeEventListener('resize', handleResize);
      viewport.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef]);
}
