import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("readcheck.py")

INDEX = """<html><body data-composition-id="main" data-duration="20">
<div class="clip" data-start="0" data-duration="3">Hello world</div>
<div data-composition-src="compositions/s2.html" data-start="10" data-duration="6"></div>
</body></html>"""
S2 = """<template><div data-composition-id="s2">
<div class="clip" data-start="1" data-duration="1.2"><span>one two three four five six</span></div>
<script type="application/json" data-texts>[{"text":"Declared title","start":3,"end":3.2,"key":true}]</script>
</div></template>"""


def run(proj, *args):
    return subprocess.run([sys.executable, "-I", str(SCRIPT), str(proj), *args], capture_output=True, text=True)


class ReadCheck(unittest.TestCase):
    def test_project(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d)
            (p / "compositions").mkdir()
            (p / "index.html").write_text(INDEX)
            (p / "compositions" / "s2.html").write_text(S2)
            r = run(p)
            self.assertEqual(r.returncode, 1, r.stdout)
            self.assertIn("one two three four five six", r.stdout)
            self.assertIn("11.00s", r.stdout)  # host offset 10 + clip start 1
            self.assertNotIn("Hello world", r.stdout)  # 3 s hold passes
            self.assertIn("Declared title", r.stdout)  # key text 0.2 s < 1.5 s floor
            self.assertIn("13.00s", r.stdout)
            m = json.loads((p / "texts.json").read_text())
            self.assertEqual(len(m), 3)
            self.assertEqual(json.loads(run(p, "--json").stdout)["ok"], False)

    def test_pass(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d)
            (p / "index.html").write_text(INDEX.replace('<div data-composition-src="compositions/s2.html" data-start="10" data-duration="6"></div>', ""))
            r = run(p)
            self.assertEqual(r.returncode, 0, r.stdout)


if __name__ == "__main__":
    unittest.main()
