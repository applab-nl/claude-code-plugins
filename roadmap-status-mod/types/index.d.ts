export type PhaseView = {
  title: string
  done: number
  total: number
  /** For a slice linked from a roadmap: the slice's own current phase. */
  sub?: string
  /** For a slice linked from a roadmap: the linked plan file. */
  link?: string
  /** Open tasks of this phase (filled for the current phase only). */
  open: string[]
  /** The phase heading this task heading sits under, when the plan nests them. */
  group?: string
}

export type PlanView = {
  path: string
  title: string
  /** How this plan was chosen: pinned, touched by the agent, linked from the roadmap, or latest edited. */
  source: 'pinned' | 'agent' | 'roadmap' | 'auto'
  phases: PhaseView[]
  /** Index of the current phase, -1 when everything is done. */
  current: number
}

export type RoadmapView = {
  path: string
  title: string
  done: number
  total: number
  /** Index of the first unfinished slice, -1 when everything is done. */
  current: number
  currentTitle?: string
}

/** The agent's open work that matches no phase of the plan. */
export type OffroadView = {
  done: number
  total: number
  active?: string
  open: string[]
}

export type PaneView = {
  roadmap?: RoadmapView
  plan?: PlanView
  offroad?: OffroadView
}

export type AgentTask = {
  id: string
  subject: string
  status: 'pending' | 'in_progress' | 'completed'
}

declare module 'claude-code' {
  interface PluginState {
    'roadmap-status-mod': {
      view: Shaped<PaneView | null>
      tasks: Shaped<AgentTask[]>
      activePlan: Shaped<string | null>
    }
  }
}
