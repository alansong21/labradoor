# Cypress E2E Tests

This directory contains end-to-end tests for the Labradoor application.

## Test Structure

### `functionality.cy.ts`
Comprehensive functionality tests covering:

1. **Navigation and Landing Page** - Basic navigation and homepage features
2. **Authentication - Login** - Student and researcher login flows, validation
3. **Authentication - Signup** - Registration flows, form validation
4. **Student Features** - Lab browsing, applications, navigation (mostly frontend-only)
5. **Researcher Features - Post Creation** - Creating posts, adding questions, tags
6. **Researcher Features - My Posts** - Viewing and managing posts
7. **Profile Management** - Viewing and editing profiles (requires backend)
8. **Admin Features** - Admin login, dashboard, verification, user management (requires backend)
9. **UI Components** - Toast notifications, loading states, navbar
10. **Form Validation** - Email, password, required fields

## Test Credentials

Test credentials are stored in `cypress/support/credentials.ts` (this file is gitignored for security).

## Backend Dependency

Most tests use API intercepts (mocks) to avoid backend dependency. However:

- **Profile Management tests** - These tests make real API calls to test profile updates
- **Admin tests** - These tests make real API calls to test admin functionality

All other tests use mocked API responses from fixture files in `cypress/fixtures/`.

## Running Tests

```bash
# Run all tests
npx cypress run

# Open Cypress UI
npx cypress open

# Run specific test file
npx cypress run --spec "cypress/e2e/functionality.cy.ts"
```

## Fixtures

Test fixtures are located in `cypress/fixtures/`:
- `student-user.json` - Mock student user data
- `researcher-user.json` - Mock researcher user data
- `posts.json` - Mock lab posts list
- `post-detail.json` - Mock single post detail
- `applications.json` - Mock applications list
- `my-posts.json` - Mock researcher's posts
- `application-form.json` - Mock application form data
- `researchers.json` - Mock researchers list for admin
- `users.json` - Mock users list for admin

## Custom Commands

Custom Cypress commands are defined in `cypress/support/commands.ts`:
- `cy.loginAsStudent()` - Login as student
- `cy.loginAsResearcher()` - Login as researcher
- `cy.loginAsAdmin()` - Login as admin
- `cy.logout()` - Logout current user
- `cy.measurePageLoad(url)` - Measure page load performance

## Notes

- Tests are designed to work even when the backend is down (except admin and profile tests)
- API intercepts are used extensively to mock backend responses
- Tests focus on UI functionality and user interactions
- Admin and profile tests require a working backend connection

