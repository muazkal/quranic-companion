import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ReviewCard } from '@/components/ReviewCard';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { RecallRating } from '@/lib/spaced-repetition';
import { ArrowLeft, Trophy, Plus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDueCards } from '@/lib/due-cards';
import { supabase } from '@/integrations/supabase/client';

interface MemorizationItem {
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
  learning_step: number; // Tracks consecutive Good responses in learning phase
}

export function Review() {
  const { t } = useLanguage();
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<MemorizationItem[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [cardKey, setCardKey] = useState(0); // Force re-render when same card reappears

  useEffect(() => {
    if (user) {
      fetchDueItems();
    }
  }, [user]);

  const fetchDueItems = async () => {
    if (!user) return;

    try {
      // SINGLE SOURCE OF TRUTH: Same query as Dashboard
      // A card is due if: next_review_at <= now (no phase filtering)
      const { data, error } = await fetchDueCards({ userId: user.id });

      if (error) throw error;
      setItems((data || []) as MemorizationItem[]);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (rating: RecallRating) => {
    if (!user || submitting) return;

    const currentItem = items[0];
    setSubmitting(true);

    try {
      const isCurrentlyLearning = currentItem.phase === 'learning';
      const currentLearningStep = currentItem.learning_step || 0;

      // ========================================
      // GRADUATION LOGIC (EXACT SPEC)
      // ========================================
      // Condition A: Easy in learning phase → graduate immediately
      // Condition B: Two consecutive Good responses (learning_step >= 1 AND rating === 2)
      // 
      // NON-GRADUATION:
      // - Again or Hard → reset learning_step to 0
      // - Single Good → increment learning_step to 1
      // - Already in review phase → stay in review
      // ========================================

      let newPhase: 'learning' | 'review' = currentItem.phase;
      let newLearningStep = currentLearningStep;
      let intervalForDb: number;
      let nextReviewAt: Date;
      let newRepetitions = currentItem.repetitions;
      let newEasinessFactor = Number(currentItem.easiness_factor);
      let requeueInSession = false;

      if (isCurrentlyLearning) {
        // === LEARNING PHASE LOGIC ===
        switch (rating) {
          case 0: // Again - reset, requeue in session
            newLearningStep = 0;
            nextReviewAt = new Date();
            nextReviewAt.setMinutes(nextReviewAt.getMinutes() + 1);
            requeueInSession = true;
            newEasinessFactor = Math.max(1.3, newEasinessFactor - 0.2);
            intervalForDb = 0;
            break;

          case 1: // Hard - reset consecutive count, 2 min delay
            newLearningStep = 0;
            nextReviewAt = new Date();
            nextReviewAt.setMinutes(nextReviewAt.getMinutes() + 2);
            newEasinessFactor = Math.max(1.3, newEasinessFactor - 0.15);
            intervalForDb = 0;
            break;

          case 2: // Good - check for graduation condition B
            if (currentLearningStep >= 1) {
              // Two consecutive Goods → GRADUATE
              newPhase = 'review';
              newLearningStep = 0;
              intervalForDb = 1;
              nextReviewAt = new Date();
              nextReviewAt.setDate(nextReviewAt.getDate() + 1);
              newRepetitions = 2; // Mark as graduated
            } else {
              // First Good → increment step, 10 min delay
              newLearningStep = 1;
              nextReviewAt = new Date();
              nextReviewAt.setMinutes(nextReviewAt.getMinutes() + 10);
              intervalForDb = 0;
            }
            break;

          case 3: // Easy - GRADUATE immediately (Condition A)
            newPhase = 'review';
            newLearningStep = 0;
            intervalForDb = 4; // Easy bonus: 4 days
            nextReviewAt = new Date();
            nextReviewAt.setDate(nextReviewAt.getDate() + 4);
            newRepetitions = 2;
            newEasinessFactor = newEasinessFactor + 0.15;
            break;

          default:
            throw new Error('Invalid rating');
        }
      } else {
        // === REVIEW PHASE LOGIC (day-based only) ===
        const currentInterval = Math.max(1, currentItem.interval);
        
        switch (rating) {
          case 0: // Again - back to learning
            newPhase = 'learning';
            newLearningStep = 0;
            intervalForDb = 0;
            nextReviewAt = new Date();
            nextReviewAt.setMinutes(nextReviewAt.getMinutes() + 1);
            requeueInSession = true;
            newRepetitions = 0;
            newEasinessFactor = Math.max(1.3, newEasinessFactor - 0.2);
            break;

          case 1: // Hard - 1.2x interval
            intervalForDb = Math.max(1, Math.round(currentInterval * 1.2));
            nextReviewAt = new Date();
            nextReviewAt.setDate(nextReviewAt.getDate() + intervalForDb);
            newRepetitions += 1;
            newEasinessFactor = Math.max(1.3, newEasinessFactor - 0.15);
            break;

          case 2: // Good - ease factor multiplier
            intervalForDb = Math.max(1, Math.round(currentInterval * newEasinessFactor));
            nextReviewAt = new Date();
            nextReviewAt.setDate(nextReviewAt.getDate() + intervalForDb);
            newRepetitions += 1;
            break;

          case 3: // Easy - ease factor * 1.3 bonus
            intervalForDb = Math.max(1, Math.round(currentInterval * newEasinessFactor * 1.3));
            nextReviewAt = new Date();
            nextReviewAt.setDate(nextReviewAt.getDate() + intervalForDb);
            newRepetitions += 1;
            newEasinessFactor = newEasinessFactor + 0.15;
            break;

          default:
            throw new Error('Invalid rating');
        }
      }

      // Update database
      const { error: updateError } = await supabase
        .from('memorization_items')
        .update({
          repetitions: newRepetitions,
          easiness_factor: Number(newEasinessFactor.toFixed(2)),
          interval: intervalForDb,
          phase: newPhase,
          learning_step: newLearningStep,
          next_review_at: nextReviewAt.toISOString(),
          next_review_date: nextReviewAt.toISOString().split('T')[0],
        })
        .eq('id', currentItem.id);

      if (updateError) throw updateError;

      // Record the review in history
      const { error: historyError } = await supabase
        .from('review_history')
        .insert({
          user_id: user.id,
          item_id: currentItem.id,
          rating,
        });

      if (historyError) throw historyError;

      // Update streak only when card leaves session (not requeued)
      if (!requeueInSession) {
        const today = new Date().toISOString().split('T')[0];
        const { data: profile } = await supabase
          .from('profiles')
          .select('current_streak, longest_streak, last_review_date')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile) {
          const lastReview = profile.last_review_date;
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          let newStreak = profile.current_streak;
          if (lastReview !== today) {
            if (lastReview === yesterdayStr) {
              newStreak += 1;
            } else if (!lastReview) {
              newStreak = 1;
            } else {
              newStreak = 1;
            }

            await supabase
              .from('profiles')
              .update({
                current_streak: newStreak,
                longest_streak: Math.max(newStreak, profile.longest_streak),
                last_review_date: today,
              })
              .eq('user_id', user.id);
          }
        }
      }

      // Handle card progression in UI
      if (requeueInSession) {
        // Again pressed - requeue card to end of session
        const updatedItem = {
          ...currentItem,
          repetitions: newRepetitions,
          easiness_factor: newEasinessFactor,
          interval: intervalForDb,
          phase: newPhase,
          learning_step: newLearningStep,
        };
        
        setItems(prevItems => {
          const newItems = [...prevItems];
          newItems.splice(0, 1);
          newItems.push(updatedItem);
          return newItems;
        });
        setCardKey(prev => prev + 1);
      } else {
        // Card leaves current session
        setItems(prevItems => {
          const newItems = [...prevItems];
          newItems.splice(0, 1);
          return newItems;
        });
        setCompletedCount(prev => prev + 1);
        setCardKey(prev => prev + 1);
      }
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Session complete when queue is empty
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-serif font-semibold mb-2">
              {completedCount === 0 ? t('noItemsReview') : t('sessionComplete')}
            </h1>
            <p className="text-muted-foreground mb-6">
              {completedCount === 0
                ? t('addToStart')
                : t('reviewedN', { n: completedCount })}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  {t('backDashboard')}
                </Button>
              </Link>
              <Link to="/add">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t('addMore')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentItem = items[0]; // Always show first item in queue
  // Progress: completed vs total (completed + remaining in queue)
  const totalToReview = completedCount + items.length;
  const progress = totalToReview > 0 ? (completedCount / totalToReview) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="max-w-2xl mx-auto space-y-2">
        <div className="flex items-center justify-between text-sm">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 -ml-2">
              <ArrowLeft className="w-4 h-4" />
              {t('exit')}
            </Button>
          </Link>
          <span className="text-muted-foreground">
            {t('doneRemaining', { d: completedCount, r: items.length })}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Review Card */}
      <ReviewCard
        key={`${currentItem.id}-${cardKey}`}
        item={currentItem}
        onRate={handleRate}
        isLoading={submitting}
      />
    </div>
  );
}
