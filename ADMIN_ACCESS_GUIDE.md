# Admin Access Guide

This guide explains how to access the admin panel and use its features.

## How to Access Admin Page

### Option 1: Set User Role to Admin (Recommended)

1. **Using Supabase Dashboard:**
   - Go to your Supabase project dashboard
   - Navigate to the `profiles` table
   - Find the user you want to make an admin
   - Update the `role` field to `'admin'`
   - Save the changes

2. **Using SQL in Supabase:**
   ```sql
   UPDATE profiles
   SET role = 'admin'
   WHERE email = 'your-email@example.com';
   ```

### Option 2: Add User to Staff Table

1. **Using Supabase Dashboard:**
   - Go to the `staff` table
   - Click "Insert" to add a new row
   - Set `user_id` to the user's ID (from `auth.users` or `profiles` table)
   - Set `role` to any value (e.g., 'admin', 'manager')
   - Optionally set `station` if applicable
   - Save

2. **Using SQL:**
   
   First, get your user information:
   ```sql
   SELECT id, email, full_name 
   FROM profiles 
   WHERE id = 'a55e3419-9658-43bd-8c3a-196513feb30c';
   ```
   
   Then insert into staff with all required fields:
   ```sql
   INSERT INTO staff (user_id, full_name, email, role, station_name)
   VALUES (
     'a55e3419-9658-43bd-8c3a-196513feb30c',
     'Your Full Name',  -- Replace with your actual name from profiles
     'your-email@example.com',  -- Replace with your actual email from profiles
     'admin',
     NULL
   );
   ```
   
   **Or use a single query that gets the data automatically:**
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
   
   **Note:** The `staff` table requires `full_name`, `email`, and `role` fields (they are NOT NULL). The column for station is `station_name`, not `station`.

### Accessing the Admin Panel

Once you have admin privileges:

1. **Log in** to your account at `/auth/login`
2. **Navigate** to `/admin` in your browser
3. The admin layout will verify your admin status and grant access

**Note:** If you're not an admin, you'll be redirected to `/dashboard`

## Admin Features

### 1. **Dashboard Overview** (`/admin`)
   - View total revenue, tickets, routes, and passes
   - See recent payments
   - View detailed ticket and pass statistics
   - Breakdown by status and type

### 2. **Scan Tickets** (`/admin/scan`)
   - Scan QR codes from tickets using your device camera
   - View full ticket details including:
     - User information (name, email, photo)
     - Route details (origin, destination)
     - Ticket status (active, used)
     - Seat number and ticket type
     - Validation timestamp
   - Validate ticket authenticity in real-time

### 3. **User Management** (`/admin/users`)
   - View all registered users
   - Search users by name, email, phone, or NIN
   - View detailed user profiles including:
     - Personal information
     - NIN verification status
     - User role
     - All tickets purchased by the user
     - All passes purchased by the user
   - See user activity and purchase history

### 4. **Fare Management** (`/admin/fares`)
   - View all routes and their current prices
   - Edit ticket prices for any route
   - Update base prices instantly
   - See vehicle types for each route

### 5. **Revenue** (`/admin/revenue`)
   - View revenue statistics
   - See breakdown by tickets and passes
   - View recent payment transactions

### 6. **Routes** (`/admin/routes`)
   - Manage all train routes
   - Add, edit, or delete routes
   - Set route details (origin, destination, vehicle type)

### 7. **Staff Management** (`/admin/staff`)
   - View and manage staff members
   - Assign staff to stations
   - Manage staff roles

### 8. **Device Management** (`/admin/devices`)
   - Register NFC/QR scanning devices
   - Assign devices to stations
   - Monitor device status

## Key Admin Capabilities

✅ **Scan Tickets**: Use the QR scanner to validate tickets and see full details  
✅ **View User Profiles**: Access complete user information and purchase history  
✅ **Change Ticket Prices**: Update route fares from the Fares page  
✅ **View Statistics**: See totals of tickets purchased and passes  
✅ **Monitor Revenue**: Track all payments and revenue streams  
✅ **Manage System**: Control routes, staff, and devices  

## Security Notes

- Admin access is protected by role-based authentication
- Only users with `role = 'admin'` in profiles or entries in the `staff` table can access admin pages
- All admin API functions verify admin status before executing
- Admin pages automatically redirect non-admin users to the dashboard

## Troubleshooting

**Can't access admin page?**
- Verify your user has `role = 'admin'` in the `profiles` table OR
- Verify your user ID exists in the `staff` table
- Make sure you're logged in
- Clear browser cache and try again

**Scanner not working?**
- Ensure camera permissions are granted
- Use HTTPS (required for camera access)
- Try a different browser (Chrome/Firefox recommended)

**Can't see user data?**
- Verify you're accessing `/admin/users` (not `/dashboard/users`)
- Check that the user has made purchases (tickets/passes)
- Ensure database connections are working

