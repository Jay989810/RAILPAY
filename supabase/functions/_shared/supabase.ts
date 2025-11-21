// Shared Supabase client for Edge Functions
// This file provides a reusable Supabase client instance for all Edge Functions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

/**
 * Creates a Supabase client for Edge Functions
 * Uses the service role key for admin operations
 * 
 * @param req - The request object containing headers
 * @returns Supabase client instance
 */
export function createSupabaseClient(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Gets the authenticated user from the Authorization header
 * 
 * @param req - The request object
 * @returns The user ID if authenticated, null otherwise
 */
export async function getAuthenticatedUser(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createSupabaseClient(req);
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }

  return user.id;
}

/**
 * CORS headers for Edge Functions
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

