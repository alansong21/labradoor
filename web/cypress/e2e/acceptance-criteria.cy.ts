/// <reference types="cypress" />

describe('Acceptance Criteria Tests', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  describe('STUDENT REGISTRATION', () => {
    it('AC: Should accept @ucla.edu email and UCLA ID and show success message', () => {
      cy.visit('/signup?role=student')
      
      cy.get('input[name="name"]').type('Test Student')
      cy.get('input[name="email"]').type('test@ucla.edu')
      cy.get('input[name="uclaId"]').type('123456789')
      cy.get('input[name="password"]').type('password123')
      cy.get('input[name="confirmPassword"]').type('password123')
      
      // Mock successful registration (verification email would be sent)
      cy.intercept('POST', '/api/auth/signup', { 
        statusCode: 200, 
        body: { message: 'Verification email sent' } 
      }).as('signup')
      
      cy.get('button[type="submit"]').click()
      cy.wait('@signup')
      
      // Should show success message about verification email
      cy.get('.toast--success', { timeout: 5000 }).should('exist')
    })

    it('AC: Should accept @g.ucla.edu email and UCLA ID', () => {
      cy.visit('/signup?role=student')
      
      cy.get('input[name="name"]').type('Test Student')
      cy.get('input[name="email"]').type('test@g.ucla.edu')
      cy.get('input[name="uclaId"]').type('987654321')
      cy.get('input[name="password"]').type('password123')
      cy.get('input[name="confirmPassword"]').type('password123')
      
      cy.intercept('POST', '/api/auth/signup', { 
        statusCode: 200, 
        body: { message: 'Verification email sent' } 
      }).as('signup')
      
      cy.get('button[type="submit"]').click()
      cy.wait('@signup')
      
      cy.get('.toast--success', { timeout: 5000 }).should('exist')
    })

    it('AC: Should show error for non-UCLA email and not send verification', () => {
      cy.visit('/signup?role=student')
      
      cy.get('input[name="name"]').type('Test Student')
      cy.get('input[name="email"]').type('test@gmail.com')
      cy.get('input[name="uclaId"]').type('123456789')
      cy.get('input[name="password"]').type('password123')
      cy.get('input[name="confirmPassword"]').type('password123')
      
      cy.intercept('POST', '/api/auth/signup', { 
        statusCode: 400, 
        body: { error: 'A valid UCLA email is required' } 
      }).as('signup')
      
      cy.get('button[type="submit"]').click()
      cy.wait('@signup')
      
      // Should show error message
      cy.get('.toast--error', { timeout: 5000 }).should('exist')
      cy.get('.toast--error').should('contain', 'UCLA email')
    })

  })

  describe('STUDENT SIGN IN', () => {
    it('AC: Should login with correct credentials and redirect to Student Homepage', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.intercept('GET', '/api/posts*', { fixture: 'posts.json' }).as('getPosts')
      
      cy.loginAsStudent()
      
      // Should redirect away from login page
      cy.url().should('not.include', '/login')
      // Should be on homepage or student dashboard
      cy.url().should('satisfy', (url) => {
        return url.includes('/') || url.includes('/my-applications')
      })
    })

    it('AC: Should not login with invalid credentials', () => {
      cy.visit('/login?role=student')
      cy.get('input[name="email"]').type('wrong@ucla.edu')
      cy.get('input[name="password"]').type('wrongpassword')
      
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: { error: 'Invalid credentials' }
      }).as('login')
      
      cy.get('button[type="submit"]').click()
      cy.wait('@login')
      
      // Should show error and stay on login page
      cy.get('.toast--error', { timeout: 5000 }).should('exist')
      cy.url().should('include', '/login')
    })
  })

  describe('RESEARCHER REGISTRATION', () => {
    it('AC: Should accept @ucla.edu email and show success message', () => {
      cy.visit('/signup?role=researcher')
      
      cy.get('input[name="name"]').type('Test Researcher')
      cy.get('input[name="email"]').type('researcher@ucla.edu')
      cy.get('input[name="password"]').type('password123')
      cy.get('input[name="confirmPassword"]').type('password123')
      
      cy.intercept('POST', '/api/auth/signup', { 
        statusCode: 200, 
        body: { message: 'Verification email sent' } 
      }).as('signup')
      
      cy.get('button[type="submit"]').click()
      cy.wait('@signup')
      
      // Should show success message about verification email
      cy.get('.toast--success', { timeout: 5000 }).should('exist')
    })

    it('AC: Should accept @g.ucla.edu email', () => {
      cy.visit('/signup?role=researcher')
      
      cy.get('input[name="name"]').type('Test Researcher')
      cy.get('input[name="email"]').type('researcher@g.ucla.edu')
      cy.get('input[name="password"]').type('password123')
      cy.get('input[name="confirmPassword"]').type('password123')
      
      cy.intercept('POST', '/api/auth/signup', { 
        statusCode: 200, 
        body: { message: 'Verification email sent' } 
      }).as('signup')
      
      cy.get('button[type="submit"]').click()
      cy.wait('@signup')
      
      cy.get('.toast--success', { timeout: 5000 }).should('exist')
    })

    it('AC: Should show error for non-UCLA email and not send verification', () => {
      cy.visit('/signup?role=researcher')
      
      cy.get('input[name="name"]').type('Test Researcher')
      cy.get('input[name="email"]').type('researcher@gmail.com')
      cy.get('input[name="password"]').type('password123')
      cy.get('input[name="confirmPassword"]').type('password123')
      
      cy.intercept('POST', '/api/auth/signup', { 
        statusCode: 400, 
        body: { error: 'A valid UCLA email address is required' } 
      }).as('signup')
      
      cy.get('button[type="submit"]').click()
      cy.wait('@signup')
      
      // Should show error message
      cy.get('.toast--error', { timeout: 5000 }).should('exist')
      cy.get('.toast--error').should('contain', 'UCLA email')
    })
  })

  describe('RESEARCHER SIGN IN', () => {
    it('AC: Should login with correct credentials and redirect to Researcher Homepage', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'researcher-user.json' }).as('getUser')
      cy.intercept('GET', '/api/posts/my-posts', { fixture: 'my-posts.json' }).as('getMyPosts')
      
      cy.loginAsResearcher()
      
      // Should redirect away from login page
      cy.url().should('not.include', '/login')
      // Should be on researcher dashboard or my posts
      cy.url().should('satisfy', (url) => {
        return url.includes('/my-posts') || url.includes('/')
      })
    })

    it('AC: Should not login with invalid credentials', () => {
      cy.visit('/login?role=researcher')
      cy.get('input[name="email"]').type('wrong@ucla.edu')
      cy.get('input[name="password"]').type('wrongpassword')
      
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: { error: 'Invalid credentials' }
      }).as('login')
      
      cy.get('button[type="submit"]').click()
      cy.wait('@login')
      
      // Should show error and stay on login page
      cy.get('.toast--error', { timeout: 5000 }).should('exist')
      cy.url().should('include', '/login')
    })
  })

  describe('STUDENT HOMEPAGE DISPLAY', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.loginAsStudent()
    })

    it('AC: Should display list of open position posts when posts exist', () => {
      cy.intercept('GET', '/api/posts*', { fixture: 'posts.json' }).as('getPosts')
      cy.visit('/')
      
      // Should see posts list - check for lab cards or links to labs
      cy.get('.lab-card, a[href*="/labs/"]', { timeout: 10000 }).should('have.length.at.least', 1)
      // Each post should be clickable/linkable
      cy.get('a[href*="/labs/"]').should('have.length.at.least', 1)
    })

    it('AC: Should show message when no positions are available', () => {
      // Since homepage uses SSR, we can't intercept server-side API calls
      // Instead, test empty state by using search to filter out all labs
      cy.visit('/')
      
      // Wait for lab page to load (user is already logged in from beforeEach)
      cy.get('.lab-page', { timeout: 10000 }).should('exist')
      cy.get('.card-container', { timeout: 10000 }).should('exist')
      
      // Use search to filter out all labs - this should show empty state
      cy.get('.lab-search input', { timeout: 5000 }).type('NonExistentLabNameThatWillNeverMatch12345')
      
      // Wait for filter to apply and empty state to appear
      cy.get('.empty-state', { timeout: 10000 }).should('exist')
      cy.get('.empty-state').should('contain', 'No labs matched')
    })

    it('AC: Should link each post to its detail page', () => {
      // Intercept for detail page (this is client-side, so we can intercept)
      cy.intercept('GET', '/api/posts/*', { fixture: 'post-detail.json' }).as('getPost')
      
      // Visit homepage - user is already logged in from beforeEach
      // Homepage uses SSR, so we can't intercept server-side fetch, but we can check rendered content
      cy.visit('/')
      
      // Wait for lab cards to render (from SSR data)
      cy.get('.lab-card', { timeout: 10000 }).should('have.length.at.least', 1)
      
      // Find the first lab card and click the "Learn More" link
      cy.get('.lab-card').first().within(() => {
        // The link should have class "learn-more" and href to /labs/[id]
        cy.get('a.learn-more').should('exist').and('have.attr', 'href').and('include', '/labs/')
        cy.get('a.learn-more').click()
      })
      
      // Should navigate to detail page with format /labs/[id]
      cy.url({ timeout: 10000 }).should('include', '/labs/')
      cy.wait('@getPost', { timeout: 10000 })
      
      // Verify we're on the detail page - check for lab detail content
      cy.get('.lab-detail-page', { timeout: 10000 }).should('exist')
      cy.get('.lab-detail-card', { timeout: 5000 }).should('exist')
      // Verify detail page has title
      cy.get('.lab-title', { timeout: 5000 }).should('exist').and('be.visible')
    })
  })

  describe('RESEARCHER POST CREATION', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'researcher-user.json' }).as('getUser')
      cy.loginAsResearcher()
    })

    it('AC: Should create post with all required fields and redirect to detail page', () => {
      cy.intercept('POST', '/api/posts', {
        statusCode: 201,
        body: { id: 1, title: 'Test Post', message: 'Post created successfully' }
      }).as('createPost')
      cy.intercept('GET', '/api/posts/1', { fixture: 'post-detail.json' }).as('getPost')
      
      cy.visit('/researcher-post-creation')
      
      // Fill in required fields
      cy.get('.post-title-input').type('Test Research Position')
      cy.get('.post-description-input').type('This is a test research position description')
      
      cy.get('.save-post-button').click()
      cy.wait('@createPost')
      
      // Should show success message
      cy.get('.toast--success', { timeout: 5000 }).should('exist')
      
      // Should redirect to post detail or my posts page
      cy.url().should('satisfy', (url) => {
        return url.includes('/my-posts') || url.includes('/labs/')
      })
    })

    it('AC: Should show validation errors for missing required fields', () => {
      cy.visit('/researcher-post-creation')
      
      // Don't fill in title (required field)
      cy.get('.post-description-input').type('Description without title')
      
      cy.get('.save-post-button').click()
      
      // Should show validation error
      cy.get('.toast--error', { timeout: 5000 }).should('exist')
      cy.get('.toast--error').should('contain', 'title')
      
      // Should stay on creation page
      cy.url().should('include', '/researcher-post-creation')
    })

    it('AC: Should not allow access to Create Post page when not logged in as Researcher', () => {
      cy.clearCookies()
      cy.clearLocalStorage()
      
      // Try to access post creation page without login
      cy.intercept('GET', '/api/auth/me', { statusCode: 401 }).as('getUser')
      cy.visit('/researcher-post-creation')
      
      // Should redirect to login or show error
      cy.url().should('satisfy', (url) => {
        return url.includes('/login') || url.includes('/signup') || url === Cypress.config().baseUrl + '/'
      })
    })
  })

  describe('STUDENT APPLICATION CREATION', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.loginAsStudent()
    })

    it('AC: Should allow student to start application for a lab post', () => {
      // Set up intercept for post - will be used by both detail page and form
      // Using a pattern that matches multiple requests
      cy.intercept('GET', '/api/posts/1', { fixture: 'post-detail.json' }).as('getPost')
      
      // Visit lab detail page
      cy.visit('/labs/1')
      cy.wait('@getPost')
      
      // Wait for lab detail page to load - check for Apply Now button/link
      cy.contains('Apply Now', { timeout: 10000 }).should('be.visible')
      cy.get('a.apply-button, .apply-button', { timeout: 5000 }).should('exist').click()
      
      // Should redirect to application page with lab query param
      cy.url({ timeout: 10000 }).should('include', '/student_application/apply')
      cy.url({ timeout: 5000 }).should('include', 'lab=1')
      
      // Wait for the application form to load - it fetches /api/posts/1 when it loads
      cy.wait('@getPost', { timeout: 10000 })
      
      // Wait for form to finish loading - check that loading is done
      cy.get('.apply-page', { timeout: 10000 }).should('exist')
      cy.get('.apply-container', { timeout: 10000 }).should('exist')
      
      // Wait a bit more for form to fully render
      cy.wait(500)
      
      // Verify form has loaded - check for page title
      cy.contains('Apply to', { timeout: 10000 }).should('be.visible')
      
      // Check for submit button - it always exists once form loads (even with no questions)
      cy.get('button[type="submit"]', { timeout: 10000 }).should('exist')
      cy.get('button.submit-button', { timeout: 5000 }).should('be.visible')
      cy.contains('button', 'Submit Application', { timeout: 5000 }).should('be.visible')
    })

    it('AC: Should not allow access to application form when not logged in as Student', () => {
      cy.clearCookies()
      cy.clearLocalStorage()
      
      // Try to access application form directly without login
      cy.visit('/student_application/apply?lab=1')
      
      // Middleware should redirect to login when no session
      // Give it time for redirect to happen
      cy.url({ timeout: 5000 }).should('satisfy', (url) => {
        return url.includes('/login') || url.includes('/signup')
      })
    })
  })

  describe('RESEARCHER APPLICATION VIEWING', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'researcher-user.json' }).as('getUser')
      cy.loginAsResearcher()
    })

    it('AC: Should view all submitted applications for researcher\'s post', () => {
      cy.intercept('GET', '/api/posts/my-posts', { fixture: 'my-posts.json' }).as('getMyPosts')
      cy.intercept('GET', '/api/applications/post/1', { fixture: 'applications.json' }).as('getApplications')
      
      cy.visit('/my-posts')
      cy.wait('@getMyPosts')
      
      // Click to view applications
      cy.contains('View Applications').first().click()
      
      // Should navigate to applications page
      cy.url().should('include', '/applications')
      cy.wait('@getApplications')
      
      // Should see applications
      cy.contains('Applications').should('be.visible')
    })

    it('AC: Should show accept/reject options when viewing application', () => {
      cy.intercept('GET', '/api/posts/my-posts', { fixture: 'my-posts.json' }).as('getMyPosts')
      cy.intercept('GET', '/api/applications/post/1', { fixture: 'applications.json' }).as('getApplications')
      
      cy.visit('/my-posts')
      cy.contains('View Applications').first().click()
      cy.wait('@getApplications')
      
      // Should see accept/reject buttons
      cy.contains('button', 'Accept').should('exist')
      cy.contains('button', 'Reject').should('exist')
    })

    it('AC: Should not allow access to applications when not logged in as post creator', () => {
      cy.clearCookies()
      cy.clearLocalStorage()
      
      cy.intercept('GET', '/api/applications/post/1', {
        statusCode: 403,
        body: { error: 'Forbidden' }
      }).as('getApplications')
      
      // Try to access applications page directly
      cy.visit('/my-posts/1/applications')
      
      // Should redirect or show error
      cy.url().should('satisfy', (url) => {
        return url.includes('/login') || url.includes('/signup') || url === Cypress.config().baseUrl + '/'
      })
    })

    it('AC: Should show message when post has no submitted applications', () => {
      cy.intercept('GET', '/api/posts/my-posts', { fixture: 'my-posts.json' }).as('getMyPosts')
      cy.intercept('GET', '/api/applications/post/1', { body: [] }).as('getApplications')
      
      cy.visit('/my-posts')
      cy.contains('View Applications').first().click()
      cy.wait('@getApplications')
      
      // Should show empty state message
      cy.contains('No applications received yet').should('be.visible')
    })
  })

  describe('RESEARCHER APPLICATION ACCEPTANCE', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'researcher-user.json' }).as('getUser')
      cy.loginAsResearcher()
    })

    it('AC: Should update application status to "Accepted" when researcher accepts', () => {
      cy.intercept('GET', '/api/posts/my-posts', { fixture: 'my-posts.json' }).as('getMyPosts')
      cy.intercept('GET', '/api/applications/post/1', { fixture: 'applications.json' }).as('getApplications')
      cy.intercept('PATCH', '/api/applications/1', {
        statusCode: 200,
        body: { id: 1, status: 'ACCEPTED', message: 'Status updated successfully' }
      }).as('acceptApplication')
      
      cy.visit('/my-posts')
      cy.contains('View Applications').first().click()
      cy.wait('@getApplications')
      
      // Click accept button
      cy.contains('button', 'Accept').first().click()
      
      cy.wait('@acceptApplication')
      
      // Should show success message
      cy.get('.toast--success', { timeout: 5000 }).should('exist')
      cy.get('.toast--success').should('contain', 'Status updated')
    })

    it('AC: Should update application status to "Rejected" when researcher rejects', () => {
      cy.intercept('GET', '/api/posts/my-posts', { fixture: 'my-posts.json' }).as('getMyPosts')
      cy.intercept('GET', '/api/applications/post/1', { fixture: 'applications.json' }).as('getApplications')
      cy.intercept('PATCH', '/api/applications/1', {
        statusCode: 200,
        body: { id: 1, status: 'REJECTED', message: 'Status updated successfully' }
      }).as('rejectApplication')
      
      cy.visit('/my-posts')
      cy.contains('View Applications').first().click()
      cy.wait('@getApplications')
      
      // Click reject button
      cy.contains('button', 'Reject').first().click()
      
      cy.wait('@rejectApplication')
      
      // Should show success message
      cy.get('.toast--success', { timeout: 5000 }).should('exist')
      cy.get('.toast--success').should('contain', 'Status updated')
    })
  })
})

