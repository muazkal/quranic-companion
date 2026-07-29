import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, BookOpen, ScrollText, Quote } from 'lucide-react';
import { RecallRating } from '@/lib/spaced-repetition';
import { cn } from '@/lib/utils';

interface ReviewCardProps {
  item: {
    id: string;
    arabic_text: string;
    translation: string | null;
    item_type: 'hadith' | 'quran' | 'scholar';
    source: string | null;
    category: string[] | null;
    narrator: string | null;
    speaker_name: string | null;
    surah_name: string | null;
    ayah_reference: string | null;
    repetitions: number;
    easiness_factor: number;
    interval: number;
    phase: 'learning' | 'review';
    learning_step: number;
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
  scholar: 'Mawqūf',
};

export function ReviewCard({ item, onRate, isLoading }: ReviewCardProps) {
  const [revealed, setRevealed] = useState(false);

  const TypeIcon = typeIcons[item.item_type];

  // Get context information based on type (shown before reveal)
  const getContextInfo = () => {
    switch (item.item_type) {
      case 'hadith':
        return item.narrator ? `Narrator: ${item.narrator}` : null;
      case 'quran':
        return item.surah_name && item.ayah_reference 
          ? `${item.surah_name} : ${item.ayah_reference}` 
          : null;
      case 'scholar':
        return item.speaker_name ? `Speaker: ${item.speaker_name}` : null;
      default:
        return null;
    }
  };

  const contextInfo = getContextInfo();

  // First few words of the matn as a recall hint
  const openingWords = item.arabic_text
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join(' ') + ' …';

  // Calculate estimated intervals based on current phase and learning_step
  const getEstimatedIntervalsForPhase = () => {
    const isLearning = item.phase === 'learning';
    const learningStep = item.learning_step || 0;
    const currentInterval = Math.max(1, item.interval);
    const easeFactor = Number(item.easiness_factor);

    if (isLearning) {
      // Learning phase intervals
      return {
        0: 'Repeat', // Again - requeue
        1: '2m',     // Hard - 2 minutes
        2: learningStep >= 1 ? '1d' : '10m', // Good - graduate if 2nd consecutive, else 10m
        3: '4d',     // Easy - immediate graduation with bonus
      };
    } else {
      // Review phase intervals (day-based)
      const hardInterval = Math.max(1, Math.round(currentInterval * 1.2));
      const goodInterval = Math.max(1, Math.round(currentInterval * easeFactor));
      const easyInterval = Math.max(1, Math.round(currentInterval * easeFactor * 1.3));
      
      return {
        0: 'Repeat',
        1: formatDays(hardInterval),
        2: formatDays(goodInterval),
        3: formatDays(easyInterval),
      };
    }
  };

  const formatDays = (days: number): string => {
    if (days === 1) return '1d';
    if (days < 30) return `${days}d`;
    if (days < 365) return `${Math.round(days / 30)}mo`;
    return `${(days / 365).toFixed(1)}y`;
  };

  const estimatedIntervals = getEstimatedIntervalsForPhase();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="p-6 space-y-6">
          {/* Header - Type badge, context info, and categories */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Badge variant="outline" className="gap-1">
                <TypeIcon className="w-3 h-3" />
                {typeLabels[item.item_type]}
              </Badge>
              {contextInfo && (
                <span className="text-sm font-medium text-foreground">
                  {contextInfo}
                </span>
              )}
            </div>
            {/* Categories - Always visible as hints */}
            {item.category && item.category.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.category.map((cat) => (
                  <Badge key={cat} variant="secondary" className="text-xs">
                    {cat}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Arabic Text - Hidden by default */}
          <div className="py-8">
            <div
              className={cn(
                'transition-all duration-500 ease-out',
                revealed ? 'blur-0' : 'blur-md select-none pointer-events-none'
              )}
            >
              <p
                className="font-arabic text-[16px] md:text-[16px] leading-[2.6] tracking-normal text-center [word-spacing:0.2em]"
                dir="rtl"
              >
                {item.arabic_text}
              </p>
            </div>
          </div>

          {/* Reveal Button + opening-words hint */}
          {!revealed && (
            <div className="text-center space-y-4">
              <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Opening words
                </p>
                <p
                  className="font-arabic text-[16px] leading-[2.4] [word-spacing:0.2em]"
                  dir="rtl"
                >
                  {openingWords}
                </p>
              </div>
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
                Try to recall the rest from the opening words, then reveal to check
              </p>
            </div>
          )}

          {/* Translation & Source - Shown only after reveal */}
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

      {/* Rating Buttons - Shown after reveal with Anki-style labels */}
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
              <span className="text-xs font-medium">Again</span>
              <span className="text-[10px] opacity-70">{estimatedIntervals[0]}</span>
            </Button>
            <Button
              variant="warning"
              onClick={() => onRate(1)}
              disabled={isLoading}
              className="flex-col h-auto py-3"
            >
              <span className="text-xs font-medium">Hard</span>
              <span className="text-[10px] opacity-70">{estimatedIntervals[1]}</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => onRate(2)}
              disabled={isLoading}
              className="flex-col h-auto py-3"
            >
              <span className="text-xs font-medium">Good</span>
              <span className="text-[10px] opacity-70">{estimatedIntervals[2]}</span>
            </Button>
            <Button
              variant="success"
              onClick={() => onRate(3)}
              disabled={isLoading}
              className="flex-col h-auto py-3"
            >
              <span className="text-xs font-medium">Easy</span>
              <span className="text-[10px] opacity-70">{estimatedIntervals[3]}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
