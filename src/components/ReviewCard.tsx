import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, BookOpen, ScrollText, Quote } from 'lucide-react';
import { RecallRating } from '@/lib/spaced-repetition';
import { cn } from '@/lib/utils';

interface ReviewCardProps {
  item: {
    id: string;
    arabic_text: string;
    translation: string | null;
    item_type: 'hadith' | 'quran' | 'scholar';
    source: string | null;
    category: string | null;
  };
  onRate: (rating: RecallRating) => void;
  isLoading?: boolean;
}

const typeIcons = {
  hadith: ScrollText,
  quran: BookOpen,
  scholar: Quote,
};

const typeLabels = {
  hadith: 'Hadith',
  quran: "Qur'an",
  scholar: 'Scholar',
};

export function ReviewCard({ item, onRate, isLoading }: ReviewCardProps) {
  const [revealed, setRevealed] = useState(false);

  const TypeIcon = typeIcons[item.item_type];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="gap-1">
              <TypeIcon className="w-3 h-3" />
              {typeLabels[item.item_type]}
            </Badge>
            {item.category && (
              <Badge variant="secondary">{item.category}</Badge>
            )}
          </div>

          {/* Arabic Text - Always shown for recall attempt */}
          <div className="py-8">
            <div
              className={cn(
                'transition-all duration-500 ease-out',
                revealed ? 'blur-0' : 'blur-md select-none'
              )}
            >
              <p
                className="font-arabic text-3xl md:text-4xl leading-[2] text-center"
                dir="rtl"
              >
                {item.arabic_text}
              </p>
            </div>
          </div>

          {/* Reveal Button */}
          {!revealed && (
            <div className="text-center">
              <Button
                variant="recall"
                size="lg"
                onClick={() => setRevealed(true)}
                className="gap-2"
              >
                <Eye className="w-5 h-5" />
                Reveal Text
              </Button>
              <p className="mt-3 text-sm text-muted-foreground">
                Try to recall the text first, then reveal to check
              </p>
            </div>
          )}

          {/* Translation & Source - Shown after reveal */}
          {revealed && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {item.translation && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground text-sm mb-1">Translation</p>
                  <p className="text-foreground">{item.translation}</p>
                </div>
              )}
              {item.source && (
                <p className="text-sm text-muted-foreground text-center">
                  Source: {item.source}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rating Buttons - Shown after reveal */}
      {revealed && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <p className="text-center text-sm text-muted-foreground">
            How well did you remember?
          </p>
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="destructive"
              onClick={() => onRate(0)}
              disabled={isLoading}
              className="flex-col h-auto py-3"
            >
              <span className="text-lg">😔</span>
              <span className="text-xs">Forgot</span>
            </Button>
            <Button
              variant="warning"
              onClick={() => onRate(1)}
              disabled={isLoading}
              className="flex-col h-auto py-3"
            >
              <span className="text-lg">😅</span>
              <span className="text-xs">Hard</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => onRate(2)}
              disabled={isLoading}
              className="flex-col h-auto py-3"
            >
              <span className="text-lg">🙂</span>
              <span className="text-xs">Good</span>
            </Button>
            <Button
              variant="success"
              onClick={() => onRate(3)}
              disabled={isLoading}
              className="flex-col h-auto py-3"
            >
              <span className="text-lg">😊</span>
              <span className="text-xs">Easy</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
