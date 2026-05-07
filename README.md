# Peak Lift

This folder contains two deliverables:

- `WebApp/`: maintainable Vite + React app backed by Supabase Auth, Postgres, RLS, and Realtime.
- `iOS/`: native SwiftUI iOS wrapper project for App Store packaging.
- `VERCEL_SETUP.md`: Vercel deployment settings for the web app.

## Current App Store Path

Open `iOS/PeakLift.xcodeproj` in full Xcode, set the Apple Developer Team, then build/archive the `PeakLift` scheme.

The iOS target loads the bundled app from `Resources/WebApp` through a local `app://localhost` WebView scheme, so it does not depend on any old hosted web app at launch.

## Required Before Submission

- Set `DEVELOPMENT_TEAM` in Xcode signing settings.
- Confirm the bundle id `fit.peaklift.app` is registered in Apple Developer.
- Review App Store Guideline 4.2 risk. A web wrapper can be rejected if it does not provide enough native app value.
- Enable and verify Supabase email, Google, and Apple sign-in providers for the production project.
- In Supabase Auth URL Configuration, add `peaklift://auth-callback` to Redirect URLs for iOS confirmation emails and social sign-in callbacks.
- Keep Supabase Row Level Security enabled for all public tables and review Supabase security advisors before submission.
- Complete the exact Supabase dashboard settings in `SUPABASE_SETUP.md`; Codex can read advisors but the current connector cannot toggle Auth URL settings without an authenticated dashboard/API session.
- Complete the Vercel deployment settings in `VERCEL_SETUP.md` if deploying the web app or using a Vercel production URL for Supabase redirects.
- Fill out App Privacy details in App Store Connect based on Supabase Auth, Postgres, nutrition/workout logs, public routines, comments, reports, and profile data actually collected.
- Replace the bundled iOS web snapshot with a fresh `WebApp/dist` build before archiving.

## Local Web Commands

```sh
cd WebApp
npm install
npm run build
```

This shell has Node from the Codex app but no global `npm`. Use a normal Node/npm install locally, or install Node from nodejs.org/Homebrew before running the commands above.

Supabase configuration is read from `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Defaults are included for the connected `PeakLift` Supabase project, and `.env.example` documents the same values for local setup.
