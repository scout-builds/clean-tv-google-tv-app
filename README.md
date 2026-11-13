# Clean TV — Google TV App

Standalone Google TV app for a TCL TV. Netflix-style home with library and player — separate from Kodi, installs side-by-side and leaves Kodi untouched.

Standalone Google TV app for a TCL TV — Netflix-style rows interface, library, player with resume, live Internet Archive search, in-app Real-Debrid login, subscription logins in one place, and an addon slot that installs from GitHub repo URLs. Installs side-by-side with Kodi (package app.cleantv.tv); Kodi stays untouched.

## Install the APK

Pushing to this repo runs the **Build APK** GitHub Actions workflow, which compiles the real APK in the cloud:

1. Open the **Actions** tab → latest run → download the APK artifact, or
2. Grab the APK attached to a **Release** (version tags like `v1.0.0` publish one automatically).

Sideload the APK to the TV with Downloader or Send Files to TV. The full interface also runs in any browser: open `app/src/main/assets/www/index.html`.

## Build locally instead

Open this folder in Android Studio → Build → Build APK(s), or run `gradle assembleDebug` (Gradle 8.7, JDK 17). Full details in `README-FIRST.txt`.
