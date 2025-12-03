// Suppress console.error during tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
    console.error = jest.fn();
    console.warn = jest.fn();
});

afterAll(() => {
    console.error = originalError;
    console.warn = originalWarn;
});

// If a test fails, dump the console errors for debugging
afterEach(() => {
    if (global.jasmine && jasmine.getEnv().currentSpec.failedExpectations.length > 0) {
        console.error.mock.calls.forEach(call => originalError(...call));
    }
});