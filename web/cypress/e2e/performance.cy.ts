/// <reference types="cypress" />

describe('Performance Benchmarking', () => {
  beforeEach(() => {
    // Clear cookies and local storage
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  it('should measure homepage load time', () => {
    const startTime = Date.now()
    
    cy.visit('/', {
      onBeforeLoad: () => {
        cy.window().then((win) => {
          win.performance.mark('page-start')
        })
      },
    })
    
    cy.get('main').should('be.visible')
    
    cy.window().then((win) => {
      win.performance.mark('page-end')
      win.performance.measure('page-load', 'page-start', 'page-end')
      
      const measure = win.performance.getEntriesByName('page-load')[0] as PerformanceMeasure
      const loadTime = measure.duration
      
      cy.log(`[OPTIMIZED] Homepage load time: ${loadTime.toFixed(2)}ms`)
      cy.task('log', `OPTIMIZED - Homepage: ${loadTime.toFixed(2)}ms`)
      
      // Assert load time is under 3 seconds (adjust based on your needs)
      expect(loadTime).to.be.lessThan(3000)
    })
  })

  it('should measure login page load time', () => {
    cy.visit('/login?role=student')
    
    cy.window().then((win) => {
      const navigation = win.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const loadTime = navigation.loadEventEnd - navigation.fetchStart
      
      cy.log(`[OPTIMIZED] Login page load time: ${loadTime.toFixed(2)}ms`)
      cy.task('log', `OPTIMIZED - Login: ${loadTime.toFixed(2)}ms`)
      expect(loadTime).to.be.lessThan(2000)
    })
    
    cy.get('.auth-card').should('be.visible')
  })

  it('should measure signup page load time', () => {
    cy.visit('/signup?role=student')
    
    cy.window().then((win) => {
      const navigation = win.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const loadTime = navigation.loadEventEnd - navigation.fetchStart
      
      cy.log(`[OPTIMIZED] Signup page load time: ${loadTime.toFixed(2)}ms`)
      cy.task('log', `OPTIMIZED - Signup: ${loadTime.toFixed(2)}ms`)
      expect(loadTime).to.be.lessThan(2000)
    })
    
    cy.get('.auth-card').should('be.visible')
  })

  it('should measure logged-in page load time (researcher)', () => {
    // Login first
    cy.visit('/login?role=researcher')
    cy.get('input[name="email"]').type('research@ucla.edu')
    cy.get('input[name="password"]').type('research')
    cy.get('button[type="submit"]').click()
    
    // Wait for redirect - researcher goes to /my-posts
    cy.url({ timeout: 10000 }).should('include', '/my-posts')
    
    // Measure the full page load time (includes server-side API calls)
    cy.window().then((win) => {
      // Wait a bit for page to fully render
      cy.wait(500)
      
      const navigation = win.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart
        const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart
        
        cy.log(`[OPTIMIZED] Logged-in page load time (researcher - /my-posts): ${loadTime.toFixed(2)}ms`)
        cy.log(`[OPTIMIZED] DOM Content Loaded: ${domContentLoaded.toFixed(2)}ms`)
        cy.task('log', `OPTIMIZED - Logged-in Page (Researcher): ${loadTime.toFixed(2)}ms`)
        cy.task('log', `OPTIMIZED - DCL (Researcher): ${domContentLoaded.toFixed(2)}ms`)
        
        expect(loadTime).to.be.lessThan(5000) // More lenient for logged-in pages
      }
    })
    
    // Verify the page loaded
    cy.get('main, body', { timeout: 10000 }).should('be.visible')
  })

  it('should measure API response times (client-side only)', () => {
    // IMPORTANT: Server-side API calls cannot be intercepted by Cypress
    // - /api/auth/me is called server-side in page.tsx (Next.js server component)
    // - /api/posts may also be server-side depending on implementation
    // This test only measures client-side API calls that happen in the browser
    
    // Intercept the login API call - use a more flexible pattern
    cy.intercept({
      method: 'POST',
      url: '**/api/auth/login',
    }).as('login')
    
    cy.visit('/login?role=researcher')
    cy.get('input[name="email"]').type('research@ucla.edu')
    cy.get('input[name="password"]').type('research')
    
    // Measure login API call (client-side)
    cy.get('button[type="submit"]').click()
    
    // Wait for the login request to complete
    cy.wait('@login', { timeout: 10000 }).then((interception) => {
      // Log request info
      cy.log(`Login API request intercepted: ${interception.request.url}`)
      
      // Check if response exists - Cypress uses statusCode property
      const response = interception.response as any
      if (response && (response.statusCode !== undefined || response.status !== undefined)) {
        const status = response.statusCode || response.status
        const responseTime = response.headers?.['x-response-time'] 
          ? parseInt(response.headers['x-response-time'] as string)
          : 0
        
        cy.log(`[OPTIMIZED] Login API response time: ${responseTime}ms`)
        cy.log(`[OPTIMIZED] Login API status: ${status}`)
        cy.task('log', `OPTIMIZED - Login API: ${responseTime}ms (status: ${status})`)
        
        // Verify login was successful if we have a valid status
        if (typeof status === 'number') {
          expect(status).to.equal(200)
        }
      } else {
        // Response not available yet, but request was intercepted
        cy.log('Login API request intercepted (response not yet available)')
        cy.task('log', 'OPTIMIZED - Login API: Request intercepted (response pending)')
        // Don't assert on status if it's not available - redirect check will confirm success
      }
    })
    
    // Wait for redirect - this is the primary indicator that login worked
    // This is more reliable than checking the response status
    cy.url({ timeout: 10000 }).should('include', '/my-posts')
    cy.log('Login successful - redirected to /my-posts')
    
    // Note: /api/posts is likely called server-side in Next.js, so we can't intercept it
    // The login API call is the main client-side API we can measure
    cy.log('API response time measurement complete')
    cy.log('Note: Posts API is likely server-side and cannot be intercepted')
  })

  it('should measure component render times', () => {
    cy.visit('/')
    
    cy.window().then((win) => {
      // Measure time to first contentful paint
      const paintEntries = win.performance.getEntriesByType('paint')
      const fcp = paintEntries.find((entry: PerformanceEntry) => entry.name === 'first-contentful-paint')
      
      if (fcp) {
        cy.log(`[OPTIMIZED] First Contentful Paint: ${fcp.startTime.toFixed(2)}ms`)
        cy.task('log', `OPTIMIZED - FCP: ${fcp.startTime.toFixed(2)}ms`)
        expect(fcp.startTime).to.be.lessThan(2000)
      }
      
      // Measure time to interactive
      const navigation = win.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart
      cy.log(`[OPTIMIZED] DOM Content Loaded: ${domContentLoaded.toFixed(2)}ms`)
      cy.task('log', `OPTIMIZED - DCL: ${domContentLoaded.toFixed(2)}ms`)
      expect(domContentLoaded).to.be.lessThan(2500)
    })
  })

  it('should benchmark multiple page navigations', () => {
    const times: number[] = []
    
    const measureNavigation = (url: string) => {
      return cy.visit(url).then(() => {
        cy.window().then((win) => {
          const navigation = win.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
          const loadTime = navigation.loadEventEnd - navigation.fetchStart
          times.push(loadTime)
          cy.log(`${url} load time: ${loadTime.toFixed(2)}ms`)
        })
      })
    }
    
    measureNavigation('/')
      .then(() => measureNavigation('/login?role=student'))
      .then(() => measureNavigation('/signup?role=student'))
      .then(() => {
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length
        cy.log(`Average navigation time: ${avgTime.toFixed(2)}ms`)
        expect(avgTime).to.be.lessThan(2000)
      })
  })
})

