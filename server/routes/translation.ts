import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import TranslationService from '../services/translation/translationService';
import { isAuthenticated } from '../core/auth';

const router = Router();
const translationService = TranslationService.getInstance();

// Middleware to ensure user is authenticated
router.use(isAuthenticated);

/**
 * POST /api/translation/batch
 * Translate a batch of UI texts
 */
router.post('/batch', async (req, res) => {
  try {
    const { texts, targetLanguage, sessionId } = req.body;

    // Validate input
    if (!texts || typeof texts !== 'object') {
      return res.status(400).json({ 
        error: 'Invalid texts object' 
      });
    }

    if (!['ar', 'en'].includes(targetLanguage)) {
      return res.status(400).json({ 
        error: 'Invalid target language. Must be "ar" or "en"' 
      });
    }

    // Use provided session ID or generate one
    const effectiveSessionId = sessionId || uuidv4();

    // Translate the batch
    const translations = await translationService.translateBatch(
      texts,
      targetLanguage as 'ar' | 'en',
      effectiveSessionId
    );

    res.json({
      translations,
      sessionId: effectiveSessionId
    });
  } catch (error) {
    console.error('Translation batch error:', error);
    res.status(500).json({ 
      error: 'Translation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/translation/cache/:sessionId
 * Clear translation cache for a session
 */
router.delete('/cache/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    translationService.clearSessionCache(sessionId);
    res.json({ success: true });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({ 
      error: 'Failed to clear cache' 
    });
  }
});

/**
 * POST /api/translation/cleanup
 * Clean up expired cache entries
 */
router.post('/cleanup', async (req, res) => {
  try {
    translationService.cleanupCache();
    res.json({ success: true });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ 
      error: 'Failed to clean up cache' 
    });
  }
});

// Run cleanup periodically (every hour)
setInterval(() => {
  translationService.cleanupCache();
}, 60 * 60 * 1000);

export default router;