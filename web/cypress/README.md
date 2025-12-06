# Cypress Testing Suite

Tests & documentation written w/ aid of GenAI: GPT4.1

## Setup

1. Install dependencies:
```bash
cd web
npm install
```

2. Make sure your dev server is running:
```bash
npm run dev
```

## Running Tests

### Open Cypress UI
```bash
npm run cypress:open
```

### Run all tests headlessly
```bash
npm run cypress:run
```

### Run only E2E tests
```bash
npm run test:e2e
```

### Run specific test suites
```bash
# Stress tests
npx cypress run --spec "cypress/e2e/stress-tests.cy.ts"

# Performance tests
npx cypress run --spec "cypress/e2e/performance.cy.ts"

# Data seeding tests
npx cypress run --spec "cypress/e2e/data-seeding.cy.ts"

# Component tests
npx cypress run --component --spec "cypress/component/Toast.cy.tsx"
```

---

## Test Suites Overview

### 1. Functionality Tests (`cypress/e2e/functionality.cy.ts`)

Comprehensive functionality tests covering core application features.

#### Navigation and Landing Page
- ✅ Homepage loading
- ✅ Navigation to login/signup pages
- ✅ Student and researcher role cards display

#### Authentication - Login
- ✅ Role toggle (student/researcher)
- ✅ Email format validation
- ✅ Password requirement validation
- ✅ Successful login as student/researcher

#### Authentication - Signup
- ✅ Role toggle functionality
- ✅ UCLA email validation (@ucla.edu, @g.ucla.edu)
- ✅ Required field validation
- ✅ Student-specific fields (UCLA ID)
- ✅ Researcher signup form display

#### Student Features - Navigation and UI
- ✅ Navbar display when logged in
- ✅ Navigation to my applications page
- ✅ Navigation to profile page
- ✅ Empty state when no applications
- ✅ Applications list display
- ✅ Expand/collapse application details
- ✅ Lab detail page navigation and display
- ✅ Application form navigation

#### Researcher Features - Post Creation
- ✅ Post creation page navigation
- ✅ Post creation form display
- ✅ Tag management (add, remove, duplicate prevention, length limits)
- ✅ Question management (text, checkbox, multiple choice)
- ✅ Option management for multiple choice questions
- ✅ Question deletion
- ✅ Post title validation and length limits
- ✅ Post description length limits

#### Researcher Features - My Posts
- ✅ My posts page navigation
- ✅ Empty state display
- ✅ Posts list display
- ✅ Application count display
- ✅ Applications page navigation

#### Profile Management
- ✅ Profile page navigation
- ✅ Profile information display
- ✅ Edit mode functionality
- ✅ Profile field updates
- ✅ Cancel edit functionality
- ✅ Profile update error handling
- ✅ UCLA ID format validation
- ✅ Researcher profile information display

#### Admin Features
- ✅ Admin login navigation
- ✅ Invalid admin login error handling
- ✅ Successful admin login
- ✅ Admin dashboard display
- ✅ Verification tab display
- ✅ Delete user tab display
- ✅ User search functionality
- ✅ Researcher verification/unverification

#### UI Components and Interactions
- ✅ Navbar display on all pages
- ✅ Loading states handling
- ✅ Toast notification display
- ✅ Toast dismissal functionality

#### Form Validation
- ✅ Email format validation in login
- ✅ Password requirement in login
- ✅ Password match validation in signup
- ✅ Required fields validation in signup

**Total Tests**: 40+ tests

---

### 2. Acceptance Criteria Tests (`cypress/e2e/acceptance-criteria.cy.ts`)

Tests based on specific user story acceptance criteria.

#### Student Registration
- ✅ Accept @ucla.edu email and UCLA ID with success message
- ✅ Accept @g.ucla.edu email and UCLA ID
- ✅ Show error for non-UCLA email, no verification sent

#### Student Sign In
- ✅ Login with correct credentials and redirect to Student Homepage
- ✅ Do not login with invalid credentials

#### Researcher Registration
- ✅ Accept @ucla.edu email with success message
- ✅ Accept @g.ucla.edu email
- ✅ Show error for non-UCLA email, no verification sent

#### Researcher Sign In
- ✅ Login with correct credentials and redirect to Researcher Homepage
- ✅ Do not login with invalid credentials

#### Student Homepage Display
- ✅ Display list of open position posts when posts exist
- ✅ Show message when no positions are available
- ✅ Link each post to its detail page

#### Researcher Post Creation
- ✅ Create post with all required fields and redirect to detail page
- ✅ Show validation errors for missing required fields
- ✅ Do not allow access to Create Post page when not logged in as Researcher

#### Student Application Creation
- ✅ Allow student to start application for a lab post
- ✅ Do not allow access to application form when not logged in as Student

#### Researcher Application Viewing
- ✅ View all submitted applications for researcher's post
- ✅ Show accept/reject options when viewing application
- ✅ Do not allow access to applications when not logged in as post creator
- ✅ Show message when post has no submitted applications

#### Researcher Application Acceptance
- ✅ Update application status to "Accepted" when researcher accepts
- ✅ Update application status to "Rejected" when researcher rejects

**Total Tests**: 24 tests

---

### 3. Authentication & RBAC Tests (`cypress/e2e/auth-rbac.cy.ts`)

Comprehensive authentication and role-based access control tests.

#### Authentication - Login/Logout
- ✅ Maintain session after login
- ✅ Logout and clear session
- ✅ Redirect to login when accessing protected route without authentication
- ✅ Redirect to login for researcher routes without authentication
- ✅ Redirect to login for admin routes without authentication

#### RBAC - Student Access Control
- ✅ Allow student to access student homepage
- ✅ Allow student to access my-applications page
- ✅ Allow student to access profile page
- ✅ Allow student to access lab detail pages
- ✅ Allow student to access application form
- ✅ Prevent student from accessing researcher post creation
- ✅ Prevent student from accessing researcher my-posts page
- ✅ Prevent student from accessing admin dashboard

#### RBAC - Researcher Access Control
- ✅ Allow researcher to access researcher homepage
- ✅ Allow researcher to access post creation page
- ✅ Allow researcher to access applications page for their posts
- ✅ Allow researcher to access profile page
- ✅ Allow researcher to access lab detail pages (to view other posts)
- ✅ Redirect researcher away from student my-applications page
- ✅ Prevent researcher from accessing admin dashboard
- ✅ Prevent researcher from creating applications (only students can)

#### RBAC - Admin Access Control
- ✅ Allow admin to access admin dashboard
- ✅ Allow admin to access researcher verification
- ✅ Allow admin to access user deletion
- ✅ Prevent admin from accessing student my-applications
- ✅ Prevent admin from accessing researcher post creation

#### RBAC - Unauthenticated Access Control
- ✅ Redirect unauthenticated user from protected student routes
- ✅ Redirect unauthenticated user from protected researcher routes
- ✅ Redirect unauthenticated user from protected admin routes
- ✅ Redirect unauthenticated user from profile page
- ✅ Redirect unauthenticated user when trying to apply
- ✅ Allow unauthenticated user to view homepage
- ✅ Allow unauthenticated user to access login page
- ✅ Allow unauthenticated user to access signup page

#### RBAC - Cross-Role Access Prevention
- ✅ Prevent student from accessing researcher applications
- ✅ Prevent researcher from accessing student applications
- ✅ Prevent non-admin from accessing admin routes
- ✅ Prevent researcher from accessing other researcher's applications

#### RBAC - Session Management
- ✅ Redirect to login when session expires
- ✅ Maintain role-specific access after page refresh

#### RBAC - API Endpoint Protection
- ✅ Reject API calls without authentication
- ✅ Reject student API calls to researcher endpoints
- ✅ Reject researcher API calls to student endpoints
- ✅ Reject non-admin API calls to admin endpoints
- ✅ Allow authenticated API calls to user endpoints

#### RBAC - Middleware Redirect Behavior
- ✅ Redirect researcher from homepage to my-posts
- ✅ Allow student to stay on homepage
- ✅ Redirect student from researcher routes to homepage
- ✅ Redirect researcher from student application routes

#### RBAC - Cookie and Session Handling
- ✅ Set session cookie after successful login
- ✅ Clear session cookie after logout
- ✅ Set admin session cookie after admin login
- ✅ Handle missing session cookie gracefully

#### RBAC - Navigation and UI Based on Role
- ✅ Show student-specific navigation items for students
- ✅ Do not show student navigation items for researchers
- ✅ Show user name in navbar when logged in

#### RBAC - Edge Cases
- ✅ Handle user with no role gracefully
- ✅ Handle corrupted session cookie (currently may allow access)
- ✅ Handle role change mid-session
- ✅ Prevent direct URL manipulation to bypass RBAC

#### RBAC - Admin Specific Tests
- ✅ Verify admin authentication before allowing dashboard access
- ✅ Allow admin to logout and clear admin session
- ✅ Prevent admin from accessing regular user routes with admin session

**Total Tests**: 45+ tests

---

### 4. Performance Tests (`cypress/e2e/performance.cy.ts`)

Comprehensive performance benchmarking tests.

**Note**: These tests use API intercepts and mocks - they do not make real database calls.

#### Page Load Performance
- ✅ Homepage load time (< 3000ms target)
- ✅ Login page load time (< 2000ms target)
- ✅ Signup page load time (< 2000ms target)
- ✅ Logged-in page load time (researcher)

#### API Response Times
- ✅ Client-side API response timing (login endpoint)
- ✅ Detailed request/response cycle metrics

#### Component Render Times
- ✅ First Contentful Paint (FCP) measurement (< 2000ms target)
- ✅ DOM Content Loaded timing (< 2500ms target)

#### Enhanced Function Performance
- ✅ Form input timing (< 500ms target)
- ✅ Form submission timing (< 2000ms target)
- ✅ Toast notification render time (< 1500ms target)
- ✅ Page interaction responsiveness (< 500ms target)
- ✅ Search/filter performance (< 1000ms target)
- ✅ Component mount lifecycle (< 1500ms target)

#### Multiple Page Navigations
- ✅ Benchmark average navigation time across multiple pages

**Total Tests**: 9 tests

---

### 5. Stress Tests (`cypress/e2e/stress-tests.cy.ts`)

Automated stress tests to identify performance bottlenecks and edge cases.

**Note**: These tests use API intercepts and mocks - they do not make real database calls.

#### Rapid Sequential Operations
- ✅ Rapid login/logout cycles (5 cycles, tracks performance degradation)
- ✅ Rapid page navigation (measures average navigation time)
- ✅ Rapid form submissions (10 attempts, validates response time)

#### Concurrent Operations
- ✅ Multiple concurrent API requests
- ✅ Multiple toast notifications handling

#### High Volume Data
- ✅ Large number of posts (100 posts, validates rendering performance)
- ✅ Long text content (10KB text, validates UI handling)

#### Edge Cases & Boundaries
- ✅ Extremely long input values (1000 character strings)
- ✅ Special characters in inputs
- ✅ Rapid state changes (20 rapid input changes)
- ✅ Network delays (2s delay, validates graceful degradation)

**Total Tests**: 10+ tests

---

### 6. Fixture-Driven Tests (`cypress/e2e/data-seeding.cy.ts`)

Tests demonstrating deterministic test data using fixtures and API intercepts.

**Note**: These tests use fixtures and API intercepts only - they do not touch the database.

#### Test Coverage
- ✅ Consistent fixture data for posts
- ✅ Consistent fixture data for applications
- ✅ Consistent fixture data for researcher posts
- ✅ Test isolation using fixtures
- ✅ Fixture data structure validation
- ✅ Post structure validation from fixtures
- ✅ Application states from fixtures

#### Fixture-Driven Approach
**File**: `cypress/fixtures/test-seed-data.json`
- User definitions (student, researcher)
- Post templates with questions
- Application states for testing

**Total Tests**: 7 tests

**Design Philosophy**: Tests use fixtures and API intercepts to create deterministic test scenarios without touching the database. This approach ensures test isolation and safety while maintaining predictable test behavior.

---

### 7. Component Tests (`cypress/component/Toast.cy.tsx`)

Isolated component testing for the Toast notification component.

#### Rendering Tests
- ✅ Success toast rendering (with correct styling and close button)
- ✅ Error toast rendering (with warning icon ⚠)
- ✅ Loading toast rendering (with spinner, no close button)
- ✅ Null toast handling (graceful return null)

#### Interaction Tests
- ✅ Close button click calls `onDismiss` callback
- ✅ Animation end events call `onAnimationEnd` callback
- ✅ Dismissal state class application

#### Accessibility Tests
- ✅ `role="alert"` attribute for screen readers
- ✅ `aria-label="Dismiss"` on close button

#### State Management Tests
- ✅ Dismissing class applied when `isDismissing={true}`
- ✅ All toast tones render correctly (success, error, loading)

#### Portal Rendering Tests
- ✅ Toast renders in `document.body` via React Portal (not in component tree)
- ✅ Verifies correct DOM positioning for z-index layering

**Total Tests**: 10 tests

**Key Features Tested**:
- Controlled component pattern
- Portal rendering for z-index management
- Accessibility (a11y) compliance
- Animation lifecycle management
- Type safety with TypeScript

---

## Custom Cypress Commands

Located in `cypress/support/commands.ts`:

### Authentication Commands
- `cy.loginAsStudent()` - Login as student user
- `cy.loginAsResearcher()` - Login as researcher user
- `cy.loginAsAdmin()` - Login as admin user
- `cy.logout()` - Logout current user

### Performance Commands
- `cy.measurePageLoad(url)` - Measures page load time for a given URL


---

## Design for Testability: data-cy Attributes

To improve test stability and maintainability, we use `data-cy` attributes instead of brittle CSS selectors.

### Components with data-cy Attributes

#### Toast Component (`web/src/app/components/Toast.tsx`)
- `data-cy="toast"` - Toast container
- `data-cy="toast-close"` - Close button
- `data-cy="toast-icon"` - Error icon
- `data-cy="toast-spinner"` - Loading spinner

#### LabList Component (`web/src/app/components/LabList.tsx`)
- `data-cy="lab-page"` - Main page container
- `data-cy="page-title"` - Page title
- `data-cy="search-container"` - Search container
- `data-cy="lab-search"` - Search input container
- `data-cy="search-input"` - Search input field
- `data-cy="lab-cards-container"` - Cards container
- `data-cy="lab-card"` - Individual lab card
- `data-cy="lab-title"` - Lab card title
- `data-cy="lab-description"` - Lab description
- `data-cy="lab-tags"` - Tags container
- `data-cy="lab-tag"` - Individual tag
- `data-cy="lab-details"` - Details list
- `data-cy="lab-detail-item"` - Detail list item
- `data-cy="learn-more-link"` - Learn more link

#### Lab Detail Page (`web/src/app/(protected)/labs/[id]/page.tsx`)
- `data-cy="lab-detail-page"` - Detail page container
- `data-cy="lab-detail-card"` - Detail card
- `data-cy="lab-detail-title"` - Lab title
- `data-cy="apply-button"` - Apply button

### Benefits

1. **Stability**: CSS classes change for styling; `data-cy` attributes are stable
2. **Clarity**: Explicit test hooks make intent clear
3. **Maintainability**: Tests break less often when UI is refactored
4. **Self-Documenting**: Shows which elements are tested

### Usage Example

```typescript
// Before (brittle):
cy.get('.lab-card .lab-name').click()

// After (stable):
cy.get('[data-cy="lab-card"]').find('[data-cy="lab-title"]').click()
```

---

## Performance Benchmarks

### Current Performance Targets

| Metric | Target | Test Suite |
|--------|--------|------------|
| Homepage Load | < 3000ms | performance.cy.ts |
| Login/Signup Pages | < 2000ms | performance.cy.ts |
| First Contentful Paint | < 2000ms | performance.cy.ts |
| DOM Content Loaded | < 2500ms | performance.cy.ts |
| API Response (auth) | < 500ms | performance.cy.ts |
| API Response (posts) | < 1000ms | performance.cy.ts |
| Form Input | < 500ms | performance.cy.ts |
| Form Submit | < 2000ms | performance.cy.ts |
| Toast Render | < 1500ms | performance.cy.ts |
| Click Response | < 500ms | performance.cy.ts |
| Search/Filter | < 1000ms | performance.cy.ts |
| Component Mount | < 1500ms | performance.cy.ts |

---

## Fixture-Driven Testing Approach

### Using Fixtures for Deterministic Data

**Location**: `cypress/fixtures/test-seed-data.json`

Tests use fixtures combined with API intercepts to create deterministic test scenarios without touching the database.

### Benefits

1. **Safety**: No risk of modifying production or test databases
2. **Isolation**: Each test uses predictable mock data
3. **Speed**: No database operations, tests run faster
4. **Determinism**: Same data every test run

### Design Philosophy

Tests use **fixtures** and **API intercepts** to create deterministic scenarios:
- Tests mock API responses using fixture data
- No database operations required
- Tests don't depend on database state
- Single source of truth for test data (fixtures)

**Example Usage**:
```typescript
// Mock API response using fixture
cy.intercept('GET', '/api/posts*', { fixture: 'posts.json' }).as('getPosts')
cy.intercept('GET', '/api/auth/me', { fixture: 'student-user.json' }).as('getUser')
```

**Report Talking Point**:
> "Our fixture-driven testing approach uses JSON fixtures and API intercepts to create deterministic test scenarios. This ensures test isolation and safety while maintaining predictable behavior. Tests don't touch the database, making them faster and safer to run."

---

## Test Statistics

| Test Suite | Tests | Purpose |
|------------|-------|---------|
| Functionality | 40+ | Core application features |
| Acceptance Criteria | 24 | User story acceptance criteria |
| Auth & RBAC | 45+ | Authentication and access control |
| Performance | 9 | Performance benchmarking |
| Stress Tests | 10+ | Performance under load |
| Fixture-Driven Tests | 7 | Deterministic test data using fixtures |
| Component (Toast) | 10 | Isolated component testing |
| **Total** | **140+** | **Comprehensive test coverage** |

---

## Test Credentials

Test credentials are stored in `cypress/support/credentials.ts` (not committed to Git).

To create this file locally:
```typescript
export const student = {
  email: 'your-student-email@ucla.edu',
  password: 'your-password',
};

export const researcher = {
  email: 'your-researcher-email@ucla.edu',
  password: 'your-password',
};

export const admin = {
  email: 'your-admin-email@example.com',
  password: 'your-password',
};
```

---

## Best Practices

### Test Isolation
- Each test should be independent and not rely on state from other tests
- Use `beforeEach` to reset state (cookies, localStorage)
- **Newer tests use mocks/intercepts** - they don't touch the database


### Stable Selectors
- Prefer `data-cy` attributes over CSS classes
- Use semantic selectors when possible

### Performance Testing
- Measure actual user-facing metrics (page load, interaction response)
- Set realistic performance targets
- Track performance over time

### Component Testing
- Test components in isolation
- Mock external dependencies
- Test user interactions and accessibility

---

## Troubleshooting

### Tests Failing Due to Timing
- Increase timeouts for slow operations: `{ timeout: 10000 }`
- Wait for API calls: `cy.wait('@apiCall')`
- Wait for elements: `cy.get('.element', { timeout: 5000 })`


### Component Tests Not Running
- Ensure component testing is enabled in `cypress.config.ts`
- Check that React dependencies are installed
- Verify component imports are correct

---

For detailed information on test implementation, see the test files themselves or refer to inline comments.
