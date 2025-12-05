/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to measure page load performance
       * @example cy.measurePageLoad('/login')
       */
      measurePageLoad(url: string): Chainable<number>
    }
  }
}

Cypress.Commands.add('measurePageLoad', (url: string) => {
  return cy.visit(url).then(() => {
    return cy.window().then((win) => {
      const navigation = win.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const loadTime = navigation.loadEventEnd - navigation.fetchStart
      cy.log(`Page load time for ${url}: ${loadTime.toFixed(2)}ms`)
      return loadTime
    })
  })
})

export {}

