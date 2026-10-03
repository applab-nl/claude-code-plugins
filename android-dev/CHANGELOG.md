# Changelog

All notable changes to the android-dev plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-03

### Added

- `android-device-test` skill, built from the device-testing loops in feedcast and memento: device selection with explicit serials, reconnect-safe logcat capture, `uiautomator`-based UI driving, ANR diagnosis that doesn't rely on `/data/anr`, a dex symbol check using `grep -a`, and an Android Auto DHU start-up sequence with the stdin fix and known failure modes.
