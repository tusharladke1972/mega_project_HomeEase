import { supabase } from '@/integrations/supabase/client';

let cachedUserId: string | null = null;
let cachedProviderId: string | null = null;

/** Reuse provider id within the session to avoid repeat lookups on every poll. */
export async function getProviderIdForUser(userId: string): Promise<string | null> {
  if (cachedUserId === userId && cachedProviderId) {
    return cachedProviderId;
  }

  const { data, error } = await supabase
    .from('service_providers')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  cachedUserId = userId;
  cachedProviderId = data?.id ?? null;
  return cachedProviderId;
}

export function clearProviderCache() {
  cachedUserId = null;
  cachedProviderId = null;
}
