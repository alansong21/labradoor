// Component testing support file
import './commands'

// Cypress 13+ includes React mounting support
// The mount command is available via cypress/react
import { mount } from 'cypress/react'

// Augment Cypress namespace to include mount
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount
    }
  }
}

Cypress.Commands.add('mount', mount)

// Example: Import any global styles or providers here
// import '../../src/app/globals.css'

// Note: Next.js components (Link, Image, etc.) may need special handling
// Consider mocking them or testing components without Next.js-specific features

