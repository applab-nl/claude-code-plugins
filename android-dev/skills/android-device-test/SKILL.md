---
name: android-device-test
description: Build, install and test an Android app on a physical phone or emulator over adb, and on Android Auto via the Desktop Head Unit (DHU). Covers picking the right device, waiting for a phone to reconnect, logcat capture that survives the cable dropping, driving the UI without screenshots, ANR/crash diagnosis, checking whether a symbol made it into the installed APK, and the DHU start-up sequence. Use when the user says "install it on my phone", "build a preview and install it", "test it on the device/emulator", "phone is (re)connected", "test in Android Auto / the head unit", "capture the logs while I reproduce", or a device check is part of shipping an Android or KMP app.
---

# Android device test

The build → install → exercise → read logs loop on a real device, with the recipes that are known to work and the traps that cost round-trips before.

Helper scripts are in `scripts/`, relative to this skill's base directory. Call them by absolute path.

| Script | Does |
|---|---|
| `wait-device.sh [serial] [timeout]` | blocks until the phone is attached and authorized; says so when the USB-debugging prompt is pending |
| `capture-logs.sh <serial> <out> [filter…]` | logcat to a file that re-attaches by itself after a replug |
| `ui.py texts \| tap "<text>" \| wait "<text>" [s] \| shot <name>` | UI driving via `uiautomator`; honours `ANDROID_SERIAL` |
| `dex-has-symbol.sh <serial> <pkg\|apk> <symbol>` | whether the installed build contains a class or string |
| `dhu.sh start <serial> <log> \| stop` | Android Auto head unit with the stdin fix |

## 0. Project specifics first

Read the project's own device notes before using the defaults here: a project skill such as `deploy-preview`, `ship-it` or `deploy-release`, and the Android section of `CLAUDE.md`. They name the package, the variant to install (e.g. a `preview` flavor that must never be replaced by debug or release), the preferred device serial and the deploy script. When a project script exists (e.g. `scripts/deploy-preview.sh`), use it instead of raw Gradle.

## 1. Pick the device

```bash
adb devices -l
```

`adb` lives in `$ANDROID_HOME/platform-tools` (`~/Library/Android/sdk` on macOS) if it isn't on PATH.

- With more than one device attached (typically phone + `emulator-5554`), **always** pass the serial: `adb -s <serial> …` for adb, and `ANDROID_SERIAL=<serial> ./gradlew …` for Gradle. Export `ANDROID_SERIAL` for `ui.py`.
- No phone attached → run `wait-device.sh` in the background and tell the user once what to do: plug in, unlock, accept the USB-debugging prompt. Don't ask them to tell you when it's connected, because the script notices.
- `adb kill-server` doesn't bring back a phone that dropped; it's physical (cable, sleep, lock). Wake a sleeping phone with `adb -s <serial> shell input keyevent KEYCODE_WAKEUP`.
- Wrap one-off diagnostics in `timeout 15 adb …`. A missing device otherwise hangs on "waiting for device".

**Emulator**:
- Start it: `nohup $ANDROID_HOME/emulator/emulator -avd <avd> -no-snapshot-save -no-boot-anim > <log> 2>&1 &`.
- Wait for boot: `until [ "$(adb -s emulator-5554 shell getprop sys.boot_completed | tr -d '\r')" = 1 ]; do sleep 3; done`.
- Stop it: `adb -s emulator-5554 emu kill`.
- An emulator that has been up for a day gets slow; a cold start can exceed 30 s and instrumentation gives up at about 20 s. Reboot it before you suspect the code. If an AVD shows the package in `pm list packages` but `am start` says the activity doesn't exist, the image is broken: use another AVD.

## 2. Build and install

```bash
./gradlew :app:assembleDebug > <log> 2>&1; echo EXIT=$?; grep -E '^e: |What went wrong|BUILD' <log>
adb -s <serial> install -r <apk>
adb -s <serial> shell am start -W -n <pkg>/<launch activity>      # or: monkey -p <pkg> -c android.intent.category.LAUNCHER 1
```

- **Never pipe Gradle into `head`/`tail`.** That hides the exit code. Redirect to a file, echo the exit code, then grep.
- Always `install -r`. Never uninstall a variant that holds the user's real data.
- Pre-grant runtime permissions so dialogs don't block a test: `adb -s <serial> shell pm grant <pkg> android.permission.POST_NOTIFICATIONS` (and whatever the change needs). Verify with `dumpsys package <pkg> | grep '<PERM>: granted'`.
- Instrumented tests: `ANDROID_SERIAL=<serial> ./gradlew :app:connectedDebugAndroidTest`. Read the results with `grep -hoE 'tests="[0-9]+"|failures="[0-9]+"|errors="[0-9]+"' app/build/outputs/androidTest-results/connected/debug/*.xml | sort -u`. Gradle uninstalls the app afterwards, so reinstall before manual checks.

## 3. Capture logs

For anything the user reproduces by hand, start the capture **before** giving them the steps:

```bash
<skill>/scripts/capture-logs.sh <serial> <scratchpad>/device.log -s MyTag:V AndroidRuntime:E   # Bash run_in_background
```

Then give the user a short numbered list of what to do on the phone. Grep the file afterwards. Don't stream it into context. Stop it with `pkill -f capture-logs.sh`.

One-shot reads:
- Recent errors for the app: `adb -s <serial> logcat -d --pid=$(adb -s <serial> shell pidof <pkg> | tr -d '\r') | grep -E ' [WE] |Caused by'`. If `pidof` is empty, the app isn't running.
- Crashes: `logcat -d -b crash`. **ANRs don't show up there**; use `logcat -d | grep -E 'ANR in <pkg>|Reason:|Killing'`. `/data/anr/` is unreadable on production images, even after `adb root`; don't try.
- Start-up slowness: `am start -W` (`TotalTime`), then `adb shell uptime` and `top -b -n 1 -m 6` for load.
- Playback state: `dumpsys media_session | grep -m1 'state=PlaybackState'`. Notifications: `dumpsys notification --noredact`.

Write logs to the session scratchpad, not `/tmp`, which may be denied.

## 4. Drive the UI

Use `ui.py`, not screenshots, to read and click: it's text, so it's cheap and exact.

```bash
export ANDROID_SERIAL=<serial>
ui.py texts                 # what's on screen
ui.py tap "Settings"        # exact text/desc match first, then substring
ui.py wait "Now playing" 20
ui.py shot after-fix        # only when the user needs to see it
```

- `screencap` is **black** on `FLAG_SECURE` screens such as lock or unlock gates; `uiautomator` still reads them.
- Media keys: `input keyevent KEYCODE_MEDIA_NEXT|KEYCODE_MEDIA_PREVIOUS|KEYCODE_MEDIA_PLAY_PAUSE`.

## 5. Is my change in the installed build?

When behaviour suggests stale code, check before debugging further:

```bash
<skill>/scripts/dex-has-symbol.sh <serial> <pkg> 'com/example/MyNewClass'
```

It scans **every** `classes*.dex`; a large app has 20+. Don't use `strings | grep` or plain BSD `grep`, which report "not found" for symbols that are there.

## 6. Android Auto (Desktop Head Unit)

One-time setup: install the DHU from the SDK Manager package `extras;google;auto`. On the phone, enable Android Auto developer mode: Settings → Connected devices → Android Auto, then tap *Version* about 10 times.

Each session:
1. **The user**, with the phone **unlocked and screen on**, opens Android Auto settings → ⋮ → **Start head unit server**. Ask for this in one message, together with step 4's checklist if you already know it.
2. Start the head unit (Bash `run_in_background`): `<skill>/scripts/dhu.sh start <serial> <scratchpad>/dhu.log`. It sets up `adb forward tcp:5277` and feeds the DHU a live stdin. Without one it prints "connected." and exits immediately.
3. Confirm the connection in the log: look for `SSL negotiation finished successfully` and no `disconnect` line within about 10 s.
4. Give the user the checks to do in the DHU window, derived from the change.

Failure modes:
- **"Waiting for phone…"**: the head unit server is stuck from an earlier attempt. Have the user stop and restart it with the phone unlocked, then `dhu.sh stop` and start again.
- **Handshake succeeds, then "Failed to read from transport - disconnect"**: the phone was locked, or showed a first-connect consent screen. Have the user unlock it, accept any prompt and restart the server, then start again.
- The "Could not load headunit.ini" warning is harmless. Exit code 144 after `dhu.sh stop` is just the kill signal.

Stop with `dhu.sh stop` when done.

## Hygiene

- Temporary probes such as log tags or test hooks are never committed. Stage specific paths, never `git add -A`, and remove probes before shipping.
- Prefer literal arguments in adb commands over shell-variable loops. Sandboxed worktrees refuse commands they can't analyse.
- End with what was verified on which device, e.g. `verified on R5CT711VQNY (Android 16): install, playback, next/previous; DHU: media browse`.
