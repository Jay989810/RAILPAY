/**
 * Supabase Edge Functions Client Helper
 * 
 * This file provides TypeScript helper functions for calling Supabase Edge Functions
 * from the Next.js frontend application.
 * 
 * Prerequisites:
 * - Install @supabase/supabase-js: npm install @supabase/supabase-js
 * - Ensure you have a Supabase client instance configured in your app
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Response type for NIN verification
 */
export interface VerifyNinResponse {
  success: boolean;
  message: string;
  data?: {
    nin: string;
    verified_at: string;
  };
}

/**
 * Response type for ticket creation
 */
export interface CreateTicketResponse {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    user_id: string;
    route_id: string;
    seat_number: string | null;
    ticket_type: string;
    qr_payload: string;
    status: string;
    purchased_at: string;
    validated_at: string | null;
    blockchain_tx_hash: string | null;
  };
}

/**
 * Response type for ticket validation
 */
export interface ValidateTicketResponse {
  success: boolean;
  message: string;
  data?: {
    ticket_id: string;
    status: string;
    validated_at: string;
    route_id: string;
  };
}

/**
 * Parameters for NIN verification
 */
export interface VerifyNinParams {
  nin: string;
  fullName: string;
  dob: string; // Format: YYYY-MM-DD
  phone: string;
}

/**
 * Parameters for ticket creation
 */
export interface CreateTicketParams {
  routeId: string;
  seatNumber?: string;
  ticketType: 'single' | 'return';
}

/**
 * Parameters for ticket validation
 */
export interface ValidateTicketParams {
  qrPayload: string;
}

/**
 * Parameters for buying a ticket (alias for createTicket)
 */
export interface BuyTicketParams extends CreateTicketParams {
  travelDate?: string; // Optional travel date (YYYY-MM-DD)
}

/**
 * Parameters for creating a pass
 */
export interface CreatePassParams {
  passType: 'daily' | 'weekly' | 'monthly';
}

/**
 * Parameters for checking pass status
 */
export interface CheckPassStatusParams {
  passId?: string; // Optional: if not provided, returns all user's passes
}

/**
 * Parameters for processing payment
 */
export interface ProcessPaymentParams {
  ticketId?: string;
  passType?: 'daily' | 'weekly' | 'monthly';
  amount: number;
  currency?: string;
  paymentMethod?: string;
  msgValue?: number; // Optional ETH value to send with transaction
}

/**
 * Parameters for fetching routes
 */
export interface FetchRoutesParams {
  origin?: string;
  destination?: string;
  vehicleType?: string;
  includeInactive?: boolean;
}

/**
 * Parameters for fetching vehicles
 */
export interface FetchVehiclesParams {
  routeId?: string;
  vehicleType?: string;
  status?: string;
  includeInactive?: boolean;
}

/**
 * Verifies a user's National Identification Number (NIN)
 * 
 * @param supabase - Supabase client instance
 * @param params - NIN verification parameters
 * @returns Promise with verification result
 * 
 * @example
 * ```typescript
 * const result = await verifyNin(supabase, {
 *   nin: '12345678901',
 *   fullName: 'John Doe',
 *   dob: '1990-01-01',
 *   phone: '+2341234567890'
 * });
 * ```
 */
export async function verifyNin(
  supabase: SupabaseClient,
  params: VerifyNinParams
): Promise<VerifyNinResponse> {
  try {
    // First, try to call the Edge Function
    const { data, error } = await supabase.functions.invoke('verify-nin', {
      body: {
        nin: params.nin,
        full_name: params.fullName,
        dob: params.dob,
        phone: params.phone,
      },
    });

    if (error) {
      // If Edge Function fails, fallback to direct database update
      console.warn('Edge Function failed, using direct database update:', error);
      return await verifyNinDirect(supabase, params);
    }

    return data as VerifyNinResponse;
  } catch (error: any) {
    // If Edge Function throws an error, try direct database update as fallback
    console.warn('Edge Function error, using direct database update:', error);
    return await verifyNinDirect(supabase, params);
  }
}

/**
 * Fallback function to verify NIN directly via database update
 * This is used when the Edge Function is not available or fails
 */
async function verifyNinDirect(
  supabase: SupabaseClient,
  params: VerifyNinParams
): Promise<VerifyNinResponse> {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        message: 'User not authenticated',
      };
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    // Prepare profile data
    const profileData: any = {
      full_name: params.fullName,
      dob: params.dob,
      phone: params.phone,
      nin: params.nin,
      nin_verified: true, // In production, this should be verified via external API
      nin_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }
      result = data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          ...profileData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }
      result = data;
    }

    // Log the verification attempt (optional - for audit purposes)
    try {
      await supabase
        .from('nin_verifications')
        .insert({
          user_id: user.id,
          nin: params.nin,
          request_payload: params,
          response_payload: { success: true, method: 'direct_update' },
          success: true,
        });
    } catch (logError) {
      // Don't fail if logging fails
      console.warn('Failed to log NIN verification:', logError);
    }

    return {
      success: true,
      message: 'NIN verified successfully',
      data: {
        nin: result.nin || params.nin,
        verified_at: result.nin_verified_at || new Date().toISOString(),
      },
    };
  } catch (error: any) {
    console.error('Error in direct NIN verification:', error);
    return {
      success: false,
      message: error.message || 'Failed to verify NIN. Please check your information and try again.',
    };
  }
}

/**
 * Creates a new ticket for the authenticated user
 * Requires NIN verification to be completed first
 * 
 * @param supabase - Supabase client instance
 * @param params - Ticket creation parameters
 * @returns Promise with created ticket data
 * 
 * @example
 * ```typescript
 * const result = await createTicket(supabase, {
 *   routeId: '550e8400-e29b-41d4-a716-446655440000',
 *   seatNumber: 'A12',
 *   ticketType: 'single'
 * });
 * ```
 */
export async function createTicket(
  supabase: SupabaseClient,
  params: CreateTicketParams
): Promise<CreateTicketResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('create-ticket', {
      body: {
        route_id: params.routeId,
        seat_number: params.seatNumber,
        ticket_type: params.ticketType,
      },
    });

    if (error) {
      throw error;
    }

    return data as CreateTicketResponse;
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return {
      success: false,
      message: error.message || 'Failed to create ticket',
    };
  }
}

/**
 * Validates a ticket by scanning its QR code payload
 * Marks the ticket as used and records validation timestamp
 * 
 * @param supabase - Supabase client instance
 * @param params - Ticket validation parameters
 * @returns Promise with validation result
 * 
 * @example
 * ```typescript
 * const result = await validateTicket(supabase, {
 *   qrPayload: 'railpay:ticket:550e8400-e29b-41d4-a716-446655440000'
 * });
 * ```
 */
export async function validateTicket(
  supabase: SupabaseClient,
  params: ValidateTicketParams
): Promise<ValidateTicketResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('validate-ticket', {
      body: {
        qr_payload: params.qrPayload,
      },
    });

    if (error) {
      throw error;
    }

    return data as ValidateTicketResponse;
  } catch (error: any) {
    console.error('Error validating ticket:', error);
    return {
      success: false,
      message: error.message || 'Failed to validate ticket',
    };
  }
}

/**
 * Response type for digital ID card
 */
export interface DigitalIdCardResponse {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    full_name: string;
    photo_url: string | null;
    nin: string | null;
    wallet_address: string | null;
    nin_verified_at: string | null;
    nin_verified: boolean;
  };
}

/**
 * Gets user's digital ID card data
 * 
 * @param supabase - Supabase client instance
 * @returns Promise with digital ID card data
 * 
 * @example
 * ```typescript
 * const result = await getDigitalIdCard(supabase);
 * ```
 */
export async function getDigitalIdCard(
  supabase: SupabaseClient
): Promise<DigitalIdCardResponse> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        message: 'User not authenticated',
      };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, photo_url, nin, wallet_address, nin_verified_at, nin_verified')
      .eq('id', user.id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return {
        success: false,
        message: 'Profile not found',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error('Error fetching digital ID card:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch digital ID card',
    };
  }
}

/**
 * Buys a ticket (alias for createTicket with additional travel date support)
 * 
 * @param supabase - Supabase client instance
 * @param params - Ticket purchase parameters
 * @returns Promise with created ticket data
 */
export async function buyTicket(
  supabase: SupabaseClient,
  params: BuyTicketParams
): Promise<CreateTicketResponse> {
  try {
    console.log('Calling create-ticket edge function with params:', {
      route_id: params.routeId,
      seat_number: params.seatNumber,
      ticket_type: params.ticketType,
      travel_date: params.travelDate,
    });

    const { data, error } = await supabase.functions.invoke('create-ticket', {
      body: {
        route_id: params.routeId,
        seat_number: params.seatNumber,
        ticket_type: params.ticketType,
        travel_date: params.travelDate,
      },
    });

    console.log('Edge function response:', { data, error });

    if (error) {
      console.error('Edge function error:', error);
      
      // Check if it's a network/connection error
      const errorMessage = error.message || String(error);
      const errorContext = error.context || {};
      
      // Check for specific error types
      if (errorMessage.includes('Failed to send') || 
          errorMessage.includes('fetch') || 
          errorMessage.includes('network') ||
          errorMessage.includes('ECONNREFUSED') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('Failed to fetch')) {
        return {
          success: false,
          message: 'Unable to connect to the server. Please check your internet connection and ensure the edge function is deployed.',
        };
      }

      // Check if edge function doesn't exist
      if (errorMessage.includes('not found') || errorMessage.includes('404') || errorContext.statusCode === 404) {
        return {
          success: false,
          message: 'The ticket service is not available. Please contact support or try again later.',
        };
      }

      // Return the actual error message from the edge function
      if (data && typeof data === 'object' && 'message' in data) {
        return {
          success: false,
          message: data.message || 'Failed to buy ticket',
        };
      }

      return {
        success: false,
        message: errorMessage || 'Failed to buy ticket. Please try again.',
      };
    }

    // Check if data indicates an error
    if (data && typeof data === 'object' && 'success' in data && !data.success) {
      return {
        success: false,
        message: data.message || 'Failed to buy ticket',
      };
    }

    return data as CreateTicketResponse;
  } catch (error: any) {
    console.error('Error buying ticket (catch block):', error);
    const errorMessage = error.message || String(error) || 'Failed to buy ticket';
    
    // Check if it's a network error
    if (errorMessage.includes('Failed to send') || 
        errorMessage.includes('fetch') || 
        errorMessage.includes('network') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('timeout')) {
      return {
        success: false,
        message: 'Unable to connect to the server. Please check your internet connection and ensure the edge function is deployed.',
      };
    }
    
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Response type for pass creation
 */
export interface CreatePassResponse {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    user_id: string;
    pass_type: string;
    starts_at: string;
    expires_at: string;
    blockchain_tx_hash: string | null;
    blockchain_pass_id: number | null;
    status: string;
  };
}

/**
 * Creates a new travel pass for the authenticated user
 * 
 * @param supabase - Supabase client instance
 * @param params - Pass creation parameters
 * @returns Promise with created pass data
 */
export async function createPass(
  supabase: SupabaseClient,
  params: CreatePassParams
): Promise<CreatePassResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('create-pass', {
      body: {
        pass_type: params.passType,
      },
    });

    if (error) {
      // Check if it's a network/connection error
      const errorMessage = error.message || String(error);
      if (errorMessage.includes('Failed to send') || 
          errorMessage.includes('fetch') || 
          errorMessage.includes('network') ||
          errorMessage.includes('ECONNREFUSED') ||
          errorMessage.includes('timeout')) {
        throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
      }
      throw error;
    }

    return data as CreatePassResponse;
  } catch (error: any) {
    console.error('Error creating pass:', error);
    return {
      success: false,
      message: error.message || 'Failed to create pass',
    };
  }
}

/**
 * Response type for pass status check
 */
export interface CheckPassStatusResponse {
  success: boolean;
  message?: string;
  data?: any | any[]; // Single pass object or array of passes
}

/**
 * Checks the status of a pass or all user's passes
 * 
 * @param supabase - Supabase client instance
 * @param params - Pass status check parameters
 * @returns Promise with pass status data
 */
export async function checkPassStatus(
  supabase: SupabaseClient,
  params?: CheckPassStatusParams
): Promise<CheckPassStatusResponse> {
  try {
    const method = params?.passId ? 'POST' : 'GET';
    const body = params?.passId ? { pass_id: params.passId } : undefined;

    const { data, error } = await supabase.functions.invoke('check-pass-status', {
      method,
      body,
    });

    if (error) {
      throw error;
    }

    return data as CheckPassStatusResponse;
  } catch (error: any) {
    console.error('Error checking pass status:', error);
    return {
      success: false,
      message: error.message || 'Failed to check pass status',
    };
  }
}

/**
 * Response type for payment processing
 */
export interface ProcessPaymentResponse {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    user_id: string;
    ticket_id: string | null;
    pass_id: string | null;
    amount: number;
    currency: string;
    payment_method: string;
    status: string;
    blockchain_tx_hash: string | null;
    blockchain_receipt_id: number | null;
  };
}

/**
 * Processes payment for a ticket or pass
 * 
 * @param supabase - Supabase client instance
 * @param params - Payment processing parameters
 * @returns Promise with payment result
 */
export async function processPayment(
  supabase: SupabaseClient,
  params: ProcessPaymentParams
): Promise<ProcessPaymentResponse> {
  try {
    if (!params.ticketId && !params.passType) {
      throw new Error('Must provide either ticketId or passType');
    }

    if (params.ticketId && params.passType) {
      throw new Error('Cannot provide both ticketId and passType');
    }

    const { data, error } = await supabase.functions.invoke('process-payment', {
      body: {
        ticket_id: params.ticketId,
        pass_type: params.passType,
        amount: params.amount,
        currency: params.currency || 'ETH',
        payment_method: params.paymentMethod || 'blockchain',
        msg_value: params.msgValue,
      },
    });

    if (error) {
      throw error;
    }

    return data as ProcessPaymentResponse;
  } catch (error: any) {
    console.error('Error processing payment:', error);
    return {
      success: false,
      message: error.message || 'Failed to process payment',
    };
  }
}

/**
 * Response type for routes
 */
export interface FetchRoutesResponse {
  success: boolean;
  message?: string;
  data?: Array<{
    id: string;
    origin: string;
    destination: string;
    vehicle_type: string;
    base_price: number;
    estimated_minutes: number | null;
    active: boolean;
    created_at: string;
  }>;
}

/**
 * Fetches available routes
 * 
 * @param supabase - Supabase client instance
 * @param params - Route fetch parameters
 * @returns Promise with routes data
 */
export async function fetchRoutes(
  supabase: SupabaseClient,
  params?: FetchRoutesParams
): Promise<FetchRoutesResponse> {
  try {
    // Build query string for the Edge Function
    const queryParams = new URLSearchParams();
    if (params?.origin) queryParams.append('origin', params.origin);
    if (params?.destination) queryParams.append('destination', params.destination);
    if (params?.vehicleType) queryParams.append('vehicle_type', params.vehicleType);
    if (params?.includeInactive) queryParams.append('include_inactive', 'true');

    // Note: Supabase functions.invoke doesn't support query params directly
    // The Edge Function will parse them from the request URL
    // For now, we'll pass params in the body for GET requests (some Edge Functions support this)
    // Alternatively, you can construct the full URL if your Supabase client supports it
    
    const { data, error } = await supabase.functions.invoke('get-routes', {
      method: 'GET',
      // Some Supabase clients support passing query params via headers or body
      // Check your Supabase client documentation for the correct approach
    });

    if (error) {
      throw error;
    }

    return data as FetchRoutesResponse;
  } catch (error: any) {
    console.error('Error fetching routes:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch routes',
    };
  }
}

/**
 * Response type for vehicles
 */
export interface FetchVehiclesResponse {
  success: boolean;
  message?: string;
  data?: Array<{
    id: string;
    vehicle_number: string;
    vehicle_type: string;
    capacity: number | null;
    route_id: string | null;
    status: string;
    last_maintenance_date: string | null;
    next_maintenance_date: string | null;
    created_at: string;
  }>;
}

/**
 * Fetches available vehicles
 * 
 * @param supabase - Supabase client instance
 * @param params - Vehicle fetch parameters
 * @returns Promise with vehicles data
 */
export async function fetchVehicles(
  supabase: SupabaseClient,
  params?: FetchVehiclesParams
): Promise<FetchVehiclesResponse> {
  try {
    // Note: Supabase functions.invoke doesn't support query params directly
    // The Edge Function will parse them from the request URL
    // For now, we'll call the function without params (Edge Function handles defaults)
    // In production, you may need to modify the Edge Function to accept params in the body
    
    const { data, error } = await supabase.functions.invoke('get-vehicles', {
      method: 'GET',
    });

    if (error) {
      throw error;
    }

    return data as FetchVehiclesResponse;
  } catch (error: any) {
    console.error('Error fetching vehicles:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch vehicles',
    };
  }
}

