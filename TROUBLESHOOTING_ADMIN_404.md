# Troubleshooting Admin 404 Error

## Quick Fixes

### 1. Restart Your Dev Server
The most common cause of 404 errors after adding new files is that the dev server needs to be restarted.

**Steps:**
1. Stop your current dev server (Ctrl+C in the terminal)
2. Clear Next.js cache:
   ```bash
   rm -rf .next
   # Or on Windows PowerShell:
   Remove-Item -Recurse -Force .next
   ```
3. Restart the dev server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

### 2. Verify Admin Access
Make sure you've set yourself as admin:

**Option A: Update Profile Role (Easiest)**
```sql
UPDATE profiles
SET role = 'admin'
WHERE id = 'a55e3419-9658-43bd-8c3a-196513feb30c';
```

**Option B: Add to Staff Table**
```sql
INSERT INTO staff (user_id, full_name, email, role, station_name)
SELECT 
  id,
  COALESCE(full_name, 'Admin User'),
  email,
  'admin',
  NULL
FROM profiles
WHERE id = 'a55e3419-9658-43bd-8c3a-196513feb30c';
```

### 3. Check Authentication
- Make sure you're logged in at `/auth/login`
- Verify your user ID matches the one in the SQL query
- Check browser console for any errors

### 4. Verify Files Exist
All these files should exist:
- ✅ `app/admin/page.tsx` - Main admin dashboard
- ✅ `app/admin/layout.tsx` - Admin layout wrapper
- ✅ `app/admin/users/page.tsx` - User management
- ✅ `app/admin/scan/page.tsx` - Ticket scanner
- ✅ `app/admin/fares/page.tsx` - Fare management

### 5. Check Browser Console
Open browser DevTools (F12) and check:
- Console tab for JavaScript errors
- Network tab to see if the request is being made
- Check what URL is actually being requested

### 6. Try Direct URL
Try accessing these URLs directly:
- `http://localhost:3000/admin` - Should show admin dashboard
- `http://localhost:3000/admin/users` - Should show users page
- `http://localhost:3000/admin/scan` - Should show scanner

## Common Issues

### Issue: "Page Not Found" even after restart
**Solution:** Check if you're logged in. The admin layout redirects non-authenticated users to `/auth/login`.

### Issue: Redirected to `/dashboard` instead of showing admin page
**Solution:** You don't have admin privileges. Run the SQL query above to grant yourself admin access.

### Issue: Files exist but still 404
**Solution:** 
1. Check for TypeScript/compilation errors in terminal
2. Verify all imports are correct
3. Make sure `'use client'` directive is at the top of client components

## Verifying Admin Status

Run this query to check if you have admin access:
```sql
-- Check profile role
SELECT id, email, role 
FROM profiles 
WHERE id = 'a55e3419-9658-43bd-8c3a-196513feb30c';

-- Check staff table
SELECT * 
FROM staff 
WHERE user_id = 'a55e3419-9658-43bd-8c3a-196513feb30c';
```

## Still Not Working?

1. **Check terminal output** - Look for build errors or warnings
2. **Clear all caches:**
   ```bash
   # Remove .next folder
   rm -rf .next
   
   # Clear node_modules and reinstall (if needed)
   rm -rf node_modules
   npm install
   ```
3. **Check Next.js version** - Make sure you're using a compatible version
4. **Verify route structure** - Ensure the `app` directory structure is correct

