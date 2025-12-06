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
    // Mock login API call
    cy.intercept('POST', '/api/auth/login', { statusCode: 200, body: { success: true } }).as('login')
    cy.intercept('GET', '/api/auth/me', { fixture: 'researcher-user.json' }).as('getUser')
    cy.intercept('GET', '/api/posts/my-posts', { fixture: 'my-posts.json' }).as('getMyPosts')
    
    // Login first
    cy.visit('/login?role=researcher')
    cy.get('input[name="email"]').type('research@ucla.edu')
    cy.get('input[name="password"]').type('research')
    cy.get('button[type="submit"]').click()
    cy.wait('@login', { timeout: 5000 })
    
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

  it('should measure API response times (mocked)', () => {
    // IMPORTANT: Server-side API calls cannot be intercepted by Cypress
    // - /api/auth/me is called server-side in page.tsx (Next.js server component)
    // - /api/posts may also be server-side depending on implementation
    // This test measures mocked client-side API calls using intercepts
    
    // Intercept the login API call with a mock response
    cy.intercept({
      method: 'POST',
      url: '**/api/auth/login',
    }, { statusCode: 200, body: { success: true }, delay: 100 }).as('login')
    
    cy.visit('/login?role=researcher')
    cy.get('input[name="email"]').type('research@ucla.edu')
    cy.get('input[name="password"]').type('research')
    
    // Measure mocked login API call timing
    cy.window().then((win) => {
      win.performance.mark('api-request-start')
    })
    
    cy.get('button[type="submit"]').click()
    
    // Wait for the mocked login request to complete
    cy.wait('@login', { timeout: 10000 }).then((interception) => {
      cy.window().then((win) => {
        win.performance.mark('api-request-end')
        win.performance.measure('api-request', 'api-request-start', 'api-request-end')
        const measure = win.performance.getEntriesByName('api-request')[0] as PerformanceMeasure
        
        cy.log(`[OPTIMIZED] Mocked Login API response time: ${measure.duration.toFixed(2)}ms`)
        cy.log(`[OPTIMIZED] Login API status: ${interception.response?.statusCode || 200}`)
        cy.task('log', `OPTIMIZED - Login API (mocked): ${measure.duration.toFixed(2)}ms`)
        
        // Verify response was intercepted correctly
        expect(measure.duration).to.be.lessThan(500)
      })
    })
    
    cy.log('API response time measurement complete (using mocked responses)')
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

  it('should measure form submission function timing', () => {
    cy.intercept('POST', '/api/auth/login', { statusCode: 401, body: { error: 'Invalid credentials' } }).as('login')
    
    cy.visit('/login?role=student')
    
    // Measure form input timing
    cy.window().then((win) => {
      win.performance.mark('form-input-start')
    })
    
    cy.get('input[name="email"]').type('test@ucla.edu')
    cy.get('input[name="password"]').type('testpassword')
    
    cy.window().then((win) => {
      win.performance.mark('form-input-end')
      win.performance.measure('form-input', 'form-input-start', 'form-input-end')
      const measure = win.performance.getEntriesByName('form-input')[0] as PerformanceMeasure
      cy.log(`[OPTIMIZED] Form input time: ${measure.duration.toFixed(2)}ms`)
      cy.task('log', `OPTIMIZED - Form Input: ${measure.duration.toFixed(2)}ms`)
    })
    
    // Measure form submission timing
    cy.window().then((win) => {
      win.performance.mark('form-submit-start')
    })
    
    cy.get('button[type="submit"]').click()
    cy.wait('@login', { timeout: 5000 })
    
    cy.window().then((win) => {
      win.performance.mark('form-submit-end')
      win.performance.measure('form-submit', 'form-submit-start', 'form-submit-end')
      const measure = win.performance.getEntriesByName('form-submit')[0] as PerformanceMeasure
      cy.log(`[OPTIMIZED] Form submission time: ${measure.duration.toFixed(2)}ms`)
      cy.task('log', `OPTIMIZED - Form Submit: ${measure.duration.toFixed(2)}ms`)
      expect(measure.duration).to.be.lessThan(2000)
    })
  })

  it('should measure API response time with detailed metrics', () => {
    cy.intercept('POST', '/api/auth/login', { statusCode: 401, body: { error: 'Invalid credentials' } }).as('login')
    
    cy.visit('/login?role=student')
    
    cy.window().then((win) => {
      win.performance.mark('api-request-start')
    })
    
    cy.get('input[name="email"]').type('test@ucla.edu')
    cy.get('input[name="password"]').type('testpassword')
    cy.get('button[type="submit"]').click()
    
    cy.wait('@login', { timeout: 5000 }).then((interception) => {
      cy.window().then((win) => {
        win.performance.mark('api-request-end')
        win.performance.measure('api-request', 'api-request-start', 'api-request-end')
        const measure = win.performance.getEntriesByName('api-request')[0] as PerformanceMeasure
        
        // Measure different phases
        const requestTime = measure.startTime
        const responseTime = measure.duration
        
        cy.log(`[OPTIMIZED] API Request Start: ${requestTime.toFixed(2)}ms`)
        cy.log(`[OPTIMIZED] API Response Total: ${responseTime.toFixed(2)}ms`)
        cy.task('log', `OPTIMIZED - API Request Start: ${requestTime.toFixed(2)}ms`)
        cy.task('log', `OPTIMIZED - API Response Total: ${responseTime.toFixed(2)}ms`)
        
        expect(responseTime).to.be.lessThan(3000)
      })
    })
  })

  it('should measure toast notification render time', () => {
    cy.intercept('POST', '/api/auth/login', { statusCode: 401, body: { error: 'Invalid credentials' } }).as('login')
    
    cy.visit('/login?role=student')
    cy.get('input[name="email"]').type('test@ucla.edu')
    cy.get('input[name="password"]').type('testpassword')
    
    cy.window().then((win) => {
      win.performance.mark('toast-start')
    })
    
    cy.get('button[type="submit"]').click()
    cy.wait('@login', { timeout: 5000 })
    cy.get('.toast--error', { timeout: 2000 }).should('exist')
    
    cy.window().then((win) => {
      win.performance.mark('toast-end')
      win.performance.measure('toast-render', 'toast-start', 'toast-end')
      const measure = win.performance.getEntriesByName('toast-render')[0] as PerformanceMeasure
      cy.log(`[OPTIMIZED] Toast render time: ${measure.duration.toFixed(2)}ms`)
      cy.task('log', `OPTIMIZED - Toast Render: ${measure.duration.toFixed(2)}ms`)
      expect(measure.duration).to.be.lessThan(1500)
    })
  })

  it('should measure page interaction responsiveness', () => {
    cy.intercept('GET', '/api/posts*', { fixture: 'posts.json' }).as('getPosts')
    cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
    
    cy.loginAsStudent()
    cy.visit('/')
    cy.wait('@getPosts')
    
    // Measure click responsiveness
    cy.window().then((win) => {
      win.performance.mark('click-start')
    })
    
    cy.get('.lab-card').first().within(() => {
      cy.get('a.learn-more').should('exist').click()
    })
    
    cy.window().then((win) => {
      win.performance.mark('click-end')
      win.performance.measure('click-response', 'click-start', 'click-end')
      const measure = win.performance.getEntriesByName('click-response')[0] as PerformanceMeasure
      cy.log(`[OPTIMIZED] Click response time: ${measure.duration.toFixed(2)}ms`)
      cy.task('log', `OPTIMIZED - Click Response: ${measure.duration.toFixed(2)}ms`)
      expect(measure.duration).to.be.lessThan(500)
    })
  })

  it('should measure search/filter function performance', () => {
    cy.intercept('GET', '/api/posts*', { fixture: 'posts.json' }).as('getPosts')
    cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
    
    cy.loginAsStudent()
    cy.visit('/')
    cy.wait('@getPosts')
    cy.get('.lab-card', { timeout: 5000 }).should('exist')
    
    // Measure search input timing
    cy.window().then((win) => {
      win.performance.mark('search-start')
    })
    
    cy.get('.lab-search input', { timeout: 5000 }).type('AI')
    
    cy.window().then((win) => {
      win.performance.mark('search-end')
      win.performance.measure('search-filter', 'search-start', 'search-end')
      const measure = win.performance.getEntriesByName('search-filter')[0] as PerformanceMeasure
      cy.log(`[OPTIMIZED] Search/filter time: ${measure.duration.toFixed(2)}ms`)
      cy.task('log', `OPTIMIZED - Search/Filter: ${measure.duration.toFixed(2)}ms`)
      expect(measure.duration).to.be.lessThan(1000)
    })
  })

  it('should measure component mount and render lifecycle', () => {
    cy.visit('/login?role=student')
    
    cy.window().then((win) => {
      // Measure React component mount time
      win.performance.mark('component-mount-start')
    })
    
    cy.get('.auth-card', { timeout: 5000 }).should('exist')
    cy.get('input[name="email"]').should('be.visible')
    cy.get('input[name="password"]').should('be.visible')
    
    cy.window().then((win) => {
      win.performance.mark('component-mount-end')
      win.performance.measure('component-mount', 'component-mount-start', 'component-mount-end')
      const measure = win.performance.getEntriesByName('component-mount')[0] as PerformanceMeasure
      cy.log(`[OPTIMIZED] Component mount time: ${measure.duration.toFixed(2)}ms`)
      cy.task('log', `OPTIMIZED - Component Mount: ${measure.duration.toFixed(2)}ms`)
      expect(measure.duration).to.be.lessThan(1500)
    })
  })
})

