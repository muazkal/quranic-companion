import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, toggle } = useLanguage();
  return (
    <Button variant="ghost" size="sm" onClick={toggle} className={`gap-1 ${className ?? ''}`} aria-label="Toggle language">
      <Languages className="w-4 h-4" />
      {lang === 'en' ? 'العربية' : 'English'}
    </Button>
  );
}
