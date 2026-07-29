import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type MemorizationItem = Tables<'memorization_items'>;

const AVAILABLE_CATEGORIES = [
  'Aqeedah',
  'Fiqh',
  'Mustalah Al-Hadith',
  'Tafsir',
  'Manners',
  'Heart-Softener',
  'Hadith',
  'Usool Al-Fiqh',
] as const;

interface EditItemDialogProps {
  item: MemorizationItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (item: MemorizationItem) => void;
}

export function EditItemDialog({ item, open, onOpenChange, onSaved }: EditItemDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [arabicText, setArabicText] = useState('');
  const [translation, setTranslation] = useState('');
  const [source, setSource] = useState('');
  const [narrator, setNarrator] = useState('');
  const [speakerName, setSpeakerName] = useState('');
  const [surahName, setSurahName] = useState('');
  const [ayahReference, setAyahReference] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (item) {
      setArabicText(item.arabic_text ?? '');
      setTranslation(item.translation ?? '');
      setSource(item.source ?? '');
      setNarrator(item.narrator ?? '');
      setSpeakerName(item.speaker_name ?? '');
      setSurahName(item.surah_name ?? '');
      setAyahReference(item.ayah_reference ?? '');
      setCategories(item.category ?? []);
    }
  }, [item]);

  const toggleCategory = (category: string) =>
    setCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('memorization_items')
        .update({
          arabic_text: arabicText.trim(),
          translation: translation.trim() || null,
          source: source.trim() || null,
          category: categories.length > 0 ? categories : null,
          narrator: item.item_type === 'hadith' ? narrator.trim() || null : null,
          speaker_name: item.item_type === 'scholar' ? speakerName.trim() || null : null,
          surah_name: item.item_type === 'quran' ? surahName.trim() || null : null,
          ayah_reference: item.item_type === 'quran' ? ayahReference.trim() || null : null,
        })
        .eq('id', item.id)
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Item updated', description: 'Your changes have been saved.' });
      onSaved(data as MemorizationItem);
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit item</DialogTitle>
          <DialogDescription>Update the text, references, and hints for this item.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5">
          {item?.item_type === 'hadith' && (
            <div className="space-y-2">
              <Label htmlFor="edit-narrator">Narrator</Label>
              <Input id="edit-narrator" value={narrator} onChange={(e) => setNarrator(e.target.value)} />
            </div>
          )}

          {item?.item_type === 'scholar' && (
            <div className="space-y-2">
              <Label htmlFor="edit-speaker">Speaker</Label>
              <Input id="edit-speaker" value={speakerName} onChange={(e) => setSpeakerName(e.target.value)} />
            </div>
          )}

          {item?.item_type === 'quran' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-surah">Surah</Label>
                <Input id="edit-surah" value={surahName} onChange={(e) => setSurahName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ayah">Ayah</Label>
                <Input id="edit-ayah" value={ayahReference} onChange={(e) => setAyahReference(e.target.value)} />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-arabic">Arabic text</Label>
            <Textarea
              id="edit-arabic"
              value={arabicText}
              onChange={(e) => setArabicText(e.target.value)}
              className="min-h-32 font-arabic text-base leading-[2.4] text-right"
              dir="rtl"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-source">Source</Label>
            <Input id="edit-source" value={source} onChange={(e) => setSource(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-translation">Translation</Label>
            <Textarea
              id="edit-translation"
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              className="min-h-24"
            />
          </div>

          <div className="space-y-2">
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_CATEGORIES.map((category) => (
                <Button
                  key={category}
                  type="button"
                  variant={categories.includes(category) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleCategory(category)}
                  className={cn('transition-all', categories.includes(category) && 'ring-2 ring-ring ring-offset-2')}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
