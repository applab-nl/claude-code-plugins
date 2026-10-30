# Branch Status

A pane beside the chat listing the branches and worktrees that run parallel to main: how far each is ahead and behind, whether it has merged, and its PR with checks and review.

```
main  origin/main 3a126f8               3 open · 1 merged

● integration/daily-brief  ▰▰▰▰▰▰▰▰▰▰▰▰ +12
◆ feat/today-redesign      ▰▰▰▰▰▰▰▰▰ +9 −2  #41 ✓ approved · maya-wt-today
  feat/remote              ▰ +1  #42 draft ✗ · origin only
  fix/oauth                merged #38 · delete?
```

## Installation

```
/plugin marketplace add applab-nl/claude-code-plugins
/plugin install branch-status-mod@applab-plugins
```

## Usage

Run `/branches` to open the pane.

| Mark | Meaning |
| --- | --- |
| `●` | The branch this session has checked out |
| `◆` | Checked out in a worktree; its folder is named at the end of the row |
| `▰▰▰ +9` | Commits ahead of main, the bar scaled to the busiest branch |
| `−2` | Commits main gained since the branch left it |
| `#41 ✓ approved` | Its PR: draft, checks passed (✓), failed (✗) or running (●), review approved or changes requested |
| `merged #38 · delete?` | Merged, dimmed, kept until you delete the branch |
| `in main` | No PR and no commits of its own beyond main |
| `origin only` | A branch with an open PR that is not checked out locally |

Every local branch except main is listed, unmerged first by latest commit, merged after.

## Options

Set in `/plugin` under the plugin's options:

| Option | Default | Effect |
| --- | --- | --- |
| Show pull requests | on | Ask GitHub (`gh`) for each branch's PR. Off, merges are seen by git alone, so a squash merge is not recognised and that branch stays listed as open |
| PR refresh (minutes) | 5 | How often PRs are fetched. They are also fetched after a `gh` command or `git push`, and when `/branches` runs |

## How it stays current

- git is read every 15 seconds and after any Bash command containing `git` or `gh`.
- `git fetch origin` runs every 5 minutes so origin/main and merges stay current. It does not prune or touch local branches.
- When `gh` is missing or not logged in, the pane says so on its last line and lists branches without PR details.

## Development

```
claude plugin validate branch-status-mod
claude plugin test branch-status-mod
claude --plugin-dir ./branch-status-mod
```

## License

MIT
