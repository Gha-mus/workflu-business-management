import { openaiGateway, checkAIFeature } from '../openai/client';

interface TranslationCache {
  [key: string]: {
    translated: string;
    timestamp: number;
  };
}

interface TranslationBatch {
  [key: string]: string; // key -> original text mapping
}

class TranslationService {
  private static instance: TranslationService;
  private openAI = openaiGateway;
  private cache: Map<string, TranslationCache> = new Map(); // sessionId -> cache
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_BATCH_SIZE = 50;

  private constructor() {
    // openAI is already initialized as singleton
  }

  public static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  /**
   * Translate a batch of UI text from English to Arabic or vice versa
   */
  public async translateBatch(
    texts: TranslationBatch,
    targetLanguage: 'ar' | 'en',
    sessionId: string
  ): Promise<TranslationBatch> {
    // Check if AI and translation feature are available
    const aiCheck = await checkAIFeature('translation');
    if (!aiCheck.enabled) {
      // Return original texts if AI or translation is disabled
      return texts;
    }

    // Get or create cache for this session
    let sessionCache = this.cache.get(sessionId);
    if (!sessionCache) {
      sessionCache = {};
      this.cache.set(sessionId, sessionCache);
    }

    const results: TranslationBatch = {};
    const toTranslate: TranslationBatch = {};
    const now = Date.now();

    // Check cache first
    for (const [key, text] of Object.entries(texts)) {
      const cacheKey = `${targetLanguage}:${text}`;
      const cached = sessionCache[cacheKey];
      
      if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
        results[key] = cached.translated;
      } else {
        toTranslate[key] = text;
      }
    }

    // If nothing to translate, return cached results
    if (Object.keys(toTranslate).length === 0) {
      return results;
    }

    try {
      // Prepare the batch for translation
      const keys = Object.keys(toTranslate);
      const textsToTranslate = Object.values(toTranslate);
      
      // Split into smaller batches if needed
      const batches: string[][] = [];
      for (let i = 0; i < textsToTranslate.length; i += this.MAX_BATCH_SIZE) {
        batches.push(textsToTranslate.slice(i, i + this.MAX_BATCH_SIZE));
      }

      let translatedTexts: string[] = [];
      
      for (const batch of batches) {
        const sourceLang = targetLanguage === 'ar' ? 'English' : 'Arabic';
        const targetLang = targetLanguage === 'ar' ? 'Arabic' : 'English';
        
        const prompt = `You are a professional translator for a business management system. Translate the following UI text from ${sourceLang} to ${targetLang}.

IMPORTANT RULES:
1. Preserve ALL placeholders exactly as they appear: {name}, {count}, {amount}, %s, %d, etc.
2. Keep ALL HTML tags unchanged: <b>, <i>, <span>, etc.
3. Maintain line breaks (\\n) and formatting
4. Do NOT translate:
   - Variable names in curly braces {}
   - Percentage signs %
   - Currency codes (USD, ETB)
   - Numbers
5. For Arabic: Use formal, professional business Arabic
6. Return ONLY the translations in the EXACT same order

Texts to translate:
${batch.map((text, idx) => `${idx + 1}. "${text}"`).join('\n')}

Return ONLY the translated texts, one per line, in the same order:`;

        const response = await this.openAI.createChatCompletion(
          [
            {
              role: 'system',
              content: 'You are a professional translator. Translate accurately while preserving all technical placeholders and formatting.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          {
            feature: 'translation'
          }
        );

        const translatedBatch = response
          ?.split('\n')
          .map((line: string) => line.replace(/^\d+\.\s*"?|"?$/g, '').trim())
          .filter((line: string) => line.length > 0) || [];

        translatedTexts = [...translatedTexts, ...translatedBatch];
      }

      // Map translations back to keys and update cache
      keys.forEach((key, index) => {
        const translatedText = translatedTexts[index] || toTranslate[key];
        results[key] = translatedText;
        
        // Update cache
        const cacheKey = `${targetLanguage}:${toTranslate[key]}`;
        sessionCache[cacheKey] = {
          translated: translatedText,
          timestamp: now
        };
      });

      return results;
    } catch (error) {
      console.error('Translation error:', error);
      // Return original texts on error
      for (const [key, text] of Object.entries(toTranslate)) {
        results[key] = text;
      }
      return results;
    }
  }

  /**
   * Clear cache for a session
   */
  public clearSessionCache(sessionId: string): void {
    this.cache.delete(sessionId);
  }

  /**
   * Clean up expired cache entries
   */
  public cleanupCache(): void {
    const now = Date.now();
    this.cache.forEach((sessionCache, sessionId) => {
      // Remove expired entries
      for (const [key, entry] of Object.entries(sessionCache)) {
        if (now - entry.timestamp > this.CACHE_TTL) {
          delete sessionCache[key];
        }
      }
      // Remove empty session caches
      if (Object.keys(sessionCache).length === 0) {
        this.cache.delete(sessionId);
      }
    });
  }
}

export default TranslationService;