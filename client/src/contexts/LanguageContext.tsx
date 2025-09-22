import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export type Language = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

interface TranslationCache {
  [key: string]: {
    [text: string]: string;
  };
}

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  translate: (text: string | string[], skipTranslation?: boolean) => string | string[];
  translateBatch: (texts: { [key: string]: string }) => Promise<{ [key: string]: string }>;
  isTranslating: boolean;
  translationEnabled: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  direction: 'ltr',
  setLanguage: () => {},
  translate: (text) => text,
  translateBatch: async (texts) => texts,
  isTranslating: false,
  translationEnabled: false,
});

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Get saved language from localStorage or default to 'en'
    const saved = localStorage.getItem('app-language');
    return (saved === 'ar' || saved === 'en') ? saved : 'en';
  });
  
  const [direction, setDirection] = useState<Direction>(language === 'ar' ? 'rtl' : 'ltr');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationEnabled, setTranslationEnabled] = useState(false);
  const [sessionId] = useState(() => {
    // Generate or get session ID for translation caching
    let sid = sessionStorage.getItem('translation-session-id');
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem('translation-session-id', sid);
    }
    return sid;
  });

  const { toast } = useToast();
  const translationCache = useRef<TranslationCache>({});
  const pendingTranslations = useRef<Set<string>>(new Set());
  const batchTimer = useRef<NodeJS.Timeout | null>(null);
  const batchQueue = useRef<{ [key: string]: string }>({});

  // Check AI status to determine if translation is available
  const { data: aiStatus } = useQuery({
    queryKey: ['/api/ai/status'],
    refetchInterval: 30000, // Check every 30 seconds
  });

  useEffect(() => {
    // Update translation availability based on AI status
    if (aiStatus && typeof aiStatus === 'object' && 'enabled' in aiStatus) {
      const status = aiStatus as any;
      setTranslationEnabled(
        status.enabled === true && 
        status.features?.translation === true && 
        status.hasApiKey === true
      );
    } else {
      setTranslationEnabled(false);
    }
  }, [aiStatus]);

  // Update document direction when language changes
  useEffect(() => {
    const newDirection = language === 'ar' ? 'rtl' : 'ltr';
    setDirection(newDirection);
    
    // Update HTML attributes
    document.documentElement.lang = language;
    document.documentElement.dir = newDirection;
    document.documentElement.setAttribute('data-language', language);
    
    // Save to localStorage
    localStorage.setItem('app-language', language);
    
    // Clear cache when switching languages
    translationCache.current = {};
    pendingTranslations.current.clear();
  }, [language]);

  // Batch translation function
  const processBatch = useCallback(async () => {
    const batch = { ...batchQueue.current };
    batchQueue.current = {};
    
    if (Object.keys(batch).length === 0) return;

    try {
      setIsTranslating(true);
      const response = await apiRequest('POST', '/api/translation/batch', {
        texts: batch,
        targetLanguage: language,
        sessionId
      });

      const result = await response.json();
      
      if (result.translations) {
        // Cache the translations
        if (!translationCache.current[language]) {
          translationCache.current[language] = {};
        }
        
        Object.entries(batch).forEach(([key, originalText]) => {
          const translatedText = result.translations[key] || originalText;
          translationCache.current[language][originalText] = translatedText;
        });
        
        // Trigger re-render for components using these translations
        queryClient.invalidateQueries({ queryKey: ['translations'] });
      }
    } catch (error) {
      console.error('Translation batch error:', error);
      // Silently fall back to original text
    } finally {
      setIsTranslating(false);
    }
  }, [language, sessionId]);

  // Debounced batch processor
  const queueTranslation = useCallback((text: string) => {
    if (!translationEnabled || language === 'en') return text;
    
    // Check cache first
    if (translationCache.current[language]?.[text]) {
      return translationCache.current[language][text];
    }
    
    // Add to queue if not already pending
    if (!pendingTranslations.current.has(text)) {
      pendingTranslations.current.add(text);
      const key = `text_${Object.keys(batchQueue.current).length}`;
      batchQueue.current[key] = text;
      
      // Clear existing timer
      if (batchTimer.current) {
        clearTimeout(batchTimer.current);
      }
      
      // Set new timer for batch processing
      batchTimer.current = setTimeout(() => {
        processBatch();
      }, 100); // 100ms debounce
    }
    
    // Return original text for now (will update when translation completes)
    return text;
  }, [language, translationEnabled, processBatch]);

  // Main translate function
  const translate = useCallback((
    text: string | string[], 
    skipTranslation: boolean = false
  ): string | string[] => {
    // Don't translate if disabled or in English mode
    if (!translationEnabled || language === 'en' || skipTranslation) {
      return text;
    }

    if (Array.isArray(text)) {
      return text.map(t => {
        // Check if this is data (numbers, dates, etc.) that shouldn't be translated
        if (/^\d+$/.test(t) || /^\d{4}-\d{2}-\d{2}/.test(t)) {
          return t;
        }
        return queueTranslation(t);
      });
    } else {
      // Check if this is data that shouldn't be translated
      if (/^\d+$/.test(text) || /^\d{4}-\d{2}-\d{2}/.test(text)) {
        return text;
      }
      return queueTranslation(text);
    }
  }, [language, translationEnabled, queueTranslation]);

  // Batch translation for explicit batch requests
  const translateBatch = useCallback(async (
    texts: { [key: string]: string }
  ): Promise<{ [key: string]: string }> => {
    if (!translationEnabled || language === 'en') {
      return texts;
    }

    try {
      const response = await apiRequest('POST', '/api/translation/batch', {
        texts,
        targetLanguage: language,
        sessionId
      });

      const result = await response.json();
      return result.translations || texts;
    } catch (error) {
      console.error('Batch translation error:', error);
      return texts;
    }
  }, [language, translationEnabled, sessionId]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  return (
    <LanguageContext.Provider 
      value={{
        language,
        direction,
        setLanguage,
        translate,
        translateBatch,
        isTranslating,
        translationEnabled,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Utility hook for translated text with caching
export const useTranslation = (text: string | string[], skipTranslation?: boolean) => {
  const { translate, language } = useLanguage();
  const [translated, setTranslated] = useState<string | string[]>(text);

  useEffect(() => {
    const result = translate(text, skipTranslation);
    setTranslated(result);
  }, [text, language, translate, skipTranslation]);

  return translated;
};