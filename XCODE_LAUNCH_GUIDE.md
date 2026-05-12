# Peak Lift Xcode Launch Guide

Use this when you want to open and run Peak Lift on your Mac in Xcode.

## 1. Open the Project

Open this file in Xcode:

```text
/Users/jakegold/.codex/worktrees/896c/Codex/PeakLift/iOS/PeakLift.xcodeproj
```

Fastest option from Terminal:

```sh
open /Users/jakegold/.codex/worktrees/896c/Codex/PeakLift/iOS/PeakLift.xcodeproj
```

## 2. Select the App

In the top bar of Xcode:

1. Select the scheme named `PeakLift`.
2. Select an iPhone simulator, such as `iPhone 16 Pro`.

## 3. Run It

Click the Run button in Xcode, or press:

```text
Command + R
```

The simulator should open and launch Peak Lift.

## 4. If the App Looks Outdated

The iOS app uses the built web app bundled inside:

```text
/Users/jakegold/.codex/worktrees/896c/Codex/PeakLift/iOS/PeakLift/Resources/WebApp
```

If recent web changes are not showing, rebuild the web app and refresh the iOS bundle:

```sh
cd /Users/jakegold/.codex/worktrees/896c/Codex/PeakLift/WebApp
npm run build
cd ..
rsync -a --delete WebApp/dist/ iOS/PeakLift/Resources/WebApp/
```

Then run the app again in Xcode.

## 5. If Signup Links Open the Browser

Supabase must include this redirect URL:

```text
peaklift://auth-callback
```

Old confirmation emails can still point to an old URL. Send a fresh confirmation email after Supabase redirect settings are updated.

