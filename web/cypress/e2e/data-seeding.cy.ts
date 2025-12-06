/// <reference types="cypress" />

/**
 * Fixture-Driven Tests & Deterministic Test Data
 * 
 * These tests demonstrate:
 * - Deterministic test data fixtures
 * - Test isolation through clean state (cookies, localStorage)
 * - Design for testability with data-cy attributes
 * - Using fixtures for predictable test scenarios
 * 
 * Note: These tests use API intercepts and fixtures instead of
 * actual database seeding for safety and test isolation.
 */

describe('Fixture-Driven Tests with Deterministic Data', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  it('should use consistent fixture data for posts', () => {
    // Use fixture data to mock API responses
    cy.intercept('GET', '/api/posts*', { fixture: 'posts.json' }).as('getPosts')
    cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
    
    cy.loginAsStudent()
    cy.visit('/')
    cy.wait('@getPosts')
    
    // Verify posts are loaded from fixture
    cy.get('[data-cy="lab-card"], .lab-card', { timeout: 5000 }).should('have.length.at.least', 1)
    
    // Verify we can access specific post
    cy.get('[data-cy="lab-card"], .lab-card').first().within(() => {
      cy.get('[data-cy="lab-title"], .lab-name, h2').should('exist')
      cy.get('[data-cy="learn-more-link"], a.learn-more').should('exist')
    })
  })

  it('should use fixture data for applications', () => {
    cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
    cy.intercept('POST', '/api/auth/login', { statusCode: 200, body: { success: true } }).as('login')
    
    // Login
    cy.visit('/login?role=student')
    cy.get('input[name="email"]').type('test@ucla.edu')
    cy.get('input[name="password"]').type('password')
    cy.get('button[type="submit"]').click()
    cy.wait('@login')
    cy.url({ timeout: 10000 }).should('not.include', '/login')
    
    // Check applications using fixture
    cy.intercept('GET', '/api/applications/my-applications', { fixture: 'applications.json' }).as('getApplications')
    cy.visit('/my-applications')
    cy.wait('@getApplications', { timeout: 5000 })
    
    // Verify applications page loads
    cy.get('[data-cy="applications-list"], .application-card, main', { timeout: 5000 }).should('exist')
  })

  it('should use fixture data for researcher posts', () => {
    cy.intercept('GET', '/api/auth/me', { fixture: 'researcher-user.json' }).as('getUser')
    cy.intercept('POST', '/api/auth/login', { statusCode: 200, body: { success: true } }).as('login')
    
    // Login as researcher
    cy.visit('/login?role=researcher')
    cy.get('input[name="email"]').type('research@ucla.edu')
    cy.get('input[name="password"]').type('password')
    cy.get('button[type="submit"]').click()
    cy.wait('@login')
    cy.url({ timeout: 10000 }).should('not.include', '/login')
    
    // Verify researcher can access their posts using fixture
    cy.intercept('GET', '/api/posts/my-posts', { fixture: 'my-posts.json' }).as('getMyPosts')
    cy.visit('/my-posts')
    cy.wait('@getMyPosts', { timeout: 5000 })
    cy.get('[data-cy="my-posts-page"], .my-posts-page, main', { timeout: 5000 }).should('exist')
  })

  it('should maintain test isolation using fixtures', () => {
    // This test verifies that using fixtures ensures test isolation
    // Each test gets the same predictable data
    
    cy.fixture('test-seed-data.json').then((seedData) => {
      // Verify fixture structure is consistent
      expect(seedData).to.have.property('users')
      expect(seedData).to.have.property('posts')
      expect(seedData).to.have.property('applications')
      
      // Fixtures ensure deterministic behavior across test runs
      cy.log(`Fixture contains ${seedData.posts.length} test posts`)
    })
  })
})

describe('Fixture Data Structure Validation', () => {
  beforeEach(() => {
    cy.fixture('test-seed-data.json').as('seedData')
  })

  it('should use fixture data for predictable test scenarios', () => {
    cy.get('@seedData').then((seedData: any) => {
      // Use fixture data to create deterministic test scenarios
      const testStudent = seedData.users.testStudent
      
      cy.visit('/signup?role=student')
      cy.get('input[name="name"]').type(testStudent.name)
      cy.get('input[name="email"]').type(testStudent.email)
      cy.get('input[name="uclaId"]').type(testStudent.uclaId)
      
      // Verify form accepts fixture data
      cy.get('input[name="name"]').should('have.value', testStudent.name)
      cy.get('input[name="email"]').should('have.value', testStudent.email)
    })
  })

  it('should validate post structure from fixtures', () => {
    cy.get('@seedData').then((seedData: any) => {
      const testPost = seedData.posts[0]
      
      // Verify fixture structure is valid
      expect(testPost).to.have.property('title')
      expect(testPost).to.have.property('body')
      expect(testPost).to.have.property('tags')
      expect(testPost).to.have.property('questions')
      expect(testPost.questions).to.be.an('array')
      
      // Can use this fixture data to mock API responses
      cy.intercept('GET', '/api/posts/1', { body: testPost }).as('getPost')
    })
  })

  it('should test application states from fixtures', () => {
    cy.get('@seedData').then((seedData: any) => {
      const applications = seedData.applications
      
      // Verify we have different application states for testing
      const statuses = applications.map((app: any) => app.status)
      expect(statuses).to.include('PENDING')
      expect(statuses).to.include('ACCEPTED')
      
      // Can use these fixtures to test different application workflows
      cy.log(`Fixture contains ${applications.length} test applications with states: ${statuses.join(', ')}`)
    })
  })
})

