// Jest setup for authentication tests
// Mock only external services, not internal auth logic

// Mock storage with all methods used by routes
jest.mock('../core/storage', () => ({
  storage: {
    getUsers: jest.fn(),
    getUser: jest.fn(),
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
    updateUserRole: jest.fn(),
    updateUserStatus: jest.fn(),
    updateDisplayName: jest.fn()
  }
}));

// Mock Supabase provider (stable singleton for consistent mocking)
jest.mock('../core/auth/providers/supabaseProvider', () => {
  const actual = jest.requireActual('../core/auth/providers/supabaseProvider');
  const client = {
    auth: {
      getUser: jest.fn(),
      admin: {
        createUser: jest.fn(),
        deleteUser: jest.fn(),
        getUserByEmail: jest.fn(),
        generateLink: jest.fn()
      }
    }
  };
  return {
    ...actual,
    supabaseAdmin: jest.fn(() => client)
  };
});

// Mock audit service
jest.mock('../auditService', () => ({
  auditService: {
    extractRequestContext: jest.fn(() => ({ userId: 'test-user', timestamp: new Date() })),
    logOperation: jest.fn()
  }
}));

// Mock approval middleware
jest.mock('../approvalMiddleware', () => ({
  requireApproval: jest.fn(() => (req, res, next) => next())
}));

// Mock approval workflow service
jest.mock('../approvalWorkflowService', () => ({
  approvalWorkflowService: {
    submitForApproval: jest.fn()
  }
}));

// Mock database
jest.mock('../core/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}));

// Environment variables for consistent testing
process.env.AUTH_PROVIDER = 'supabase';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.FRONTEND_URL = 'http://localhost:5000';