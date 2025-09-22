import { storage } from '../../storage';
import { env } from '../../config/env';

export interface AISettings {
  enabled: boolean;
  features: {
    translation: boolean;
    assistant: boolean;
    reports: boolean;
  };
  model: string;
  hasApiKey: boolean;
}

class AISettingsService {
  private static instance: AISettingsService;
  private cachedSettings: AISettings | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_TTL = 5000; // 5 seconds cache

  public static getInstance(): AISettingsService {
    if (!AISettingsService.instance) {
      AISettingsService.instance = new AISettingsService();
    }
    return AISettingsService.instance;
  }

  private constructor() {}

  /**
   * Get AI settings from database, with fallback to environment variables
   */
  async getSettings(): Promise<AISettings> {
    // Check cache first
    if (this.cachedSettings && Date.now() - this.lastFetch < this.CACHE_TTL) {
      return this.cachedSettings;
    }

    try {
      // Try to get settings from database
      const dbSettings = await storage.getSettingsBulk([
        'AI_ENABLED',
        'AI_FEATURE_TRANSLATION',
        'AI_FEATURE_ASSISTANT',
        'AI_FEATURE_REPORTS',
        'AI_MODEL'
      ]);

      const settings: AISettings = {
        enabled: this.parseBoolean(dbSettings.AI_ENABLED?.value ?? env.AI_ENABLED.toString()),
        features: {
          translation: this.parseBoolean(dbSettings.AI_FEATURE_TRANSLATION?.value ?? env.AI_FEATURE_TRANSLATION.toString()),
          assistant: this.parseBoolean(dbSettings.AI_FEATURE_ASSISTANT?.value ?? env.AI_FEATURE_ASSISTANT.toString()),
          reports: this.parseBoolean(dbSettings.AI_FEATURE_REPORTS?.value ?? env.AI_FEATURE_REPORTS.toString()),
        },
        model: dbSettings.AI_MODEL?.value ?? env.OPENAI_MODEL,
        hasApiKey: !!env.OPENAI_API_KEY
      };

      this.cachedSettings = settings;
      this.lastFetch = Date.now();
      return settings;
    } catch (error) {
      console.error('Error fetching AI settings from database, falling back to env:', error);
      
      // Fallback to environment variables
      return {
        enabled: env.AI_ENABLED,
        features: {
          translation: env.AI_FEATURE_TRANSLATION,
          assistant: env.AI_FEATURE_ASSISTANT,
          reports: env.AI_FEATURE_REPORTS,
        },
        model: env.OPENAI_MODEL,
        hasApiKey: !!env.OPENAI_API_KEY
      };
    }
  }

  /**
   * Update AI settings in database
   */
  async updateSettings(updates: Partial<AISettings>): Promise<AISettings> {
    const settingsToUpdate: Array<{ key: string; value: string; category: string; description: string }> = [];

    if (updates.enabled !== undefined) {
      settingsToUpdate.push({
        key: 'AI_ENABLED',
        value: updates.enabled.toString(),
        category: 'ai',
        description: 'Master toggle for all AI features'
      });
    }

    if (updates.features) {
      if (updates.features.translation !== undefined) {
        settingsToUpdate.push({
          key: 'AI_FEATURE_TRANSLATION',
          value: updates.features.translation.toString(),
          category: 'ai',
          description: 'Enable AI translation features'
        });
      }
      if (updates.features.assistant !== undefined) {
        settingsToUpdate.push({
          key: 'AI_FEATURE_ASSISTANT',
          value: updates.features.assistant.toString(),
          category: 'ai',
          description: 'Enable AI assistant features'
        });
      }
      if (updates.features.reports !== undefined) {
        settingsToUpdate.push({
          key: 'AI_FEATURE_REPORTS',
          value: updates.features.reports.toString(),
          category: 'ai',
          description: 'Enable AI reports and analytics features'
        });
      }
    }

    if (updates.model) {
      settingsToUpdate.push({
        key: 'AI_MODEL',
        value: updates.model,
        category: 'ai',
        description: 'OpenAI model to use for AI features'
      });
    }

    // Update settings in database
    for (const setting of settingsToUpdate) {
      await storage.upsertSetting(
        setting.key,
        setting.value,
        setting.description,
        setting.category,
        'boolean',
        false
      );
    }

    // Clear cache to force refresh
    this.cachedSettings = null;
    
    // Return updated settings
    return this.getSettings();
  }

  /**
   * Clear the settings cache
   */
  clearCache(): void {
    this.cachedSettings = null;
    this.lastFetch = 0;
  }

  private parseBoolean(value: string | boolean): boolean {
    if (typeof value === 'boolean') return value;
    return value === 'true';
  }
}

export const aiSettingsService = AISettingsService.getInstance();