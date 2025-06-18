import { render, act } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock store configuration
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { user: null, isAuthenticated: false, loading: false }, action) => {
        switch (action.type) {
          case 'auth/setUser':
            return { ...state, user: action.payload, isAuthenticated: true };
          case 'auth/clearUser':
            return { ...state, user: null, isAuthenticated: false };
          case 'auth/setLoading':
            return { ...state, loading: action.payload };
          default:
            return state;
        }
      },
      cart: (state = { items: [], total: 0 }, action) => {
        switch (action.type) {
          case 'cart/addItem':
            return { ...state, items: [...state.items, action.payload] };
          case 'cart/clearCart':
            return { ...state, items: [], total: 0 };
          default:
            return state;
        }
      },
      ...initialState
    }
  });
};

// Enhanced render function with providers
export const renderWithProviders = (
  ui,
  {
    initialState = {},
    store = createMockStore(initialState),
    route = '/',
    ...renderOptions
  } = {}
) => {
  // Set initial route
  window.history.pushState({}, 'Test page', route);

  const Wrapper = ({ children }) => (
    <Provider store={store}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  );

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  };
};

// Async operation helper with act()
export const actAsync = async (fn) => {
  await act(async () => {
    await fn();
  });
};

// Timer advancement helper
export const advanceTimersAsync = async (ms = 0) => {
  await act(async () => {
    if (ms > 0) {
      vi.advanceTimersByTime(ms);
    } else {
      await vi.runOnlyPendingTimersAsync();
    }
  });
};

// Wait for state updates
export const waitForStateUpdate = async (callback, timeout = 1000) => {
  await act(async () => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const check = () => {
        if (callback()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          resolve(); // Timeout, but don't throw
        } else {
          setTimeout(check, 10);
        }
      };
      
      check();
    });
  });
};

// Mock fetch helper
export const createMockFetch = (responses = {}) => {
  return vi.fn().mockImplementation((url, options) => {
    const key = `${options?.method || 'GET'} ${url}`;
    const response = responses[key] || responses[url] || { data: {} };
    
    if (response.error) {
      return Promise.reject(new Error(response.error));
    }
    
    return Promise.resolve({
      ok: response.ok !== false,
      status: response.status || 200,
      json: () => Promise.resolve(response.data || response),
      text: () => Promise.resolve(JSON.stringify(response.data || response))
    });
  });
};

// Component testing helper
export class ComponentTestHelper {
  constructor() {
    this.mocks = new Map();
    this.timers = false;
  }

  // Setup fake timers with proper cleanup
  setupTimers() {
    vi.useFakeTimers();
    this.timers = true;
    return this;
  }

  // Mock a module (Note: vi.mock must be called at top level, this is just for tracking)
  mockModule(modulePath, implementation) {
    // vi.mock must be called at top level, so we can't do it here
    // This is just for tracking what was mocked
    this.mocks.set(modulePath, implementation);
    return this;
  }

  // Mock a global
  mockGlobal(name, implementation) {
    const original = global[name];
    global[name] = implementation;
    this.mocks.set(`global.${name}`, { original, mock: implementation });
    return this;
  }

  // Mock fetch globally
  mockFetch(responses) {
    const mockFetch = createMockFetch(responses);
    global.fetch = mockFetch;
    this.mocks.set('global.fetch', mockFetch);
    return mockFetch;
  }

  // Mock clipboard
  mockClipboard() {
    const mockClipboard = {
      writeText: vi.fn(() => Promise.resolve()),
      readText: vi.fn(() => Promise.resolve(''))
    };
    global.navigator.clipboard = mockClipboard;
    this.mocks.set('global.navigator.clipboard', mockClipboard);
    return mockClipboard;
  }

  // Render component with all providers
  render(component, options = {}) {
    return renderWithProviders(component, options);
  }

  // Wait for async operations
  async waitForAsync(ms = 100) {
    if (this.timers) {
      await advanceTimersAsync(ms);
    } else {
      await actAsync(async () => {
        await new Promise(resolve => setTimeout(resolve, ms));
      });
    }
  }

  // Clean up all mocks and timers
  cleanup() {
    // Restore globals
    for (const [key, value] of this.mocks.entries()) {
      if (key.startsWith('global.')) {
        const prop = key.replace('global.', '');
        if (value.original !== undefined) {
          global[prop] = value.original;
        } else {
          delete global[prop];
        }
      }
    }

    // Clear mocks
    vi.clearAllMocks();
    this.mocks.clear();

    // Restore timers
    if (this.timers) {
      vi.useRealTimers();
      this.timers = false;
    }
  }
}

// Factory function
export const createComponentTestHelper = () => new ComponentTestHelper();

// Common test patterns
export const testPatterns = {
  // Test a component that makes API calls
  async testAsyncComponent(component, apiCalls = {}) {
    const helper = createComponentTestHelper();
    const mockFetch = helper.mockFetch(apiCalls);
    
    const result = helper.render(component);
    await helper.waitForAsync();
    
    return { ...result, mockFetch, helper };
  },

  // Test a component with timers
  async testTimerComponent(component, timerAdvanceMs = 1000) {
    const helper = createComponentTestHelper().setupTimers();
    
    const result = helper.render(component);
    await helper.waitForAsync(timerAdvanceMs);
    
    return { ...result, helper };
  },

  // Test authenticated component
  async testAuthenticatedComponent(component, user = { id: '1', email: 'test@example.com' }) {
    const helper = createComponentTestHelper();
    
    const result = helper.render(component, {
      initialState: {
        auth: { user, isAuthenticated: true, loading: false }
      }
    });
    
    return { ...result, helper };
  }
};

export default {
  renderWithProviders,
  actAsync,
  advanceTimersAsync,
  waitForStateUpdate,
  createMockFetch,
  ComponentTestHelper,
  createComponentTestHelper,
  testPatterns
};