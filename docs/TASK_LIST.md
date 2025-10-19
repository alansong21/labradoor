
## Must Have User Stories

### 1. STUDENT REGISTRATION

**As a UCLA Student**, I want to register with a UCLA-verified credential (UCLA email and ID) so that my identity as a UCLA Student can be verified.

**Acceptance Criteria**

-   Given that a UCLA Student enters their `@ucla.edu` or `@g.ucla.edu` email and UCLA ID, when they submit the registration form, then they should receive a verification link sent to that email address.
    
-   Given that a UCLA Student clicks the verification link, a Student Account is created and they can access the platform.
    
-   Given that a User enters a non-UCLA email, when they attempt to register, they should see an error message explaining that a valid UCLA email is required and should not receive a verification email.
    

**Tasks To Implement**

-   [UI/UX] Wireframe Student Registration Page
    
-   [UI/UX] Implement Registration Page (React/HTML/CSS)
    
-   [UI/UX] Wireframe Verification Page
    
-   [UI/UX] Implement Verification Page (React/HTML/CSS)
    
-   [BL] Define API contracts for frontend–backend communication
    
-   [BL] Implement credentials validation logic
    
-   [BL] Implement email service & verification logic
    
-   [BL] Implement account creation logic
    
-   [DB] Define Student/Student Account data models and create tables
    
-   [QA] Write integration tests for end-to-end flows/API calls
    
-   [DOCS] Update README/docs for Dev & API
    

----------

### 2. STUDENT SIGN IN

**As a UCLA Student**, I want to sign in with my username and password so that I can access my account.

**Acceptance Criteria**

-   Given valid credentials, when a Student clicks “Sign In,” they are logged into their account and redirected to the Student Homepage.
    
-   Given invalid credentials, when they attempt to sign in, they should not be logged into any account.
    

**Tasks To Implement**

-   [UI/UX] Wireframe Student Sign-In Page
    
-   [UI/UX] Implement Sign-In Page (React/HTML/CSS)
    
-   [BL] Define API contracts for frontend–backend communication
    
-   [BL] Implement credentials validation logic
    
-   [BL] Implement post-login flow logic
    
-   [QA] Write integration tests
    
-   [DOCS] Update README/docs
    

----------

### 3. RESEARCHER REGISTRATION

**As a UCLA Researcher**, I want to register with a UCLA-verified method (e.g., UCLA email) so that my identity as a UCLA Researcher can be verified.

**Acceptance Criteria**

-   Given that a Researcher enters their `@ucla.edu` or `@g.ucla.edu` email, when they submit the registration form, they should receive a verification email.
    
-   Given that a Researcher clicks the verification link, a Researcher Account is created and they can access the platform.
    
-   Given that a User enters a non-UCLA email, they should see an error message and should not receive a verification email.
    

**Tasks To Implement**

-   [UI/UX] Wireframe Researcher Registration Page
    
-   [UI/UX] Implement Researcher Registration Page (React/HTML/CSS)
    
-   [UI/UX] Wireframe Verification Page
    
-   [UI/UX] Implement Verification Page (React/HTML/CSS)
    
-   [BL] Define API contracts for frontend–backend communication
    
-   [BL] Implement credentials validation logic
    
-   [BL] Implement email service & verification logic
    
-   [BL] Implement account creation logic
    
-   [DB] Define Researcher/Researcher Account data models and create tables
    
-   [QA] Write integration tests for end-to-end flows/API calls
    
-   [DOCS] Update README/docs for Dev & API
    

----------

### 4. RESEARCHER SIGN IN

**As a UCLA Researcher**, I want to sign in with my username and password so that I can access my account.

**Acceptance Criteria**

-   Given valid credentials, when they sign in, they are logged into their Researcher Homepage.
    
-   Given invalid credentials, when they attempt to sign in, they should not be logged into any account.
    

**Tasks To Implement**

-   [UI/UX] Wireframe Researcher Sign-In Page
    
-   [UI/UX] Implement Sign-In Page (React/HTML/CSS)
    
-   [BL] Define API contracts for frontend–backend communication
    
-   [BL] Implement credentials validation logic
    
-   [BL] Implement post-login flow logic
    
-   [QA] Write integration tests
    
-   [DOCS] Update README/docs
    

----------

### 5. STUDENT HOMEPAGE DISPLAY

**As a UCLA Student**, I want to view the homepage listing open lab positions (“Student Homepage”) so that I can discover research opportunities.

**Acceptance Criteria**

-   Given open position posts exist, when a Student navigates to the homepage, they should see a list of open posts, each linking to a detail page.
    
-   Given no open position posts exist, when a Student navigates to the homepage, they should see a message indicating that no positions are available.
    

**Tasks To Implement**

-   [UI/UX] Wireframe Student Homepage
    
-   [UI/UX] Implement page shell (React/HTML/CSS)
    
-   [UI/UX] Implement posts/openings feed component
    
-   [UI/UX] Implement individual post card component
    
-   [BL] Define API contracts for frontend–backend communication
    
-   [BL] Implement auth logic (gating as needed)
    
-   [BL] Implement list-openings endpoint + feed fetching
    
-   [BL] Implement navigation to Post Detail on click
    
-   [QA] Write integration tests
    
-   [DOCS] Update docs and README
    

----------

### 6. RESEARCHER POST CREATION

**As a UCLA Researcher**, I want to create and publish new lab posts (title, description, requirements, questions, etc.) so that students can view and apply.

**Acceptance Criteria**

-   Given that a Researcher fills in the required fields and confirms, a new post is created, stored persistently, and they are redirected to its detail page with a success message.
    
-   Given missing fields, when they attempt to submit, validation errors are shown and the post is not created.
    
-   Given that a User is not logged in as a Researcher, when they attempt to access the Create Post page, they should not be able to access it.
    

**Tasks To Implement**

-   [UI/UX] Wireframe Create Post Page
    
-   [UI/UX] Implement page shell (React/HTML/CSS)
    
-   [UI/UX] Implement application information form
    
-   [BL] Define API contracts for frontend–backend communication
    
-   [BL] Implement auth for researcher-only access
    
-   [BL] Implement business logic to create a new post
    
-   [BL] Implement logic to load application information (questions)
    
-   [BL] Implement form validation on server side
    
-   [BL] Implement update on submit + redirect
    
-   [DB] Design and document data model for a post
    
-   [QA] Write integration tests
    
-   [DOCS] Update docs and README
    

----------

### 7. STUDENT APPLICATION CREATION

**As a UCLA Student**, I want to create applications for each lab opening so that I can begin applying to a specific post.

**Acceptance Criteria**

-   Given that a Student is logged in and on a post’s detail page, when they start an application, a new application draft is created (linked to the post and student) and stored persistently, and they are redirected to the application editing page.
    
-   Given that a User is not logged in as a Student, when they attempt to start an application, no draft should be created.
    
-   Given that a Student already has an existing draft for that post, when they attempt to start another, they should see a message indicating that an application already exists.
    

**Tasks To Implement**

-   [UI/UX] Wireframe Post Detail Page
    
-   [UI/UX] Implement Post Detail Page (React/HTML/CSS)
    
-   [UI/UX] Wireframe Edit Application Page
    
-   [UI/UX] Implement Application Edit Page (React/HTML/CSS)
    
-   [BL] Define API contracts for frontend–backend communication
    
-   [BL] Implement auth logic (student-only)
    
-   [BL] Implement create-application draft logic
    
-   [BL] Load post details/information
    
-   [BL] Load application information (draft)
    
-   [BL] Validate application form data
    
-   [BL] Implement post-form submission flow
    
-   [BL] Enforce single draft per post (check existing drafts)
    
-   [DB] Design and document data model for an application
    
-   [QA] Write integration tests
    
-   [DOCS] Update docs and README
    

----------

### 8. RESEARCHER APPLICATION VIEWING

**As a UCLA Researcher**, I want to view submitted applications for a specific post I created so that I can review and manage candidates.

**Acceptance Criteria**

-   Given that a Researcher is logged in, when they open their post, they are able to view every submitted application.
    
-   Given that a Researcher is viewing a submitted application, they can accept or reject it.
    
-   Given that a User is not the post’s creator, they cannot access that post’s applications.
    
-   Given that a post has no submitted applications, when viewed, the Researcher sees a message indicating “no applications have been submitted.”
    

**Tasks To Implement**

-   [UI/UX] Wireframe Application Viewer Page
    
-   [UI/UX] Implement page shell (React/HTML/CSS)
    
-   [UI/UX] Implement application renderer component
    
-   [BL] Define API contracts for frontend–backend communication
    
-   [BL] Implement auth logic (owner-only access)
    
-   [BL] Implement logic to load application details
    
-   [QA] Write integration tests
    
-   [DOCS] Update docs and README
    

----------

### 9. RESEARCHER APPLICATION ACCEPTANCE

**As a UCLA Researcher**, I want to accept or reject a student’s application so that I can track successful and unsuccessful applicants.

**Acceptance Criteria**

-   Given that a Researcher accepts an application, its status updates to “Accepted.”
    
-   Given that a Researcher rejects an application, its status updates to “Rejected.”
    

**Tasks To Implement**

-   [UI/UX] Implement Accept & Reject buttons (React/HTML/CSS)
    
-   [BL] Define API contracts for frontend–backend communication
    
-   [BL] Implement business logic to handle acceptance/rejection flows
    
-   [QA] Write integration tests
    
-   [DOCS] Update docs and README
    

----------

## Should Have User Stories

### 10. RESEARCHER CLOSING POST

**As a UCLA Researcher**, I want to close my post so that I can stop receiving applications.

**Acceptance Criteria**

-   Given that a Researcher is viewing one of their posts, when they choose to close it, the post’s `status` changes to `Closed`.
    
-   Given that a post is closed, new applications cannot be submitted.
    

**Tasks To Implement**

-   [UI/UX] Implement “Close Applications” button (React/HTML/CSS)
    
-   [BL] Define API contracts for frontend–backend communication
    
-   [BL] Implement business logic to close a post
    
-   [QA] Write integration tests
    
-   [DOCS] Update docs and README
    

----------

### 11. RESEARCHER POST EDITING

**As a UCLA Researcher**, I want to edit my lab opening posts so that I can modify the information requested from students.

**Acceptance Criteria**

-   Given that a Researcher is logged in and viewing one of their posts, when they choose to edit, the existing information is displayed and can be modified.
    
-   Given that they save their progress, all entries are persisted.
    
-   Given invalid edits, they should see validation errors and no changes are saved.
    

**Tasks To Implement**

-   [UI/UX] Wireframe Edit Post Page
    
-   [UI/UX] Implement Edit Post Page (React/HTML/CSS)
    
-   [UI/UX] Implement form rendering with existing post data
    
-   [UI/UX] Add Edit Post button on Post Detail Page
    
-   [BL] Define API contracts for frontend–backend communication
    
-   [BL] Implement form validation logic
    
-   [BL] Implement fetch post + save changes persistently
    
-   [QA] Write integration tests
    
-   [DOCS] Update docs and README
    

----------

### 12. STUDENT APPLICATION EDITING

**As a UCLA Student**, I want to edit my application drafts so that I can modify my responses before submission.

**Acceptance Criteria**

-   Given that a Student is logged in and viewing an application, existing data is displayed for editing.
    
-   Given that they save their progress, all entries are persisted.
    
-   Given that the application is already submitted, it cannot be edited further.
    

**Tasks To Implement**

-   [UI/UX] Add “Edit Application” entry point on Application Detail Page (React/HTML/CSS)
    
-   [BL] Define API contracts for frontend–backend communication
    
-   [BL] Implement save-draft logic
    
-   [QA] Write integration tests
    
-   [DOCS] Update docs and README
    

----------

## Nice To Have User Stories

### 13. RESEARCHER POST STATUS PAGE (“My Posts”)

**As a UCLA Researcher**, I want to view all of my lab openings (“My Posts”) so that I can easily access and manage them.

**Acceptance Criteria**

-   Given that a Researcher is logged in, when they navigate to the “My Posts” page, they see all posts linked to their account.
    
-   Given that they open a post from this page, they are redirected to that specific post’s detail page.
    

**Tasks To Implement**

-   [UI/UX] Wireframe “My Posts” Page
    
-   [UI/UX] Implement page shell (React/HTML/CSS)
    
-   [UI/UX] Implement list component for created posts
    
-   [UI/UX] Implement individual post item component
    
-   [BL] Define API contracts for frontend–backend communication
    
-   [BL] Implement auth logic
    
-   [BL] Implement fetch of user’s created posts
    
-   [BL] Implement navigation to Post Detail
    
-   [QA] Write integration tests
    
-   [DOCS] Update docs and README
    

----------

### 14. STUDENT APPLICATION STATUS PAGE (“My Applications”)

**As a UCLA Student**, I want to view and track the status of all of my applications (“My Applications”) so that I can manage my submissions.

**Acceptance Criteria**

-   Given that a Student is logged in, when they navigate to “My Applications,” they see all applications linked to their account.
    
-   Given that they open an application, they are redirected to that specific application’s detail page.
    

**Tasks To Implement**

-   [UI/UX] Wireframe “My Applications” Page
    
-   [UI/UX] Implement My Applications button on Student Homepage (React/HTML/CSS)
    
-   [UI/UX] Implement list component for the student’s applications
    
-   [UI/UX] Implement individual application item component
    
-   [BL] Define API contracts for frontend–backend communication
    
-   [BL] Implement auth logic
    
-   [BL] Implement fetch of user’s applications
    
-   [BL] Implement navigation to Application Detail
    
-   [QA] Write integration tests
    
-   [DOCS] Update docs and README
    

----------

## Overlapping (Embedded in Others)

### 15. STUDENT APPLICATION SUBMISSION

**As a UCLA Student**, I want to submit my completed application so that researchers can review it.

**Acceptance Criteria**

-   Given that a Student submits an application, its status changes to `Submitted`.
    
-   Given that an application has status `Submitted`, it becomes read-only and cannot be edited or resubmitted.
    

**Tasks To Implement**

-   [UI/UX] Implement “Submit Application” button on the Application Edit Page (React/HTML/CSS)
    
-   [BL] Define API contracts for frontend–backend communication
    
-   [BL] Implement auth logic
    
-   [BL] Implement submission logic and state enforcement
    
-   [QA] Write integration tests
    
-   [DOCS] Update docs and README
    

----------