# android-dev

Skills for working with Android apps on real devices.

## android-device-test

The build → install → exercise → read logs loop on a phone or emulator, plus Android Auto via the Desktop Head Unit. It triggers on requests like "install it on my phone", "phone is reconnected, test it", or "test it in the head unit".

Bundled scripts (`skills/android-device-test/scripts/`):

| Script | Purpose |
|---|---|
| `wait-device.sh` | Wait for a phone to attach and authorize |
| `capture-logs.sh` | Logcat capture that re-attaches after a replug |
| `ui.py` | List, tap or wait for on-screen text via `uiautomator`; screenshots |
| `dex-has-symbol.sh` | Check whether the installed APK contains a class or string, across all dex files |
| `dhu.sh` | Start or stop the Android Auto Desktop Head Unit, with port forward and the stdin fix |

Project specifics (package, variant, serial, deploy script) stay in each project's own skill or `CLAUDE.md`. This skill reads them first.

### Fewer permission prompts

Optionally allow the read-only and install commands in a project's `.claude/settings.local.json`:

```json
{ "permissions": { "allow": ["Bash(adb devices*)", "Bash(adb -s * logcat*)", "Bash(adb -s * install -r *)", "Bash(./gradlew *)"] } }
```

## Installation

```bash
/plugin install android-dev@applab-plugins
```
