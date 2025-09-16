# Testing Guide

## Setting Up Test Authentication

Since the app uses Supabase authentication, you'll need to create test users. Here are a few options:

### Option 1: Create Test Users via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Click "Add user" and create test accounts:
   - `salesperson@test.com` / `password123`
   - `manager@test.com` / `password123`
   - `warehouse@test.com` / `password123`

### Option 2: Use the Sign Up Flow (if enabled)

1. Modify the login form to include a sign-up option
2. Create accounts through the app interface

### Option 3: Bypass Authentication for Testing

If you want to test the UI without authentication, you can temporarily modify the auth check.

## Quick Auth Bypass for UI Testing

If you just want to test the UI components without setting up full authentication, I can create a temporary bypass.

Would you like me to:

1. Help you set up Supabase authentication properly, or
2. Create a temporary auth bypass for UI testing?
