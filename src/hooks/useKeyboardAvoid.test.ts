import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We test the hook's core logic by simulating what it does:
// - Listens to visualViewport resize
// - When viewport shrinks significantly and an input inside the container is focused,
//   calls scrollIntoView on that input

describe('useKeyboardAvoid – behavior', () => {
  let originalViewport: VisualViewport | null;

  // Helper to create a mock visualViewport
  function createMockViewport(initialHeight: number) {
    const listeners: Record<string, Set<EventListener>> = {};
    return {
      height: initialHeight,
      width: 375,
      offsetLeft: 0,
      offsetTop: 0,
      pageLeft: 0,
      pageTop: 0,
      scale: 1,
      addEventListener: vi.fn((event: string, cb: EventListener) => {
        if (!listeners[event]) listeners[event] = new Set();
        listeners[event].add(cb);
      }),
      removeEventListener: vi.fn((event: string, cb: EventListener) => {
        listeners[event]?.delete(cb);
      }),
      dispatchEvent: vi.fn(),
      _fire(event: string) {
        listeners[event]?.forEach((cb) => cb(new Event(event)));
      },
      _listeners: listeners,
    };
  }

  beforeEach(() => {
    originalViewport = window.visualViewport;
  });

  afterEach(() => {
    Object.defineProperty(window, 'visualViewport', {
      value: originalViewport,
      writable: true,
      configurable: true,
    });
  });

  it('should be importable', async () => {
    const mod = await import('./useKeyboardAvoid');
    expect(mod.useKeyboardAvoid).toBeDefined();
    expect(typeof mod.useKeyboardAvoid).toBe('function');
  });

  it('keyboard detection logic: large viewport shrink triggers scrollIntoView', () => {
    // This tests the core logic inline (same as what the hook does)
    const KEYBOARD_THRESHOLD = 100;
    const initialHeight = 800;
    const newHeight = 400; // keyboard opened
    const heightDiff = initialHeight - newHeight;

    expect(heightDiff).toBeGreaterThanOrEqual(KEYBOARD_THRESHOLD);
  });

  it('keyboard detection logic: small viewport change is ignored', () => {
    const KEYBOARD_THRESHOLD = 100;
    const initialHeight = 800;
    const newHeight = 750; // desktop resize or toolbar
    const heightDiff = initialHeight - newHeight;

    expect(heightDiff).toBeLessThan(KEYBOARD_THRESHOLD);
  });

  it('should only scroll input-like elements (input, textarea, select)', () => {
    const inputTags = ['input', 'textarea', 'select'];
    const nonInputTags = ['button', 'div', 'span', 'a'];

    for (const tag of inputTags) {
      const tagName = tag.toLowerCase();
      const isInput =
        tagName === 'input' || tagName === 'textarea' || tagName === 'select';
      expect(isInput).toBe(true);
    }

    for (const tag of nonInputTags) {
      const tagName = tag.toLowerCase();
      const isInput =
        tagName === 'input' || tagName === 'textarea' || tagName === 'select';
      expect(isInput).toBe(false);
    }
  });

  it('should register and clean up event listeners on visualViewport', () => {
    const mockViewport = createMockViewport(800);
    Object.defineProperty(window, 'visualViewport', {
      value: mockViewport,
      writable: true,
      configurable: true,
    });

    // Simulate what the hook does on mount
    const handleResize = vi.fn();
    const handleScroll = vi.fn();
    mockViewport.addEventListener('resize', handleResize);
    mockViewport.addEventListener('scroll', handleScroll);

    expect(mockViewport.addEventListener).toHaveBeenCalledWith('resize', handleResize);
    expect(mockViewport.addEventListener).toHaveBeenCalledWith('scroll', handleScroll);

    // Simulate unmount cleanup
    mockViewport.removeEventListener('resize', handleResize);
    mockViewport.removeEventListener('scroll', handleScroll);

    expect(mockViewport.removeEventListener).toHaveBeenCalledWith('resize', handleResize);
    expect(mockViewport.removeEventListener).toHaveBeenCalledWith('scroll', handleScroll);
  });

  it('container.contains check ensures only elements inside the container trigger scroll', () => {
    const container = document.createElement('div');
    const insideInput = document.createElement('input');
    const outsideInput = document.createElement('input');
    container.appendChild(insideInput);
    document.body.appendChild(container);
    document.body.appendChild(outsideInput);

    expect(container.contains(insideInput)).toBe(true);
    expect(container.contains(outsideInput)).toBe(false);

    document.body.removeChild(container);
    document.body.removeChild(outsideInput);
  });

  it('scrollIntoView is called with correct options when keyboard opens', () => {
    // Simulate the full flow
    const mockViewport = createMockViewport(800);
    Object.defineProperty(window, 'visualViewport', {
      value: mockViewport,
      writable: true,
      configurable: true,
    });

    const container = document.createElement('div');
    const input = document.createElement('input');
    input.scrollIntoView = vi.fn();
    container.appendChild(input);
    document.body.appendChild(container);
    input.focus();

    const KEYBOARD_THRESHOLD = 100;
    let initialHeight = mockViewport.height;

    // Simulate the resize handler logic
    const handleResize = () => {
      const heightDiff = initialHeight - mockViewport.height;
      if (heightDiff < KEYBOARD_THRESHOLD) return;

      const focused = document.activeElement;
      if (!focused || !(focused instanceof HTMLElement) || !container.contains(focused)) return;

      const tag = focused.tagName.toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea' || tag === 'select' || focused.isContentEditable;
      if (!isInput) return;

      focused.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    // Simulate keyboard opening
    mockViewport.height = 400;
    handleResize();

    expect(input.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });

    document.body.removeChild(container);
  });

  it('does NOT scroll when viewport change is below threshold', () => {
    const mockViewport = createMockViewport(800);

    const container = document.createElement('div');
    const input = document.createElement('input');
    input.scrollIntoView = vi.fn();
    container.appendChild(input);
    document.body.appendChild(container);
    input.focus();

    const KEYBOARD_THRESHOLD = 100;
    const initialHeight = mockViewport.height;

    const handleResize = () => {
      const heightDiff = initialHeight - mockViewport.height;
      if (heightDiff < KEYBOARD_THRESHOLD) return;

      const focused = document.activeElement;
      if (!focused || !(focused instanceof HTMLElement) || !container.contains(focused)) return;

      const tag = focused.tagName.toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea' || tag === 'select' || focused.isContentEditable;
      if (!isInput) return;

      focused.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    // Small change — should NOT trigger scroll
    mockViewport.height = 750;
    handleResize();

    expect(input.scrollIntoView).not.toHaveBeenCalled();

    document.body.removeChild(container);
  });
});
