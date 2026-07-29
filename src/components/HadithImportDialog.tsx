import { useEffect, useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BookOpen } from 'lucide-react';
import {
  fetchCollections,
  fetchHadith,
  extractNarrator,
  stripHtml,
  type SunnahCollection,
} from '@/lib/sunnah-api';

export interface ImportedHadith {
  arabicText: string;
  translation: string;
  narrator: string;
  source: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (hadith: ImportedHadith) => void;
}

export function HadithImportDialog({ open, onOpenChange, onImport }: Props) {
  const { toast } = useToast();
  const [collections, setCollections] = useState<SunnahCollection[]>([]);
  const [collection, setCollection] = useState('bukhari');
  const [hadithNumber, setHadithNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ImportedHadith | null>(null);

  useEffect(() => {
    if (!open || collections.length) return;
    fetchCollections()
      .then((res) => setCollections(res.data ?? []))
      .catch(() => {
        /* keep manual collection entry available */
      });
  }, [open, collections.length]);

  const handleFetch = async () => {
    if (!hadithNumber.trim()) return;
    setLoading(true);
    setPreview(null);
    try {
      const hadith = await fetchHadith(collection, hadithNumber.trim());
      const ar = hadith.hadith?.find((h) => h.lang === 'ar');
      const en = hadith.hadith?.find((h) => h.lang === 'en');
      const title =
        collections.find((c) => c.name === collection)?.collection?.find((c) => c.lang === 'en')
          ?.title ?? collection;

      setPreview({
        arabicText: stripHtml(ar?.body ?? ''),
        translation: stripHtml(en?.body ?? ''),
        narrator: extractNarrator(en?.body ?? ''),
        source: `${title} ${hadith.hadithNumber}`,
      });
    } catch (error: any) {
      toast({ title: 'Could not fetch hadith', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUse = () => {
    if (!preview) return;
    onImport(preview);
    onOpenChange(false);
    setPreview(null);
    setHadithNumber('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Import from Sunnah.com
          </DialogTitle>
          <DialogDescription>
            Pick a collection and hadith number to pull the Arabic matn, translation and narrator.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-2 sm:col-span-2">
            <Label>Collection</Label>
            <Select value={collection} onValueChange={setCollection}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {(collections.length
                  ? collections.map((c) => ({
                      value: c.name,
                      label: c.collection?.find((x) => x.lang === 'en')?.title ?? c.name,
                    }))
                  : [
                      { value: 'bukhari', label: 'Sahih al-Bukhari' },
                      { value: 'muslim', label: 'Sahih Muslim' },
                      { value: 'nasai', label: "Sunan an-Nasa'i" },
                      { value: 'abudawud', label: 'Sunan Abi Dawud' },
                      { value: 'tirmidhi', label: 'Jami` at-Tirmidhi' },
                      { value: 'ibnmajah', label: 'Sunan Ibn Majah' },
                      { value: 'nawawi40', label: 'Forty Hadith of an-Nawawi' },
                      { value: 'riyadussalihin', label: 'Riyad as-Salihin' },
                    ]
                ).map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hadithNumber">Hadith number</Label>
            <Input
              id="hadithNumber"
              value={hadithNumber}
              onChange={(e) => setHadithNumber(e.target.value)}
              placeholder="e.g., 1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleFetch();
                }
              }}
            />
          </div>
        </div>

        <Button type="button" onClick={handleFetch} disabled={loading || !hadithNumber.trim()}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Fetch hadith
        </Button>

        {preview && (
          <div className="space-y-3 rounded-lg border p-4">
            <p dir="rtl" className="font-arabic text-base leading-[2.4] tracking-wide text-right">
              {preview.arabicText || '—'}
            </p>
            {preview.narrator && (
              <p className="text-sm text-muted-foreground">Narrator: {preview.narrator}</p>
            )}
            <p className="text-sm">{preview.translation}</p>
            <p className="text-xs text-muted-foreground">{preview.source}</p>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleUse} disabled={!preview}>
            Use this hadith
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
