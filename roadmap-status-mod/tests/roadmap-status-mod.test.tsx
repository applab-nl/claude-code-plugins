import { expect, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import { joinPath, matchPhase, parsePlan } from '../hooks/plan'

const OPENSPEC = `# Tasks

## 1. Setup
- [x] 1.1 Create schema
- [x] 1.2 Add migration

## 2. API
- [x] 2.1 Add endpoint
- [ ] 2.2 Validate \`input\`
- [ ] 2.3 Write tests
`

const SUPERPOWERS = `# Auth Implementation Plan

### Task 1: Token store
- [x] **Step 1: Write the failing test**
- [x] **Step 2: Implement**

### Task 2: Refresh flow
- [ ] **Step 1: Write the failing test**

\`\`\`md
- [ ] not a real step
\`\`\`
`

const ROADMAP = `# Roadmap

- [x] [Slice 1: Foundations](openspec/changes/archive/foundations/tasks.md)
- [ ] [Slice 2: Billing](openspec/changes/add-billing/)
- [ ] Slice 3: Polish
`

const TABLE_ROADMAP = `# Roadmap (vertical slices)

| Slice | Outcome | Acceptance |
|---|---|---|
| 0 (done) | Profiles and chat route | 32 tests |
| 1b (done) | Outlook mail | Built against a fake Graph |
| 7 | Breadth | Todoist and Linear |

## Notes
- not a slice
`

const REDESIGN = `# /today redesign Implementation Plan

| Constraint | Why |
|---|---|
| No new deps | size |

### Task 1: Gateway runs user ticks
- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Implement**

### Task 2: Tick API
- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Implement**

### Task 3: Docs and visual check
- [ ] **Step 1: README**
`

const NESTED = `# Board Plan

## Global Constraints
- not a checkbox

## Phase 1: Shared logic
### Task 1: Types
- [x] **Step 1: Test**
- [x] **Step 2: Implement**
### Task 2: Layout
- [x] **Step 1: Test**

## Phase 2: Editing
### Task 3: Cards
- [x] **Step 1: Test**
- [ ] **Step 2: Implement**
### Task 4: Filters
- [ ] **Step 1: Test**

## Notes
### Task 5: Animations
- [ ] **Step 1: Test**
`

test('task headings nest under phase headings until a heading closes the phase', async () => {
  const plan = parsePlan(NESTED)
  expect(plan.phases.map(p => [p.title, p.group])).toEqual([
    ['Task 1: Types', 'Phase 1: Shared logic'],
    ['Task 2: Layout', 'Phase 1: Shared logic'],
    ['Task 3: Cards', 'Phase 2: Editing'],
    ['Task 4: Filters', 'Phase 2: Editing'],
    ['Task 5: Animations', undefined],
  ])
  // Phase headings that hold their own checkboxes stay plain phases.
  expect(parsePlan('## Phase 1\n- [ ] a\n## Phase 2\n- [ ] b\n').phases.map(p => p.group)).toEqual([undefined, undefined])
})

test('a heading loses its closing hashes, long lines and huge files are skipped', async () => {
  const plan = parsePlan(`## Setup ##\n- [ ] a\n## C#\n- [ ] b\n- [ ] ${'x'.repeat(2000)}\n`)
  expect(plan.phases.map(p => [p.title, p.tasks.length])).toEqual([['Setup', 1], ['C#', 1]])
  expect(parsePlan(`## Big\n- [ ] a\n${' '.repeat(1_000_001)}`).phases).toEqual([])
})

test('hostile headings and links parse quickly', async () => {
  const line = `## ${'# '.repeat(400)}${' '.repeat(150)}x`
  const links = `- [ ] ${'[a]('.repeat(240)}`
  const started = Date.now()
  parsePlan(Array.from({ length: 2000 }, (_, i) => (i % 2 ? line : links)).join('\n'))
  expect(Date.now() - started).toBeLessThan(2000)
})

test('OpenSpec headings become phases with their checkboxes', async () => {
  const plan = parsePlan(OPENSPEC)
  expect(plan.phases.map(p => p.title)).toEqual(['1. Setup', '2. API'])
  expect(plan.phases[1]?.tasks.map(t => t.isDone)).toEqual([true, false, false])
  expect(plan.phases[1]?.tasks[1]?.text).toBe('2.2 Validate input')
})

test('Superpowers steps are tasks and fenced checkboxes are ignored', async () => {
  const plan = parsePlan(SUPERPOWERS)
  expect(plan.title).toBe('Auth Implementation Plan')
  expect(plan.phases.map(p => p.tasks.length)).toEqual([2, 1])
  expect(plan.phases[1]?.tasks[0]?.text).toBe('Step 1: Write the failing test')
})

test('a roadmap item linking to a plan is a slice of its own', async () => {
  const plan = parsePlan(ROADMAP)
  expect(plan.phases.map(p => p.link)).toEqual([
    'openspec/changes/archive/foundations/tasks.md',
    'openspec/changes/add-billing/',
    undefined,
  ])
})

test('roadmap table rows are slices, done by their (done) marker', async () => {
  const plan = parsePlan(TABLE_ROADMAP, { tables: true })
  expect(plan.phases.map(p => p.title)).toEqual([
    'Slice 0: Profiles and chat route',
    'Slice 1b: Outlook mail',
    'Slice 7: Breadth',
  ])
  expect(plan.phases.map(p => p.tasks[0]?.isDone)).toEqual([true, true, false])
  expect(parsePlan(REDESIGN).phases.map(p => p.title)).toEqual([
    'Task 1: Gateway runs user ticks',
    'Task 2: Tick API',
    'Task 3: Docs and visual check',
  ])
})

test('an agent task matches a phase by number, else by shared words', async () => {
  const titles = parsePlan(REDESIGN).phases.map(p => p.title)
  expect(matchPhase('Re-review Task 2 fix', titles)).toBe(1)
  expect(matchPhase('Implement Task 3: docs and visual check', titles)).toBe(2)
  expect(matchPhase('Gateway: run user ticks right away', titles)).toBe(0)
  expect(matchPhase('Fix flaky CI on main', titles)).toBe(-1)
  expect(matchPhase('Phase 2 review', titles)).toBe(-1)
  expect(matchPhase('Phase 2 review', ['Phase 1: Logic', 'Phase 2: Server'])).toBe(1)
})

test('paths join relative to the roadmap', async () => {
  expect(joinPath('docs', '../openspec/changes/x/')).toBe('openspec/changes/x')
  expect(joinPath('/p/repo/docs', './a.md')).toBe('/p/repo/docs/a.md')
})

const PANE = {
  plugin: 'roadmap-status-mod',
  component: 'Pane',
  requestId: 'roadmap-status-mod',
  props: {
    title: 'Plan',
    isFocused: false,
    bodyColumns: 50,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

type Files = Record<string, string>

// Stands for the engine: a project at /repo with these files, nothing stored.
function project(on: On, files: Files) {
  const dirs = (path: string) =>
    Object.keys(files)
      .filter(key => key.startsWith(`${path}/`))
      .map(key => key.slice(path.length + 1).split('/'))
      .map(parts => ({ name: parts[0] ?? '', kind: parts.length > 1 ? ('dir' as const) : ('file' as const) }))
  on('command.register', () => ({ value: { command: 'roadmap-status' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.root', () => ({ value: '/p/repo' }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('clock.every', () => ({ value: undefined }))
  on('tool.call', () => ({ result: {} }))
  on('fs.list', (_, e) => ({
    value: dirs(e.path).map(d => ({ ...d, size: 0, mtimeMs: 0, isLink: false })),
  }))
  on('fs.stat', (_, e) =>
    e.path in files
      ? { value: { kind: 'file', size: 1, mtimeMs: 1, isLink: false } }
      : { deny: 'ENOENT' },
  )
  on('fs.exists', (_, e) => ({ value: e.path in files }))
  on('fs.read', (_, e) => ({ value: files[e.path] ?? '' }))
}

const texts = async (ui: { findAll: (q: { type: 'Text' }) => Promise<{ text?: string }[]> }) =>
  (await ui.findAll({ type: 'Text' })).map(t => t.text ?? '')

test('the roadmap sits above the slice it links to', async ($, on) => {
  project(on, {
    '/p/repo/ROADMAP.md': ROADMAP,
    '/p/repo/openspec/changes/add-billing/tasks.md': OPENSPEC,
  })

  await $.session.start({ cwd: '/p/repo', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const all = await texts(ui)

  expect(all).toContain('Roadmap')
  expect(all.find(t => t.includes('▶ Slice 2: Billing'))).toBeDefined()
  expect(all).toContain('add-billing')
  expect(all.find(t => t.startsWith('Phase 2 of 2'))).toContain('3/5 tasks')
  expect(all.find(t => t.includes('2.3 Write tests'))).toContain('□')
  await ui.unmount()
})

test('the plan the agent reads in a worktree is followed, ticked off by its task list', async ($, on) => {
  const plan = '/p/wt-today/docs/superpowers/plans/today-redesign.md'
  project(on, {
    '/p/repo/docs/ROADMAP.md': TABLE_ROADMAP,
    '/p/repo/docs/superpowers/plans/slice-6.md': SUPERPOWERS,
    [plan]: REDESIGN,
  })

  await $.session.start({ cwd: '/p/repo', surface: 'terminal', isInteractive: true })
  await $.tool.call({ tool: 'Read', file_path: plan })
  await $.tool.call({
    tool: 'TodoWrite',
    todos: [
      { content: 'Task 1: Gateway runs user ticks', status: 'completed', activeForm: '' },
      { content: 'Task 2: Tick API', status: 'in_progress', activeForm: '' },
      { content: 'Fix flaky CI on main', status: 'pending', activeForm: '' },
    ],
  })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const all = await texts(ui)

  expect(all.find(t => t.includes('▶ Slice 7: Breadth'))).toBeDefined()
  expect(all).toContain('/today redesign Implementation Plan')
  expect(all).toContain('in use · wt-today/docs/superpowers/plans/today-redesign.md')
  expect(all.find(t => t.startsWith('Task 2 of 3'))).toContain('2/5 steps')
  expect(all).toContain('✓ Task 1: Gateway runs user ticks')
  expect(all).toContain('▶ Task 2: Tick API')
  expect(all.find(t => t.startsWith('⤳ Off-road'))).toBeDefined()
  expect(all.find(t => t.includes('Fix flaky CI on main'))).toContain('□')
  await ui.unmount()
})

test('a nested plan opens the phase in progress and folds the others', async ($, on) => {
  project(on, { '/p/repo/docs/superpowers/plans/board.md': NESTED })

  await $.session.start({ cwd: '/p/repo', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const all = await texts(ui)

  expect(all).toContain('Phase 2 of 2 · Task 3 of 5 · 4/7 steps')
  expect(all).toContain('✓ Phase 1: Shared logic')
  expect(all.find(t => t.includes('Task 1: Types'))).toBeUndefined()
  expect(all).toContain('▾ Phase 2: Editing')
  expect(all).toContain('  ▶ Task 3: Cards')
  expect(all).toContain('  ○ Task 4: Filters')
  expect(all).toContain('○ Task 5: Animations')
  await ui.unmount()
})

test('a roadmap beside the plans is the header, never the plan', async ($, on) => {
  project(on, {
    '/p/repo/docs/superpowers/plans/stage-1-roadmap.md': '# Stage 1 Roadmap\n\n## Phase 1: Logic\n- [x] Task 1\n\n## Phase 2: Editing\n- [ ] Task 3\n',
    '/p/repo/docs/superpowers/plans/board.md': NESTED,
  })

  await $.session.start({ cwd: '/p/repo', surface: 'terminal', isInteractive: true })
  await $.tool.call({ tool: 'Read', file_path: '/p/repo/docs/superpowers/plans/stage-1-roadmap.md' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const all = await texts(ui)

  expect(all).toContain('Stage 1 Roadmap')
  expect(all.find(t => t.includes('▶ Phase 2: Editing'))).toBeDefined()
  expect(all).toContain('Board Plan')
  await ui.unmount()
})

test('without a plan the pane says where it looks', async ($, on) => {
  on('state.get', () => ({ value: { value: undefined, version: 0 } }))
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  expect((await ui.find({ type: 'Text', text: /No plan/ }))?.text).toBe('No plan found.')
  await ui.unmount()
})
