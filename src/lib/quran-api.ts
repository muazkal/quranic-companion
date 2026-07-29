const QURAN_API = 'https://api.quran.com/api/v4';

export interface QuranSearchResult {
  verseKey: string;
  snippet: string;
  translation: string;
}

export interface QuranVerse {
  verseKey: string;
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  arabic: string;
  translation: string;
}

let chapterCache: Record<number, string> | null = null;

async function getChapters(): Promise<Record<number, string>> {
  if (chapterCache) return chapterCache;
  const res = await fetch(`${QURAN_API}/chapters?language=en`);
  if (!res.ok) throw new Error('Could not load surah list');
  const json = await res.json();
  const map: Record<number, string> = {};
  for (const c of json.chapters ?? []) map[c.id] = c.name_simple;
  chapterCache = map;
  return map;
}

function stripTags(html: string) {
  return html.replace(/<[^>]*>/g, '').trim();
}

export async function searchQuran(query: string): Promise<QuranSearchResult[]> {
  const res = await fetch(
    `${QURAN_API}/search?q=${encodeURIComponent(query)}&size=15&language=en`
  );
  if (!res.ok) throw new Error('Qur\u2019an search failed');
  const json = await res.json();
  const results = json?.search?.results ?? [];
  return results.map((r: any) => ({
    verseKey: r.verse_key,
    snippet: stripTags(r.text ?? ''),
    translation: stripTags(r.translations?.[0]?.text ?? ''),
  }));
}

export async function getVerse(verseKey: string): Promise<QuranVerse> {
  const [chapters, res] = await Promise.all([
    getChapters(),
    fetch(
      `${QURAN_API}/verses/by_key/${encodeURIComponent(verseKey)}?fields=text_uthmani&translations=131`
    ),
  ]);
  if (!res.ok) throw new Error('Could not load that ayah');
  const json = await res.json();
  const v = json.verse;
  const [surahNumber, ayahNumber] = verseKey.split(':').map(Number);
  return {
    verseKey,
    surahNumber,
    ayahNumber,
    surahName: chapters[surahNumber] ?? `Surah ${surahNumber}`,
    arabic: v?.text_uthmani ?? '',
    translation: stripTags(v?.translations?.[0]?.text ?? ''),
  };
}

export async function listSurahs() {
  const chapters = await getChapters();
  return Object.entries(chapters).map(([id, name]) => ({ id: Number(id), name }));
}
