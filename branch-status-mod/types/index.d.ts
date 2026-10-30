export type Checks = 'pass' | 'fail' | 'pending'

export type PrView = {
  number: number
  state: 'open' | 'draft' | 'merged' | 'closed'
  checks?: Checks
  review?: 'approved' | 'changes' | 'required'
  /** The commit the PR's branch stood at. */
  headOid?: string
}

export type BranchRow = {
  name: string
  ahead: number
  behind: number
  /** Merged into main: by its PR, or with no commits of its own left. */
  isMerged: boolean
  /** Its PR merged, but the branch has commits that PR never held. */
  hasCommitsSincePr: boolean
  /** The worktree folder's name when the branch is checked out in one. */
  worktree?: string
  /** Checked out where this session runs. */
  isCurrent: boolean
  /** Only on origin, listed for its open PR. */
  isRemoteOnly: boolean
  pr?: PrView
}

export type BranchesView = {
  main: string
  mainSha: string
  rows: BranchRow[]
  /** Why PR details are missing, when gh could not answer. */
  prNote?: string
  error?: string
}

declare module 'claude-code' {
  interface PluginState {
    'branch-status-mod': { view: Shaped<BranchesView | null> }
  }
}
