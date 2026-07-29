import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const BASE = 'https://api.sunnah.com/v1';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const apiKey = Deno.env.get('SUNNAH_API_KEY');
  if (!apiKey) {
    return json({ error: 'Sunnah.com API key is not configured yet.' }, 503);
  }

  // Require an authenticated app user
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return json({ error: 'Unauthorized' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!,
  );
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) return json({ error: 'Unauthorized' }, 401);

  const url = new URL(req.url);
  const action = url.searchParams.get('action') ?? 'collections';

  let path = '';
  if (action === 'collections') {
    path = `/collections?limit=100`;
  } else if (action === 'books') {
    const collection = url.searchParams.get('collection');
    if (!collection) return json({ error: 'collection is required' }, 400);
    path = `/collections/${encodeURIComponent(collection)}/books?limit=100`;
  } else if (action === 'hadith') {
    const collection = url.searchParams.get('collection');
    const hadithNumber = url.searchParams.get('hadithNumber');
    if (!collection || !hadithNumber) {
      return json({ error: 'collection and hadithNumber are required' }, 400);
    }
    path = `/collections/${encodeURIComponent(collection)}/hadiths/${encodeURIComponent(hadithNumber)}`;
  } else if (action === 'book-hadiths') {
    const collection = url.searchParams.get('collection');
    const bookNumber = url.searchParams.get('bookNumber');
    const page = url.searchParams.get('page') ?? '1';
    if (!collection || !bookNumber) {
      return json({ error: 'collection and bookNumber are required' }, 400);
    }
    path = `/collections/${encodeURIComponent(collection)}/books/${encodeURIComponent(bookNumber)}/hadiths?limit=25&page=${encodeURIComponent(page)}`;
  } else if (action === 'random') {
    path = `/hadiths/random`;
  } else {
    return json({ error: 'Unknown action' }, 400);
  }

  const res = await fetch(`${BASE}${path}`, { headers: { 'X-API-Key': apiKey } });
  const text = await res.text();
  if (!res.ok) {
    return json({ error: `Sunnah.com API error (${res.status})`, detail: text.slice(0, 300) }, res.status);
  }
  return new Response(text, {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
