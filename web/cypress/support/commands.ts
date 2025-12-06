/// <reference types="cypress" />
import { credentials } from './credentials'

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to measure page load performance
       * @example cy.measurePageLoad('/login')
       */
      measurePageLoad(url: string): Chainable<number>
      
      /**
       * Login as a student
       * @example cy.loginAsStudent()
       */
      loginAsStudent(): Chainable<void>
      
      /**
       * Login as a researcher
       * @example cy.loginAsResearcher()
       */
      loginAsResearcher(): Chainable<void>
      
      /**
       * Login as an admin
       * @example cy.loginAsAdmin()
       */
      loginAsAdmin(): Chainable<void>
      
      /**
       * Logout current user
       * @example cy.logout()
       */
      logout(): Chainable<void>
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

Cypress.Commands.add('loginAsStudent', () => {
  cy.visit('/login?role=student')
  cy.get('input[name="email"]').type(credentials.student.email)
  cy.get('input[name="password"]').type(credentials.student.password)
  cy.get('button[type="submit"]').click()
  // Wait for redirect or success
  cy.url({ timeout: 10000 }).should('not.include', '/login')
})

Cypress.Commands.add('loginAsResearcher', () => {
  cy.visit('/login?role=researcher')
  cy.get('input[name="email"]').type(credentials.researcher.email)
  cy.get('input[name="password"]').type(credentials.researcher.password)
  cy.get('button[type="submit"]').click()
  // Wait for redirect to /my-posts (researcher homepage)
  cy.url({ timeout: 10000 }).should('include', '/my-posts')
})

Cypress.Commands.add('loginAsAdmin', () => {
  cy.visit('/admin/login')
  cy.get('input[name="email"]').type(credentials.admin.email)
  cy.get('input[name="password"]').type(credentials.admin.password)
  cy.get('button[type="submit"]').click()
  // Wait for redirect to admin dashboard
  cy.url({ timeout: 10000 }).should('include', '/admin/dashboard')
})

Cypress.Commands.add('logout', () => {
  // Look for logout button/link in navbar
  cy.get('body').then(($body) => {
    if ($body.find('a[href*="/logout"], button:contains("Logout"), a:contains("Logout")').length > 0) {
      cy.contains('Logout').click()
    } else {
      // Clear cookies and localStorage as fallback
      cy.clearCookies()
      cy.clearLocalStorage()
    }
  })
})

export {}

