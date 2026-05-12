# Peak Lift Supabase Setup

Project: `PeakLift`
Project ref: `qwqwctttggwesgqspgrp`
Project URL: `https://qwqwctttggwesgqspgrp.supabase.co`

Current public Auth settings checked from `auth/v1/settings`:

- Email sign-in: enabled
- Apple sign-in: disabled
- Google sign-in: disabled

Live configuration updated from the Supabase dashboard:

- PRD foundation migration applied successfully.
- Verified 10 PeakLift PRD tables exist in `public`.
- Verified 18 seeded exercises exist in `public.exercises`.
- Site URL changed from `http://localhost:3000` to `peaklift://auth-callback`.
- Redirect URL save was submitted for:
  - `peaklift://auth-callback`
  - `http://localhost:*/**`
  - `http://127.0.0.1:*/**`

The migration found duplicate `liljakey007` profile usernames in the live database, so duplicate usernames are now normalized before the unique username index is created.

Dashboard links:

- Project dashboard: https://supabase.com/dashboard/project/qwqwctttggwesgqspgrp
- Auth URL Configuration: https://supabase.com/dashboard/project/qwqwctttggwesgqspgrp/auth/url-configuration
- Auth Providers: https://supabase.com/dashboard/project/qwqwctttggwesgqspgrp/auth/providers
- Auth Email Templates: https://supabase.com/dashboard/project/qwqwctttggwesgqspgrp/auth/templates
- Security Advisor: https://supabase.com/dashboard/project/qwqwctttggwesgqspgrp/database/security-advisor

## Required Auth Configuration

Check these before testing a real App Store signup flow:

1. In Auth URL Configuration, keep Site URL away from `http://localhost:3000`. It is currently set to:

   ```text
   peaklift://auth-callback
   ```

2. In Auth URL Configuration, make sure this Redirect URL exists:

   ```text
   peaklift://auth-callback
   ```

3. Keep local web testing redirects only for development, such as:

   ```text
   http://localhost:*/**
   http://127.0.0.1:*/**
   ```

4. After the Vercel production deployment exists, add its production URL:

   ```text
   https://YOUR-VERCEL-PRODUCTION-DOMAIN/**
   ```

5. In Auth Providers, keep Email enabled and keep email confirmations enabled.
6. In Auth Providers or Auth password settings, enable leaked password protection.
7. In Auth Email Templates, use wording that says this is a Peak Lift confirmation email. If a custom template uses `{{ .SiteURL }}` for the confirmation destination, change it to use `{{ .RedirectTo }}` so mobile confirmation links can return to `peaklift://auth-callback`.

## Social Login

The app has Google and Apple buttons wired to Supabase OAuth. They will only work after provider credentials are configured in Supabase.

Until Google or Apple are enabled in Supabase, the app hides those buttons and only shows email/password sign-in.

Google:

- Add the Google Client ID and Client Secret in Supabase Auth Providers.
- Add this callback URL in Google Cloud:

  ```text
  https://qwqwctttggwesgqspgrp.supabase.co/auth/v1/callback
  ```

Apple:

- Configure Sign in with Apple for bundle id `fit.peaklift.app`.
- Add the Apple Services ID and client secret in Supabase Auth Providers.
- Add this callback URL in Apple Developer:

  ```text
  https://qwqwctttggwesgqspgrp.supabase.co/auth/v1/callback
  ```

## Current Advisor Status

Security Advisor currently reports:

- `delete_current_user()` is a SECURITY DEFINER function executable by signed-in users. This is intentional because the app needs a Delete Account button, but it should be reviewed again before submission.
- Leaked password protection is disabled and should be enabled in the Supabase dashboard.

Performance Advisor currently reports unused indexes. That is expected while the app has little or no production usage; keep the indexes until real usage data exists.

## PRD Foundation Migration

The PRD-aligned backend foundation is in:

```text
WebApp/supabase/migrations/20260511120000_peaklift_prd_foundation.sql
```

Apply it before wiring the next screens. It adds normalized infrastructure for:

- Exercise library and custom exercises
- Reusable workout templates
- Program builder tables and active programs
- Set-level workout logs
- Automatic personal record tracking from logged sets
- Follows
- Shared workouts/programs
- Profile privacy and training fields

This migration is additive. It keeps the older `routines`, `workout_logs`, likes, comments, and reports tables so the current app keeps working while the new PRD screens are built.

## Test After Configuration

1. Delete any old test account using the same email, or use a fresh test email.
2. Install/run the app from Xcode.
3. Create an account in Peak Lift.
4. Confirm that the app says to check for the Peak Lift confirmation email.
5. Open the new email and tap Confirm Your Signup.
6. Confirm iOS opens Peak Lift instead of a browser page at localhost.
7. Sign in with the confirmed email and password.

Old confirmation emails that already point to `localhost:3000` or show `otp_expired` cannot be repaired. Generate a fresh confirmation email after the URL settings above are saved.
