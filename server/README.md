# Labradoor Backend API Documentation

The Labradoor backend is an Express.js server that provides REST API endpoints for managing research opportunities, applications, and user authentication.

Note that these docs are largely written by Claude Sonnet 2.5. The outline and routes were given, the details were filled out by AI.

## Base URL

Development: `http://localhost:4000`

## Table of Contents

- [Authentication](#authentication)
- [Users](#users)
- [Posts (Research Opportunities)](#posts-research-opportunities)
- [Applications](#applications)
- [Questions](#questions)
- [Answers](#answers)
- [Students](#students)
- [Researchers](#researchers)
- [Admin](#admin)

---

## Authentication

Base path: `/api/auth`

### POST `/signup`
Start the user signup process and send a verification email.

**Request Body:**
```json
{
  "email": "student@ucla.edu",
  "password": "password123",
  "name": "John Doe",
  "uclaId": "123456789",
  "role": "STUDENT"
}
```

**Fields:**
- `email` (required): Valid UCLA email (@ucla.edu or @g.ucla.edu)
- `password` (required): Minimum 8 characters
- `name` (optional): User's full name
- `uclaId` (optional): 9-digit UCLA ID or empty string
- `role` (required): Either "STUDENT" or "RESEARCHER"

**Response:** `202 Accepted`
```json
{
  "message": "Verification link sent (check server logs)"
}
```

**Error Responses:**
- `400`: Invalid request body
- `409`: Account already exists

---

### POST `/verify-signup`
Verify email address using the token sent via email.

**Request Body:**
```json
{
  "token": "verification_token_string"
}
```

**Response:** `200 OK`
```json
{
  "message": "Email verified. You can now log in."
}
```

**Error Responses:**
- `400`: Invalid or expired token

---

### POST `/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "student@ucla.edu",
  "password": "password123"
}
```

**Response:** `200 OK`
Sets a session cookie and returns user information.

```json
{
  "user": {
    "id": 1,
    "email": "student@ucla.edu",
    "name": "John Doe",
    "uclaId": "123456789"
  }
}
```

**Error Responses:**
- `401`: Invalid credentials or unverified email

---

### GET `/me`
Get current authenticated user information.

**Authentication:** Required (session cookie)

**Response:** `200 OK`
```json
{
  "user": {
    "id": 1,
    "email": "student@ucla.edu",
    "name": "John Doe",
    "uclaId": "123456789"
  }
}
```

**Error Responses:**
- `401`: Not authenticated

---

### POST `/logout`
Logout the current user and clear session.

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "message": "Logged out"
}
```

---

### POST `/admin/login`
Admin login endpoint.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "admin_password"
}
```

**Response:** `200 OK`
Sets an admin session cookie.

---

### GET `/admin/verify`
Verify admin session.

**Authentication:** Admin session required

**Response:** `200 OK`

---

### POST `/admin/logout`
Logout admin user.

**Response:** `200 OK`

---

## Users

Base path: `/api/users`

All user endpoints require authentication.

### GET `/`
List all users.

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "users": [
    {
      "id": 1,
      "email": "user@ucla.edu",
      "name": "John Doe",
      "uclaId": "123456789"
    }
  ]
}
```

---

### GET `/:id`
Get a specific user by ID.

**Authentication:** Required

**Parameters:**
- `id` (path): User ID

**Response:** `200 OK`
```json
{
  "user": {
    "id": 1,
    "email": "user@ucla.edu",
    "name": "John Doe",
    "uclaId": "123456789"
  }
}
```

**Error Responses:**
- `404`: User not found

---

### PUT `/:id`
Update user information.

**Authentication:** Required

**Parameters:**
- `id` (path): User ID

**Request Body:**
```json
{
  "name": "John Smith",
  "uclaId": "987654321"
}
```

**Response:** `200 OK`

---

### PUT `/:id/profile`
Update user profile.

**Authentication:** Required

**Parameters:**
- `id` (path): User ID

**Response:** `200 OK`

---

### DELETE `/:id`
Delete a user account.

**Authentication:** Required

**Parameters:**
- `id` (path): User ID

**Response:** `204 No Content`

---

## Posts (Research Opportunities)

Base path: `/api/posts`

### GET `/`
Get all research opportunity posts (public).

**Response:** `200 OK`
```json
{
  "posts": [
    {
      "id": 1,
      "title": "Machine Learning Research Assistant",
      "body": "Full description...",
      "description": "Short description",
      "tags": ["ML", "AI"],
      "createdAt": "2024-01-15T10:00:00Z",
      "researcher": {
        "userId": 2,
        "user": {
          "name": "Dr. Smith"
        }
      }
    }
  ]
}
```

---

### GET `/:id`
Get a specific post by ID (public).

**Parameters:**
- `id` (path): Post ID

**Response:** `200 OK`
```json
{
  "id": 1,
  "title": "Machine Learning Research Assistant",
  "body": "Full description...",
  "description": "Short description",
  "tags": ["ML", "AI"],
  "questions": [
    {
      "id": 1,
      "type": "LONG_TEXT",
      "body": {
        "prompt": "Why are you interested?",
        "description": "",
        "options": []
      }
    }
  ]
}
```

**Error Responses:**
- `404`: Post not found

---

### GET `/my-posts`
Get all posts created by the authenticated researcher.

**Authentication:** Required (Researcher role)

**Response:** `200 OK`
```json
{
  "posts": [...]
}
```

---

### POST `/`
Create a new research opportunity post.

**Authentication:** Required (Researcher role, must be verified)

**Request Body:**
```json
{
  "title": "Machine Learning Research Assistant",
  "body": "Full description of the opportunity...",
  "description": "Short summary",
  "tags": ["ML", "AI", "Python"],
  "questions": [
    {
      "type": "text",
      "question": "Why are you interested in this position?",
      "description": "Please provide detailed reasoning"
    },
    {
      "type": "multiple-choice",
      "question": "What is your year?",
      "options": ["Freshman", "Sophomore", "Junior", "Senior"]
    },
    {
      "type": "checkbox",
      "question": "Which programming languages do you know?",
      "options": ["Python", "Java", "C++", "JavaScript"]
    }
  ]
}
```

**Question Types:**
- `text`: Long text response
- `multiple-choice`: Single selection from options (requires `options` array)
- `checkbox`: Multiple selections from options (requires `options` array)

**Response:** `201 Created`
```json
{
  "id": 1,
  "title": "Machine Learning Research Assistant",
  "body": "Full description...",
  "questions": [...]
}
```

**Error Responses:**
- `400`: Invalid request body or validation error
- `403`: Researcher not verified

---

### DELETE `/:id`
Delete a post.

**Authentication:** Required (Researcher role, must own the post)

**Parameters:**
- `id` (path): Post ID

**Response:** `204 No Content`

**Error Responses:**
- `404`: Post not found
- `403`: Not authorized to delete this post

---

## Applications

Base path: `/api/applications`

### POST `/`
Submit an application to a research opportunity.

**Authentication:** Required (Student role)

**Request Body:**
```json
{
  "postId": 1,
  "status": "PENDING",
  "responses": [
    {
      "questionId": 1,
      "answer": "I am interested because..."
    },
    {
      "questionId": 2,
      "answer": "Junior"
    },
    {
      "questionId": 3,
      "answer": ["Python", "Java"]
    }
  ]
}
```

**Fields:**
- `postId` (required): ID of the post to apply to
- `status` (optional): Application status (default: "PENDING")
- `responses` (optional): Array of answers to post questions

**Response:** `201 Created`
```json
{
  "id": 1,
  "postId": 1,
  "studentId": 5,
  "status": "PENDING",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

**Error Responses:**
- `400`: Invalid request or incomplete student profile
- `404`: Post not found
- `409`: Already applied to this post

---

### GET `/my-applications`
Get all applications submitted by the authenticated student.

**Authentication:** Required (Student role)

**Response:** `200 OK`
```json
{
  "applications": [
    {
      "id": 1,
      "postId": 1,
      "status": "PENDING",
      "createdAt": "2024-01-15T10:00:00Z",
      "post": {
        "title": "Machine Learning Research Assistant"
      }
    }
  ]
}
```

---

### GET `/post/:postId`
Get all applications for a specific post.

**Authentication:** Required (Researcher role, must own the post)

**Parameters:**
- `postId` (path): Post ID

**Response:** `200 OK`
```json
{
  "applications": [
    {
      "id": 1,
      "studentId": 5,
      "status": "PENDING",
      "student": {
        "user": {
          "name": "John Doe",
          "email": "student@ucla.edu"
        },
        "year": "Junior",
        "major": "Computer Science"
      },
      "answers": [...]
    }
  ]
}
```

---

### GET `/:id`
Get a specific application by ID.

**Authentication:** Required

**Parameters:**
- `id` (path): Application ID

**Response:** `200 OK`

**Error Responses:**
- `404`: Application not found

---

### PATCH `/:id`
Update an application (e.g., change status).

**Authentication:** Required

**Parameters:**
- `id` (path): Application ID

**Request Body:**
```json
{
  "status": "ACCEPTED"
}
```

**Status Options:**
- `PENDING`
- `UNDER_REVIEW`
- `ACCEPTED`
- `REJECTED`

**Response:** `200 OK`

---

### DELETE `/:id`
Delete an application.

**Authentication:** Required (Student role, must own the application)

**Parameters:**
- `id` (path): Application ID

**Response:** `204 No Content`

---

## Questions

Base path: `/api/questions`

### GET `/:id`
Get a specific question by ID (public).

**Parameters:**
- `id` (path): Question ID

**Response:** `200 OK`

---

### GET `/post/:postId`
Get all questions for a specific post (public).

**Parameters:**
- `postId` (path): Post ID

**Response:** `200 OK`
```json
{
  "questions": [
    {
      "id": 1,
      "type": "LONG_TEXT",
      "body": {
        "prompt": "Why are you interested?",
        "description": "Please be specific",
        "options": []
      }
    }
  ]
}
```

---

### POST `/`
Create a new question for a post.

**Authentication:** Required (Researcher role)

**Request Body:**
```json
{
  "postId": 1,
  "type": "text",
  "question": "What is your experience?",
  "description": "Optional description",
  "options": []
}
```

**Response:** `201 Created`

---

### PATCH `/:id`
Update a question.

**Authentication:** Required (Researcher role)

**Parameters:**
- `id` (path): Question ID

**Response:** `200 OK`

---

### DELETE `/:id`
Delete a question.

**Authentication:** Required (Researcher role)

**Parameters:**
- `id` (path): Question ID

**Response:** `204 No Content`

---

## Answers

Base path: `/api/answers`

### POST `/`
Create an answer to a question.

**Authentication:** Required

**Request Body:**
```json
{
  "applicationId": 1,
  "questionId": 1,
  "answer": "My response..."
}
```

**Response:** `201 Created`

---

### GET `/:id`
Get a specific answer by ID.

**Authentication:** Required

**Parameters:**
- `id` (path): Answer ID

**Response:** `200 OK`

---

### GET `/application/:id`
Get all answers for a specific application.

**Authentication:** Required

**Parameters:**
- `id` (path): Application ID

**Response:** `200 OK`
```json
{
  "answers": [
    {
      "id": 1,
      "questionId": 1,
      "answer": "My response...",
      "question": {
        "body": {
          "prompt": "Why are you interested?"
        }
      }
    }
  ]
}
```

---

### PATCH `/:id`
Update an answer.

**Authentication:** Required

**Parameters:**
- `id` (path): Answer ID

**Request Body:**
```json
{
  "answer": "Updated response..."
}
```

**Response:** `200 OK`

---

### DELETE `/:id`
Delete an answer.

**Authentication:** Required

**Parameters:**
- `id` (path): Answer ID

**Response:** `204 No Content`

---

## Students

Base path: `/api/students`

### PUT `/:id`
Update student profile information.

**Authentication:** Required

**Parameters:**
- `id` (path): Student user ID

**Request Body:**
```json
{
  "year": "Junior",
  "major": "Computer Science",
  "description": "I am passionate about research..."
}
```

**Response:** `200 OK`

---

## Researchers

Base path: `/api/researchers`

### PUT `/:id`
Update researcher profile information.

**Authentication:** Required

**Parameters:**
- `id` (path): Researcher user ID

**Request Body:**
```json
{
  "department": "Computer Science",
  "bio": "Professor specializing in..."
}
```

**Response:** `200 OK`

---

## Admin

Base path: `/api/admin`

All admin endpoints require admin authentication.

### GET `/researchers`
Get all researchers with verification status.

**Authentication:** Admin required

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "userId": 2,
    "verifyStatus": "VERIFIED",
    "user": {
      "id": 2,
      "email": "researcher@ucla.edu",
      "name": "Dr. Smith",
      "createdAt": "2024-01-15T10:00:00Z"
    },
    "_count": {
      "posts": 5
    }
  }
]
```

---

### PATCH `/researchers/:userId/verify`
Update researcher verification status.

**Authentication:** Admin required

**Parameters:**
- `userId` (path): User ID of the researcher

**Request Body:**
```json
{
  "verifyStatus": "VERIFIED"
}
```

**Status Options:**
- `VERIFIED`: Researcher is verified and can create posts
- `PENDING`: Verification pending
- `UNVERIFIED`: Not verified

**Response:** `200 OK`
```json
{
  "id": 1,
  "userId": 2,
  "verifyStatus": "VERIFIED",
  "user": {
    "id": 2,
    "email": "researcher@ucla.edu",
    "name": "Dr. Smith"
  }
}
```

**Error Responses:**
- `400`: Invalid userId or verifyStatus
- `404`: Researcher not found

---

### GET `/users`
Get all users (admin view with student/researcher data).

**Authentication:** Admin required

**Response:** `200 OK`
```json
{
  "users": [
    {
      "id": 1,
      "email": "user@ucla.edu",
      "name": "John Doe",
      "student": {
        "year": "Junior",
        "major": "Computer Science"
      },
      "researcher": null
    }
  ]
}
```

---

### GET `/users/:id`
Get a specific user by ID (admin view).

**Authentication:** Admin required

**Parameters:**
- `id` (path): User ID

**Response:** `200 OK`

**Error Responses:**
- `400`: Invalid user id
- `404`: User not found

---

### DELETE `/users/:id`
Delete a user and all related data.

**Authentication:** Admin required

**Parameters:**
- `id` (path): User ID

**Response:** `204 No Content`

This operation cascades and deletes:
- Student/Researcher profiles
- Applications
- Answers
- Posts (for researchers)
- Questions (for researcher's posts)
- Sessions
- Verification tokens

**Error Responses:**
- `400`: Invalid user id
- `404`: User not found

---

## Error Handling

All endpoints follow standard HTTP status codes:

- `200 OK`: Successful GET/PUT/PATCH request
- `201 Created`: Successful POST request creating a resource
- `202 Accepted`: Request accepted for processing
- `204 No Content`: Successful DELETE request
- `400 Bad Request`: Invalid request body or parameters
- `401 Unauthorized`: Authentication required or invalid credentials
- `403 Forbidden`: Authenticated but not authorized for this action
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate entry)
- `500 Internal Server Error`: Server error

Error responses typically follow this format:
```json
{
  "error": "Error message describing what went wrong"
}
```

## Authentication

The API uses cookie-based session authentication. After logging in, the session cookie is automatically included in subsequent requests. The cookie name is `session_token` for regular users and `admin_session` for admin users.

## Role-Based Access

- **Public**: Anyone can access
- **Student**: Requires authentication with student role
- **Researcher**: Requires authentication with researcher role
- **Verified Researcher**: Researcher with `VERIFIED` status (required for creating posts)
- **Admin**: Requires admin authentication

## Testing

This project uses Jest and Supertest for testing API controllers. The tests cover endpoints successes and failures, authorization, validadtion and database errors.

### Testing structure
```
project/
├── __tests__/
│   ├── answerController.test.js
│   ├── authController.test.js
│   ├── questionController.test.js
│   ├── userController.test.js
│   └── postController.test.js
├── __mocks__/
│   └── prisma.js                     # mock Prisma client
├── jest.config.js                    # jest configuration
└── jest.setup.js                     # Ggobal test setup
```

### Running tests

#### Dependencies:
```bash
npm install --save-dev jest supertest
```

#### Running tests:
```bash
npm test
```

#### Running specific test files:
```bash
npm test __test__/[file]Controller.test.js
```