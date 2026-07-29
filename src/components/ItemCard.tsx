import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, ScrollText, Quote, Trash2, Calendar, Pencil } from 'lucide-react';
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { getItemStatus } from '@/lib/spaced-repetition';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type MemorizationItem = Tables<'memorization_items'>;

interface ItemCardProps {
  item: MemorizationItem;
  onDelete?: (id: string) => void;
  onEdit?: (item: MemorizationItem) => void;
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
  // Use next_review_at (timestamp) for accurate due check, not next_review_date (date only)
  const nextReview = new Date(item.next_review_at);
  const now = new Date();
  const isOverdue = nextReview <= now;
  
  // Get human-readable due label
  const getDueLabel = () => {
    if (isOverdue) {
      return 'Due now';
    }
    
    const minutesUntilDue = differenceInMinutes(nextReview, now);
    
    if (minutesUntilDue < 60) {
      return `Due in ${minutesUntilDue} min`;
    }
    
    // For longer times, use formatDistanceToNow
    return `Due ${formatDistanceToNow(nextReview, { addSuffix: true })}`;
  };

  // Get context info based on type
  const getContextInfo = () => {
    switch (item.item_type) {
      case 'hadith':
        return item.narrator;
      case 'quran':
        return item.surah_name && item.ayah_reference 
          ? `${item.surah_name} : ${item.ayah_reference}` 
          : null;
      case 'scholar':
        return item.speaker_name;
      default:
        return null;
    }
  };

  const contextInfo = getContextInfo();

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

        {/* Context info (narrator/surah/speaker) */}
        {contextInfo && (
          <p className="text-sm font-medium text-foreground">
            {contextInfo}
          </p>
        )}

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
              {getDueLabel()}
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
