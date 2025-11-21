# Troubleshooting Ticket Purchase Errors

## Error: "Unable to connect to the server"

If you're seeing this error when trying to purchase a ticket, follow these steps:

### 1. Check Edge Function Deployment

The `create-ticket` edge function must be deployed to Supabase. To deploy:

```bash
# Navigate to your project root
cd "C:\Users\DELL\Desktop\NEW VERSION RAILPAY"

# Deploy the edge function
supabase functions deploy create-ticket
```

Or deploy via Supabase Dashboard:
1. Go to Supabase Dashboard → Edge Functions
2. Click "Deploy" or "Create Function"
3. Select `create-ticket` function
4. Deploy

### 2. Check Environment Variables

Ensure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Check Browser Console

Open browser DevTools (F12) → Console tab and look for:
- Network errors
- CORS errors
- Authentication errors
- Detailed error messages

### 4. Verify Edge Function is Accessible

Test the edge function directly:

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/create-ticket \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"route_id":"test","ticket_type":"single"}'
```

### 5. Common Issues

**Issue: Edge function not found (404)**
- Solution: Deploy the edge function

**Issue: CORS error**
- Solution: Check `corsHeaders` in `_shared/supabase.ts`

**Issue: Authentication error (401)**
- Solution: Ensure user is logged in and session is valid

**Issue: Network timeout**
- Solution: Check internet connection and Supabase project status

### 6. Check Supabase Logs

1. Go to Supabase Dashboard → Logs → Edge Functions
2. Look for errors related to `create-ticket`
3. Check for authentication or database errors

### 7. Verify Database Setup

Ensure:
- Routes table has data
- Vehicles table has data
- User profile exists with NIN verified
- Wallet address is set in profile

### 8. Test with Console Logs

The code now includes console.log statements. Check browser console for:
- "Calling create-ticket edge function with params"
- "Edge function response"
- Any error details

