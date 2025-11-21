/**
 * Supabase Client Helper
 * 
 * Creates and exports a Supabase client instance for use in the Next.js frontend
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Supabase client instance for client-side operations
 * Use this for authenticated requests from the browser
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Database types (basic structure - extend as needed)
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          email: string | null;
          nin: string | null;
          nin_verified: boolean;
          nin_verified_at: string | null;
          dob: string | null;
          gender: string | null;
          address: string | null;
          photo_url: string | null;
          wallet_address: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          user_id: string | null;
          route_id: string | null;
          seat_number: string | null;
          ticket_type: string | null;
          qr_payload: string | null;
          status: string;
          blockchain_tx_hash: string | null;
          purchased_at: string;
          validated_at: string | null;
        };
      };
      routes: {
        Row: {
          id: string;
          origin: string;
          destination: string;
          vehicle_type: string;
          base_price: number;
          estimated_minutes: number | null;
          active: boolean;
          created_at: string;
        };
      };
      nin_verifications: {
        Row: {
          id: string;
          user_id: string;
          nin: string | null;
          request_payload: any;
          response_payload: any;
          success: boolean | null;
          created_at: string;
        };
      };
    };
  };
};

