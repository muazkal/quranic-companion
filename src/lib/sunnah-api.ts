import { supabase } from '@/integrations/supabase/client';

export interface SunnahHadithLang {
  lang: string;
  chapterNumber?: string;
  chapterTitle?: string;
  urn?: number;
  body?: string;
  grades?: { graded_by: string; grade: string }[];
}

export interface SunnahHadith {
  collection: string;
  bookNumber?: string;
  chapterId?: string;
  hadithNumber: string;
  hadith: SunnahHadithLang[];
}

export interface SunnahCollection {
  name: string;
  hasBooks: boolean;
  totalAvailableHadith: number;
  collection: { lang: string; title: string; shortIntro?: string }[];
}

async function call<T>(params: Record<string, string>): Promise<T> {
  const query = new URLSearchParams(params).toString();
  const { data, error } = await supabase.functions.invoke(`sunnah?${query}`, {
    method: 'GET',
  });
  if (error) {
    const message = (data as any)?.error ?? error.message;
    throw new Error(message || 'Sunnah.com request failed');
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}

export function fetchCollections() {
  return call<{ data: SunnahCollection[] }>({ action: 'collections' });
}

export function fetchHadith(collection: string, hadithNumber: string) {
  return call<SunnahHadith>({ action: 'hadith', collection, hadithNumber });
}

export function fetchBookHadiths(collection: string, bookNumber: string, page = 1) {
  return call<{ data: SunnahHadith[] }>({
    action: 'book-hadiths',
    collection,
    bookNumber,
    page: String(page),
  });
}

export function fetchRandomHadith() {
  return call<SunnahHadith>({ action: 'random' });
}

export function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Sunnah.com English bodies start with "Narrated X:" — pull that out. */
export function extractNarrator(englishBody: string): string {
  const text = stripHtml(englishBody);
  const match = text.match(/^(?:Narrated|It was narrated (?:from|that))\s+([^:.]{2,80})[:.]/i);
  return match ? match[1].trim() : '';
}
