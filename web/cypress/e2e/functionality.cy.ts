/// <reference types="cypress" />

describe('Functionality Tests', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  it('should navigate to login page', () => {
    cy.visit('/')
    cy.get('a[href*="/login"]').first().click()
    cy.url().should('include', '/login')
    cy.get('.auth-card').should('be.visible')
  })

  it('should navigate to signup page', () => {
    cy.visit('/')
    cy.get('a[href*="/signup"]').first().click()
    cy.url().should('include', '/signup')
    cy.get('.auth-card').should('be.visible')
  })

  it('should toggle between student and researcher on login', () => {
    cy.visit('/login?role=student')
    cy.get('.role-toggle__option').contains('Researcher').click()
    cy.url().should('include', 'role=researcher')
    // Check that the role pill exists (may be clipped but should exist in DOM)
    cy.get('.role-pill--researcher').should('exist')
    // Also verify the page content changed
    cy.contains('Researcher login').should('exist')
  })

  it('should show error on invalid login', () => {
    cy.visit('/login?role=student')
    cy.get('input[name="email"]').type('invalid@ucla.edu')
    cy.get('input[name="password"]').type('wrongpassword')
    cy.get('button[type="submit"]').click()
    
    cy.get('.toast--error', { timeout: 5000 }).should('be.visible')
    cy.get('.toast--error').should('contain', 'Login invalid')
  })

  it('should show field errors on login failure', () => {
    cy.visit('/login?role=student')
    cy.get('input[name="email"]').type('invalid@ucla.edu')
    cy.get('input[name="password"]').type('wrongpassword')
    cy.get('button[type="submit"]').click()
    
    cy.get('.auth-form-error', { timeout: 5000 }).should('be.visible')
    cy.get('.auth-input--error').should('have.length.at.least', 1)
  })

  it('should validate signup form', () => {
    cy.visit('/signup?role=student')
    
    // Try to submit empty form
    cy.get('button[type="submit"]').click()
    
    // Should show validation errors
    cy.get('input:invalid').should('have.length.at.least', 1)
  })

  it('should show password mismatch error', () => {
    cy.visit('/signup?role=student')
    cy.get('input[name="name"]').type('Test User')
    cy.get('input[name="email"]').type('test@ucla.edu')
    cy.get('input[name="password"]').type('password123')
    cy.get('input[name="confirmPassword"]').type('password456')
    cy.get('button[type="submit"]').click()
    
    cy.get('.toast--error', { timeout: 5000 }).should('be.visible')
    cy.get('.toast--error').should('contain', 'Passwords do not match')
  })
})

