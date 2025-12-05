# Cypress Component Testing

Component testing allows you to test individual React components in isolation without needing to run the full application.

## Setup

Component testing is already configured in `cypress.config.ts`. You just need to install the dependency:

```bash
cd web
npm install
```

## Running Component Tests

### Interactive Mode (Recommended)
```bash
npm run cypress:open
```
Then select "Component Testing" from the Cypress UI.

### Headless Mode
```bash
npx cypress run --component
```

### Run Specific Component Test
```bash
npx cypress run --component --spec "cypress/component/Loading.cy.tsx"
```

## Writing Component Tests

### Basic Example

```tsx
import MyComponent from '../../src/app/components/MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    cy.mount(<MyComponent prop1="value" />)
    cy.get('.my-component').should('be.visible')
  })
})
```

### Testing with Props

```tsx
describe('Navbar', () => {
  it('should show login button when logged out', () => {
    cy.mount(<Navbar isLoggedIn={false} />)
    cy.contains('Login').should('be.visible')
  })

  it('should hide login button when logged in', () => {
    cy.mount(<Navbar isLoggedIn={true} />)
    cy.contains('Login').should('not.exist')
  })
})
```

### Testing User Interactions

```tsx
it('should handle button clicks', () => {
  cy.mount(<MyComponent />)
  cy.get('button').click()
  cy.get('.result').should('contain', 'Clicked!')
})
```

### Testing with State

```tsx
it('should update when state changes', () => {
  cy.mount(<Counter />)
  cy.contains('Count: 0')
  cy.get('button').click()
  cy.contains('Count: 1')
})
```

## Available Commands

- `cy.mount()` - Mount a React component
- Standard Cypress commands work: `cy.get()`, `cy.contains()`, `cy.click()`, etc.

## Example Test Files

- `Loading.cy.tsx` - Tests the Loading component
- `Navbar.cy.tsx` - Tests the Navbar component

## Tips

1. **Test in isolation** - Component tests don't need the full app running
2. **Mock dependencies** - Use props to pass mock data instead of API calls
3. **Test behavior, not implementation** - Focus on what users see/do
4. **Keep tests simple** - One component, one test file

## Differences from E2E Tests

| E2E Tests | Component Tests |
|-----------|----------------|
| Test full user flows | Test individual components |
| Need app running | No app needed |
| Slower | Faster |
| More realistic | More isolated |
| `cy.visit()` | `cy.mount()` |

## Troubleshooting

### "Cannot find module" errors
Make sure paths are relative to the component file:
```tsx
// ✅ Correct
import Loading from '../../src/app/components/Loading'

// ❌ Wrong
import Loading from '@/app/components/Loading'
```

### Styles not loading
Import global styles in `cypress/support/component.ts`:
```tsx
import '../../src/app/globals.css'
```

### Next.js components not working
Some Next.js features (like `next/link`) need special handling. Use `cy.stub()` to mock them or test the component without Next.js-specific features.

