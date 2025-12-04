const mockPrisma = {
    answer: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    application: {
      findUnique: jest.fn(),
    },
    post: {
      findUnique: jest.fn(),
    },
  };
  
  module.exports = mockPrisma;