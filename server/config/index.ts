/**
 * Centralized configuration management
 */
import { env, isDevelopment, isProduction, isTest } from './env';

// Application configuration
export const config = {
  // Environment
  env: env.NODE_ENV,
  isDevelopment,
  isProduction,
  isTest,
  
  // Server
  port: parseInt(env.PORT, 10),
  
  // Database
  database: {
    url: env.DATABASE_URL,
    host: env.PGHOST,
    port: env.PGPORT ? parseInt(env.PGPORT, 10) : undefined,
    database: env.PGDATABASE,
    user: env.PGUSER,
    password: env.PGPASSWORD,
  },
  
  // Authentication
  session: {
    secret: env.SESSION_SECRET,
    name: 'workflu-session',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: isProduction,
    httpOnly: true,
    sameSite: 'lax' as const,
  },
  
  // AI Services
  openai: {
    apiKey: env.OPENAI_API_KEY,
    model: 'gpt-4',
    maxTokens: 4000,
    temperature: 0.7,
  },
  
  // Email (optional)
  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ? parseInt(env.SMTP_PORT, 10) : undefined,
    user: env.SMTP_USER,
    password: env.SMTP_PASS,
  },
  
  // Business settings (default values, can be overridden in database)
  business: {
    defaultCurrency: 'USD',
    defaultExchangeRate: 80.0,
    approvalThreshold: 10000,
    preventNegativeBalance: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    timezone: 'Africa/Addis_Ababa',
    enableNotifications: true,
    autoBackup: true,
  },
  
  // Security
  security: {
    rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
    rateLimitMaxRequests: 100,
    bcryptRounds: 12,
    jwtSecret: env.SESSION_SECRET, // Reuse session secret for JWT
    jwtExpiresIn: '7d',
  },
  
  // File uploads
  uploads: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
    uploadDir: 'uploads/',
    documentsDir: 'uploads/documents/',
  },
} as const;

// Type for configuration
export type Config = typeof config;

// Export environment for direct access when needed
export { env };