import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatsCard } from '@/components/StatsCard';
import { ItemCard } from '@/components/ItemCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Flame, BookOpen, Target, TrendingUp, Play, Plus, Library } from 'lucide-react';
import { getItemStatus } from '@/lib/spaced-repetition';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDueCards } from '@/lib/due-cards';
import type { Tables } from '@/integrations/supabase/types';

type MemorizationItem = Tables<'memorization_items'>;

interface Profile {
  current_streak: number;
  longest_streak: number;
  last_review_date: string | null;
}

export function Dashboard() {
  const { t } = useLanguage();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<MemorizationItem[]>([]);
  const [dueItems, setDueItems] = useState<MemorizationItem[]>([]);
  const [todayReviewed, setTodayReviewed] = useState(0);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Run all queries in parallel for better performance
      const [profileResult, itemsResult, dueResult, reviewCountResult] = await Promise.all([
        // Fetch profile
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        
        // Fetch all items for stats
        supabase
          .from('memorization_items')
          .select('*')
          .eq('user_id', user.id)
          .order('next_review_at', { ascending: true }),
        
        // SINGLE SOURCE OF TRUTH: Use shared fetchDueCards for due items
        // This is the EXACT same query used by the Review page
        fetchDueCards({ userId: user.id }),
        
        // Count today's reviews
        supabase
          .from('review_history')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('reviewed_at', new Date().toISOString().split('T')[0])
      ]);

      setProfile(profileResult.data);
      setItems((itemsResult.data || []) as MemorizationItem[]);
      setDueItems((dueResult.data || []) as MemorizationItem[]);
      setTodayReviewed(reviewCountResult.count || 0);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    memorized: items.filter(i => getItemStatus(i.repetitions, Number(i.easiness_factor)) === 'memorized').length,
    learning: items.filter(i => getItemStatus(i.repetitions, Number(i.easiness_factor)) === 'learning').length,
    struggling: items.filter(i => getItemStatus(i.repetitions, Number(i.easiness_factor)) === 'struggling').length,
    new: items.filter(i => getItemStatus(i.repetitions, Number(i.easiness_factor)) === 'new').length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold">السلام عليكم ورحمة الله وبركاته</h1>
          <p className="text-muted-foreground">{t('dashReady')}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
          <Flame className="w-5 h-5 text-primary" />
          <span className="font-semibold">{profile?.current_streak || 0}</span>
          <span className="text-sm text-muted-foreground">{t('dayStreak')}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title={t('dueToday')}
          value={dueItems.length}
          icon={Target}
          description={t('reviewedCount', { n: todayReviewed })}
        />
        <StatsCard
          title={t('memorized')}
          value={stats.memorized}
          icon={TrendingUp}
        />
        <StatsCard
          title={t('learning')}
          value={stats.learning + stats.new}
          icon={BookOpen}
        />
        <StatsCard
          title={t('totalItems')}
          value={items.length}
          icon={Library}
        />
      </div>

      {/* Quick Actions */}
      {dueItems.length > 0 ? (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-semibold">
                  {t('itemsDue', { n: dueItems.length })}
                </h2>
                <p className="text-muted-foreground">
                  {t('keepStreak')}
                </p>
              </div>
              <Link to="/review">
                <Button size="lg" className="gap-2">
                  <Play className="w-4 h-4" />
                  {t('startReview')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : items.length > 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-semibold">{t('allCaught')}</h2>
            <p className="text-muted-foreground mt-1">
              {t('noneDue')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">{t('startJourney')}</h2>
            <p className="text-muted-foreground mt-1 mb-4">
              {t('addFirstToBegin')}
            </p>
            <Link to="/add">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {t('addFirst')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Recent Items */}
      {items.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('recentItems')}</h2>
            <Link to="/library">
              <Button variant="ghost" size="sm">{t('viewAll')}</Button>
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {items.slice(0, 4).map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
