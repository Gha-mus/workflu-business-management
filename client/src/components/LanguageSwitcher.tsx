import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, translationEnabled } = useLanguage();

  const handleToggle = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  // Always show the language switcher
  // Translation will fallback to original text if AI is disabled

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      className="flex items-center gap-2 hover:bg-accent"
      data-testid="language-switcher"
    >
      <Globe className="h-4 w-4" />
      <span className="hidden sm:inline-block font-medium">
        {language === 'en' ? 'English' : 'العربية'}
      </span>
      <span className="sm:hidden font-medium">
        {language === 'en' ? 'EN' : 'AR'}
      </span>
    </Button>
  );
};

// Compact version for mobile or tight spaces
export const LanguageSwitcherCompact: React.FC = () => {
  const { language, setLanguage, translationEnabled } = useLanguage();

  // Always show the language switcher

  return (
    <Badge
      variant="outline"
      className="cursor-pointer hover:bg-accent transition-colors"
      onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
      data-testid="language-switcher-compact"
    >
      {language === 'en' ? 'EN' : 'AR'}
    </Badge>
  );
};