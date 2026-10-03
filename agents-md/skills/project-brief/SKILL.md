---
name: project-brief
description: Write or refresh docs/PROJECT_OVERVIEW.md, a short, LLM-optimized description of a repository's purpose, goals and shape that another agent can read to orient itself, with a fixed frontmatter schema and a link to the code repository, committed and pushed to the default branch. Use when the user asks to "describe this project for another agent", "create a project overview/brief", "explain the project to an LLM", "write PROJECT_OVERVIEW", "/project-brief", or pastes the "Create a description of this project, its purpose and goals… I need to explain the project to another agent" prompt. Also use to update an existing overview that went stale.
---

# Project brief

Produces `docs/PROJECT_OVERVIEW.md`: one page another agent reads first to understand what a repository is for. It is the same file, schema and commit behaviour in every repo, so briefs can be compared and consumed by tools.

Defaults, unless the user says otherwise in the request:

| | |
|---|---|
| Path | `docs/PROJECT_OVERVIEW.md` |
| Audience | other LLM agents. Text only, no images. |
| Length | 500–800 words of body |
| Language | English, whatever the language of the request |
| Delivery | commit only this file to the default branch and push |

## 1. Gather facts

Delegate the survey to an `Explore` agent (thoroughness "medium") so the file dumps stay out of the main context. Ask it for facts with file paths, not guesses:

- what the project is and who it is for: `README.md`, `CLAUDE.md`/`AGENTS.md`, product docs, specs (`openspec/specs/`, `docs/`)
- the main components and how they connect: apps, packages, services, external APIs, data stores
- stack and languages: manifests such as `package.json`, `build.gradle.kts`, `Cargo.toml`, `pyproject.toml`
- current state: version, recent `git log --oneline -20`, open spec changes, anything marked prototype or deprecated
- which files an agent should read next

In parallel, collect the repo facts yourself:

```bash
git remote get-url origin 2>/dev/null       # → https URL (convert git@github.com:org/repo.git)
git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's#origin/##'   # default branch
git ls-files --error-unmatch docs/PROJECT_OVERVIEW.md 2>/dev/null; ls docs/ 2>/dev/null
```

Look for an existing overview under any name: `docs/PROJECT_OVERVIEW.md`, `docs/project-overview.md`, or an untracked draft. If one exists, this is an **update**. Fact-check it against the survey, keep what is still true, fix what isn't, and migrate it to the schema below. Remove a draft that sits at another path once its content has moved over.

## 2. Write

### Frontmatter (all keys, in this order)

```yaml
---
title: <Project name>: project overview
description: <one sentence: what it is and for whom>
type: project-overview
audience: llm-agents
project: <short name>
repository: <https URL of origin, or null if there is no remote>
default_branch: <branch>
status: <prototype | active | maintenance | archived>
updated: <YYYY-MM-DD>
sources: [<files an agent should read next, e.g. CLAUDE.md, README.md, openspec/specs/>]
---
```

Don't add other keys. Put repo-specific detail in the body.

### Body sections

Use these H2s, in this order. Drop a section only when it truly doesn't apply.

1. **What it is**: two or three sentences, with the repository URL on its own line (`Code repository: <url>`).
2. **Purpose and goals**: the problem it solves and what success looks like.
3. **Scope**: what it deliberately is not, or doesn't do yet.
4. **Architecture in brief**: the main parts and how data or control flows between them. Use a short bullet list. One small text diagram is fine.
5. **Key concepts**: domain terms an agent will meet in the code. Leave this out if there are none.
6. **Status**: maturity, current version, and what is in flight.
7. **Where to look next**: the `sources` with one line on each.

Write for an LLM reader: concrete nouns, real names of modules and services, and no marketing. Don't go into implementation detail, because the brief points to where the detail lives. Every claim must come from the survey. If something is unknown, leave it out.

## 3. Commit and push

Commit **only** `docs/PROJECT_OVERVIEW.md`, plus the removal of a superseded draft. Use the message:

```
📝 docs: add LLM-oriented project overview        # or "update" on a refresh
```

How the commit reaches the default branch depends on the checkout:

- **On the default branch, nothing else staged, no hook blocking edits**: `git add docs/PROJECT_OVERVIEW.md`, commit, then `git push`.
- **Otherwise** (on a feature branch, other work staged or in progress, another session in the checkout, or a hook blocking edits in the shared checkout): don't touch that checkout's branch or index. Commit from a throwaway worktree off the default branch:
  ```bash
  ROOT=$(git rev-parse --show-toplevel); WT="$ROOT/.worktrees/project-brief"
  git -C "$ROOT" fetch origin
  git -C "$ROOT" worktree add --detach "$WT" origin/<default>
  # write the file into "$WT/docs/PROJECT_OVERVIEW.md", then:
  git -C "$WT" add docs/PROJECT_OVERVIEW.md && git -C "$WT" commit -m "…"
  git -C "$WT" push origin HEAD:<default>
  git -C "$ROOT" worktree remove "$WT"
  ```
  If the push is rejected because of branch protection or a non-fast-forward, push a `docs/project-overview` branch instead, open a PR with `gh pr create`, and say so.
- **No remote**: commit locally, set `repository: null`, and report that the push was skipped. When a remote exists on a later run, the update replaces `null` with the URL.

## Report

End with one line, for example:

```
result: docs/PROJECT_OVERVIEW.md created (640 words), pushed to main as a1b2c3d, https://github.com/org/repo
```
