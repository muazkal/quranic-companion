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
import { Loader2, Plus, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { HadithImportDialog, type ImportedHadith } from '@/components/HadithImportDialog';
import { QuranSearchDialog, type ImportedAyah } from '@/components/QuranSearchDialog';

type ItemType = 'hadith' | 'quran' | 'scholar';
type DifficultyLevel = 'easy' | 'medium' | 'hard';

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

export function AddItemForm() {
  const [itemType, setItemType] = useState<ItemType>('hadith');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [loading, setLoading] = useState(false);
  const [hadithImportOpen, setHadithImportOpen] = useState(false);
  const [quranSearchOpen, setQuranSearchOpen] = useState(false);
  

  
  // Common fields
  const [arabicText, setArabicText] = useState('');
  const [translation, setTranslation] = useState('');
  const [source, setSource] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Hadith-specific
  const [narrator, setNarrator] = useState('');
  
  // Scholar/Mawquf-specific
  const [speakerName, setSpeakerName] = useState('');
  
  // Quran-specific
  const [surahName, setSurahName] = useState('');
  const [ayahReference, setAyahReference] = useState('');
  
  const { user } = useAuthContext();
  const { toast } = useToast();
  const navigate = useNavigate();

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleHadithImport = (h: ImportedHadith) => {
    setItemType('hadith');
    setArabicText(h.arabicText);
    setTranslation(h.translation);
    setNarrator(h.narrator);
    setSource(h.source);
    toast({ title: 'Hadith imported', description: 'Review the fields, then save it to your library.' });
  };

  const handleAyahImport = (a: ImportedAyah) => {
    setItemType('quran');
    setArabicText(a.arabicText);
    setTranslation(a.translation);
    setSurahName(a.surahName);
    setAyahReference(a.ayahReference);
    setSource(a.source);
    toast({ title: 'Ayah imported', description: 'Review the fields, then save it to your library.' });
  };

  const resetForm = () => {
    setArabicText('');
    setTranslation('');
    setSource('');
    setSelectedCategories([]);
    setNarrator('');
    setSpeakerName('');
    setSurahName('');
    setAyahReference('');
    setDifficulty('medium');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation based on type
    if (itemType === 'hadith' && !narrator.trim()) {
      toast({ title: 'Narrator required', description: 'Please enter the narrator for this hadith.', variant: 'destructive' });
      return;
    }
    if (itemType === 'scholar' && !speakerName.trim()) {
      toast({ title: 'Speaker required', description: 'Please enter the speaker name.', variant: 'destructive' });
      return;
    }
    if (itemType === 'quran' && (!surahName.trim() || !ayahReference.trim())) {
      toast({ title: 'Surah and Ayah required', description: 'Please enter both surah name and ayah reference.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('memorization_items').insert({
        user_id: user.id,
        arabic_text: arabicText.trim(),
        translation: translation.trim() || null,
        item_type: itemType,
        source: source.trim() || null,
        category: selectedCategories.length > 0 ? selectedCategories : null,
        difficulty,
        narrator: itemType === 'hadith' ? narrator.trim() : null,
        speaker_name: itemType === 'scholar' ? speakerName.trim() : null,
        surah_name: itemType === 'quran' ? surahName.trim() : null,
        ayah_reference: itemType === 'quran' ? ayahReference.trim() : null,
      });

      if (error) throw error;

      toast({ title: 'Item added!', description: 'Your memorization item has been saved.' });
      resetForm();
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
          {/* Quick import */}
          <div className="mb-6 flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => setHadithImportOpen(true)}
            >
              <Download className="w-4 h-4" />
              Import hadith (Sunnah.com)
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => setQuranSearchOpen(true)}
            >
              <Download className="w-4 h-4" />
              Search Qur'an
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Type Selection */}
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
                    <SelectItem value="scholar">Mawqūf / Maqṭū' (Scholar)</SelectItem>
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

            {/* Type-specific fields */}
            {itemType === 'hadith' && (
              <div className="space-y-2">
                <Label htmlFor="narrator">Narrator *</Label>
                <Input
                  id="narrator"
                  value={narrator}
                  onChange={(e) => setNarrator(e.target.value)}
                  placeholder="e.g., Abu Hurayrah, Ibn 'Umar, 'Aa'ishah"
                  required
                />
              </div>
            )}

            {itemType === 'scholar' && (
              <div className="space-y-2">
                <Label htmlFor="speakerName">Speaker Name *</Label>
                <Input
                  id="speakerName"
                  value={speakerName}
                  onChange={(e) => setSpeakerName(e.target.value)}
                  placeholder="e.g., Ibn Taymiyyah, Ibn al-Qayyim, al-Hasan al-Basri"
                  required
                />
              </div>
            )}

            {itemType === 'quran' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="surahName">Surah Name *</Label>
                  <Input
                    id="surahName"
                    value={surahName}
                    onChange={(e) => setSurahName(e.target.value)}
                    placeholder="e.g., Al-Baqarah, Al-Fatihah"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ayahReference">Ayah Number/Range *</Label>
                  <Input
                    id="ayahReference"
                    value={ayahReference}
                    onChange={(e) => setAyahReference(e.target.value)}
                    placeholder="e.g., 255 or 1-5"
                    required
                  />
                </div>
              </div>
            )}

            {/* Arabic Text - Main content */}
            <div className="space-y-2">
              <Label htmlFor="arabicText">
                {itemType === 'hadith' ? 'Matn / Nass' : itemType === 'quran' ? 'Ayah Text' : 'Text'} *
              </Label>
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

            {/* Source */}
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder={
                  itemType === 'hadith' 
                    ? "e.g., Sahih al-Bukhari, Sahih Muslim, Musnad Ahmad" 
                    : itemType === 'scholar'
                    ? "e.g., Majmu' al-Fatawa, Madarij al-Salikin"
                    : "Optional source reference"
                }
              />
            </div>

            {/* Translation */}
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

            {/* Category Selector */}
            <div className="space-y-3">
              <Label>Categories (optional hint during review)</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_CATEGORIES.map((category) => (
                  <Button
                    key={category}
                    type="button"
                    variant={selectedCategories.includes(category) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleCategory(category)}
                    className={cn(
                      'transition-all',
                      selectedCategories.includes(category) && 'ring-2 ring-ring ring-offset-2'
                    )}
                  >
                    {category}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Select one or more categories. These will be visible during review as hints.
              </p>
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
