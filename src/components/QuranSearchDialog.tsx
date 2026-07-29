import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, BookMarked } from 'lucide-react';
import { searchQuran, getVerse, type QuranSearchResult } from '@/lib/quran-api';

export interface ImportedAyah {
  arabicText: string;
  translation: string;
  surahName: string;
  ayahReference: string;
  source: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (ayah: ImportedAyah) => void;
}

export function QuranSearchDialog({ open, onOpenChange, onImport }: Props) {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<QuranSearchResult[]>([]);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportedAyah | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setPreview(null);
    try {
      const res = await searchQuran(query.trim());
      setResults(res);
      if (res.length === 0) {
        toast({ title: 'No matches', description: 'Try different wording or a verse key like 2:255.' });
      }
    } catch (error: any) {
      toast({ title: 'Search failed', description: error.message, variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  const selectVerse = async (verseKey: string) => {
    setLoadingKey(verseKey);
    try {
      const verse = await getVerse(verseKey);
      setPreview({
        arabicText: verse.arabic,
        translation: verse.translation,
        surahName: verse.surahName,
        ayahReference: String(verse.ayahNumber),
        source: `Surah ${verse.surahName} ${verse.verseKey}`,
      });
    } catch (error: any) {
      toast({ title: 'Could not load ayah', description: error.message, variant: 'destructive' });
    } finally {
      setLoadingKey(null);
    }
  };

  const handleUse = () => {
    if (!preview) return;
    onImport(preview);
    onOpenChange(false);
    setPreview(null);
    setResults([]);
    setQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookMarked className="w-5 h-5" />
            Search the Qur'an
          </DialogTitle>
          <DialogDescription>
            Search by meaning, Arabic words, or a verse key such as 2:255.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="quranQuery">Search</Label>
          <div className="flex gap-2">
            <Input
              id="quranQuery"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., ayat al-kursi, patience, 2:255"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />
            <Button type="button" onClick={handleSearch} disabled={searching || !query.trim()}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {results.length > 0 && (
          <div className="max-h-64 overflow-y-auto rounded-lg border divide-y">
            {results.map((r) => (
              <button
                key={r.verseKey}
                type="button"
                onClick={() => selectVerse(r.verseKey)}
                className="w-full text-left p-3 hover:bg-muted transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-primary">{r.verseKey}</span>
                  {loadingKey === r.verseKey && <Loader2 className="h-3 w-3 animate-spin" />}
                </div>
                <p dir="rtl" className="font-arabic text-base leading-[2.2] tracking-wide text-right">
                  {r.snippet}
                </p>
                {r.translation && (
                  <p className="text-xs text-muted-foreground mt-1">{r.translation}</p>
                )}
              </button>
            ))}
          </div>
        )}

        {preview && (
          <div className="space-y-3 rounded-lg border p-4">
            <p dir="rtl" className="font-arabic text-base leading-[2.4] tracking-wide text-right">
              {preview.arabicText}
            </p>
            <p className="text-sm">{preview.translation}</p>
            <p className="text-xs text-muted-foreground">{preview.source}</p>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleUse} disabled={!preview}>
            Use this ayah
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
