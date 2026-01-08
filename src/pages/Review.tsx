import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ReviewCard } from '@/components/ReviewCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { calculateNextReview, RecallRating } from '@/lib/spaced-repetition';
import { ArrowLeft, Trophy, Plus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

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
}

export function Review() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<MemorizationItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchDueItems();
    }
  }, [user]);

  const fetchDueItems = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('memorization_items')
        .select('*')
        .eq('user_id', user.id)
        .lte('next_review_date', today)
        .order('next_review_date', { ascending: true });

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

    const currentItem = items[currentIndex];
    setSubmitting(true);

    try {
      // Calculate next review using Anki-style SM-2
      const result = calculateNextReview(rating, {
        repetitions: currentItem.repetitions,
        easinessFactor: Number(currentItem.easiness_factor),
        interval: currentItem.interval,
      });

      // Update the item immediately
      const { error: updateError } = await supabase
        .from('memorization_items')
        .update({
          repetitions: result.repetitions,
          easiness_factor: result.easinessFactor,
          interval: result.interval,
          next_review_date: result.nextReviewDate.toISOString().split('T')[0],
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

      // Update streak
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
            newStreak = 1; // Reset streak if missed a day
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

      setCompletedCount(prev => prev + 1);
      
      // Move to next item
      if (currentIndex < items.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
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

  // All done!
  if (items.length === 0 || completedCount >= items.length) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-serif font-semibold mb-2">
              {items.length === 0 ? 'No items to review' : 'Session Complete!'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {items.length === 0
                ? 'Add some items to your library to start reviewing.'
                : `You reviewed ${completedCount} item${completedCount !== 1 ? 's' : ''}. Great work!`}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <Link to="/add">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add More Items
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentItem = items[currentIndex];
  const progress = (completedCount / items.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="max-w-2xl mx-auto space-y-2">
        <div className="flex items-center justify-between text-sm">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 -ml-2">
              <ArrowLeft className="w-4 h-4" />
              Exit
            </Button>
          </Link>
          <span className="text-muted-foreground">
            {completedCount + 1} of {items.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Review Card */}
      <ReviewCard
        key={currentItem.id}
        item={currentItem}
        onRate={handleRate}
        isLoading={submitting}
      />
    </div>
  );
}
