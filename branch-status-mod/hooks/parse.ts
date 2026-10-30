// Pure parsing of git and gh output, and the rows the pane lists.

import type { BranchRow, Checks, PrView } from '../types'

export type Worktree = { path: string; branch?: string }
export type LocalBranch = { name: string; committedAt: number }
export type Counts = { ahead: number; behind: number }

export type GhPr = {
  number: number
  headRefName: string
  state: 'OPEN' | 'MERGED' | 'CLOSED'
  isDraft?: boolean
  reviewDecision?: string | null
  statusCheckRollup?: { conclusion?: string | null; state?: string | null; status?: string | null }[] | null
}

export function parseWorktrees(porcelain: string): Worktree[] {
  const out: Worktree[] = []
  for (const block of porcelain.split(/\n\n+/)) {
    const path = /^worktree (.+)$/m.exec(block)?.[1]
    if (!path) continue
    const branch = /^branch refs\/heads\/(.+)$/m.exec(block)?.[1]
    out.push({ path, branch })
  }
  return out
}

export function parseBranches(lines: string): LocalBranch[] {
  return lines
    .split('\n')
    .map(line => line.split('\t'))
    .filter(([name]) => name)
    .map(([name = '', date = '0']) => ({ name, committedAt: Number(date) || 0 }))
}

// `git rev-list --left-right --count main...branch` prints "behind\tahead".
export function parseCounts(text: string): Counts | undefined {
  const [behind, ahead] = text.trim().split(/\s+/).map(Number)
  return behind === undefined || ahead === undefined || Number.isNaN(behind + ahead)
    ? undefined
    : { ahead, behind }
}

const FAILED = new Set(['FAILURE', 'ERROR', 'CANCELLED', 'TIMED_OUT', 'ACTION_REQUIRED', 'STARTUP_FAILURE'])
const DONE = new Set(['SUCCESS', 'NEUTRAL', 'SKIPPED'])

export function summarizeChecks(rollup: GhPr['statusCheckRollup']): Checks | undefined {
  if (!rollup || rollup.length === 0) return undefined
  const results = rollup.map(c => (c.conclusion || c.state || '').toUpperCase())
  if (results.some(r => FAILED.has(r))) return 'fail'
  return results.every(r => DONE.has(r)) ? 'pass' : 'pending'
}

export function prView(pr: GhPr): PrView {
  const review =
    pr.reviewDecision === 'APPROVED'
      ? 'approved'
      : pr.reviewDecision === 'CHANGES_REQUESTED'
        ? 'changes'
        : pr.reviewDecision === 'REVIEW_REQUIRED'
          ? 'required'
          : undefined
  const state =
    pr.state === 'MERGED' ? 'merged' : pr.state === 'CLOSED' ? 'closed' : pr.isDraft ? 'draft' : 'open'
  return { number: pr.number, state, checks: state === 'open' || state === 'draft' ? summarizeChecks(pr.statusCheckRollup) : undefined, review }
}

// An open PR wins over an older merged or closed one for the same branch.
export function prsByBranch(prs: readonly GhPr[]): Map<string, PrView> {
  const rank = { OPEN: 3, MERGED: 2, CLOSED: 1 }
  const best = new Map<string, GhPr>()
  for (const pr of prs) {
    const held = best.get(pr.headRefName)
    if (!held || rank[pr.state] > rank[held.state] || (rank[pr.state] === rank[held.state] && pr.number > held.number)) {
      best.set(pr.headRefName, pr)
    }
  }
  return new Map([...best].map(([name, pr]) => [name, prView(pr)]))
}

const folderName = (path: string) => path.split('/').filter(Boolean).pop() ?? path

export type RowInput = {
  name: string
  counts: Counts
  committedAt: number
  worktree?: string
  isCurrent: boolean
  isRemoteOnly: boolean
  pr?: PrView
}

// A squash merge leaves commits git calls ahead, so a merged PR decides; with
// no PR, a branch with nothing ahead of main is in it.
export function toRows(inputs: readonly RowInput[]): BranchRow[] {
  const rows = inputs.map(input => ({
    row: {
      name: input.name,
      ahead: input.counts.ahead,
      behind: input.counts.behind,
      isMerged: input.pr?.state === 'merged' || (input.counts.ahead === 0 && input.pr?.state !== 'open'),
      worktree: input.worktree ? folderName(input.worktree) : undefined,
      isCurrent: input.isCurrent,
      isRemoteOnly: input.isRemoteOnly,
      pr: input.pr,
    },
    committedAt: input.committedAt,
  }))
  rows.sort((a, b) => Number(a.row.isMerged) - Number(b.row.isMerged) || b.committedAt - a.committedAt)
  return rows.map(r => r.row)
}
