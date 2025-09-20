/**
 * Environment variable management and validation
 */
import { z } from 'zod';

// Environment schema with validation
const envSchema = z.object({
  // Database configuration
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  PGHOST: z.string().optional(),
  PGPORT: z.string().optional(),
  PGDATABASE: z.string().optional(),
  PGUSER: z.string().optional(),
  PGPASSWORD: z.string().optional(),
  
  // Authentication
  SESSION_SECRET: z.string().min(1, 'SESSION_SECRET is required'),
  
  // AI services
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  
  // Optional configurations
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

// Parse and validate environment variables
export const env = envSchema.parse(process.env);

// Type-safe environment object
export type Environment = z.infer<typeof envSchema>;

// Environment helpers
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';