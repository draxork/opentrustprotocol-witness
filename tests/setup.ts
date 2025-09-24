/**
 * Test setup configuration
 */

// Global test configuration
beforeAll(() => {
  console.log('🧪 Setting up OpenTrust Protocol Witness tests...');
});

afterAll(() => {
  console.log('✅ OpenTrust Protocol Witness tests completed');
});

// Mock console methods for cleaner test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  // Suppress console output during tests
  console.log = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  // Restore console output
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});
