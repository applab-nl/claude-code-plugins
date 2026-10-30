import { expect, test } from 'claude-code/testing'

import { parseCounts, parseWorktrees, prsByBranch, summarizeChecks, toRows } from '../hooks/parse'
import type { GhPr } from '../hooks/parse'

const WORKTREES = `worktree /p/maya
HEAD 34c60b2
branch refs/heads/integration/daily-brief

worktree /p/maya-wt-today
HEAD e71c478
branch refs/heads/feat/today-redesign

worktree /p/maya-detached
HEAD 1234567
detached
`

const PRS: GhPr[] = [
  { number: 41, headRefName: 'feat/today-redesign', state: 'OPEN', reviewDecision: 'APPROVED', statusCheckRollup: [{ conclusion: 'SUCCESS' }] },
  { number: 30, headRefName: 'feat/today-redesign', state: 'CLOSED' },
  { number: 38, headRefName: 'fix/oauth', state: 'MERGED', headRefOid: 'aaa111' },
  { number: 37, headRefName: 'feat/reused', state: 'MERGED', headRefOid: 'bbb222' },
  { number: 36, headRefName: 'feat/forked', state: 'MERGED', isCrossRepository: true, headRefOid: 'ccc333' },
  { number: 43, headRefName: 'feat/fork-open', state: 'OPEN', isCrossRepository: true },
  { number: 42, headRefName: 'feat/remote', state: 'OPEN', isDraft: true, statusCheckRollup: [{ conclusion: 'FAILURE' }, { status: 'IN_PROGRESS' }] },
]

test('worktrees, counts and checks parse', async () => {
  expect(parseWorktrees(WORKTREES)).toEqual([
    { path: '/p/maya', branch: 'integration/daily-brief' },
    { path: '/p/maya-wt-today', branch: 'feat/today-redesign' },
    { path: '/p/maya-detached', branch: undefined },
  ])
  expect(parseCounts('2\t9\n')).toEqual({ ahead: 9, behind: 2 })
  expect(parseCounts('')).toBeUndefined()
  expect(summarizeChecks([{ conclusion: 'SUCCESS' }, { conclusion: 'SKIPPED' }])).toBe('pass')
  expect(summarizeChecks([{ conclusion: null, status: 'QUEUED' }])).toBe('pending')
  expect(summarizeChecks([])).toBeUndefined()
})

test('an open PR wins over an older closed one for its branch', async () => {
  const byBranch = prsByBranch(PRS)
  expect(byBranch.get('feat/today-redesign')).toEqual({ number: 41, headOid: undefined, state: 'open', checks: 'pass', review: 'approved' })
  expect(byBranch.get('feat/forked')).toBeUndefined()
  expect(byBranch.get('feat/remote')?.state).toBe('draft')
  expect(byBranch.get('feat/remote')?.checks).toBe('fail')
})

test('a branch with commits past its merged PR is not merged', async () => {
  const rows = toRows([
    { name: 'feat/reused', counts: { ahead: 2, behind: 0 }, committedAt: 1, isCurrent: false, isRemoteOnly: false, pr: prsByBranch(PRS).get('feat/reused'), hasCommitsSincePr: true },
  ])
  expect(rows[0]?.isMerged).toBe(false)
  expect(rows[0]?.hasCommitsSincePr).toBe(true)
})

test('a squash-merged PR is merged though git sees commits ahead; unmerged rows come first', async () => {
  const byBranch = prsByBranch(PRS)
  const rows = toRows([
    { name: 'fix/oauth', counts: { ahead: 3, behind: 5 }, committedAt: 30, isCurrent: false, isRemoteOnly: false, pr: byBranch.get('fix/oauth') },
    { name: 'old/ff', counts: { ahead: 0, behind: 8 }, committedAt: 20, isCurrent: false, isRemoteOnly: false },
    { name: 'feat/today-redesign', counts: { ahead: 9, behind: 2 }, committedAt: 10, worktree: '/p/maya-wt-today', isCurrent: false, isRemoteOnly: false, pr: byBranch.get('feat/today-redesign') },
  ])
  expect(rows.map(r => [r.name, r.isMerged])).toEqual([
    ['feat/today-redesign', false],
    ['fix/oauth', true],
    ['old/ff', true],
  ])
  expect(rows[0]?.worktree).toBe('maya-wt-today')
})

const PANE = {
  plugin: 'branch-status-mod',
  component: 'Pane',
  requestId: 'branch-status-mod',
  props: {
    title: 'Branches',
    isFocused: false,
    bodyColumns: 70,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
} as const

const ran = (exitCode: number, stdout: string) => ({
  value: { exitCode, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false },
})
const RUN_BRANCHES = {
  command: 'branches',
  args: '',
  origin: { kind: 'composer' },
  presentation: { isFullscreen: false, columns: 120 },
} as const

// Stands for git and gh in a repo with three local branches.
const OUTPUT: Record<string, string> = {
  'git rev-parse --show-toplevel': '/p/maya',
  'git symbolic-ref --short refs/remotes/origin/HEAD': 'origin/main',
  'git rev-parse --short origin/main': '3a126f8',
  'git rev-parse --abbrev-ref HEAD': 'integration/daily-brief',
  'git worktree list --porcelain': WORKTREES,
  'git for-each-ref refs/heads --format=%(refname:short)%09%(committerdate:unix)':
    'main\t1\nintegration/daily-brief\t50\nfeat/today-redesign\t40\nfix/oauth\t30\nfeat/reused\t20\nfeat/forked\t10\n',
  'git rev-list --left-right --count origin/main...integration/daily-brief': '0\t12',
  'git rev-list --left-right --count origin/main...feat/today-redesign': '2\t9',
  'git rev-list --left-right --count origin/main...fix/oauth': '5\t3',
  'git rev-list --left-right --count origin/main...origin/feat/remote': '0\t1',
  'git rev-list --left-right --count origin/main...feat/reused': '0\t2',
  'git rev-list --left-right --count origin/main...feat/forked': '0\t4',
  'git rev-parse fix/oauth': 'aaa111',
  'git rev-parse feat/reused': 'ddd444',
}

test('the pane lists branches parallel to main with their PRs', async ($, on) => {
  on('command.register', () => ({ value: { command: 'branches' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('clock.every', () => ({ value: undefined }))
  on('process.run', (_, e) => {
    const line = e.argv.join(' ')
    if (line.startsWith('gh pr list')) return ran(0, JSON.stringify(PRS))
    const stdout = OUTPUT[line]
    return ran(stdout === undefined ? 1 : 0, stdout ?? '')
  })

  await $.command.run(RUN_BRANCHES)
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const texts = (await ui.findAll({ type: 'Text' })).map(t => t.text ?? '')

  expect(texts.find(t => t.includes('5 open · 1 merged'))).toBeDefined()
  expect(texts.find(t => t.includes('#37 merged, new commits since'))).toBeDefined()
  expect(texts.find(t => t.includes('#36'))).toBeUndefined()
  expect(texts.find(t => t.includes('#43'))).toBeUndefined()
  expect(texts).toContain('● integration/daily-brief')
  expect(texts.find(t => t.startsWith('▰') && t.includes('+9') && t.includes('#41'))).toContain('maya-wt-today')
  expect(texts.find(t => t.includes('#42 draft'))).toContain('origin only')
  expect(texts.find(t => t.includes('merged #38'))).toContain('delete?')
  expect(texts).not.toContain('  main')
  await ui.unmount()
})

test('outside a git repository the pane says so', async ($, on) => {
  on('state.get', () => ({ value: { value: null, version: 1 } }))
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  expect((await ui.find({ type: 'Text' }))?.text).toBe('Not in a git repository.')
  await ui.unmount()
})

test('with PRs switched off, gh is never asked', { options: { showPrs: false } }, async ($, on) => {
  const asked: string[] = []
  on('command.register', () => ({ value: { command: 'branches' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('clock.every', () => ({ value: undefined }))
  on('process.run', (_, e) => {
    const line = e.argv.join(' ')
    asked.push(line)
    const stdout = OUTPUT[line]
    return ran(stdout === undefined ? 1 : 0, stdout ?? '')
  })

  await $.command.run(RUN_BRANCHES)
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const texts = (await ui.findAll({ type: 'Text' })).map(t => t.text ?? '')

  expect(asked.some(line => line.startsWith('gh '))).toBe(false)
  expect(texts.find(t => t.includes('#41'))).toBeUndefined()
  // git alone cannot see the squash merge of fix/oauth
  expect(texts.find(t => t.includes('5 open · 0 merged'))).toBeDefined()
  await ui.unmount()
})
