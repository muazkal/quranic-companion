import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/StatsCard';
import { ItemCard } from '@/components/ItemCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Flame, BookOpen, Target, TrendingUp, Play, Plus, Library } from 'lucide-react';
import { getItemStatus } from '@/lib/spaced-repetition';
import { Skeleton } from '@/components/ui/skeleton';

interface MemorizationItem {
  id: string;
  arabic_text: string;
  translation: string | null;
  item_type: 'hadith' | 'quran' | 'scholar';
  source: string | null;
  category: string[] | null;
  difficulty: 'easy' | 'medium' | 'hard';
  repetitions: number;
  easiness_factor: number;
  next_review_date: string;
  next_review_at: string;
  phase: 'learning' | 'review';
  narrator: string | null;
  speaker_name: string | null;
  surah_name: string | null;
  ayah_reference: string | null;
}

interface Profile {
  current_streak: number;
  longest_streak: number;
  last_review_date: string | null;
}

export function Dashboard() {
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
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setProfile(profileData);

      // Fetch all items
      const { data: itemsData } = await supabase
        .from('memorization_items')
        .select('*')
        .eq('user_id', user.id)
        .order('next_review_at', { ascending: true });

      const allItems = (itemsData || []) as MemorizationItem[];
      setItems(allItems);

      // Filter due items - ONLY review phase cards that are due
      // Learning phase cards are handled within the review session, not on dashboard
      const now = new Date().toISOString();
      const due = allItems.filter(item => 
        item.phase === 'review' && item.next_review_at <= now
      );
      setDueItems(due);

      // Count today's reviews
      const { count } = await supabase
        .from('review_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('reviewed_at', new Date().toISOString().split('T')[0]);
      
      setTodayReviewed(count || 0);
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
          <p className="text-muted-foreground">Ready for your daily memorization?</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
          <Flame className="w-5 h-5 text-primary" />
          <span className="font-semibold">{profile?.current_streak || 0}</span>
          <span className="text-sm text-muted-foreground">day streak</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Due Today"
          value={dueItems.length}
          icon={Target}
          description={`${todayReviewed} reviewed`}
        />
        <StatsCard
          title="Memorized"
          value={stats.memorized}
          icon={TrendingUp}
        />
        <StatsCard
          title="Learning"
          value={stats.learning + stats.new}
          icon={BookOpen}
        />
        <StatsCard
          title="Total Items"
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
                  {dueItems.length} item{dueItems.length !== 1 ? 's' : ''} due for review
                </h2>
                <p className="text-muted-foreground">
                  Keep your streak going! Start your daily review now.
                </p>
              </div>
              <Link to="/review">
                <Button size="lg" className="gap-2">
                  <Play className="w-4 h-4" />
                  Start Review
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
            <h2 className="text-xl font-semibold">All caught up!</h2>
            <p className="text-muted-foreground mt-1">
              No items due for review today. Great job staying consistent!
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Start your journey</h2>
            <p className="text-muted-foreground mt-1 mb-4">
              Add your first memorization item to begin
            </p>
            <Link to="/add">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add First Item
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Recent Items */}
      {items.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Items</h2>
            <Link to="/library">
              <Button variant="ghost" size="sm">View All</Button>
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
