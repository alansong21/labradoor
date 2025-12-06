/**
 * Test-only routes for Cypress E2E testing
 * These routes are only available when NODE_ENV !== 'production'
 * 
 * Purpose: Provide deterministic test environments through:
 * - Database reset and seeding
 * - Test data management
 * - Clean test isolation
 * 
 * Design: Uses modularity and information hiding - tests interact
 * with backend via clean API, not DB internals
 */

const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { hashPassword } = require('../services/passwordService');

// Guard: Only allow in test/development environments
if (process.env.NODE_ENV === 'production') {
  // In production, return 404 for all test routes
  router.use('*', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  module.exports = router;
  return;
}

/**
 * POST /api/test/reset-db
 * Resets the database to a known test state
 * Clears existing data and seeds with deterministic test fixtures
 */
router.post('/reset-db', async (_req, res) => {
  try {
    // Clear all data in reverse dependency order (children first)
    await prisma.answer.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.application.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.researcher.deleteMany({});
    await prisma.verificationToken.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
    
    // Seed test users
    const studentPasswordHash = await hashPassword('student123');
    const researcherPasswordHash = await hashPassword('researcher123');
    
    // Create test student
    const studentUser = await prisma.user.create({
      data: {
        email: 'teststudent@ucla.edu',
        name: 'Test Student',
        passwordHash: studentPasswordHash,
        emailVerifiedAt: new Date(),
        uclaId: '123456789',
        student: {
          create: {
            year: 'Junior',
            major: 'Computer Science',
            description: 'Test student for E2E tests'
          }
        }
      },
      include: { student: true }
    });
    
    // Create test researcher
    const researcherUser = await prisma.user.create({
      data: {
        email: 'testresearcher@ucla.edu',
        name: 'Test Researcher',
        passwordHash: researcherPasswordHash,
        emailVerifiedAt: new Date(),
        researcher: {
          create: {
            department: 'Computer Science',
            verifyStatus: 'VERIFIED'
          }
        }
      },
      include: { researcher: true }
    });
    
    // Create test posts
    const post1 = await prisma.post.create({
      data: {
        title: 'Test Lab Position - AI Research',
        body: 'We are looking for motivated students to join our AI research team. This is a test post for E2E testing.',
        researcherId: researcherUser.id,
        tags: ['AI', 'Machine Learning', 'Research'],
        questions: {
          create: [
            {
              type: 'LONG_TEXT',
              body: {
                prompt: 'Why are you interested in this position?',
                description: 'Please provide a detailed answer.'
              }
            },
            {
              type: 'MULTIPLE_CHOICE',
              body: {
                prompt: 'What is your year?',
                options: ['Freshman', 'Sophomore', 'Junior', 'Senior']
              }
            }
          ]
        }
      },
      include: { questions: true }
    });
    
    const post2 = await prisma.post.create({
      data: {
        title: 'Test Lab Position - Biology Research',
        body: 'We need students interested in molecular biology research. This is a test post for E2E testing.',
        researcherId: researcherUser.id,
        tags: ['Biology', 'Research'],
        questions: {
          create: [
            {
              type: 'SHORT_TEXT',
              body: {
                prompt: 'What is your GPA?',
                description: 'Enter your current GPA.'
              }
            }
          ]
        }
      },
      include: { questions: true }
    });
    
    // Create test applications
    await prisma.application.create({
      data: {
        studentId: studentUser.id,
        postId: post1.id,
        status: 'PENDING',
        answers: {
          create: [
            {
              questionId: post1.questions[0].id,
              type: 'LONG_TEXT',
              body: 'I am interested because...'
            },
            {
              questionId: post1.questions[1].id,
              type: 'MULTIPLE_CHOICE',
              body: 'Junior'
            }
          ]
        }
      }
    });
    
    await prisma.application.create({
      data: {
        studentId: studentUser.id,
        postId: post2.id,
        status: 'ACCEPTED',
        answers: {
          create: [
            {
              questionId: post2.questions[0].id,
              type: 'SHORT_TEXT',
              body: '3.8'
            }
          ]
        }
      }
    });
    
    res.json({
      success: true,
      message: 'Database reset and seeded successfully',
      data: {
        studentUserId: studentUser.id,
        researcherUserId: researcherUser.id,
        postIds: [post1.id, post2.id]
      }
    });
  } catch (error) {
    console.error('Error resetting database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset database',
      message: error.message
    });
  }
});

/**
 * GET /api/test/seed-status
 * Returns the current state of test data in the database
 */
router.get('/seed-status', async (_req, res) => {
  try {
    const [userCount, postCount, applicationCount] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.application.count()
    ]);
    
    res.json({
      users: userCount,
      posts: postCount,
      applications: applicationCount
    });
  } catch (error) {
    console.error('Error getting seed status:', error);
    res.status(500).json({ error: 'Failed to get seed status' });
  }
});

module.exports = router;

