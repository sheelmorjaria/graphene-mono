import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Create MSW server instance
export const server = setupServer();

// Default handlers that can be overridden in tests
export const defaultHandlers = [
  // Add other API mocks here as needed
];

// Setup MSW server with default handlers
server.use(...defaultHandlers);

// Setup and teardown for tests
export function setupMSW() {
  // Enable request interception
  beforeAll(() => {
    server.listen({
      onUnhandledRequest: 'warn' // Warn about unhandled requests but don't fail tests
    });
  });

  // Reset handlers after each test but restore defaults
  afterEach(() => {
    server.resetHandlers(...defaultHandlers);
  });

  // Clean up after all tests
  afterAll(() => {
    server.close();
  });
}

// Helper function to override handlers for specific tests
export function mockApiResponse(url, response, options = {}) {
  const { method = 'get', status = 200 } = options;

  const handler = method === 'post'
    ? http.post(url, () => HttpResponse.json(response, { status }))
    : http.get(url, () => HttpResponse.json(response, { status }));

  server.use(handler);
}

// Helper function to mock API errors
export function mockApiError(url, options = {}) {
  const { method = 'get', status = 500, statusText = 'Internal Server Error' } = options;

  const handler = method === 'post'
    ? http.post(url, () => new Response(null, { status, statusText }))
    : http.get(url, () => new Response(null, { status, statusText }));

  server.use(handler);
}