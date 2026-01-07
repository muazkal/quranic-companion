import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, ScrollText, Quote, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { getItemStatus } from '@/lib/spaced-repetition';
import { cn } from '@/lib/utils';

interface ItemCardProps {
  item: {
    id: string;
    arabic_text: string;
    translation: string | null;
    item_type: 'hadith' | 'quran' | 'scholar';
    source: string | null;
    category: string | null;
    difficulty: 'easy' | 'medium' | 'hard';
    repetitions: number;
    easiness_factor: number;
    next_review_date: string;
  };
  onDelete?: (id: string) => void;
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

const statusColors = {
  new: 'bg-primary/10 text-primary',
  learning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  memorized: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  struggling: 'bg-destructive/10 text-destructive',
};

const statusLabels = {
  new: 'New',
  learning: 'Learning',
  memorized: 'Memorized',
  struggling: 'Struggling',
};

export function ItemCard({ item, onDelete }: ItemCardProps) {
  const TypeIcon = typeIcons[item.item_type];
  const status = getItemStatus(item.repetitions, Number(item.easiness_factor));
  const nextReview = new Date(item.next_review_date);
  const isOverdue = nextReview <= new Date();

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="gap-1">
              <TypeIcon className="w-3 h-3" />
              {typeLabels[item.item_type]}
            </Badge>
            <Badge className={cn('text-xs', statusColors[status])}>
              {statusLabels[status]}
            </Badge>
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        <p
          className="font-arabic text-xl leading-[1.8] line-clamp-2"
          dir="rtl"
        >
          {item.arabic_text}
        </p>

        {item.translation && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.translation}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span className={isOverdue ? 'text-primary font-medium' : ''}>
              {isOverdue ? 'Due now' : `Due ${format(nextReview, 'MMM d')}`}
            </span>
          </div>
          {item.source && (
            <span className="truncate max-w-32">{item.source}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
