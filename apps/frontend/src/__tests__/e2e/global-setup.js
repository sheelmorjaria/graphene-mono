/**
 * Global setup for frontend E2E tests.
 * Runs before all test suites.
 */
async function globalSetup() {
  // Verify the frontend dev server is reachable
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
  try {
    const response = await fetch(baseURL);
    if (!response.ok) {
      console.warn(`Warning: Frontend server at ${baseURL} returned status ${response.status}`);
    }
  } catch {
    console.warn(`Warning: Could not reach frontend server at ${baseURL}. Ensure it is running.`);
  }
}

export default globalSetup;
