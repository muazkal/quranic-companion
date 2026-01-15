/**
 * SINGLE SOURCE OF TRUTH for due card logic.
 * 
 * A card is due if and only if:
 *   next_review_at <= now
 * 
 * This applies EVERYWHERE - Dashboard, Review, all counts.
 * There is NO distinction between learning/review phases for "due" status.
 * 
 * INVARIANT: Dashboard due count === Review session card count
 */

import { supabase } from '@/integrations/supabase/client';

export interface DueCardFilters {
  userId: string;
}

/**
 * Fetches ALL due cards from the database.
 * A card is due if: next_review_at <= now
 * 
 * This is the ONLY due card query. Used by Dashboard AND Review.
 */
export async function fetchDueCards({ userId }: DueCardFilters) {
  const now = new Date().toISOString();
  
  return supabase
    .from('memorization_items')
    .select('*')
    .eq('user_id', userId)
    .lte('next_review_at', now)
    .order('next_review_at', { ascending: true });
}

/**
 * Filters an array of items to only those that are due.
 * Use this when you already have items loaded.
 * 
 * A card is due if: next_review_at <= now
 */
export function filterDueCards<T extends { next_review_at: string }>(
  items: T[]
): T[] {
  const now = new Date().toISOString();
  return items.filter(item => item.next_review_at <= now);
}

/**
 * Counts due cards for display.
 * A card is due if: next_review_at <= now
 */
export async function countDueCards(userId: string): Promise<number> {
  const now = new Date().toISOString();
  
  const { count, error } = await supabase
    .from('memorization_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .lte('next_review_at', now);
  
  if (error) {
    console.error('Error counting due cards:', error);
    return 0;
  }
  
  return count || 0;
}
