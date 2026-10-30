import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { AgentTask, OffroadView, PaneView, PhaseView, PlanView, RoadmapView } from '../types'
import { clean, dirname, joinPath, matchPhase, parsePlan } from './plan'
import type { ParsedPlan, Phase } from './plan'

const PANE = 'roadmap-status-mod'
const TITLE = 'Plan'
const POLL_MS = 4000
const ROADMAPS = ['ROADMAP.md', 'PLAN.md', 'docs/ROADMAP.md', 'openspec/ROADMAP.md']
const PLAN_DIRS = ['docs/superpowers/plans', 'docs/plans']
const PLAN_FILE = /\/docs\/(?:superpowers\/)?plans\/[^/]+\.md$/
const OPENSPEC_FILE = /^(.*\/openspec\/changes\/(?!archive\/)[^/]+)\/(?:tasks|proposal|design)\.md$/
const FILE_TOOLS = new Set(['Read', 'Edit', 'Write', 'MultiEdit'])

const view = atom({ plugin: 'roadmap-status-mod', key: 'view' } as const, null as PaneView | null, {
  shape: 'view-2',
})
const tasks = atom({ plugin: 'roadmap-status-mod', key: 'tasks' } as const, [] as AgentTask[], {
  shape: 'tasks-1',
})
const activePlan = atom({ plugin: 'roadmap-status-mod', key: 'activePlan' } as const, null as string | null, {
  shape: 'active-1',
})

type $ = EngineInterface
type Cached = { plan: ParsedPlan; mtimeMs: number }
type Built = { view: PlanView; abs: string; mtimeMs: number }

const cache = new Map<string, Cached>()
let lastKey = ''
let running: Promise<void> | undefined
let isDirty = false

// ROADMAP.md, PLAN.md, or a roadmap beside the plans (2026-10-29-stage-1-roadmap.md).
const isRoadmapFile = (path: string) => /(?:^|\/)(?:[^/]*roadmap[^/]*|plan)\.md$/i.test(path)

// A plan the agent reads or edits: a Superpowers plan, or an OpenSpec change
// (its proposal and design count, the progress is in its tasks.md).
function planFileOf(path: string): string | undefined {
  if (isRoadmapFile(path)) return undefined
  if (PLAN_FILE.test(path)) return path
  const change = OPENSPEC_FILE.exec(path)
  return change?.[1] ? `${change[1]}/tasks.md` : undefined
}

// Inside the project as a relative path; a sibling worktree as
// `maya-wt-today/docs/...`.
function shown(path: string, root: string): string {
  const parent = dirname(root)
  if (path.startsWith(`${root}/`)) return path.slice(root.length + 1)
  if (parent !== '/' && path.startsWith(`${parent}/`)) return path.slice(parent.length + 1)
  return path
}

async function readPlan($: $, path: string): Promise<Cached | undefined> {
  const stat = await $.fs.stat(path).catch(() => undefined)
  if (!stat || stat.kind !== 'file') return undefined
  const hit = cache.get(path)
  if (hit && hit.mtimeMs === stat.mtimeMs) return hit
  const text = await $.fs.read(path).catch(() => undefined)
  if (typeof text !== 'string') return undefined
  const entry = { plan: parsePlan(text, { tables: isRoadmapFile(path) }), mtimeMs: stat.mtimeMs }
  cache.set(path, entry)
  return entry
}

// A link to an OpenSpec change folder means its tasks.md; links are tried
// relative to the roadmap first, then to the project root.
async function resolveLink($: $, from: string, target: string, root: string) {
  const toFile = (p: string) => (/\.md$/i.test(p) ? p : joinPath(p, 'tasks.md'))
  for (const path of [toFile(joinPath(dirname(from), target)), toFile(joinPath(root, target))]) {
    if (await $.fs.exists(path)) return path
  }
  return undefined
}

function titleFor(path: string, plan: ParsedPlan): string {
  const change = /openspec\/changes\/([^/]+)\/tasks\.md$/.exec(path)
  if (change?.[1]) return change[1]
  return plan.title ?? path.split('/').pop()!.replace(/\.md$/i, '')
}

const openTasks = (phase: Phase) => phase.tasks.filter(t => !t.isDone).map(t => t.text)
const doneCount = (phase: Phase) => phase.tasks.filter(t => t.isDone).length
const firstOpen = (phases: PhaseView[]) => phases.findIndex(p => p.done < p.total)

async function buildView($: $, abs: string, source: PlanView['source'], root: string) {
  const own = await readPlan($, abs)
  if (!own) return undefined
  let mtimeMs = own.mtimeMs
  const phases: PhaseView[] = []

  for (const phase of own.plan.phases) {
    const childPath = phase.link ? await resolveLink($, abs, phase.link, root) : undefined
    const child = childPath ? await readPlan($, childPath) : undefined
    if (childPath && child && child.plan.phases.length > 0) {
      mtimeMs = Math.max(mtimeMs, child.mtimeMs)
      const all = child.plan.phases
      const current = all.find(p => p.tasks.some(t => !t.isDone))
      phases.push({
        title: phase.title,
        done: all.reduce((n, p) => n + doneCount(p), 0),
        total: all.reduce((n, p) => n + p.tasks.length, 0),
        sub: current?.title,
        link: childPath,
        group: phase.group,
        open: current ? openTasks(current) : [],
      })
      continue
    }
    phases.push({
      title: phase.title,
      done: doneCount(phase),
      total: phase.tasks.length,
      open: openTasks(phase),
      group: phase.group,
    })
  }

  const view: PlanView = {
    path: shown(abs, root),
    title: clean(titleFor(abs, own.plan)),
    source,
    phases,
    current: firstOpen(phases),
  }
  return view.phases.length > 0 ? { view, abs, mtimeMs } : undefined
}

async function candidates($: $, root: string): Promise<string[]> {
  const paths: string[] = []
  const changes = joinPath(root, 'openspec/changes')
  for (const entry of await $.fs.list(changes).catch(() => [])) {
    if (entry.kind === 'dir' && entry.name !== 'archive') paths.push(`${changes}/${entry.name}/tasks.md`)
  }
  for (const dir of PLAN_DIRS.map(d => joinPath(root, d))) {
    for (const entry of await $.fs.list(dir).catch(() => [])) {
      if (entry.kind === 'file' && /\.md$/i.test(entry.name) && !isRoadmapFile(entry.name)) paths.push(`${dir}/${entry.name}`)
    }
  }
  return paths
}

// The most recently edited plan with open work.
async function autoPick($: $, root: string): Promise<Built | undefined> {
  const built: Built[] = []
  for (const path of await candidates($, root)) {
    const one = await buildView($, path, 'auto', root)
    if (one) built.push(one)
  }
  const open = built.filter(b => b.view.current >= 0)
  const pool = open.length > 0 ? open : built
  pool.sort((a, b) => b.mtimeMs - a.mtimeMs)
  return pool[0]
}

// The usual roadmap paths first, else the newest roadmap beside the plans.
async function findRoadmap($: $, root: string): Promise<Built | undefined> {
  for (const rel of ROADMAPS) {
    const one = await buildView($, joinPath(root, rel), 'auto', root)
    if (one) return one
  }
  const beside: Built[] = []
  for (const dir of PLAN_DIRS.map(d => joinPath(root, d))) {
    for (const entry of await $.fs.list(dir).catch(() => [])) {
      if (entry.kind !== 'file' || !isRoadmapFile(entry.name)) continue
      const one = await buildView($, `${dir}/${entry.name}`, 'auto', root)
      if (one) beside.push(one)
    }
  }
  return beside.sort((a, b) => b.mtimeMs - a.mtimeMs)[0]
}

function roadmapSummary(road: PlanView): RoadmapView {
  return {
    path: road.path,
    title: road.title,
    done: road.phases.filter(p => p.total > 0 && p.done === p.total).length,
    total: road.phases.length,
    current: road.current,
    currentTitle: road.phases[road.current]?.title,
  }
}

// The agent's task list marks a phase done once every task matched to it is
// completed (remembered per plan across sessions), moves the current phase to
// the one in progress, and anything matching no phase is off-road.
async function withAgentTasks($: $, plan: Built | undefined, list: AgentTask[]) {
  const titles = plan?.view.phases.map(p => p.title) ?? []
  const byPhase = new Map<number, AgentTask[]>()
  const offroad: AgentTask[] = []
  const groups = [...new Set(plan?.view.phases.flatMap(p => (p.group ? [p.group] : [])) ?? [])]
  for (const task of list) {
    const index = matchPhase(task.subject, titles)
    // "Phase 4 review" works on the plan too, just not on one task of it.
    if (index < 0 && matchPhase(task.subject, groups) >= 0) continue
    if (index < 0) offroad.push(task)
    else byPhase.set(index, [...(byPhase.get(index) ?? []), task])
  }

  let result: PlanView | undefined
  if (plan) {
    const key = `done:${plan.abs}`
    const stored = await $.store.get(key)
    const done = new Set(Array.isArray(stored) ? stored.filter(s => typeof s === 'string') : [])
    const before = JSON.stringify([...done].sort())
    let active = -1
    for (const [index, matched] of byPhase) {
      const title = titles[index] ?? ''
      if (matched.every(t => t.status === 'completed')) done.add(title)
      else done.delete(title)
      if (active < 0 && matched.some(t => t.status === 'in_progress')) active = index
    }
    if (JSON.stringify([...done].sort()) !== before) await $.store.set(key, [...done])

    const phases = plan.view.phases.map(p =>
      done.has(p.title) && p.done < p.total ? { ...p, done: p.total, open: [] } : p,
    )
    const isActiveOpen = active >= 0 && (phases[active]?.done ?? 0) < (phases[active]?.total ?? 0)
    const current = isActiveOpen ? active : firstOpen(phases)
    result = { ...plan.view, current, phases: phases.map((p, i) => (i === current ? p : { ...p, open: [] })) }
  }

  const open = offroad.filter(t => t.status !== 'completed')
  const offroadView: OffroadView | undefined =
    open.length === 0
      ? undefined
      : {
          done: offroad.length - open.length,
          total: offroad.length,
          active: open.find(t => t.status === 'in_progress')?.subject,
          open: open.filter(t => t.status !== 'in_progress').map(t => t.subject),
        }
  return { plan: result, offroad: offroadView }
}

const pinKey = (root: string) => `pin:${root}`

// One refresh at a time; a call during one runs it again after, so the
// last tool call's change is always drawn.
function refresh($: $): Promise<void> {
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

async function refreshOnce($: $): Promise<void> {
  try {
    const root = await $.session.root()
    const pinned = await $.store.get(pinKey(root))
    const touched = await read($, activePlan)
    const road = await findRoadmap($, root)

    let plan: Built | undefined
    if (typeof pinned === 'string') plan = await buildView($, joinPath(root, pinned), 'pinned', root)
    if (!plan && touched) plan = await buildView($, touched, 'agent', root)
    const slice = road?.view.phases[road.view.current]?.link
    if (!plan && slice) plan = await buildView($, slice, 'roadmap', root)
    if (!plan) plan = await autoPick($, root)
    if (!plan && road) plan = road

    const agent = await withAgentTasks($, plan, await read($, tasks))
    const next: PaneView | null =
      !agent.plan && !agent.offroad && !road
        ? null
        : {
            roadmap: road && road.abs !== plan?.abs ? roadmapSummary(road.view) : undefined,
            plan: agent.plan,
            offroad: agent.offroad,
          }
    const key = JSON.stringify(next)
    if (key !== lastKey) {
      lastKey = key
      await update($, view, () => next)
    }
  } catch (error) {
    $.ui.log(`roadmap-status-mod: ${String(error)}`)
  }
}

type Todo = { content: string; status: AgentTask['status'] }
const STATUSES: readonly AgentTask['status'][] = ['pending', 'in_progress', 'completed']

// Keeps the main agent's task list (TodoWrite, or the Task tools) and which
// plan any agent of this session last read or edited.
async function track($: $, e: { tool: string; agentId?: string } & Record<string, unknown>, output: unknown) {
  const filePath = e.file_path
  if (FILE_TOOLS.has(e.tool) && typeof filePath === 'string') {
    const plan = planFileOf(filePath)
    if (plan) await update($, activePlan, () => plan)
  }
  const ran = output as { result?: Record<string, unknown>; isError?: boolean; deny?: string }
  if (e.agentId !== undefined || ran.deny !== undefined || ran.isError || !ran.result) return
  const result = ran.result

  if (e.tool === 'TodoWrite' && Array.isArray(e.todos)) {
    const todos = (e.todos as Todo[]).map((t, i) => ({ id: `todo:${i}`, subject: t.content, status: t.status }))
    await update($, tasks, list => [...list.filter(t => !t.id.startsWith('todo:')), ...todos])
  } else if (e.tool === 'TaskCreate' && typeof e.subject === 'string') {
    const id = (result.task as { id?: string } | undefined)?.id
    const subject = e.subject
    if (id) await update($, tasks, list => [...list.filter(t => t.id !== id), { id, subject, status: 'pending' as const }])
  } else if (e.tool === 'TaskUpdate' && typeof e.taskId === 'string') {
    const taskId = e.taskId
    const status = STATUSES.find(s => s === e.status)
    const subject = typeof e.subject === 'string' ? e.subject : undefined
    await update($, tasks, list =>
      e.status === 'deleted'
        ? list.filter(t => t.id !== taskId)
        : list.map(t =>
            t.id === taskId ? { ...t, subject: subject ?? t.subject, status: status ?? t.status } : t,
          ),
    )
  } else if (e.tool === 'TaskList' && Array.isArray(result.tasks)) {
    const listed = (result.tasks as AgentTask[]).map(({ id, subject, status }) => ({ id, subject, status }))
    await update($, tasks, list => [...list.filter(t => t.id.startsWith('todo:')), ...listed])
  }
}

function bar(done: number, total: number, width: number): string {
  const filled = total === 0 ? 0 : Math.round((done / total) * width)
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

const percent = (done: number, total: number) => (total === 0 ? 0 : Math.round((done / total) * 100))

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'roadmap-status',
      description: 'Show plan progress; pass a path to pin a plan, or "auto" to follow the agent and latest plan',
    })
    const result = await next(e)
    await refresh($)
    if (lastKey !== 'null') void $.ui.open({ id: PANE, title: TITLE })
    $.clock.every(POLL_MS, () => void refresh($))

    return result
  })

  on('command.run', { command: 'roadmap-status' }, async ($, e) => {
    const arg = e.args.trim()
    const root = await $.session.root()
    let text = 'Plan pane opened.'
    if (arg === 'auto') {
      await $.store.delete(pinKey(root))
      await update($, activePlan, () => null)
      text = 'Following the plan the agent works from, else the most recently edited one.'
    } else if (arg !== '') {
      const abs = joinPath(root, arg)
      const stat = await $.fs.stat(abs).catch(() => undefined)
      if (!stat) return { text: `No file or folder at ${arg}.` }
      const path = stat.kind === 'dir' ? joinPath(abs, 'tasks.md') : abs
      if (!(await $.fs.exists(path))) return { text: `No tasks.md in ${arg}.` }
      await $.store.set(pinKey(root), path)
      text = `Pinned ${shown(path, root)}. Run /roadmap-status auto to follow the agent again.`
    }
    await refresh($)
    await $.ui.open({ id: PANE, title: TITLE })

    return { text }
  })

  // Any tool may have ticked a box (Edit, Write, a sed in Bash): look again.
  on('tool.call', async ($, e, next) => {
    const result = await next(e)
    await track($, e as never, result).catch(() => undefined)
    void refresh($).catch(() => undefined)

    return result
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const pane = await read($, view)
    const columns = e.viewport?.columns ?? 40
    const rows = e.viewport?.rows ?? 24

    if (!pane) {
      return (
        <Box flexDirection="column">
          <Text dimColor>No plan found.</Text>
          <Text dimColor>
            Follows the plan the agent reads, else looks in openspec/changes, docs/superpowers/plans and
            ROADMAP.md. Pin any markdown file with /roadmap-status &lt;path&gt;.
          </Text>
        </Box>
      )
    }

    const { roadmap, plan, offroad } = pane
    const width = Math.max(8, Math.min(32, columns - 12))
    const offroadRoom = 3
    const offroadShown = offroad?.open.slice(0, offroadRoom) ?? []
    const used =
      (roadmap ? 3 : 0) +
      (offroad ? 3 + (offroad.active ? 1 : 0) + offroadShown.length + (offroad.open.length > offroadShown.length ? 1 : 0) : 0)
    const left = Math.max(8, rows - used)

    const roadmapBlock = roadmap && (
      <Box flexDirection="column">
        <Box justifyContent="space-between" gap={1}>
          <Text dimColor wrap="truncate-end">
            {roadmap.title}
          </Text>
          <Text dimColor>
            {roadmap.done}/{roadmap.total}
          </Text>
        </Box>
        <Text wrap="truncate-end">
          <Text color="claude">{bar(roadmap.done, roadmap.total, 10)}</Text>{' '}
          {roadmap.current >= 0 ? `▶ ${roadmap.currentTitle}` : 'All slices done'}
        </Text>
        <Text> </Text>
      </Box>
    )

    const offroadBlock = offroad && (
      <Box flexDirection="column">
        <Text weight="bold" color="warning">
          ⤳ Off-road <Text dimColor>· agent tasks outside this plan</Text>
        </Text>
        <Text>
          {'  '}
          <Text color="warning">{bar(offroad.done, offroad.total, Math.max(6, width - 4))}</Text> {offroad.done}/
          {offroad.total}
        </Text>
        {offroad.active && (
          <Text wrap="truncate-end">
            {'  '}▶ {offroad.active}
          </Text>
        )}
        {offroadShown.map(task => (
          <Text wrap="truncate-end">
            {'  '}□ {task}
          </Text>
        ))}
        {offroad.open.length > offroadShown.length && (
          <Text dimColor>  … {offroad.open.length - offroadShown.length} more</Text>
        )}
        <Text> </Text>
      </Box>
    )

    if (!plan) {
      return (
        <Box flexDirection="column">
          {roadmapBlock}
          {offroadBlock}
        </Box>
      )
    }

    const { phases, current } = plan
    const done = phases.reduce((n, p) => n + p.done, 0)
    const total = phases.reduce((n, p) => n + p.total, 0)
    const active = current >= 0 ? phases[current] : undefined
    const isDoneP = (p: PhaseView) => p.total > 0 && p.done === p.total

    // A nested plan lists its phase headings, opening only the one in
    // progress to show its tasks; a flat plan lists every phase.
    type Entry =
      | { kind: 'group'; title: string; done: number; total: number; isActive: boolean }
      | { kind: 'phase'; index: number; isNested: boolean }
    const groups = [...new Set(phases.flatMap(p => (p.group ? [p.group] : [])))]
    const entries: Entry[] = []
    for (const [index, p] of phases.entries()) {
      if (!p.group) {
        entries.push({ kind: 'phase', index, isNested: false })
        continue
      }
      if (!entries.some(en => en.kind === 'group' && en.title === p.group)) {
        const members = phases.filter(q => q.group === p.group)
        const title = p.group
        entries.push({ kind: 'group', title, done: members.filter(isDoneP).length, total: members.length, isActive: title === active?.group })
      }
      if (p.group === active?.group) entries.push({ kind: 'phase', index, isNested: true })
    }

    // Rows: 5 header, the current phase's block, then as many neighbours as fit.
    const openRoom = Math.max(3, Math.floor((left - 10) / 2))
    const openShown = active ? active.open.slice(0, openRoom) : []
    const activeRows = active ? 2 + (active.sub ? 1 : 0) + openShown.length + 1 : 0
    const room = Math.max(2, left - 5 - activeRows - 2)
    const anchorAt = entries.findIndex(en => en.kind === 'phase' && en.index === current)
    const anchor = anchorAt >= 0 ? anchorAt : entries.length
    const beforeRoom = Math.min(anchor, Math.max(1, Math.floor(room / 3)))
    const from = anchor - beforeRoom
    const to = Math.min(entries.length, anchor + 1 + (room - beforeRoom))
    const origin = plan.source === 'pinned' ? 'pinned · ' : plan.source === 'agent' ? 'in use · ' : ''

    // Count in the plan's own words: Superpowers' "Task 16" holds steps.
    const wordOf = (title: string | undefined, fallback: string) =>
      /^(task|phase|slice|stage|milestone|part|wave|sprint|epic)\b/i.exec(title ?? '')?.[1]?.toLowerCase() ?? fallback
    const capital = (w: string) => w[0]!.toUpperCase() + w.slice(1)
    const word = wordOf(phases[0]?.title, 'phase')
    const unit = word === 'task' ? 'steps' : 'tasks'
    const groupAt = active?.group ? groups.indexOf(active.group) : -1
    const where = [
      groupAt >= 0 ? `${capital(wordOf(active?.group, 'phase'))} ${groupAt + 1} of ${groups.length}` : undefined,
      `${capital(word)} ${current + 1} of ${phases.length}`,
      `${done}/${total} ${unit}`,
    ]

    const row = (entry: Entry) => {
      if (entry.kind === 'group') {
        const isDone = entry.total > 0 && entry.done === entry.total
        const mark = entry.isActive ? '▾' : isDone ? '✓' : entry.done > 0 ? '◐' : '○'
        return (
          <Box justifyContent="space-between" gap={1}>
            <Text
              color={isDone && !entry.isActive ? 'success' : undefined}
              dimColor={!isDone && !entry.isActive}
              weight={entry.isActive ? 'bold' : undefined}
              wrap="truncate-end"
            >
              {mark} {entry.title}
            </Text>
            <Text dimColor>
              {entry.done}/{entry.total}
            </Text>
          </Box>
        )
      }
      const p = phases[entry.index]!
      const isDone = isDoneP(p)
      const mark = isDone ? '✓' : p.done > 0 ? '◐' : '○'
      return (
        <Box justifyContent="space-between" gap={1}>
          <Text color={isDone ? 'success' : undefined} dimColor={!isDone} wrap="truncate-end">
            {entry.isNested ? '  ' : ''}
            {mark} {p.title}
          </Text>
          <Text dimColor>
            {p.done}/{p.total}
          </Text>
        </Box>
      )
    }
    const indent = active?.group ? '  ' : ''

    return (
      <Box flexDirection="column">
        {roadmapBlock}
        {offroadBlock}
        <Text weight="bold" wrap="truncate-end">
          {plan.title}
        </Text>
        <Text dimColor wrap="truncate-start">
          {origin}
          {plan.path}
        </Text>
        <Text>
          <Text color="claude">{bar(done, total, width)}</Text> {percent(done, total)}%
        </Text>
        <Text dimColor wrap="truncate-end">
          {active ? where.filter(Boolean).join(' · ') : `All ${phases.length} ${word}s done · ${done}/${total} ${unit}`}
        </Text>
        <Text> </Text>
        {from > 0 && <Text dimColor>  … {from} earlier</Text>}
        {entries.slice(from, anchor).map(row)}
        {active && (
          <Box flexDirection="column">
            <Text weight="bold" color="warning" wrap="truncate-end">
              {indent}▶ {active.title}
            </Text>
            <Text>
              {indent}
              {'  '}
              <Text color="warning">{bar(active.done, active.total, Math.max(6, width - 4))}</Text>{' '}
              {active.done}/{active.total}
            </Text>
            {active.sub && (
              <Text dimColor wrap="truncate-end">
                {indent}
                {'  '}↳ {active.sub}
              </Text>
            )}
            {openShown.map(task => (
              <Text wrap="truncate-end">
                {indent}
                {'  '}□ {task}
              </Text>
            ))}
            {active.open.length > openShown.length && (
              <Text dimColor>
                {indent}  … {active.open.length - openShown.length} more open
              </Text>
            )}
          </Box>
        )}
        {entries.slice(anchor + 1, to).map(row)}
        {to < entries.length && <Text dimColor>  … {entries.length - to} more</Text>}
      </Box>
    )
  })
}
