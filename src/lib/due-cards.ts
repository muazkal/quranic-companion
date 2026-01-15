/**
 * SINGLE SOURCE OF TRUTH for due card logic.
 * 
 * A card is due if and only if:
 * - phase = "review"
 * - AND next_review_at <= now (full timestamp comparison)
 * 
 * Learning-phase cards are NEVER considered "due" for dashboard purposes.
 * They are handled within an active review session only.
 */

import { supabase } from '@/integrations/supabase/client';

export interface DueCardFilters {
  userId: string;
  /** If true, also includes learning-phase cards (for active review sessions only) */
  includeLearningSessions?: boolean;
}

/**
 * Fetches due cards from the database.
 * 
 * By default (includeLearningSessions = false):
 *   Only returns cards where phase = "review" AND next_review_at <= now
 * 
 * If includeLearningSessions = true:
 *   Returns ALL cards where next_review_at <= now (for active review sessions)
 */
export async function fetchDueCards({ userId, includeLearningSessions = false }: DueCardFilters) {
  const now = new Date().toISOString();
  
  let query = supabase
    .from('memorization_items')
    .select('*')
    .eq('user_id', userId)
    .lte('next_review_at', now)
    .order('next_review_at', { ascending: true });
  
  // For dashboard: only review-phase cards are "due"
  // For review session: include learning-phase cards too
  if (!includeLearningSessions) {
    query = query.eq('phase', 'review');
  }
  
  return query;
}

/**
 * Filters an array of items to only those that are due.
 * Use this when you already have items loaded.
 * 
 * By default (includeLearningSessions = false):
 *   Only returns cards where phase = "review" AND next_review_at <= now
 */
export function filterDueCards<T extends { phase: string; next_review_at: string }>(
  items: T[],
  includeLearningSessions = false
): T[] {
  const now = new Date().toISOString();
  
  return items.filter(item => {
    const isDue = item.next_review_at <= now;
    
    if (includeLearningSessions) {
      return isDue;
    }
    
    // Dashboard: only review-phase cards
    return item.phase === 'review' && isDue;
  });
}

/**
 * Counts due cards for dashboard display.
 * Only counts review-phase cards.
 */
export async function countDueCards(userId: string): Promise<number> {
  const now = new Date().toISOString();
  
  const { count, error } = await supabase
    .from('memorization_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('phase', 'review')
    .lte('next_review_at', now);
  
  if (error) {
    console.error('Error counting due cards:', error);
    return 0;
  }
  
  return count || 0;
}
