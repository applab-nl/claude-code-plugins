#!/usr/bin/env python3
"""Render a nightshift manifest into a single self-contained HTML test plan.

Usage:
    render_testplan.py --manifest nightshift/2026-08-25/manifest.json \
                       --out      nightshift/2026-08-25/testplan.html

The manifest is written by the nightshift orchestrator from the structured
results its implementation agents return. See the testplan skill for
the schema. Stdlib only - no install step, runs anywhere python3 does.
"""

import argparse
import html
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

OUTCOME_META = {
    "complete": ("ok", "Ready to test"),
    "partial": ("warn", "Partial - test what exists"),
    "blocked": ("bad", "Blocked - needs a decision"),
    "skipped": ("mute", "Not ready - needs refinement"),
}

CSS = """
:root{--bg:#0e1116;--panel:#161b22;--line:#262d36;--fg:#e6edf3;--dim:#8b949e;
--ok:#3fb950;--warn:#d29922;--bad:#f85149;--mute:#6e7681;--accent:#58a6ff}
@media(prefers-color-scheme:light){:root{--bg:#fff;--panel:#f6f8fa;--line:#d8dee4;
--fg:#1f2328;--dim:#636c76;--ok:#1a7f37;--warn:#9a6700;--bad:#cf222e;--mute:#6e7781;--accent:#0969da}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
.wrap{max-width:920px;margin:0 auto;padding:40px 24px 96px}
h1{font-size:26px;margin:0 0 4px;letter-spacing:-.01em}
h2{font-size:19px;margin:0;letter-spacing:-.01em}
h3{font-size:14px;text-transform:uppercase;letter-spacing:.06em;color:var(--dim);margin:24px 0 8px}
.sub{color:var(--dim);font-size:14px;margin-bottom:28px}
.meta{display:flex;flex-wrap:wrap;gap:8px 20px;padding:14px 16px;background:var(--panel);
border:1px solid var(--line);border-radius:8px;font-size:13px;margin-bottom:12px}
.meta b{color:var(--dim);font-weight:500;margin-right:6px}
code,kbd{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;
background:var(--panel);border:1px solid var(--line);border-radius:5px;padding:1px 6px}
pre{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:14px 16px;
overflow-x:auto;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;line-height:1.5}
pre code{background:none;border:none;padding:0}
.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:20px 22px;margin:16px 0}
.card.ok{border-left:3px solid var(--ok)}.card.warn{border-left:3px solid var(--warn)}
.card.bad{border-left:3px solid var(--bad)}.card.mute{border-left:3px solid var(--mute);opacity:.85}
.head{display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap}
.key{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--accent);font-size:13px}
.badge{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;
padding:3px 9px;border-radius:99px;white-space:nowrap}
.badge.ok{background:rgba(63,185,80,.15);color:var(--ok)}
.badge.warn{background:rgba(210,153,34,.15);color:var(--warn)}
.badge.bad{background:rgba(248,81,73,.15);color:var(--bad)}
.badge.mute{background:rgba(110,118,129,.15);color:var(--mute)}
.summary{margin:10px 0 0;color:var(--fg)}
.links{margin-top:10px;font-size:13px;display:flex;gap:14px;flex-wrap:wrap}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
ol.steps{margin:6px 0 0;padding-left:0;list-style:none;counter-reset:s}
ol.steps li{counter-increment:s;position:relative;padding:7px 0 7px 34px;border-bottom:1px solid var(--line)}
ol.steps li:last-child{border-bottom:none}
ol.steps li::before{content:counter(s);position:absolute;left:0;top:8px;width:22px;height:22px;
border-radius:50%;background:var(--bg);border:1px solid var(--line);color:var(--dim);
font-size:11px;display:flex;align-items:center;justify-content:center}
ol.steps input{position:absolute;left:26px;top:12px;display:none}
label.step{display:block;cursor:pointer;padding-left:8px}
input.chk{margin-right:10px;vertical-align:-1px;accent-color:var(--accent)}
input.chk:checked+span{text-decoration:line-through;color:var(--dim)}
table{border-collapse:collapse;width:100%;font-size:13.5px;margin-top:6px}
th{text-align:left;color:var(--dim);font-weight:500;padding:6px 10px 6px 0;border-bottom:1px solid var(--line)}
td{padding:7px 10px 7px 0;border-bottom:1px solid var(--line);vertical-align:top}
td.v{white-space:nowrap;width:1%}
.note{border-left:2px solid var(--warn);padding:8px 0 8px 14px;margin-top:14px;color:var(--dim);font-size:13.5px}
.note.bad{border-color:var(--bad)}
.tick{color:var(--ok)}.cross{color:var(--bad)}.dash{color:var(--mute)}
footer{margin-top:44px;padding-top:20px;border-top:1px solid var(--line);color:var(--dim);font-size:13px}
"""

JS = """
(function(){
  var k='nightshift:'+document.body.dataset.plan;
  var s=JSON.parse(localStorage.getItem(k)||'{}');
  document.querySelectorAll('input.chk').forEach(function(b){
    if(s[b.id])b.checked=true;
    b.addEventListener('change',function(){
      s[b.id]=b.checked;localStorage.setItem(k,JSON.stringify(s));count();
    });
  });
  function count(){
    var all=document.querySelectorAll('input.chk'),done=0;
    all.forEach(function(b){if(b.checked)done++});
    var el=document.getElementById('progress');
    if(el)el.textContent=done+' / '+all.length+' steps checked';
  }
  count();
})();
"""


def e(value) -> str:
    """HTML-escape any scalar."""
    return html.escape("" if value is None else str(value), quote=True)


def render_criteria(criteria) -> str:
    if not criteria:
        return ""

    rows = []
    for c in criteria:
        met = c.get("met")
        mark = ('<span class="tick">met</span>' if met is True
                else '<span class="cross">not met</span>' if met is False
                else '<span class="dash">untested</span>')
        rows.append(
            f"<tr><td>{e(c.get('criterion'))}</td><td class='v'>{mark}</td>"
            f"<td class='v'><code>{e(c.get('evidence') or '—')}</code></td></tr>"
        )
    return ("<h3>Acceptance criteria</h3><table>"
            "<tr><th>Criterion</th><th>Status</th><th>Evidence</th></tr>"
            + "".join(rows) + "</table>")


def render_steps(key: str, steps) -> str:
    if not steps:
        return ('<h3>How to test</h3><p class="note">No manual steps were '
                'provided for this ticket. Check the PR body before testing.</p>')
    items = []
    for i, step in enumerate(steps):
        sid = f"{key}-{i}"
        items.append(
            f'<li><label class="step"><input class="chk" type="checkbox" id="{e(sid)}">'
            f"<span>{e(step)}</span></label></li>"
        )
    return f'<h3>How to test</h3><ol class="steps">{"".join(items)}</ol>'


def render_ticket(t: dict) -> str:
    outcome = (t.get("outcome") or "complete").lower()
    cls, label = OUTCOME_META.get(outcome, ("mute", outcome))
    links = []
    if t.get("prUrl"):
        links.append(f'<a href="{e(t["prUrl"])}">Draft PR</a>')
    if t.get("branch"):
        links.append(f'<code>{e(t["branch"])}</code>')
    if t.get("testStatus"):
        links.append(f'tests: {e(t["testStatus"])}')

    notes = ""
    if t.get("blocker"):
        notes += f'<p class="note bad"><b>Blocked:</b> {e(t["blocker"])}</p>'
    for a in t.get("assumptions") or []:
        notes += f'<p class="note"><b>Assumption:</b> {e(a)}</p>'

    return f"""<section class="card {cls}" id="{e(t.get('key'))}">
  <div class="head">
    <div><span class="key">{e(t.get('key'))}</span> <h2>{e(t.get('title'))}</h2></div>
    <span class="badge {cls}">{e(label)}</span>
  </div>
  <p class="summary">{e(t.get('summary'))}</p>
  <div class="links">{' · '.join(links)}</div>
  {render_criteria(t.get('acceptanceCriteria'))}
  {render_steps(t.get('key') or 'x', t.get('steps'))}
  {notes}
</section>"""


def render(m: dict) -> str:
    tickets = m.get("tickets") or []
    preview = m.get("preview") or {}
    date = m.get("date") or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    branch = m.get("previewBranch") or ""
    base = m.get("baseBranch") or "main"

    counts = {}
    for t in tickets:
        o = (t.get("outcome") or "complete").lower()
        counts[o] = counts.get(o, 0) + 1
    tally = " · ".join(f"{n} {o}" for o, n in sorted(counts.items())) or "nothing built"

    excluded = preview.get("excluded") or []
    excl_html = ""
    if excluded:
        rows = "".join(
            f"<tr><td><code>{e(x.get('key'))}</code></td><td>{e(x.get('reason'))}</td></tr>"
            for x in excluded
        )
        excl_html = (
            '<div class="note bad"><b>Not in this preview.</b> These branches '
            "conflicted and were left out — test them individually from their own "
            f"branches.<table>{rows}</table></div>"
        )

    preview_tests = preview.get("testStatus")
    tests_html = ""
    if preview_tests:
        cls = "note" if "fail" not in str(preview_tests).lower() else "note bad"
        tests_html = f'<p class="{cls}"><b>Preview branch tests:</b> {e(preview_tests)}</p>'

    setup = m.get("setupCommand") or "# start the app the way this repo normally does"
    checkout = f"git fetch origin\ngit checkout {branch}\n{setup}"

    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nightshift test plan — {e(date)}</title>
<style>{CSS}</style></head>
<body data-plan="{e(date)}"><div class="wrap">

<h1>Nightshift test plan</h1>
<p class="sub">{e(date)} · {e(tally)} · <span id="progress"></span></p>

<div class="meta">
  <span><b>preview</b><code>{e(branch)}</code></span>
  <span><b>base</b><code>{e(base)}</code></span>
  <span><b>repo</b>{e(m.get('repo') or '—')}</span>
</div>
{tests_html}
{excl_html}

<h3>Start here</h3>
<pre><code>{e(checkout)}</code></pre>
<p class="sub">Everything below is on that one branch. Work through the tickets,
tick the steps as you go (they're saved in this browser), then finalize the ones
that pass.</p>

{''.join(render_ticket(t) for t in tickets)}

<footer>
  <p><b>When a ticket passes:</b> run <code>/nightshift finalize &lt;KEY&gt;</code> —
  it marks that ticket's draft PR ready for review and moves the ticket forward.
  Each ticket ships on its own branch, so you can finalize some and reject others.</p>
  <p><b>When a ticket fails:</b> leave the PR in draft and say what broke — the
  branch stays put for a follow-up run.</p>
  <p>Built unattended. None of this has been reviewed by a human.</p>
</footer>

</div><script>{JS}</script></body></html>
"""


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--manifest", required=True, type=Path)
    ap.add_argument("--out", required=True, type=Path)
    args = ap.parse_args()

    if not args.manifest.is_file():
        print(f"error: manifest not found: {args.manifest}", file=sys.stderr)
        return 1
    try:
        manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"error: manifest is not valid JSON: {exc}", file=sys.stderr)
        return 1

    if not isinstance(manifest.get("tickets"), list):
        print("error: manifest needs a 'tickets' array", file=sys.stderr)
        return 1

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(render(manifest), encoding="utf-8")
    print(f"wrote {args.out} ({len(manifest['tickets'])} tickets)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
