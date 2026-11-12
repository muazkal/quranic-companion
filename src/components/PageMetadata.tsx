import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const pages: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Memorization Dashboard — Revise | راجع',
    description: "Build daily consistency in memorizing Hadith, Qur'an, and scholarly sayings. Track due reviews, learning progress, and your daily streak.",
  },
  '/review': {
    title: 'Daily Review — Revise | راجع',
    description: "Review your due Hadith, Qur'an, and scholarly sayings with spaced repetition. Practice recall and rate each response to schedule your next review.",
  },
  '/library': {
    title: 'Library — Revise | راجع',
    description: "Browse, search, and edit your saved Hadith, Qur'an verses, and scholarly sayings. Keep your memorization library organized for daily study.",
  },
  '/add': {
    title: 'Add Memorization Item — Revise | راجع',
    description: "Add a Hadith, Qur'an passage, or scholarly saying to your study library with Arabic text, translation, source, and optional categories.",
  },
  '/reset-password': {
    title: 'Reset Password — Revise | راجع',
    description: 'Set a new password for your Revise account using your reset link and return to your memorization library and daily reviews.',
  },
};

export function PageMetadata() {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, '') || '/';
  const page = pages[path] ?? {
    title: 'Page Not Found — Revise | راجع',
    description: 'This page is not available on Revise. Return to your memorization dashboard to continue studying and reviewing your saved items.',
  };
  const canonical = `https://raji-revise.lovable.app${path}`;

  return (
    <Helmet>
      <title>{page.title}</title>
      <meta name="description" content={page.description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={page.title} />
      <meta property="og:description" content={page.description} />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:title" content={page.title} />
      <meta name="twitter:description" content={page.description} />
    </Helmet>
  );
}