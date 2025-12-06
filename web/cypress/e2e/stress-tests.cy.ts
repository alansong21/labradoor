/// <reference types="cypress" />

/**
 * Automated Stress Tests
 * 
 * These tests stress the system with:
 * - Rapid sequential operations
 * - Concurrent operations
 * - High-volume data scenarios
 * - Edge cases and boundary conditions
 * 
 * Purpose: Identify performance bottlenecks, memory leaks, and race conditions
 */

describe('Stress Tests - Rapid Sequential Operations', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  it('should handle rapid login/logout cycles', () => {
    const cycles = 5
    const times: number[] = []

    for (let i = 0; i < cycles; i++) {
      const startTime = Date.now()
      
      // Mock login and logout API calls
      cy.intercept('POST', '/api/auth/login', { statusCode: 200, body: { success: true } }).as(`login${i}`)
      cy.intercept('POST', '/api/auth/logout', { statusCode: 200, body: { success: true } }).as(`logout${i}`)
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as(`getUser${i}`)
      
      // Login
      cy.visit('/login?role=student')
      cy.get('input[name="email"]').type('test@ucla.edu')
      cy.get('input[name="password"]').type('password')
      cy.get('button[type="submit"]').click()
      cy.wait(`@login${i}`, { timeout: 5000 })
      
      // Simulate logout (just clear cookies, no API call)
      cy.clearCookies()
      cy.clearLocalStorage()
      
      const endTime = Date.now()
      times.push(endTime - startTime)
    }

    cy.then(() => {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      const maxTime = Math.max(...times)
      cy.log(`Average login/logout cycle: ${avgTime.toFixed(2)}ms`)
      cy.log(`Max cycle time: ${maxTime.toFixed(2)}ms`)
      
      // Assert performance doesn't degrade
      expect(avgTime).to.be.lessThan(10000)
      expect(maxTime).to.be.lessThan(15000)
    })
  })

  it('should handle rapid page navigation', () => {
    const pages = ['/', '/login?role=student', '/signup?role=student', '/']
    const times: number[] = []

    pages.forEach((page, index) => {
      const startTime = Date.now()
      cy.visit(page)
      cy.get('main, .auth-card, body', { timeout: 5000 }).should('exist')
      const endTime = Date.now()
      times.push(endTime - startTime)
    })

    cy.then(() => {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      cy.log(`Average page navigation: ${avgTime.toFixed(2)}ms`)
      expect(avgTime).to.be.lessThan(3000)
    })
  })

  it('should handle rapid form submissions', () => {
    cy.intercept('POST', '/api/auth/login', { statusCode: 401, body: { error: 'Invalid credentials' } }).as('login')
    
    const attempts = 10
    const startTime = Date.now()

    for (let i = 0; i < attempts; i++) {
      cy.visit('/login?role=student')
      cy.get('input[name="email"]').clear().type(`test${i}@ucla.edu`)
      cy.get('input[name="password"]').clear().type('wrongpassword')
      cy.get('button[type="submit"]').click()
      cy.wait('@login', { timeout: 5000 })
      cy.get('.toast--error', { timeout: 2000 }).should('exist')
    }

    cy.then(() => {
      const totalTime = Date.now() - startTime
      const avgTime = totalTime / attempts
      cy.log(`Average form submission time: ${avgTime.toFixed(2)}ms`)
      cy.log(`Total time for ${attempts} attempts: ${totalTime.toFixed(2)}ms`)
      expect(avgTime).to.be.lessThan(2000)
    })
  })
})

describe('Stress Tests - Concurrent Operations', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  it('should handle multiple API requests concurrently', () => {
    cy.intercept('POST', '/api/auth/login', { statusCode: 200, body: { success: true } }).as('login')
    cy.intercept('GET', '/api/posts*', { fixture: 'posts.json' }).as('getPosts')
    cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
    
    cy.loginAsStudent()
    
    // Trigger multiple concurrent requests by navigating and interacting
    cy.visit('/')
    cy.wait('@getPosts')
    cy.wait('@getUser')
    
    // Navigate to different pages rapidly
    cy.visit('/my-applications')
    cy.intercept('GET', '/api/applications/my-applications', { body: [] }).as('getApplications')
    cy.wait('@getApplications', { timeout: 5000 })
    
    cy.visit('/')
    cy.wait('@getPosts', { timeout: 5000 })
    
    // Verify all requests completed successfully
    cy.get('.lab-page, .empty-state', { timeout: 5000 }).should('exist')
  })

  it('should handle multiple toast notifications', () => {
    cy.visit('/login?role=student')
    
    // Trigger multiple error toasts rapidly
    const attempts = 5
    for (let i = 0; i < attempts; i++) {
      cy.intercept('POST', '/api/auth/login', { statusCode: 401, body: { error: 'Invalid credentials' } }).as(`login${i}`)
      cy.get('input[name="email"]').clear().type(`test${i}@ucla.edu`)
      cy.get('input[name="password"]').clear().type('wrong')
      cy.get('button[type="submit"]').click()
      cy.wait(`@login${i}`, { timeout: 5000 })
      cy.wait(200) // Small delay between attempts
    }
    
    // Verify toast handling works correctly
    cy.get('.toast--error', { timeout: 2000 }).should('exist')
  })
})

describe('Stress Tests - High Volume Data', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  it('should handle large number of posts', () => {
    // Generate large fixture data
    const largePosts = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      title: `Lab Position ${i + 1}`,
      summary: `Summary for lab ${i + 1}`,
      body: `Body content for lab position ${i + 1}`,
      tags: ['Research', 'Science'],
      createdAt: new Date().toISOString(),
      researcher: {
        user: {
          name: `Researcher ${i + 1}`
        }
      }
    }))

    cy.intercept('POST', '/api/auth/login', { statusCode: 200, body: { success: true } }).as('login')
    cy.intercept('GET', '/api/posts*', { body: largePosts }).as('getLargePosts')
    cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
    
    cy.loginAsStudent()
    cy.visit('/')
    
    const startTime = Date.now()
    cy.wait('@getLargePosts', { timeout: 10000 })
    
    cy.then(() => {
      const loadTime = Date.now() - startTime
      cy.log(`Load time for 100 posts: ${loadTime.toFixed(2)}ms`)
      
      // Verify page renders (even if paginated or virtualized)
      cy.get('.lab-page, .card-container, .empty-state', { timeout: 10000 }).should('exist')
      
      // Assert reasonable performance
      expect(loadTime).to.be.lessThan(5000)
    })
  })

  it('should handle long text content', () => {
    const longText = 'A'.repeat(10000) // 10KB of text
    
    cy.intercept('GET', '/api/posts/1', {
      id: 1,
      title: 'Test Post',
      body: longText,
      tags: [],
      createdAt: new Date().toISOString(),
      researcher: { user: { name: 'Test Researcher' } },
      questions: []
    }).as('getLongPost')
    
    cy.intercept('POST', '/api/auth/login', { statusCode: 200, body: { success: true } }).as('login')
    cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
    cy.loginAsStudent()
    
    cy.visit('/labs/1')
    cy.wait('@getLongPost', { timeout: 10000 })
    
    // Verify page still renders with long content
    cy.get('.lab-detail-page, .lab-detail-card', { timeout: 5000 }).should('exist')
  })
})

describe('Stress Tests - Edge Cases & Boundaries', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  it('should handle extremely long input values', () => {
    cy.visit('/signup?role=student')
    
    const longString = 'A'.repeat(1000)
    cy.get('input[name="name"]').type(longString)
    cy.get('input[name="email"]').type(`${longString}@ucla.edu`)
    
    // Verify form doesn't break
    cy.get('button[type="submit"]').should('exist')
    cy.get('form').should('exist')
  })

  it('should handle special characters in inputs', () => {
    cy.visit('/signup?role=student')
    
    const specialChars = '!@#$%^&*()_+-=[]{}|;:",.<>?/~`'
    cy.get('input[name="name"]').type(specialChars)
    
    // Verify form handles special characters
    cy.get('input[name="name"]').should('have.value', specialChars)
  })

  it('should handle rapid state changes', () => {
    cy.visit('/login?role=student')
    
    // Rapidly change input values
    for (let i = 0; i < 20; i++) {
      cy.get('input[name="email"]').clear().type(`test${i}@ucla.edu`)
      cy.wait(50) // Small delay
    }
    
    // Verify form still works
    cy.get('input[name="email"]').should('exist')
    cy.get('button[type="submit"]').should('be.visible')
  })

  it('should handle network delays gracefully', () => {
    cy.intercept('POST', '/api/auth/login', { statusCode: 200, body: { success: true } }).as('login')
    cy.intercept('GET', '/api/posts*', { delay: 2000, fixture: 'posts.json' }).as('slowPosts')
    cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
    
    cy.loginAsStudent()
    cy.visit('/')
    
    // Verify loading states work
    cy.get('.lab-page, .loading-wrapper, main', { timeout: 10000 }).should('exist')
    
    cy.wait('@slowPosts', { timeout: 10000 })
    
    // Verify content eventually loads
    cy.get('.lab-card, .card-container, .empty-state', { timeout: 5000 }).should('exist')
  })
})

