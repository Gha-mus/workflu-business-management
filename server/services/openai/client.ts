/**
 * OpenAI client initialization and configuration
 */
import OpenAI from 'openai';
import { config } from '../../config';

// Initialize OpenAI client with configuration
export const openaiClient = new OpenAI({
  apiKey: config.openai.apiKey,
});

// OpenAI configuration constants
export const OPENAI_CONFIG = {
  model: config.openai.model,
  maxTokens: config.openai.maxTokens,
  temperature: config.openai.temperature,
  
  // Model-specific settings
  models: {
    gpt4: 'gpt-4',
    gpt4Turbo: 'gpt-4-turbo-preview',
    gpt35: 'gpt-3.5-turbo',
  },
  
  // Request timeouts
  timeout: 30000, // 30 seconds
  
  // Rate limiting (requests per minute)
  rateLimit: {
    requestsPerMinute: 60,
    tokensPerMinute: 150000,
  },
} as const;

// Error handling for OpenAI requests
export class OpenAIError extends Error {
  constructor(message: string, public readonly originalError?: any) {
    super(message);
    this.name = 'OpenAIError';
  }
}

// Retry logic for OpenAI requests
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw new OpenAIError(
          `OpenAI operation failed after ${maxRetries} attempts: ${lastError.message}`,
          lastError
        );
      }
      
      // Exponential backoff
      const delay = delayMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}