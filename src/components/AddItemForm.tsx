import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Loader2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type ItemType = 'hadith' | 'quran' | 'scholar';
type DifficultyLevel = 'easy' | 'medium' | 'hard';

export function AddItemForm() {
  const [arabicText, setArabicText] = useState('');
  const [translation, setTranslation] = useState('');
  const [itemType, setItemType] = useState<ItemType>('hadith');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('memorization_items').insert({
        user_id: user.id,
        arabic_text: arabicText.trim(),
        translation: translation.trim() || null,
        item_type: itemType,
        source: source.trim() || null,
        category: category.trim() || null,
        difficulty,
      });

      if (error) throw error;

      toast({ title: 'Item added!', description: 'Your memorization item has been saved.' });
      
      // Reset form
      setArabicText('');
      setTranslation('');
      setSource('');
      setCategory('');
      setDifficulty('medium');
      
      navigate('/library');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Memorization Item
          </CardTitle>
          <CardDescription>
            Add a new hadith, Qur'anic verse, or scholarly saying to your library
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="arabicText">Arabic Text *</Label>
              <Textarea
                id="arabicText"
                value={arabicText}
                onChange={(e) => setArabicText(e.target.value)}
                placeholder="أدخل النص العربي هنا..."
                className="min-h-32 font-arabic text-xl leading-loose text-right"
                dir="rtl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="translation">Translation (optional)</Label>
              <Textarea
                id="translation"
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                placeholder="Enter the translation..."
                className="min-h-24"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemType">Type</Label>
                <Select value={itemType} onValueChange={(v) => setItemType(v as ItemType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hadith">Hadith</SelectItem>
                    <SelectItem value="quran">Qur'an</SelectItem>
                    <SelectItem value="scholar">Scholar Saying</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as DifficultyLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Source (optional)</Label>
              <Input
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g., Sahih Bukhari, Surah Al-Baqarah:255"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category / Topic (optional)</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Prayer, Patience, Aqeedah"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add to Library
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
