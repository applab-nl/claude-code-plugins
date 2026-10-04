#!/usr/bin/env python3
"""Drive an Android UI over adb without a screenshot round-trip.

  ui.py texts              list visible text/content-desc with bounds
  ui.py tap "<text>"       tap the first node whose text/desc contains <text>
  ui.py wait "<text>" [s]  wait until <text> is on screen (default 30 s)
  ui.py shot <name>        save a screenshot to <name>.png

Honours ANDROID_SERIAL. uiautomator also reads FLAG_SECURE screens, where screencap returns black.
"""
import re, subprocess, sys, time

NODE = re.compile(r'<node [^>]*>')
ATTR = lambda a: re.compile(a + r'="([^"]*)"')


def adb(*args, binary=False):
    return subprocess.run(["adb", *args], capture_output=True, check=False).stdout if binary else \
        subprocess.run(["adb", *args], capture_output=True, text=True, check=False).stdout


def nodes():
    adb("shell", "uiautomator", "dump", "/sdcard/ui.xml")
    xml = adb("exec-out", "cat", "/sdcard/ui.xml")
    for n in NODE.findall(xml):
        text = (ATTR("text").search(n) or [None, ""])[1]
        desc = (ATTR("content-desc").search(n) or [None, ""])[1]
        b = ATTR("bounds").search(n)
        if (text or desc) and b:
            x1, y1, x2, y2 = map(int, re.findall(r"\d+", b[1]))
            yield text, desc, ((x1 + x2) // 2, (y1 + y2) // 2), b[1]


def find(needle):
    found = list(nodes())
    for text, desc, centre, _ in found:
        if needle == text or needle == desc:
            return centre
    for text, desc, centre, _ in found:
        if needle.lower() in (text + " " + desc).lower():
            return centre
    return None


def main(argv):
    if len(argv) < 2:
        sys.exit(__doc__)
    cmd = argv[1]
    if cmd == "texts":
        for text, desc, _, bounds in nodes():
            print(f"{text or '-'} | {desc or '-'} | {bounds}")
    elif cmd == "tap":
        c = find(argv[2])
        if not c:
            sys.exit(f"NOT FOUND: {argv[2]}")
        adb("shell", "input", "tap", str(c[0]), str(c[1]))
        print(f"tapped {argv[2]} at {c}")
    elif cmd == "wait":
        deadline = time.time() + float(argv[3] if len(argv) > 3 else 30)
        while time.time() < deadline:
            if find(argv[2]):
                print(f"visible: {argv[2]}")
                return
            time.sleep(1)
        sys.exit(f"TIMEOUT waiting for: {argv[2]}")
    elif cmd == "shot":
        open(argv[2] + ".png", "wb").write(adb("exec-out", "screencap", "-p", binary=True))
        print(argv[2] + ".png")
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main(sys.argv)
