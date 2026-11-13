Clean TV — Google TV App v1.0.0 — COMPLETE APP PACKAGE
============================================================

WHAT THIS IS
This zip is the whole app, not a spec stub:
  * assets/www/         the full TV interface (Netflix-style rows, D-pad
                        navigation, player, library, search) — real
                        HTML/CSS/JS that runs as-is in any browser too.
  * java/ AndroidManifest the Android TV (Leanback) shell that loads the
                        interface full-screen on the TCL Google TV.
  * build.gradle files  everything Android Studio / Gradle needs.

WHY IT IS A .ZIP AND NOT A .APK
An .apk has to be compiled and signed by the Android SDK. This console
has no Android SDK, so instead of faking a tiny "APK", it ships the
complete buildable project. One Gradle build turns it into the real,
sideloadable APK:

HOW TO GET THE .APK — OPTION A: GITHUB BUILDS IT FOR YOU (no computer)
  This package includes .github/workflows/build-apk.yml. Push these files
  to a GitHub repo (the APK Builder console's "Push to GitHub" button does
  exactly that) and GitHub Actions compiles the real APK in the cloud:
    1. Open the repo on github.com > Actions tab > latest run.
    2. Download the "Clean TV — Google TV App-apk" artifact, or grab the APK attached
       to the Release the workflow publishes.
    3. Sideload that .apk to the TV with Downloader or Send Files to TV.
  That release APK is the normal install path — same as any GitHub app.

HOW TO GET THE .APK — OPTION B: BUILD IT ON A COMPUTER
  1. Unzip this package on a computer.
  2. Open the folder in Android Studio and choose Build > Build APK(s),
     or from a terminal in the folder:  ./gradlew assembleDebug
  3. The APK lands in app/build/outputs/apk/debug/ — sideload it to the
     TV with Downloader or Send Files to TV.

NO COMPUTER HANDY? PREVIEW THE INTERFACE NOW
  Unzip and open app/src/main/assets/www/index.html in any browser —
  that is the exact interface the TV app shows. Arrow keys = D-pad,
  Enter = OK, Esc = Back.

ON THE TV
  * Settings > Accounts inside the app: paste YOUR Real-Debrid token.
  * Settings also holds your other subscription logins in one place.
  * Addons > paste a GitHub repo URL to install addons, Kodi-style.
  * Package name app.cleantv.tv is separate from Kodi (org.xbmc.kodi) —
    both apps install side-by-side; Kodi is untouched.

FEATURES IN THIS BUILD
  - Netflix-style interface
  - Library + built-in player
  - Real-Debrid login inside the app (your own account)
  - Addon slot — installs addons from a GitHub repo URL
  - Side-by-side with Kodi — Kodi stays untouched
  - A spot where I can add all of my logins for my other subscription services like Hulu, Disney, etc. that way they’re all in one player. The ones that can’t be played from that will just open up using the real debrid key / some kind of scraper

Built by APK Builder console · Build #3 · 2026-11-13T00:42:24.362Z
