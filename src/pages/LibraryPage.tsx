import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ItemCard } from '@/components/ItemCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Library } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Tables } from '@/integrations/supabase/types';

type MemorizationItem = Tables<'memorization_items'>;

export function LibraryPage() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MemorizationItem[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [user]);

  const fetchItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('memorization_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems((data || []) as MemorizationItem[]);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('memorization_items')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      setItems(items.filter(item => item.id !== deleteId));
      toast({ title: 'Item deleted', description: 'The item has been removed from your library.' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
  };

  const filteredItems = items.filter(item => {
    const categoryMatch = item.category?.some(cat => 
      cat.toLowerCase().includes(search.toLowerCase())
    );
    const matchesSearch = search === '' ||
      item.arabic_text.includes(search) ||
      item.translation?.toLowerCase().includes(search.toLowerCase()) ||
      item.source?.toLowerCase().includes(search.toLowerCase()) ||
      categoryMatch;

    const matchesType = typeFilter === 'all' || item.item_type === typeFilter;

    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Library className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-semibold">Library</h1>
            <p className="text-sm text-muted-foreground">{items.length} items</p>
          </div>
        </div>
        <Link to="/add">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="hadith">Hadith</SelectItem>
            <SelectItem value="quran">Qur'an</SelectItem>
            <SelectItem value="scholar">Scholar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <Library className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-1">Your library is empty</h2>
          <p className="text-muted-foreground mb-4">Add your first memorization item to get started</p>
          <Link to="/add">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add First Item
            </Button>
          </Link>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No items match your search</p>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item and all its review history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
