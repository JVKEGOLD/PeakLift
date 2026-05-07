# Peak Lift Release Checklist

## GitHub

- Keep release work on a branch named `codex/...` or `release/...`.
- Open a pull request into `main` before shipping.
- Confirm the GitHub Actions validation workflow is passing.
- Keep generated folders out of commits unless they are required by the iOS bundle.

## Supabase

- Email auth enabled and tested.
- Apple and Google auth either enabled in Supabase or hidden in the app.
- Redirect URL includes `peaklift://auth-callback`.
- Row Level Security enabled for all public tables.
- Security advisors reviewed before release.

## Vercel

- Production project linked.
- Environment variables match `WebApp/.env.example`.
- Production deployment tested if the web build is published.

## Xcode

- Apple Developer Team selected.
- Bundle identifier `fit.peaklift.app` registered.
- App icon present.
- Privacy manifest reviewed.
- Archive build created from a clean web build.

## App Store Connect

- App Privacy completed based on actual data collected.
- Screenshots uploaded for required device sizes.
- Support URL and privacy policy URL configured.
- TestFlight build smoke-tested before App Review.
