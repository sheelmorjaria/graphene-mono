import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Create MSW server instance
export const server = setupServer();

// Default handlers that can be overridden in tests
export const defaultHandlers = [
  // CoinGecko API mock
  http.get('https://api.coingecko.com/api/v3/simple/price', ({ request }) => {
    const url = new URL(request.url);
    const ids = url.searchParams.get('ids');
    const vsCurrencies = url.searchParams.get('vs_currencies');
    
    if (ids === 'bitcoin' && vsCurrencies === 'gbp') {
      return HttpResponse.json({
        bitcoin: { gbp: 25000 }
      });
    }
    
    if (ids === 'monero' && vsCurrencies === 'gbp') {
      return HttpResponse.json({
        monero: { gbp: 161.23 }
      });
    }
    
    return HttpResponse.json({}, { status: 404 });
  }),

  // Blockonomics API mocks
  http.post('https://www.blockonomics.co/api/new_address', () => {
    return HttpResponse.json({
      address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
    });
  }),

  http.post('https://www.blockonomics.co/api/balance', async ({ request }) => {
    const body = await request.json();
    
    if (body && body.addr) {
      return HttpResponse.json({
        response: [{
          confirmed: 1000000,
          unconfirmed: 500000,
          tx_count: 5
        }]
      });
    }
    
    return HttpResponse.json({}, { status: 400 });
  }),

  http.get('https://www.blockonomics.co/api/tx_detail/:txHash', ({ params: _params }) => {
    return HttpResponse.json({
      confirmations: 6,
      block_height: 700000,
      time: 1640995200,
      fee: 1000,
      size: 250,
      out: []
    });
  }),

  // GloBee API mocks
  http.post('https://api.globee.com/v1/payment-request', () => {
    return HttpResponse.json({
      id: 'globee-payment-123',
      payment_address: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q',
      total: 1.9999,
      currency: 'XMR',
      expiration_time: '2024-01-01T12:00:00Z',
      payment_url: 'https://globee.com/payment/123',
      status: 'pending'
    });
  }),

  http.get('https://api.globee.com/v1/payment-request/:paymentId', ({ params }) => {
    return HttpResponse.json({
      id: params.paymentId,
      status: 'paid',
      confirmations: 12,
      paid_amount: 1.5,
      transaction_hash: 'abc123',
      payment_address: '4AdUndXHHZ...',
      created_at: '2024-01-01T10:00:00Z',
      expires_at: '2024-01-02T10:00:00Z'
    });
  })
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