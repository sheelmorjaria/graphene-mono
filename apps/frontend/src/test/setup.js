import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

// Add Jest compatibility for existing tests
if (typeof global.jest === 'undefined') {
  global.jest = {
    fn: vi.fn,
    spyOn: vi.spyOn,
    mock: vi.mock,
    unmock: vi.unmock,
    clearAllMocks: vi.clearAllMocks,
    resetAllMocks: vi.resetAllMocks,
    restoreAllMocks: vi.restoreAllMocks,
    advanceTimersByTime: vi.advanceTimersByTime,
    runOnlyPendingTimers: vi.runOnlyPendingTimers,
    runAllTimers: vi.runAllTimers,
    useFakeTimers: vi.useFakeTimers,
    useRealTimers: vi.useRealTimers,
    requireActual: vi.importActual
  };
}

// Suppress console errors during tests unless actually needed
const originalError = console.error;
const originalWarn = console.warn;

// Cleanup after each test case and reset console
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  console.error = originalError;
  console.warn = originalWarn;
})

// Mock environment variables
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn()
  },
  writable: true
})

// Mock navigator.clipboard with configurable property
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      readText: vi.fn().mockImplementation(() => Promise.resolve('')),
      write: vi.fn().mockImplementation(() => Promise.resolve()),
      read: vi.fn().mockImplementation(() => Promise.resolve([])),
    },
    writable: true,
    configurable: true,
  });
} else {
  // If clipboard already exists, just mock the methods
  navigator.clipboard.writeText = vi.fn().mockImplementation(() => Promise.resolve());
  navigator.clipboard.readText = vi.fn().mockImplementation(() => Promise.resolve(''));
  navigator.clipboard.write = vi.fn().mockImplementation(() => Promise.resolve());
  navigator.clipboard.read = vi.fn().mockImplementation(() => Promise.resolve([]));
}

// Setup test environment globals
if (typeof global !== 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  global.IntersectionObserver = class IntersectionObserver {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  global.MutationObserver = class MutationObserver {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock window.scrollTo and other window methods
window.scrollTo = vi.fn();
window.scrollBy = vi.fn();
window.scroll = vi.fn();

// Mock URL constructor for environments that don't have it
if (typeof URL === 'undefined') {
  global.URL = class URL {
    constructor(url, base) {
      this.href = url;
      this.origin = base || 'http://localhost:3000';
      this.pathname = '/';
      this.search = '';
      this.hash = '';
    }
  };
}

// Mock fetch if not available
if (typeof global.fetch === 'undefined') {
  global.fetch = vi.fn();
}

beforeEach(() => {
  // Reset clipboard mocks
  if (navigator.clipboard) {
    navigator.clipboard.writeText = vi.fn().mockImplementation(() => Promise.resolve());
    navigator.clipboard.readText = vi.fn().mockImplementation(() => Promise.resolve(''));
    navigator.clipboard.write = vi.fn().mockImplementation(() => Promise.resolve());
    navigator.clipboard.read = vi.fn().mockImplementation(() => Promise.resolve([]));
  }

  // Suppress specific console warnings and errors during tests
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: React.createFactory() is deprecated') ||
       args[0].includes('Warning: Functions are not valid as a React child') ||
       args[0].includes('Warning: Each child in a list should have a unique "key" prop') ||
       args[0].includes('Warning: An update to') ||
       args[0].includes('act(...)'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: React.createFactory() is deprecated') ||
       args[0].includes('act(...)') ||
       args[0].includes('Warning: An update to') ||
       args[0].includes('was not wrapped in act'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

