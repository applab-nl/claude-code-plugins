import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { BranchRow, BranchesView } from '../types'
import { parseBranches, parseCounts, parseWorktrees, prsByBranch, toRows } from './parse'
import type { GhPr, RowInput } from './parse'

const PANE = 'branch-status-mod'
const TITLE = 'Branches'
const GIT_POLL_MS = 15_000
const FETCH_MS = 5 * 60_000

const view = atom({ plugin: 'branch-status-mod', key: 'view' } as const, null as BranchesView | null, {
  shape: 'view-1',
})

type $ = EngineInterface

let prs: GhPr[] = []
let prNote: string | undefined
let prsAt = 0
let lastKey = ''
let running: Promise<void> | undefined
let isDirty = false
let isPrsDue = false
let isPrsOn = true
let prPollMs = 5 * 60_000

async function run($: $, argv: string[]) {
  const out = await $.process.run(argv, { timeoutMs: 20_000 })
  return { ok: out.exitCode === 0, text: out.stdout.trim(), err: out.stderr.trim() }
}

const git = ($: $, ...args: string[]) => run($, ['git', ...args])

// origin's default branch, else origin/main or origin/master, else local main.
async function mainRef($: $): Promise<string | undefined> {
  const head = await git($, 'symbolic-ref', '--short', 'refs/remotes/origin/HEAD')
  if (head.ok && head.text) return head.text
  for (const ref of ['origin/main', 'origin/master', 'main', 'master']) {
    if ((await git($, 'rev-parse', '--verify', '--quiet', ref)).ok) return ref
  }
  return undefined
}

async function loadPrs($: $): Promise<void> {
  try {
    const out = await run($, [
      'gh', 'pr', 'list', '--state', 'all', '--limit', '100',
      '--json', 'number,headRefName,state,isDraft,reviewDecision,statusCheckRollup',
    ])
    if (out.ok) {
      prs = JSON.parse(out.text || '[]') as GhPr[]
      prNote = undefined
    } else {
      prNote = `No PR details: ${out.err.split('\n')[0] || 'gh failed'}`
    }
  } catch {
    prNote = 'No PR details: gh is not installed'
  }
  prsAt = Date.now()
}

async function collect($: $): Promise<BranchesView | null> {
  if (!(await git($, 'rev-parse', '--show-toplevel')).ok) return null
  const ref = await mainRef($)
  if (!ref) return { main: '?', mainSha: '', rows: [], error: 'No main branch found (origin/main, main).' }
  const mainName = ref.replace(/^origin\//, '')

  if (!isPrsOn) {
    prs = []
    prNote = undefined
  } else if (isPrsDue || Date.now() - prsAt > prPollMs) {
    isPrsDue = false
    await loadPrs($)
  }

  const [sha, current, trees, refs] = await Promise.all([
    git($, 'rev-parse', '--short', ref),
    git($, 'rev-parse', '--abbrev-ref', 'HEAD'),
    git($, 'worktree', 'list', '--porcelain'),
    git($, 'for-each-ref', 'refs/heads', '--format=%(refname:short)%09%(committerdate:unix)'),
  ])
  const worktrees = parseWorktrees(trees.text)
  const locals = parseBranches(refs.text).filter(b => b.name !== mainName)
  const byBranch = prsByBranch(prs)
  const localNames = new Set(locals.map(b => b.name))

  // Remote branches are listed only for an open PR not checked out here.
  const remotes = prs
    .filter(pr => pr.state === 'OPEN' && !localNames.has(pr.headRefName) && pr.headRefName !== mainName)
    .map(pr => pr.headRefName)

  const counted = async (name: string, target: string, committedAt: number, isRemoteOnly: boolean) => {
    const counts = parseCounts((await git($, 'rev-list', '--left-right', '--count', `${ref}...${target}`)).text)
    if (!counts) return undefined
    const input: RowInput = {
      name,
      counts,
      committedAt,
      worktree: worktrees.find(w => w.branch === name)?.path,
      isCurrent: name === current.text,
      isRemoteOnly,
      pr: byBranch.get(name),
    }
    return input
  }
  const inputs = await Promise.all([
    ...locals.map(b => counted(b.name, b.name, b.committedAt, false)),
    ...[...new Set(remotes)].map(name => counted(name, `origin/${name}`, 0, true)),
  ])

  return {
    main: ref,
    mainSha: sha.text,
    rows: toRows(inputs.filter((i): i is RowInput => i !== undefined)),
    prNote,
  }
}

async function refreshOnce($: $): Promise<void> {
  try {
    const next = await collect($)
    const key = JSON.stringify(next)
    if (key !== lastKey) {
      lastKey = key
      await update($, view, () => next)
    }
  } catch (error) {
    $.ui.log(`branch-status-mod: ${String(error)}`)
  }
}

// One refresh at a time; a call during one runs it again after.
function refresh($: $, withPrs = false): Promise<void> {
  if (withPrs) isPrsDue = true
  if (running) {
    isDirty = true
    return running
  }
  running = (async () => {
    do {
      isDirty = false
      await refreshOnce($)
    } while (isDirty)
  })().finally(() => {
    running = undefined
  })
  return running
}

const BAR_MAX = 12

function badge(row: BranchRow): { text: string; color?: string; isDim?: boolean } | undefined {
  const pr = row.pr
  if (pr?.state === 'merged') return { text: `merged #${pr.number}`, isDim: true }
  if (pr?.state === 'closed') return { text: `#${pr.number} closed`, isDim: true }
  if (!pr) return row.isMerged ? { text: 'in main', isDim: true } : undefined
  return { text: `#${pr.number}${pr.state === 'draft' ? ' draft' : ''}` }
}

export const register: Register = (on, options) => {
  isPrsOn = options.showPrs !== false
  prPollMs = Math.max(1, Number(options.prRefreshMinutes) || 5) * 60_000

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'branches',
      description: 'Show the branches and worktrees running parallel to main, with their PRs',
    })
    const result = await next(e)
    void refresh($, true)
    $.clock.every(GIT_POLL_MS, () => void refresh($))
    $.clock.every(FETCH_MS, () => {
      void git($, 'fetch', '--quiet', 'origin')
        .then(() => refresh($, true))
        .catch(() => undefined)
    })

    return result
  })

  on('command.run', { command: 'branches' }, async $ => {
    await refresh($, true)
    await $.ui.open({ id: PANE, title: TITLE })

    return { text: 'Branches pane opened.' }
  })

  // A git or gh command may have moved a branch, merged one or opened a PR.
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const result = await next(e)
    if (/\b(?:git|gh)\b/.test(e.command)) void refresh($, /\bgh\b|\bgit\s+push\b/.test(e.command)).catch(() => undefined)

    return result
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const pane = await read($, view)
    const columns = e.viewport?.columns ?? 50
    const rows = e.viewport?.rows ?? 24

    if (!pane) return <Text dimColor>Not in a git repository.</Text>
    if (pane.error) return <Text color="error">{pane.error}</Text>

    const open = pane.rows.filter(r => !r.isMerged)
    const merged = pane.rows.filter(r => r.isMerged)
    const nameWidth = Math.min(
      Math.max(8, ...pane.rows.map(r => r.name.length + 2)),
      Math.max(10, Math.floor(columns * 0.45)),
    )
    const barMax = Math.max(3, Math.min(BAR_MAX, columns - nameWidth - 24))
    const maxAhead = Math.max(1, ...open.map(r => r.ahead))
    const room = Math.max(3, rows - 5)
    const shown = pane.rows.slice(0, room)

    const line = (row: BranchRow) => {
      const mark = row.isCurrent ? '●' : row.worktree ? '◆' : ' '
      const tag = badge(row)
      const checks = row.pr?.checks
      const review = row.pr?.review
      const width = row.isMerged ? 0 : Math.max(row.ahead > 0 ? 1 : 0, Math.round((row.ahead / maxAhead) * barMax))
      return (
        <Box gap={1}>
          <Box width={nameWidth} flexShrink={0}>
            <Text wrap="truncate-end" dimColor={row.isMerged} weight={row.isCurrent ? 'bold' : undefined}>
              {mark} {row.name}
            </Text>
          </Box>
          <Text wrap="truncate-end" dimColor={row.isMerged}>
            {!row.isMerged && <Text color="claude">{'▰'.repeat(width)}</Text>}
            {!row.isMerged && ' '}
            {row.isMerged ? '' : `+${row.ahead}`}
            {!row.isMerged && row.behind > 0 && <Text dimColor> −{row.behind}</Text>}
            {tag && (
              <Text color={tag.color} dimColor={tag.isDim}>
                {'  '}
                {tag.text}
              </Text>
            )}
            {checks === 'pass' && <Text color="success"> ✓</Text>}
            {checks === 'fail' && <Text color="error"> ✗</Text>}
            {checks === 'pending' && <Text color="warning"> ●</Text>}
            {review === 'approved' && <Text color="success"> approved</Text>}
            {review === 'changes' && <Text color="error"> changes requested</Text>}
            {row.isMerged && !row.isRemoteOnly && <Text dimColor> · delete?</Text>}
            {row.worktree && <Text dimColor> · {row.worktree}</Text>}
            {row.isRemoteOnly && <Text dimColor> · origin only</Text>}
          </Text>
        </Box>
      )
    }

    return (
      <Box flexDirection="column">
        <Box justifyContent="space-between" gap={1}>
          <Text wrap="truncate-end">
            <Text weight="bold">{pane.main.replace(/^origin\//, '')}</Text>
            <Text dimColor>
              {'  '}
              {pane.main} {pane.mainSha}
            </Text>
          </Text>
          <Text dimColor>
            {open.length} open · {merged.length} merged
          </Text>
        </Box>
        <Text> </Text>
        {pane.rows.length === 0 && <Text dimColor>No branches besides {pane.main}.</Text>}
        {shown.map(line)}
        {pane.rows.length > shown.length && <Text dimColor>  … {pane.rows.length - shown.length} more</Text>}
        {pane.prNote && (
          <Text dimColor wrap="truncate-end">
            {pane.prNote}
          </Text>
        )}
      </Box>
    )
  })
}
