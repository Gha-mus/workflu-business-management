import React from 'react';
import { useTranslation } from '@/contexts/LanguageContext';

interface TranslatedTextProps {
  children: string;
  skipTranslation?: boolean;
  className?: string;
}

/**
 * Component for translating static text
 * Usage: <TranslatedText>Dashboard</TranslatedText>
 */
export const TranslatedText: React.FC<TranslatedTextProps> = ({ 
  children, 
  skipTranslation = false,
  className 
}) => {
  const translated = useTranslation(children, skipTranslation);
  
  return <span className={className}>{translated}</span>;
};

/**
 * Higher-order component for translating all text in a component
 */
export function withTranslation<T extends object>(Component: React.ComponentType<T>) {
  return (props: T) => {
    return <Component {...props} />;
  };
}