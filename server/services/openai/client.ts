/**
 * OpenAI Gateway - Centralized AI request management with feature toggles
 */
import OpenAI from 'openai';
import { config } from '../../config';
import { aiSettingsService, type AISettings } from '../ai/settingsService';

// AI Feature Types
export type AIFeature = 'translation' | 'assistant' | 'reports';

// Error codes for AI operations
export const AI_ERROR_CODES = {
  AI_DISABLED: 'AI_DISABLED',
  AI_FEATURE_DISABLED: 'AI_FEATURE_DISABLED',
  OPENAI_KEY_MISSING: 'OPENAI_KEY_MISSING',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVICE_ERROR: 'SERVICE_ERROR',
} as const;

// AI Error class
export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 503,
    public readonly originalError?: any
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

// OpenAI configuration constants
export const OPENAI_CONFIG = {
  model: config.openai.model, // Now reads from env (gpt-3.5-turbo)
  maxTokens: config.openai.maxTokens,
  temperature: config.openai.temperature,
  timeout: 30000, // 30 seconds
  rateLimit: {
    requestsPerMinute: 60,
    tokensPerMinute: 150000,
  },
} as const;

/**
 * OpenAI Gateway Class
 * All OpenAI requests must go through this gateway
 */
class OpenAIGateway {
  private client: OpenAI | null = null;
  private initialized = false;
  private settings: AISettings | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize OpenAI client if AI is enabled and API key exists
   */
  private async initialize() {
    // Get settings from database or env
    try {
      this.settings = await aiSettingsService.getSettings();
    } catch (error) {
      console.error('Failed to load AI settings:', error);
      this.settings = {
        enabled: config.ai.enabled,
        features: config.ai.features,
        model: config.openai.model,
        hasApiKey: !!config.openai.apiKey
      };
    }

    // Check master toggle
    if (!this.settings.enabled) {
      console.log('AI features disabled via settings');
      this.initialized = false;
      return;
    }

    // Check API key (fail-safe)
    if (!config.openai.apiKey || config.openai.apiKey === '') {
      console.warn('OPENAI_API_KEY not found or invalid. AI features disabled.');
      this.initialized = false;
      return;
    }

    // Initialize client
    try {
      this.client = new OpenAI({
        apiKey: config.openai.apiKey,
      });
      this.initialized = true;
      console.log(`OpenAI Gateway initialized with model: ${OPENAI_CONFIG.model}`);
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
      this.initialized = false;
    }
  }

  /**
   * Check if a specific AI feature is enabled
   */
  private async isFeatureEnabled(feature?: AIFeature): Promise<boolean> {
    // Ensure settings are loaded
    if (!this.settings) {
      await this.initialize();
    }

    // Master toggle check
    if (!this.settings?.enabled) {
      return false;
    }

    // API key check (fail-safe)
    if (!config.openai.apiKey || config.openai.apiKey === '') {
      return false;
    }

    // No specific feature check needed
    if (!feature) {
      return true;
    }

    // Check specific feature toggle
    return this.settings.features[feature] === true;
  }

  /**
   * Validate AI availability before making requests
   */
  private async validateAvailability(feature?: AIFeature): Promise<void> {
    // Ensure settings are loaded
    if (!this.settings) {
      await this.initialize();
    }

    // Check master toggle
    if (!this.settings?.enabled) {
      throw new AIServiceError(
        'AI features are currently disabled',
        AI_ERROR_CODES.AI_DISABLED,
        503
      );
    }

    // Check API key (fail-safe)
    if (!config.openai.apiKey || config.openai.apiKey === '') {
      throw new AIServiceError(
        'OpenAI API key is not configured',
        AI_ERROR_CODES.OPENAI_KEY_MISSING,
        503
      );
    }

    // Check specific feature if provided
    if (feature && !this.settings.features[feature]) {
      throw new AIServiceError(
        `AI feature '${feature}' is currently disabled`,
        AI_ERROR_CODES.AI_FEATURE_DISABLED,
        503
      );
    }

    // Check client initialization
    if (!this.initialized || !this.client) {
      throw new AIServiceError(
        'OpenAI client is not properly initialized',
        AI_ERROR_CODES.SERVICE_ERROR,
        503
      );
    }
  }

  /**
   * Create a chat completion with toggle checking
   */
  async createChatCompletion(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options: {
      feature?: AIFeature;
      useJson?: boolean;
      maxRetries?: number;
    } = {}
  ): Promise<string | null> {
    // Validate availability
    await this.validateAvailability(options.feature);

    const { useJson = false, maxRetries = 3 } = options;

    // Retry logic
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.client!.chat.completions.create({
          model: this.settings?.model || OPENAI_CONFIG.model, // Uses model from settings or env
          messages,
          max_tokens: OPENAI_CONFIG.maxTokens,
          temperature: OPENAI_CONFIG.temperature,
          ...(useJson && { response_format: { type: "json_object" } }),
        });

        return response.choices[0].message.content;
      } catch (error: any) {
        lastError = error;
        console.error(`OpenAI request attempt ${attempt} failed:`, error.message);

        // Check for rate limiting
        if (error.status === 429 || error.code === 'rate_limit_exceeded') {
          throw new AIServiceError(
            'OpenAI rate limit exceeded. Please try again later.',
            AI_ERROR_CODES.RATE_LIMITED,
            429,
            error
          );
        }

        // Don't retry on certain errors
        if (error.status === 401 || error.status === 403) {
          throw new AIServiceError(
            'OpenAI authentication failed. Please check API key.',
            AI_ERROR_CODES.OPENAI_KEY_MISSING,
            503,
            error
          );
        }

        // Exponential backoff for retries
        if (attempt < maxRetries) {
          const delay = 1000 * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    throw new AIServiceError(
      `OpenAI request failed after ${maxRetries} attempts: ${lastError?.message}`,
      AI_ERROR_CODES.SERVICE_ERROR,
      503,
      lastError
    );
  }

  /**
   * Check AI status
   */
  async getStatus() {
    // Ensure settings are loaded
    if (!this.settings) {
      await this.initialize();
    }

    return {
      enabled: this.settings?.enabled || false,
      initialized: this.initialized,
      hasApiKey: !!config.openai.apiKey && config.openai.apiKey !== '',
      model: this.settings?.model || OPENAI_CONFIG.model,
      features: {
        translation: await this.isFeatureEnabled('translation'),
        assistant: await this.isFeatureEnabled('assistant'),
        reports: await this.isFeatureEnabled('reports'),
      },
    };
  }

  /**
   * Re-initialize the gateway (useful after config changes)
   */
  async reinitialize() {
    this.client = null;
    this.initialized = false;
    this.settings = null;
    aiSettingsService.clearCache();
    await this.initialize();
  }
}

// Export singleton instance
export const openaiGateway = new OpenAIGateway();

// Export for backward compatibility (will be deprecated)
export const openaiClient = {
  chat: {
    completions: {
      create: async (params: any) => {
        console.warn('Direct openaiClient usage is deprecated. Use openaiGateway instead.');
        const messages = params.messages;
        const useJson = params.response_format?.type === 'json_object';
        const result = await openaiGateway.createChatCompletion(messages, { useJson });
        return {
          choices: [{ message: { content: result } }],
        };
      },
    },
  },
};

// Export helper to check feature availability
export async function checkAIFeature(feature?: AIFeature): Promise<{ enabled: boolean; error?: string }> {
  const status = await openaiGateway.getStatus();
  
  if (!status.enabled) {
    return { enabled: false, error: 'AI features are disabled' };
  }
  
  if (!status.hasApiKey) {
    return { enabled: false, error: 'OpenAI API key is missing' };
  }
  
  if (feature && !status.features[feature]) {
    return { enabled: false, error: `Feature '${feature}' is disabled` };
  }
  
  return { enabled: true };
}