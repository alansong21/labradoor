# Cypress E2E Testing & Performance Benchmarking

## Setup

1. Install dependencies:
```bash
cd web
npm install
```

2. Make sure your dev server is running:
```bash
npm run dev
```

## Running Tests

### Open Cypress UI
```bash
npm run cypress:open
```

### Run all tests headlessly
```bash
npm run cypress:run
```

### Run only E2E tests
```bash
npm run test:e2e
```

## Test Suites

### Performance Tests (`cypress/e2e/performance.cy.ts`)
- Measures homepage load time
- Measures login/signup page load times
- Measures logged-in homepage load time
- Benchmarks API response times
- Measures component render times (FCP, DOM Content Loaded)
- Benchmarks multiple page navigations

### Functionality Tests (`cypress/e2e/functionality.cy.ts`)
- Navigation tests
- Form validation tests
- Error handling tests
- User interaction tests

## Performance Benchmarks

Current performance targets:
- Homepage: < 3000ms
- Login/Signup pages: < 2000ms
- API responses: < 500ms (auth), < 1000ms (posts)
- First Contentful Paint: < 2000ms
- DOM Content Loaded: < 2500ms

## Custom Commands

- `cy.measurePageLoad(url)` - Measures page load time for a given URL

