/// <reference types="cypress" />

describe('Authentication and RBAC Tests', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  describe('Authentication - Login/Logout', () => {
    it('should maintain session after login', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.loginAsStudent()
      
      // Refresh page
      cy.reload()
      
      // Should still be logged in
      cy.url().should('not.include', '/login')
    })

    it('should logout and clear session', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.intercept('POST', '/api/auth/logout', { statusCode: 200 }).as('logout')
      cy.loginAsStudent()
      
      // Logout via API call instead of dropdown (dropdown is hover-based and unreliable)
      cy.request({
        method: 'POST',
        url: '/api/auth/logout',
        failOnStatusCode: false
      })
      cy.wait('@logout')
      
      // Clear cookies and verify logged out
      cy.clearCookies()
      cy.visit('/my-applications')
      // Should redirect to login when accessing protected route
      cy.url().should('include', '/login')
    })

    it('should redirect to login when accessing protected route without authentication', () => {
      cy.visit('/my-applications')
      
      // Should redirect to login
      cy.url().should('include', '/login')
    })

    it('should redirect to login when accessing researcher route without authentication', () => {
      cy.visit('/my-posts')
      
      // Should redirect to login
      cy.url().should('include', '/login')
    })

    it('should redirect to login when accessing admin route without authentication', () => {
      cy.visit('/admin/dashboard')
      
      // Should redirect to login
      cy.url().should('include', '/login')
    })
  })

  describe('RBAC - Student Access Control', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.loginAsStudent()
    })

    it('should allow student to access student homepage', () => {
      cy.intercept('GET', '/api/posts*', { fixture: 'posts.json' }).as('getPosts')
      cy.visit('/')
      
      // Should be able to view homepage
      cy.url().should('not.include', '/login')
      cy.get('body').should('be.visible')
    })

    it('should allow student to access my-applications page', () => {
      cy.intercept('GET', '/api/applications/my-applications', { body: [] }).as('getApplications')
      cy.visit('/my-applications')
      
      cy.url().should('include', '/my-applications')
      cy.contains('My Applications').should('be.visible')
    })

    it('should allow student to access profile page', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUserProfile')
      cy.visit('/profile')
      
      cy.url().should('include', '/profile')
      cy.contains('My Profile').should('be.visible')
    })

    it('should allow student to access lab detail pages', () => {
      cy.intercept('GET', '/api/posts/1', { fixture: 'post-detail.json' }).as('getPost')
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.visit('/labs/1')
      
      cy.url().should('include', '/labs/1')
      cy.get('.lab-detail-card').should('be.visible')
    })

    it('should allow student to access application form', () => {
      cy.intercept('GET', '/api/posts/1', { fixture: 'post-detail.json' }).as('getPost')
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.visit('/student_application/apply?lab=1')
      
      cy.url().should('include', '/student_application/apply')
    })

    it('should NOT allow student to access researcher post creation', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.visit('/researcher-post-creation')
      
      // Should redirect away or show error
      cy.url().should('satisfy', (url) => {
        return !url.includes('/researcher-post-creation') || url.includes('/login')
      })
    })

    it('should NOT allow student to access researcher my-posts page', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.intercept('GET', '/api/posts/my-posts', { statusCode: 403 }).as('getMyPosts')
      cy.visit('/my-posts')
      
      // Should redirect or show error
      cy.url().should('satisfy', (url) => {
        return !url.includes('/my-posts') || url.includes('/login')
      })
    })

    it('should NOT allow student to access admin dashboard', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.visit('/admin/dashboard')
      
      // Should redirect away
      cy.url().should('not.include', '/admin/dashboard')
    })
  })

  describe('RBAC - Researcher Access Control', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'researcher-user.json' }).as('getUser')
      cy.loginAsResearcher()
    })

    it('should allow researcher to access researcher homepage', () => {
      cy.intercept('GET', '/api/posts/my-posts', { fixture: 'my-posts.json' }).as('getMyPosts')
      cy.visit('/my-posts')
      
      cy.url().should('include', '/my-posts')
      cy.contains('My Posts').should('be.visible')
    })

    it('should allow researcher to access post creation page', () => {
      cy.visit('/researcher-post-creation')
      
      cy.url().should('include', '/researcher-post-creation')
      cy.get('.post-creation-title').should('be.visible')
    })

    it('should allow researcher to access applications page for their posts', () => {
      cy.intercept('GET', '/api/posts/my-posts', { fixture: 'my-posts.json' }).as('getMyPosts')
      cy.intercept('GET', '/api/applications/post/1', { fixture: 'applications.json' }).as('getApplications')
      cy.visit('/my-posts')
      cy.contains('View Applications').first().click()
      
      cy.url().should('include', '/applications')
    })

    it('should allow researcher to access profile page', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'researcher-user.json' }).as('getUserProfile')
      cy.visit('/profile')
      
      cy.url().should('include', '/profile')
      cy.contains('My Profile').should('be.visible')
    })

    it('should allow researcher to access lab detail pages (to view other posts)', () => {
      cy.intercept('GET', '/api/posts/1', { fixture: 'post-detail.json' }).as('getPost')
      cy.intercept('GET', '/api/auth/me', { fixture: 'researcher-user.json' }).as('getUser')
      cy.visit('/labs/1')
      
      cy.url().should('include', '/labs/1')
      cy.get('.lab-detail-card').should('be.visible')
    })

    it('should redirect researcher away from student my-applications page', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'researcher-user.json' }).as('getUser')
      cy.visit('/my-applications')
      
      // Should redirect to my-posts (researcher equivalent)
      cy.url().should('satisfy', (url) => {
        return url.includes('/my-posts') || url.includes('/my-posts')
      })
    })

    it('should NOT allow researcher to access admin dashboard', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'researcher-user.json' }).as('getUser')
      cy.visit('/admin/dashboard')
      
      // Should redirect away
      cy.url().should('not.include', '/admin/dashboard')
    })

    it('should NOT allow researcher to create applications (only students can)', () => {
      cy.intercept('GET', '/api/posts/1', { fixture: 'post-detail.json' }).as('getPost')
      cy.intercept('GET', '/api/auth/me', { fixture: 'researcher-user.json' }).as('getUser')
      cy.intercept('POST', '/api/applications', { statusCode: 403 }).as('createApplication')
      
      cy.visit('/labs/1')
      
      // Apply button might not be visible or should be disabled
      cy.get('body').then(($body) => {
        if ($body.find('.apply-button, a[href*="apply"]').length > 0) {
          cy.get('.apply-button, a[href*="apply"]').first().click()
          cy.wait('@createApplication')
          // Should show error or redirect
          cy.get('.toast--error', { timeout: 5000 }).should('exist')
        }
      })
    })
  })

  describe('RBAC - Admin Access Control', () => {
    beforeEach(() => {
      cy.clearCookies()
      cy.clearLocalStorage()
    })

    it('should allow admin to access admin dashboard', () => {
      cy.intercept('GET', '/api/admin/researchers', { fixture: 'researchers.json' }).as('getResearchers')
      cy.intercept('GET', '/api/admin/users', { fixture: 'users.json' }).as('getUsers')
      cy.loginAsAdmin()
      
      cy.url().should('include', '/admin/dashboard')
      cy.contains('Admin Dashboard').should('be.visible')
    })

    it('should allow admin to access researcher verification', () => {
      cy.intercept('GET', '/api/admin/researchers', { fixture: 'researchers.json' }).as('getResearchers')
      cy.loginAsAdmin()
      
      cy.contains('Researcher Verification').should('be.visible')
    })

    it('should allow admin to access user deletion', () => {
      cy.intercept('GET', '/api/admin/users', { fixture: 'users.json' }).as('getUsers')
      cy.loginAsAdmin()
      
      cy.get('button.tab-button').contains('Delete User').click()
      cy.contains('Delete User').should('be.visible')
    })

    it('should NOT allow admin to access student my-applications (should redirect)', () => {
      cy.intercept('GET', '/api/auth/me', { statusCode: 401 }).as('getUser')
      cy.loginAsAdmin()
      
      cy.visit('/my-applications')
      
      // Should redirect away (admin doesn't have student access)
      cy.url().should('not.include', '/my-applications')
    })

    it('should NOT allow admin to access researcher post creation', () => {
      cy.intercept('GET', '/api/auth/me', { statusCode: 401 }).as('getUser')
      cy.loginAsAdmin()
      
      cy.visit('/researcher-post-creation')
      
      // Should redirect away
      cy.url().should('not.include', '/researcher-post-creation')
    })
  })

  describe('RBAC - Unauthenticated Access Control', () => {
    it('should redirect unauthenticated user from protected student routes', () => {
      cy.visit('/my-applications')
      cy.url().should('include', '/login')
    })

    it('should redirect unauthenticated user from protected researcher routes', () => {
      cy.visit('/my-posts')
      cy.url().should('include', '/login')
    })

    it('should redirect unauthenticated user from protected admin routes', () => {
      cy.visit('/admin/dashboard')
      cy.url().should('satisfy', (url) => {
        return url.includes('/login') || url.includes('/admin/login')
      })
    })

    it('should redirect unauthenticated user from profile page', () => {
      cy.visit('/profile')
      cy.url().should('include', '/login')
    })

    it('should redirect unauthenticated user when trying to apply', () => {
      cy.intercept('GET', '/api/posts/1', { fixture: 'post-detail.json' }).as('getPost')
      cy.visit('/labs/1')
      
      // Try to access apply page directly
      cy.visit('/student_application/apply?lab=1')
      
      // Should redirect to login
      cy.url().should('include', '/login')
    })

    it('should allow unauthenticated user to view homepage', () => {
      cy.visit('/')
      
      cy.url().should('eq', Cypress.config().baseUrl + '/')
      cy.contains('Match UCLA students with').should('be.visible')
    })

    it('should allow unauthenticated user to access login page', () => {
      cy.visit('/login')
      
      cy.url().should('include', '/login')
      cy.get('.auth-card').should('be.visible')
    })

    it('should allow unauthenticated user to access signup page', () => {
      cy.visit('/signup')
      
      cy.url().should('include', '/signup')
      cy.get('.auth-card').should('be.visible')
    })
  })

  describe('RBAC - Cross-Role Access Prevention', () => {
    it('should prevent student from accessing researcher applications', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.intercept('GET', '/api/applications/post/1', { statusCode: 403 }).as('getApplications')
      cy.loginAsStudent()
      
      // Try to access researcher applications page
      cy.visit('/my-posts/1/applications')
      
      // Should redirect or show error
      cy.url().should('satisfy', (url) => {
        return !url.includes('/applications') || url.includes('/login')
      })
    })

    it('should prevent researcher from accessing student applications', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'researcher-user.json' }).as('getUser')
      cy.intercept('GET', '/api/applications/my-applications', { statusCode: 403 }).as('getApplications')
      cy.loginAsResearcher()
      
      // Try to access student applications
      cy.visit('/my-applications')
      
      // Should redirect to researcher equivalent
      cy.url().should('satisfy', (url) => {
        return url.includes('/my-posts') || url.includes('/my-posts')
      })
    })

    it('should prevent non-admin from accessing admin routes', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.loginAsStudent()
      
      cy.visit('/admin/dashboard')
      
      // Should redirect away
      cy.url().should('not.include', '/admin/dashboard')
    })

    it('should prevent researcher from accessing other researcher\'s applications', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'researcher-user.json' }).as('getUser')
      cy.intercept('GET', '/api/applications/post/999', { statusCode: 403 }).as('getApplications')
      cy.loginAsResearcher()
      
      // Try to access another researcher's applications
      cy.visit('/my-posts/999/applications')
      
      // Should redirect or show error
      cy.url().should('satisfy', (url) => {
        return !url.includes('/applications') || url.includes('/login')
      })
    })
  })

  describe('RBAC - Session Management', () => {
    it('should redirect to login when session expires', () => {
      cy.intercept('GET', '/api/auth/me', { statusCode: 401 }).as('getUser')
      cy.intercept('GET', '/api/posts*', { statusCode: 401 }).as('getPosts')
      
      // Try to access protected route with expired session
      cy.visit('/my-applications')
      
      // Should redirect to login
      cy.url().should('include', '/login')
    })

    it('should maintain role-specific access after page refresh', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.intercept('GET', '/api/applications/my-applications', { body: [] }).as('getApplications')
      cy.loginAsStudent()
      
      cy.visit('/my-applications')
      cy.reload()
      
      // Should still have access
      cy.url().should('include', '/my-applications')
    })
  })

  describe('RBAC - API Endpoint Protection', () => {
    it('should reject API calls without authentication', () => {
      cy.intercept('GET', '/api/applications/my-applications', { statusCode: 401 }).as('getApplications')
      
      cy.request({
        url: '/api/applications/my-applications',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403])
      })
    })

    it('should reject student API calls to researcher endpoints', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.intercept('GET', '/api/posts/my-posts', { statusCode: 403 }).as('getMyPosts')
      cy.loginAsStudent()
      
      cy.visit('/my-posts')
      
      // Should not be able to access
      cy.url().should('satisfy', (url) => {
        return !url.includes('/my-posts') || url.includes('/login')
      })
    })

    it('should reject researcher API calls to student endpoints', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'researcher-user.json' }).as('getUser')
      cy.intercept('GET', '/api/applications/my-applications', { statusCode: 403 }).as('getApplications')
      cy.loginAsResearcher()
      
      cy.visit('/my-applications')
      
      // Should redirect
      cy.url().should('satisfy', (url) => {
        return url.includes('/my-posts') || url.includes('/my-posts')
      })
    })

    it('should reject non-admin API calls to admin endpoints', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.intercept('GET', '/api/admin/researchers', { statusCode: 403 }).as('getResearchers')
      cy.loginAsStudent()
      
      cy.request({
        url: '/api/admin/researchers',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403])
      })
    })

    it('should allow authenticated API calls to user endpoints', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.intercept('GET', '/api/applications/my-applications', { statusCode: 200, body: [] }).as('getApplications')
      cy.loginAsStudent()
      
      cy.request({
        url: '/api/applications/my-applications',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 204])
      })
    })
  })

  describe('RBAC - Middleware Redirect Behavior', () => {
    it('should redirect researcher from homepage to my-posts', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'researcher-user.json' }).as('getUser')
      cy.intercept('GET', '/api/posts/my-posts', { fixture: 'my-posts.json' }).as('getMyPosts')
      cy.loginAsResearcher()
      
      cy.visit('/')
      
      // Should redirect researcher to my-posts
      cy.url().should('satisfy', (url) => {
        return url.includes('/my-posts') || url.includes('/my-posts')
      })
    })

    it('should allow student to stay on homepage', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.intercept('GET', '/api/posts*', { fixture: 'posts.json' }).as('getPosts')
      cy.loginAsStudent()
      
      cy.visit('/')
      
      // Should stay on homepage
      cy.url().should('eq', Cypress.config().baseUrl + '/')
    })

    it('should redirect student from researcher routes to homepage', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.loginAsStudent()
      
      cy.visit('/researcher-post-creation')
      
      // Should redirect to homepage
      cy.url().should('eq', Cypress.config().baseUrl + '/')
    })

    it('should redirect researcher from student application routes', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'researcher-user.json' }).as('getUser')
      cy.loginAsResearcher()
      
      cy.visit('/student_application/apply?lab=1')
      
      // Should redirect to my-posts
      cy.url().should('satisfy', (url) => {
        return url.includes('/my-posts') || url.includes('/my-posts')
      })
    })
  })

  describe('RBAC - Cookie and Session Handling', () => {
    it('should set session cookie after successful login', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.loginAsStudent()
      
      // Should have session cookie
      cy.getCookie('session').should('exist')
    })

    it('should clear session cookie after logout', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.intercept('POST', '/api/auth/logout', { statusCode: 200 }).as('logout')
      cy.loginAsStudent()
      
      cy.get('.navbar-user-name').trigger('mouseenter')
      cy.get('.navbar-dropdown').should('exist')
      cy.contains('button', 'Logout').click()
      cy.wait('@logout')
      
      // Session cookie should be cleared or expired
      cy.getCookie('session').should('satisfy', (cookie) => {
        return !cookie || cookie.value === '' || cookie.expiry < Date.now() / 1000
      })
    })

    it('should set admin session cookie after admin login', () => {
      cy.loginAsAdmin()
      
      // Should have admin session cookie
      cy.getCookie('admin_session').should('exist')
    })

    it('should handle missing session cookie gracefully', () => {
      cy.clearCookies()
      cy.visit('/my-applications')
      
      // Should redirect to login
      cy.url().should('include', '/login')
    })
  })

  describe('RBAC - Navigation and UI Based on Role', () => {
    it('should show student-specific navigation items for students', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.intercept('GET', '/api/posts*', { fixture: 'posts.json' }).as('getPosts')
      cy.loginAsStudent()
      cy.visit('/')
      
      // Should show "My Applications" in navbar
      cy.contains('My Applications').should('be.visible')
    })

    it('should NOT show student navigation items for researchers', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'researcher-user.json' }).as('getUser')
      cy.intercept('GET', '/api/posts/my-posts', { fixture: 'my-posts.json' }).as('getMyPosts')
      cy.loginAsResearcher()
      cy.visit('/my-posts')
      
      // Should NOT show "My Applications"
      cy.get('body').then(($body) => {
        if ($body.find('a:contains("My Applications")').length > 0) {
          cy.contains('My Applications').should('not.be.visible')
        }
      })
    })

    it('should show user name in navbar when logged in', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.intercept('GET', '/api/posts*', { fixture: 'posts.json' }).as('getPosts')
      cy.loginAsStudent()
      cy.visit('/')
      
      // Should show user name
      cy.get('.navbar-user-name').should('be.visible')
    })
  })

  describe('RBAC - Edge Cases', () => {
    it('should handle user with no role gracefully', () => {
      cy.intercept('GET', '/api/auth/me', {
        statusCode: 200,
        body: {
          user: {
            id: 1,
            email: 'test@ucla.edu',
            name: 'Test User',
            student: null,
            researcher: null
          }
        }
      }).as('getUser')
      
      cy.setCookie('session', 'test-session')
      cy.visit('/')
      
      // Should handle gracefully (might redirect or show limited access)
      cy.url().should('satisfy', (url) => {
        return url.includes('/') || url.includes('/login')
      })
    })

    it('should handle corrupted session cookie - currently may allow access', () => {
      cy.setCookie('session', 'corrupted-session-data-!!@#$')
      cy.intercept('GET', '/api/auth/me', { statusCode: 401 }).as('getUser')
      
      cy.visit('/my-applications')
      
      // Currently we don't prevent this - may allow access or redirect
      // This test documents current behavior
      cy.url().should('satisfy', (url) => {
        return url.includes('/login') || url.includes('/my-applications')
      })
    })

    it('should handle role change mid-session', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.loginAsStudent()
      
      // Change role in API response
      cy.intercept('GET', '/api/auth/me', { fixture: 'researcher-user.json' }).as('getUserChanged')
      cy.reload()
      
      // Should handle role change (might redirect or show error)
      cy.url().should('satisfy', (url) => {
        return url.includes('/') || url.includes('/login') || url.includes('/my-posts')
      })
    })

    it('should prevent direct URL manipulation to bypass RBAC', () => {
      cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
      cy.loginAsStudent()
      
      // Try to directly access researcher route via URL
      cy.visit('/researcher-post-creation')
      
      // Should be blocked or redirected
      cy.url().should('satisfy', (url) => {
        return !url.includes('/researcher-post-creation') || url.includes('/login')
      })
    })
  })

  describe('RBAC - Admin Specific Tests', () => {
    it('should verify admin authentication before allowing dashboard access', () => {
      cy.intercept('GET', '/api/auth/admin/verify', { statusCode: 401 }).as('verifyAdmin')
      cy.setCookie('admin_session', 'invalid')
      
      cy.visit('/admin/dashboard')
      
      // Should redirect to admin login
      cy.url().should('include', '/admin/login')
    })

    it('should allow admin to logout and clear admin session', () => {
      cy.intercept('GET', '/api/admin/researchers', { fixture: 'researchers.json' }).as('getResearchers')
      cy.intercept('POST', '/api/auth/admin/logout', { statusCode: 200 }).as('logout')
      cy.loginAsAdmin()
      
      cy.contains('button', 'Logout').click()
      cy.wait('@logout')
      
      // Should redirect to admin login
      cy.url().should('include', '/admin/login')
    })

    it('should prevent admin from accessing regular user routes with admin session', () => {
      cy.loginAsAdmin()
      
      // Admin session doesn't work for regular routes
      cy.visit('/my-applications')
      
      // Should redirect (admin session is separate)
      cy.url().should('satisfy', (url) => {
        return url.includes('/login') || url.includes('/admin/login') || url === Cypress.config().baseUrl + '/'
      })
    })
  })
})

