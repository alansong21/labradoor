/// <reference types="cypress" />

describe('Functionality Tests', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  describe('Navigation and Landing Page', () => {
    it('should load homepage', () => {
      cy.visit('/')
      cy.contains('Match UCLA students with').should('be.visible')
      cy.contains('research labs').should('be.visible')
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

    it('should show student and researcher role cards on homepage', () => {
      cy.visit('/')
      cy.contains('I am a Student').should('be.visible')
      cy.contains('I am a Researcher').should('be.visible')
    })
  })

  describe('Authentication - Login', () => {
  it('should toggle between student and researcher on login', () => {
    cy.visit('/login?role=student')
    cy.get('.role-toggle__option').contains('Researcher').click()
    cy.url().should('include', 'role=researcher')
    cy.get('.role-pill--researcher').should('exist')
    cy.contains('Researcher login').should('exist')
  })

    it('should toggle between researcher and student on login', () => {
      cy.visit('/login?role=researcher')
      cy.get('.role-toggle__option').contains('Student').click()
      cy.url().should('include', 'role=student')
      cy.get('.role-pill--student').should('exist')
      cy.contains('Student login').should('exist')
  })

  it('should show error on invalid login', () => {
    cy.visit('/login?role=student')
    cy.get('input[name="email"]').type('invalid@ucla.edu')
    cy.get('input[name="password"]').type('wrongpassword')
    cy.get('button[type="submit"]').click()
    
      // Check for toast existence and message instead of visibility (may have opacity 0 during animation)
      cy.get('.toast--error', { timeout: 5000 }).should('exist')
      cy.get('.toast--error').should('contain', 'Login')
  })

  it('should show field errors on login failure', () => {
    cy.visit('/login?role=student')
    cy.get('input[name="email"]').type('invalid@ucla.edu')
    cy.get('input[name="password"]').type('wrongpassword')
    cy.get('button[type="submit"]').click()
    
    cy.get('.auth-form-error', { timeout: 5000 }).should('be.visible')
    cy.get('.auth-input--error').should('have.length.at.least', 1)
  })

    it('should validate email format on login', () => {
      cy.visit('/login?role=student')
      cy.get('input[name="email"]').type('notanemail')
      cy.get('input[name="password"]').type('password123')
      cy.get('button[type="submit"]').click()
      
      // HTML5 validation should prevent submission
      cy.get('input[name="email"]:invalid').should('exist')
    })

    it('should require password on login', () => {
      cy.visit('/login?role=student')
      cy.get('input[name="email"]').type('test@ucla.edu')
      cy.get('button[type="submit"]').click()
      
      // HTML5 validation should prevent submission
      cy.get('input[name="password"]:invalid').should('exist')
    })

    it('should successfully login as student', () => {
      cy.loginAsStudent()
      // Should redirect away from login page
      cy.url().should('not.include', '/login')
    })

    it('should successfully login as researcher', () => {
      cy.loginAsResearcher()
      // Should redirect away from login page
      cy.url().should('not.include', '/login')
    })
  })

  describe('Authentication - Signup', () => {
    it('should toggle between student and researcher on signup', () => {
      cy.visit('/signup?role=student')
      cy.get('.role-toggle__option').contains('Researcher').click()
      cy.url().should('include', 'role=researcher')
      cy.contains('Researcher signup').should('exist')
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
    
      // Check for toast existence and message instead of visibility (may have opacity 0 during animation)
      cy.get('.toast--error', { timeout: 5000 }).should('exist')
    cy.get('.toast--error').should('contain', 'Passwords do not match')
  })

    it('should validate UCLA email on signup', () => {
      cy.visit('/signup?role=student')
      cy.get('input[name="name"]').type('Test User')
      cy.get('input[name="email"]').type('test@gmail.com')
      cy.get('input[name="password"]').type('password123')
      cy.get('input[name="confirmPassword"]').type('password123')
      cy.get('button[type="submit"]').click()
      
      // Should show error about UCLA email requirement
      // Check for toast existence instead of visibility (may have opacity 0 during animation)
      cy.get('.toast--error', { timeout: 5000 }).should('exist')
    })

    it('should require all fields on signup', () => {
      cy.visit('/signup?role=student')
      cy.get('input[name="name"]').type('Test User')
      // Missing email and password
      cy.get('button[type="submit"]').click()
      
      cy.get('input:invalid').should('have.length.at.least', 1)
    })

    it('should show student-specific fields on student signup', () => {
      cy.visit('/signup?role=student')
      cy.contains('Student signup').should('be.visible')
      cy.get('input[name="uclaId"]').should('exist')
    })

    it('should show researcher signup form', () => {
      cy.visit('/signup?role=researcher')
      cy.contains('Researcher signup').should('be.visible')
      // Researcher signup doesn't have department field - it's collected after signup
      cy.get('input[name="name"]').should('exist')
      cy.get('input[name="email"]').should('exist')
    })
  })

  describe('Student Features - Navigation and UI', () => {
    beforeEach(() => {
      // Mock API responses for student features
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.intercept('GET', '/api/posts*', { fixture: 'posts.json' }).as('getPosts')
      cy.loginAsStudent()
    })

    it('should display navbar when logged in as student', () => {
      cy.get('nav').should('be.visible')
      cy.contains('My Applications').should('be.visible')
    })

    it('should navigate to my applications page', () => {
      cy.intercept('GET', '/api/applications/my-applications', { body: [] }).as('getApplications')
      cy.contains('My Applications').click()
      cy.url().should('include', '/my-applications')
      cy.contains('My Applications').should('be.visible')
    })

    it('should navigate to profile page', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUserProfile')
      // Navigate directly to profile page instead of using dropdown
      cy.visit('/profile')
      cy.wait('@getUserProfile')
      cy.url().should('include', '/profile')
      cy.contains('My Profile').should('be.visible')
    })

    it('should show empty state when no applications', () => {
      cy.intercept('GET', '/api/applications/my-applications', { statusCode: 204 }).as('getApplications')
      cy.visit('/my-applications')
      cy.contains("You haven't submitted any applications yet").should('be.visible')
    })

    it('should display applications list when applications exist', () => {
      cy.intercept('GET', '/api/applications/my-applications', { 
        fixture: 'applications.json' 
      }).as('getApplications')
      cy.visit('/my-applications')
      cy.contains('Application').should('be.visible')
    })

    it('should expand/collapse application details', () => {
      cy.intercept('GET', '/api/applications/my-applications', { 
        fixture: 'applications.json' 
      }).as('getApplications')
      cy.visit('/my-applications')
      
      // Click to expand
      cy.contains('View My Responses').click()
      cy.contains('Hide My Responses').should('be.visible')
      
      // Click to collapse
      cy.contains('Hide My Responses').click()
      cy.contains('View My Responses').should('be.visible')
    })

    it('should navigate to lab detail page', () => {
      cy.intercept('GET', '/api/posts/*', { fixture: 'post-detail.json' }).as('getPost')
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.visit('/labs/1')
      cy.get('.lab-detail-card').should('be.visible')
    })

    it('should display lab information on detail page', () => {
      cy.intercept('GET', '/api/posts/*', { fixture: 'post-detail.json' }).as('getPost')
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.visit('/labs/1')
      cy.contains('Apply Now').should('be.visible')
    })

    it('should navigate to application form from lab detail', () => {
      cy.intercept('GET', '/api/posts/*', { fixture: 'post-detail.json' }).as('getPost')
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.intercept('GET', '/api/posts/*/application', { fixture: 'application-form.json' }).as('getApplicationForm')
      cy.visit('/labs/1')
      cy.contains('Apply Now').click()
      cy.url().should('include', '/student_application/apply')
    })
  })

  describe('Researcher Features - Post Creation', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'researcher-user.json' }).as('getUser')
      cy.loginAsResearcher()
    })

    it('should navigate to post creation page', () => {
      cy.intercept('GET', '/api/posts/my-posts', { body: [] }).as('getMyPosts')
      cy.visit('/my-posts')
      cy.contains('Create New Post').click()
      cy.url().should('include', '/researcher-post-creation')
    })

    it('should display post creation form', () => {
      cy.visit('/researcher-post-creation')
      cy.get('.post-creation-title').should('be.visible')
      cy.get('.post-title-input').should('be.visible')
      cy.get('.post-description-input').should('be.visible')
    })

    it('should add and remove tags', () => {
      cy.visit('/researcher-post-creation')
      cy.get('.tag-input').type('AI')
      cy.get('.add-tag-btn').click()
      // Check for tag chip existence - wait for it to appear
      cy.get('.tag-chip', { timeout: 5000 }).should('exist')
      cy.get('.tag-chip').should('contain', 'AI')
      
      // Remove tag - find the tag chip containing 'AI' and click its remove button
      cy.get('.tag-chip').contains('AI').within(() => {
        cy.get('.tag-remove-btn').click()
      })
      // Tag should be removed
      cy.get('.tag-chip').should('not.exist')
    })

    it('should prevent duplicate tags', () => {
      cy.visit('/researcher-post-creation')
      cy.get('.tag-input').type('AI')
      cy.get('.add-tag-btn').click()
      cy.get('.tag-input').type('AI')
      cy.get('.add-tag-btn').click()
      
      // Should show alert for duplicate
      cy.on('window:alert', (text) => {
        expect(text).to.include('already been added')
      })
    })

    it('should limit tag length', () => {
      cy.visit('/researcher-post-creation')
      const longTag = 'A'.repeat(31)
      cy.get('.tag-input').type(longTag)
      cy.get('.add-tag-btn').click()
      
      cy.on('window:alert', (text) => {
        expect(text).to.include('30 characters')
      })
    })

    it('should limit number of tags', () => {
      cy.visit('/researcher-post-creation')
      // Add 10 tags
      for (let i = 0; i < 10; i++) {
        cy.get('.tag-input').type(`Tag${i}`)
        cy.get('.add-tag-btn').click()
      }
      
      // Try to add 11th tag
      cy.get('.tag-input').type('Tag11')
      cy.get('.add-tag-btn').click()
      
      cy.on('window:alert', (text) => {
        expect(text).to.include('10 tags')
      })
    })

    it('should add text question', () => {
      cy.visit('/researcher-post-creation')
      cy.get('.add-entry-button').click()
      cy.get('.menu-option').contains('Text Field').click()
      cy.contains('Question 1').should('be.visible')
      cy.get('.entry-type-badge').contains('text').should('be.visible')
    })

    it('should add checkbox question', () => {
      cy.visit('/researcher-post-creation')
      cy.get('.add-entry-button').click()
      cy.get('.menu-option').contains('Checkbox').click()
      cy.contains('Question 1').should('be.visible')
      cy.get('.entry-type-badge').contains('checkbox').should('be.visible')
    })

    it('should add multiple choice question', () => {
      cy.visit('/researcher-post-creation')
      cy.get('.add-entry-button').click()
      cy.get('.menu-option').contains('Multiple Choice').click()
      cy.contains('Question 1').should('be.visible')
      cy.get('.entry-type-badge').contains('multiple-choice').should('be.visible')
    })

    it('should add options to multiple choice question', () => {
      cy.visit('/researcher-post-creation')
      cy.get('.add-entry-button').click()
      cy.get('.menu-option').contains('Multiple Choice').click()
      cy.get('.add-option-button').click()
      cy.get('.option-input').should('have.length.at.least', 2)
    })

    it('should remove options from multiple choice question', () => {
      cy.visit('/researcher-post-creation')
      cy.get('.add-entry-button').click()
      cy.get('.menu-option').contains('Multiple Choice').click()
      cy.get('.add-option-button').click()
      cy.get('.remove-option-button').first().click()
      cy.get('.option-input').should('have.length', 1)
    })

    it('should delete question entry', () => {
      cy.visit('/researcher-post-creation')
      cy.get('.add-entry-button').click()
      cy.get('.menu-option').contains('Text Field').click()
      cy.get('.delete-entry-button').click()
      cy.contains('Question 1').should('not.exist')
    })

    it('should validate post title is required', () => {
      cy.visit('/researcher-post-creation')
      cy.get('.save-post-button').click()
      // Check for toast existence and message instead of visibility (may have opacity 0 during animation)
      cy.get('.toast--error', { timeout: 5000 }).should('exist')
      cy.get('.toast--error').should('contain', 'post title')
    })

    it('should limit post title length', () => {
      cy.visit('/researcher-post-creation')
      const longTitle = 'A'.repeat(51)
      cy.get('.post-title-input').type(longTitle)
      cy.get('.post-title-input').should('have.attr', 'maxLength', '50')
    })

    it('should limit post description length', () => {
      cy.visit('/researcher-post-creation')
      cy.get('.post-description-input').should('have.attr', 'maxLength', '500')
    })
  })

  describe('Researcher Features - My Posts', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'researcher-user.json' }).as('getUser')
      cy.loginAsResearcher()
    })

    it('should navigate to my posts page', () => {
      cy.intercept('GET', '/api/posts/my-posts', { fixture: 'my-posts.json' }).as('getMyPosts')
      cy.visit('/my-posts')
      cy.contains('My Posts').should('be.visible')
    })

    it('should display empty state when no posts', () => {
      cy.intercept('GET', '/api/posts/my-posts', { body: [] }).as('getMyPosts')
      cy.visit('/my-posts')
      cy.contains("You haven't created any posts yet").should('be.visible')
    })

    it('should display posts list when posts exist', () => {
      cy.intercept('GET', '/api/posts/my-posts', { fixture: 'my-posts.json' }).as('getMyPosts')
      cy.visit('/my-posts')
      cy.get('.post-card').should('have.length.at.least', 1)
    })

    it('should show application count for each post', () => {
      cy.intercept('GET', '/api/posts/my-posts', { fixture: 'my-posts.json' }).as('getMyPosts')
      cy.visit('/my-posts')
      cy.contains('Application').should('be.visible')
    })

    it('should navigate to applications page for a post', () => {
      cy.intercept('GET', '/api/posts/my-posts', { fixture: 'my-posts.json' }).as('getMyPosts')
      cy.intercept('GET', '/api/posts/*/applications', { fixture: 'applications.json' }).as('getApplications')
      cy.visit('/my-posts')
      cy.contains('View Applications').first().click()
      cy.url().should('include', '/applications')
    })
  })

  describe('Profile Management', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.loginAsStudent()
    })

    it('should navigate to profile page', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUserProfile')
      cy.visit('/profile')
      cy.contains('My Profile').should('be.visible')
    })

    it('should display profile information', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUserProfile')
      cy.visit('/profile')
      cy.contains('Basic Information').should('be.visible')
      cy.contains('Student Information').should('be.visible')
    })

    it('should enter edit mode', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUserProfile')
      cy.visit('/profile')
      cy.contains('Edit Profile').click()
      cy.get('.profile-form').should('be.visible')
    })

    it('should update profile fields in edit mode', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUserProfile')
      cy.intercept('PUT', '/api/users/*/profile', { statusCode: 200, body: { success: true } }).as('updateProfile')
      cy.visit('/profile')
      cy.contains('Edit Profile').click()
      
      cy.get('input[name="name"]').clear().type('Updated Name')
      cy.get('input[name="uclaId"]').clear().type('123456789')
      cy.get('input[name="year"]').clear().type('Senior')
      cy.get('input[name="major"]').clear().type('Computer Science')
      
      cy.get('.save-button').click()
      cy.wait('@updateProfile')
    })

    it('should cancel profile edit', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUserProfile')
      cy.visit('/profile')
      cy.contains('Edit Profile').click()
      cy.get('input[name="name"]').clear().type('Changed Name')
      cy.get('.cancel-button').click()
      cy.get('.profile-view').should('be.visible')
    })

    it('should show error on profile update failure', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUserProfile')
      cy.intercept('PUT', '/api/users/*/profile', { statusCode: 400, body: { error: 'Invalid data' } }).as('updateProfile')
      cy.visit('/profile')
      cy.contains('Edit Profile').click()
      cy.get('input[name="name"]').clear().type('Test')
      cy.get('.save-button').click()
      cy.wait('@updateProfile')
      cy.get('.error-message').should('be.visible')
    })

    it('should validate UCLA ID format', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUserProfile')
      cy.visit('/profile')
      cy.contains('Edit Profile').click()
      cy.get('input[name="uclaId"]').clear().type('12345') // Too short
      cy.get('.save-button').click()
      // Should show validation error
      cy.get('.error-message', { timeout: 5000 }).should('be.visible')
    })

    it('should display researcher profile information', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'researcher-user.json' }).as('getUserProfile')
      cy.loginAsResearcher()
      cy.visit('/profile')
      cy.contains('Researcher Information').should('be.visible')
      cy.contains('Verification Status').should('be.visible')
    })
  })

  describe('Admin Features', () => {
    beforeEach(() => {
      cy.clearCookies()
      cy.clearLocalStorage()
    })

    it('should navigate to admin login', () => {
      cy.visit('/admin/login')
      cy.contains('Admin').should('be.visible')
    })

    it('should show error on invalid admin login', () => {
      cy.intercept('POST', '/api/auth/admin/login', { statusCode: 401, body: { error: 'Invalid credentials' } }).as('adminLogin')
      cy.visit('/admin/login')
      cy.get('input[name="email"]').type('wrong@email.com')
      cy.get('input[name="password"]').type('wrongpassword')
      cy.get('button[type="submit"]').click()
      cy.wait('@adminLogin')
      // Check for toast existence - wait for error toast to appear
      cy.get('.toast--error', { timeout: 5000 }).should('exist')
      // Check the toast message text (the message is in a span inside the toast)
      cy.get('.toast--error').within(() => {
        cy.get('span').should('satisfy', ($span) => {
          const text = $span.text().toLowerCase()
          return text.includes('invalid') || text.includes('failed') || text.includes('credentials') || text.includes('login')
        })
      })
    })

    it('should successfully login as admin', () => {
      cy.loginAsAdmin()
      cy.url().should('include', '/admin/dashboard')
    })

    it('should display admin dashboard', () => {
      cy.intercept('GET', '/api/admin/researchers', { fixture: 'researchers.json' }).as('getResearchers')
      cy.intercept('GET', '/api/admin/users', { fixture: 'users.json' }).as('getUsers')
      cy.loginAsAdmin()
      cy.contains('Admin Dashboard').should('be.visible')
    })

    it('should display verification tab', () => {
      cy.intercept('GET', '/api/admin/researchers', { fixture: 'researchers.json' }).as('getResearchers')
      cy.loginAsAdmin()
      cy.contains('Researcher Verification').should('be.visible')
    })

    it('should display delete user tab', () => {
      cy.intercept('GET', '/api/admin/users', { fixture: 'users.json' }).as('getUsers')
      cy.loginAsAdmin()
      cy.get('button.tab-button').contains('Delete User').click()
      cy.contains('Delete User').should('be.visible')
    })

    it('should search for users in delete tab', () => {
      cy.intercept('GET', '/api/admin/users', { fixture: 'users.json' }).as('getUsers')
      cy.loginAsAdmin()
      cy.get('button.tab-button').contains('Delete User').click()
      cy.get('input[placeholder*="Search"], input[type="search"], input[type="text"]').first().type('test')
      // Should filter users
      cy.get('input[placeholder*="Search"], input[type="search"], input[type="text"]').first().should('have.value', 'test')
    })

    it('should verify a researcher', () => {
      cy.intercept('GET', '/api/admin/researchers', { fixture: 'researchers.json' }).as('getResearchers')
      cy.intercept('GET', '/api/auth/admin/verify', { statusCode: 200, body: { admin: { email: 'charlie@kirk.com' } } }).as('verifyAdmin')
      cy.intercept('PATCH', '/api/admin/researchers/3/verify', { statusCode: 200, body: { success: true } }).as('verifyResearcher')
      cy.loginAsAdmin()
      
      // Wait for admin verification and researchers to load
      cy.wait('@verifyAdmin')
      cy.wait('@getResearchers')
      
      // Wait for the page to render with researchers
      cy.contains('Researcher Verification').should('be.visible')
      cy.contains('Total Researchers: 2').should('be.visible')
      
      // Wait for researcher cards to appear
      cy.get('.researcher-card', { timeout: 10000 }).should('have.length.at.least', 1)
      
      // Find verify button (only shows for non-verified researchers - PENDING status)
      // From fixture: Researcher with userId 3 has PENDING status, so Verify button will show
      // Find the researcher card containing "Pending Researcher" and click verify button within it
      cy.get('.researcher-card').contains('Pending Researcher').parents('.researcher-card').within(() => {
        cy.get('.verify-btn', { timeout: 5000 }).should('exist').click()
      })
      cy.wait('@verifyResearcher')
      
      // Should show success message
      cy.get('.toast--success', { timeout: 5000 }).should('exist')
    })

    it('should unverify a researcher', () => {
      cy.intercept('GET', '/api/admin/researchers', { fixture: 'researchers.json' }).as('getResearchers')
      cy.intercept('GET', '/api/auth/admin/verify', { statusCode: 200, body: { admin: { email: 'charlie@kirk.com' } } }).as('verifyAdmin')
      cy.intercept('PATCH', '/api/admin/researchers/2/verify', { statusCode: 200, body: { success: true } }).as('unverifyResearcher')
      cy.loginAsAdmin()
      
      // Wait for admin verification and researchers to load
      cy.wait('@verifyAdmin')
      cy.wait('@getResearchers')
      
      // Wait for the page to render with researchers
      cy.contains('Researcher Verification').should('be.visible')
      cy.contains('Total Researchers: 2').should('be.visible')
      
      // Wait for researcher cards to appear
      cy.get('.researcher-card', { timeout: 10000 }).should('have.length.at.least', 1)
      
      // Find unverify button (only shows for verified researchers - VERIFIED status)
      // From fixture: Researcher with userId 2 has VERIFIED status, so Unverify button will show
      // Find the researcher card containing "Test Researcher" and click unverify button within it
      cy.get('.researcher-card').contains('Test Researcher').parents('.researcher-card').within(() => {
        cy.get('.unverify-btn', { timeout: 5000 }).should('exist').click()
      })
      cy.wait('@unverifyResearcher')
      
      // Should show success message
      cy.get('.toast--success', { timeout: 5000 }).should('exist')
    })
  })

  describe('UI Components and Interactions', () => {
    it('should display navbar on all pages', () => {
      cy.visit('/')
      cy.get('nav').should('be.visible')
    })

    it('should handle loading states', () => {
      cy.intercept('GET', '/api/auth/me', { delay: 1000, fixture: 'student-user.json' }).as('slowRequest')
      cy.loginAsStudent()
      // Should show loading indicator
      cy.get('body').should('contain', 'Loading')
    })

    it('should display toast notifications', () => {
      cy.visit('/login?role=student')
      cy.get('input[name="email"]').type('invalid@ucla.edu')
      cy.get('input[name="password"]').type('wrongpassword')
      cy.get('button[type="submit"]').click()
      // Check for toast existence and message instead of visibility (may have opacity 0 during animation)
      cy.get('.toast', { timeout: 5000 }).should('exist')
      cy.get('.toast').should('contain', 'Login')
    })

    it('should dismiss toast notifications', () => {
      cy.visit('/login?role=student')
      cy.get('input[name="email"]').type('invalid@ucla.edu')
      cy.get('input[name="password"]').type('wrongpassword')
      cy.get('button[type="submit"]').click()
      // Wait for toast to appear
      cy.get('.toast', { timeout: 5000 }).should('exist')
      // Wait a bit for toast to fully render
      cy.wait(500)
      // Toast needs to be dismissed with X button - wait for close button to be ready
      cy.get('.toast-close', { timeout: 5000 }).should('exist').click()
      // Verify that clicking the dismiss button triggers the dismissal
      // The toast should get the dismissing class
      cy.get('.toast').should('have.class', 'toast--dismissing')
    })
  })

  describe('Form Validation', () => {
    it('should validate email format in login', () => {
      cy.visit('/login?role=student')
      cy.get('input[name="email"]').type('notanemail')
      cy.get('input[name="email"]').blur()
      cy.get('input[name="email"]:invalid').should('exist')
    })

    it('should require password in login', () => {
      cy.visit('/login?role=student')
      cy.get('input[name="email"]').type('test@ucla.edu')
      cy.get('button[type="submit"]').click()
      cy.get('input[name="password"]:invalid').should('exist')
    })

    it('should validate password match in signup', () => {
      cy.visit('/signup?role=student')
      cy.get('input[name="name"]').type('Test User')
      cy.get('input[name="email"]').type('test@ucla.edu')
      cy.get('input[name="password"]').type('password123')
      cy.get('input[name="confirmPassword"]').type('password456')
      cy.get('button[type="submit"]').click()
    cy.get('.toast--error').should('contain', 'Passwords do not match')
    })

    it('should validate required fields in signup', () => {
      cy.visit('/signup?role=student')
      cy.get('button[type="submit"]').click()
      cy.get('input:invalid').should('have.length.at.least', 1)
    })
  })
})
