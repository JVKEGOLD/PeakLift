# Peak Lift Vercel Setup

The deployable Vercel project root is:

```text
/Users/jakegold/Movies/LAB/Codex/PeakLift/WebApp
```

## Project Settings

Use these settings in Vercel:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Install Command: `npm install`
- Output Directory: `dist`
- Root Directory: `PeakLift/WebApp` if this folder is deployed from a larger repository.

`WebApp/vercel.json` already contains the matching build settings and a single-page app rewrite so routes like `/dashboard`, `/settings`, and `/privacy` load correctly when opened directly.

## Environment Variables

Set these Vercel environment variables for Production, Preview, and Development:

```text
VITE_SUPABASE_URL=https://qwqwctttggwesgqspgrp.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_OXWeJ_vTwPcbHpFBVbql4g_eoYoBkHT
```

For the web deployment, set this after the first Vercel production URL exists:

```text
VITE_AUTH_REDIRECT_URL=https://YOUR-VERCEL-PRODUCTION-DOMAIN
```

The iOS app uses `peaklift://auth-callback` internally, so keep that value configured in Supabase Redirect URLs too.

## Supabase URL Configuration

After Vercel gives the production domain, update Supabase Auth URL Configuration:

- Site URL: the final Vercel production URL or custom domain.
- Redirect URLs:
  - `peaklift://auth-callback`
  - `https://YOUR-VERCEL-PRODUCTION-DOMAIN/**`
  - any temporary preview URLs you actively test.

## Local Commands

From `WebApp`:

```sh
npm install
npm run build
```

The local build should finish before any production deployment.
