import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, BookOpen, ScrollText, Quote } from 'lucide-react';
import { RecallRating, getEstimatedIntervals, SpacedRepetitionData } from '@/lib/spaced-repetition';
import { cn } from '@/lib/utils';

interface ReviewCardProps {
  item: {
    id: string;
    arabic_text: string;
    translation: string | null;
    item_type: 'hadith' | 'quran' | 'scholar';
    source: string | null;
    category: string | null;
    narrator: string | null;
    speaker_name: string | null;
    surah_name: string | null;
    ayah_reference: string | null;
    repetitions: number;
    easiness_factor: number;
    interval: number;
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

  // Calculate estimated intervals for each rating
  const currentData: SpacedRepetitionData = {
    repetitions: item.repetitions,
    easinessFactor: Number(item.easiness_factor),
    interval: item.interval,
  };
  const estimatedIntervals = getEstimatedIntervals(currentData);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="p-6 space-y-6">
          {/* Header - Type badge and context info */}
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

          {/* Arabic Text - Hidden by default */}
          <div className="py-8">
            <div
              className={cn(
                'transition-all duration-500 ease-out',
                revealed ? 'blur-0' : 'blur-md select-none pointer-events-none'
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
