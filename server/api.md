# API Documentation

Base URL: **`http://localhost:4000/api`**

Authentication uses an HTTP-only `session` cookie set by **Login**.  
Any route marked **Auth: required** must be called *after* login.

---

## 1. Auth

### `POST /auth/request-signup`
Request a signup verification link for a UCLA email.

**Auth:** not required  
**Use case:** user begins signup flow.

#### Request Body
```json
{
  "email": "bruin@g.ucla.edu",
  "password": "mypassword123",
  "name": "First Last",
  "uclaId": "1234567",
  "role": "STUDENT"
}
```

#### Success
- `202 Accepted`: verification link sent.

#### Common errors
- `400`: invalid input  
- `409`: already verified user exists  

---

### `POST /auth/verify-signup`
Verify signup with token from verification link.

**Auth:** not required  
**Use case:** complete signup & activate account.

#### Request Body
```json
{
  "token": "long-verification-token"
}
```

#### Success
- `200 OK`: email verified.

#### Common errors
- `400`: missing/invalid/expired token  

---

### `POST /auth/login`
Log in with UCLA email + password.

**Auth:** not required  
**Use case:** authenticate user and start a session.

#### Request Body
```json
{
  "email": "bruin@g.ucla.edu",
  "password": "mypassword123"
}
```

#### Success
- `200 OK`
- Sets the **`session`** cookie (HTTP-only)
- Returns:
```json
{
  "user": {
    "id": 3,
    "email": "bruin@g.ucla.edu",
    "name": "FirstName",
    "uclaId": "1234567",
    "role": "STUDENT",
    "createdAt": "..."
  }
}
```

#### Common errors
- `400`: invalid body  
- `401`: bad credentials or email not verified  

---

### `GET /auth/me`
Get the currently logged-in user.

**Auth:** required  
**Use case:** frontend loads user info on refresh.

#### Success
```json
{
  "user": {
    "id": 3,
    "email": "bruin@g.ucla.edu",
    "name": "FirstName",
    "uclaId": "1234567",
    "role": "STUDENT"
  }
}
```

#### Common errors
- `401`: not authenticated  

---

### `POST /auth/logout`
Log out and clear the session cookie.

**Auth:** required

#### Success
```json
{ "ok": true }
```

---

## 2. Researcher

Routes mounted at: **`/api/researcher`**

These manage a user’s Researcher profile.

---

### `POST /researcher/me`
Create or update the current user’s Researcher profile.

**Auth:** required  
**Use case:** user becomes a researcher or updates department.

#### Request Body
```json
{
  "department": "Computer Science"
}
```

#### Success  
**201** (create) or **200** (update):
```json
{
  "userId": 3,
  "verifyStatus": "PENDING",
  "department": "Computer Science"
}
```

#### Common errors
- `400`: invalid body  
- `401`: not authenticated  
- `500`: failed to save researcher profile  

---

### `GET /researcher/me`
Get the current user's Researcher profile.

**Auth:** required  
**Use case:** show researcher profile & status.

#### Success
```json
{
  "userId": 3,
  "verifyStatus": "PENDING",
  "department": "Computer Science",
  "user": {
    "id": 3,
    "email": "bruin@g.ucla.edu",
    "name": "Angela"
  },
  "_count": {
    "posts": 2
  }
}
```

#### Common errors
- `401`: not authenticated  
- `404`: not a researcher  
- `500`: failed to fetch researcher profile  

---

## 3. Posts

Routes mounted at: **`/api/posts`**

Posts represent research opportunities created by researchers.

---

### `POST /posts`
Create a new post with optional questions.

**Auth:** required  
**Use case:** researcher creates a new project listing.

#### Request Body
```json
{
  "title": "Undergraduate RA in CS Education",
  "description": "Help us study intro CS learning using surveys and LMS data.",
  "questions": [
    {
      "type": "text",
      "question": "Why are you interested in this project?"
    },
    {
      "type": "multiple-choice",
      "question": "How many hours per week can you commit?",
      "options": ["3–5", "5–8", "8–10", "10+"]
    },
    {
      "type": "checkbox",
      "question": "Which skills do you have?",
      "options": ["Python", "Java", "Data analysis", "Tutoring"]
    }
  ]
}
```

#### Success
```json
{
  "id": 5,
  "title": "Undergraduate RA in CS Education",
  "content": "Help us study intro CS learning using surveys and LMS data.",
  "authorId": 3,
  "questions": [
    {
      "id": 12,
      "type": "multiple-choice",
      "question": "How many hours per week can you commit?",
      "options": ["3–5", "5–8", "8–10", "10+"]
    }
  ]
}
```

#### Common errors
- `400`: invalid input  
- `401`: not authenticated  
- `500`: failed to create post  

---

### `GET /posts/my-posts`
Get posts created by the logged-in user.

**Auth:** required  
**Use case:** researcher dashboard.

#### Success
```json
[
  {
    "id": 5,
    "title": "Undergraduate RA in CS Education",
    "content": "Help us study...",
    "authorId": 3,
    "_count": {
      "applications": 4
    }
  }
]
```

#### Common errors
- `401`: not authenticated  
- `500`: failed to fetch posts  

---

### `GET /posts/:id`
Get one post by id.

**Auth:** not required  
**Use case:** post detail view.

#### Success
```json
{
  "id": 5,
  "title": "Undergraduate RA in CS Education",
  "content": "Help us study...",
  "authorId": 3,
  "questions": [
    {
      "id": 12,
      "type": "multiple-choice",
      "question": "How many hours?"
    }
  ],
  "author": {
    "name": "Professor X",
    "email": "prof@ucla.edu"
  }
}
```

#### Common errors
- `400`: bad post id  
- `404`: post not found  
- `500`: failed to fetch post  

---

### `GET /posts`
Get all posts.

**Auth:** not required  
**Use case:** browse all research listings.

#### Success
```json
[
  {
    "id": 5,
    "title": "Undergraduate RA in CS Education",
    "content": "Help us study...",
    "authorId": 3,
    "author": { "name": "Professor X" }
  }
]
```

#### Common errors
- `500`: failed to fetch posts  
```