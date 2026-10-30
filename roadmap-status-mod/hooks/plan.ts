// Pure markdown plan parsing: headings with checkboxes under them are phases,
// and a list item linking to another local markdown file (or an OpenSpec
// change folder) is a slice of its own. In a roadmap, table rows are slices.

export type Task = { text: string; isDone: boolean }
/** `group`: the phase heading ("## Phase 2: Server") a task heading sits under. */
export type Phase = { title: string; tasks: Task[]; link?: string; group?: string }
export type ParsedPlan = { title?: string; phases: Phase[] }
export type ParseOptions = { tables?: boolean }

const HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/
const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s+(?:\[([ xX])\]\s+)?(.*)$/
const LINK = /\[([^\]]+)\]\(<?([^)\s>]+)>?\)/
const FENCE = /^\s*(```|~~~)/
const TABLE_ROW = /^\s*\|(.*)\|\s*$/
const TABLE_RULE = /^[\s|:-]+$/
const DONE_MARK = /\((?:done|complete|completed|shipped)\)|✅|✔|✓|\[x\]/i
const DONE_WORD = /^(?:done|complete|completed|shipped|merged)$/i
const GROUP = /^(?:phase|stage|milestone|part|wave|sprint|epic)\b/i

export function clean(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*|__|`/g, '')
    .trim()
}

function localLink(text: string): { label: string; target: string } | undefined {
  const match = LINK.exec(text)
  if (!match) return undefined
  const target = (match[2] ?? '').split('#')[0] ?? ''
  if (target === '' || /^[a-z][a-z0-9+.-]*:/i.test(target)) return undefined
  const isPlanLike = /\.md$/i.test(target) || !/\.[a-z0-9]+$/i.test(target)
  return isPlanLike ? { label: clean(match[1] ?? ''), target } : undefined
}

const cells = (row: string) => row.split('|').map(cell => cell.trim())

// `| 7 (done) | Breadth | ... |` under `| Slice | Outcome | ... |` reads
// "Slice 7: Breadth", done.
function tableItem(row: string[], header: string[] | undefined): Item | undefined {
  const [first = '', second = ''] = row
  const id = clean(first.replace(DONE_MARK, ''))
  if (id === '' && second === '') return undefined
  const column = header?.[0] ? clean(header[0]) : ''
  const label = column && id.length <= 6 ? `${column} ${id}` : id
  const text = [label, clean(second)].filter(Boolean).join(': ')
  const isDone = row.some(cell => DONE_MARK.test(cell) || DONE_WORD.test(clean(cell)))
  const link = row.map(localLink).find(Boolean)
  return { text, isDone, link: link?.target }
}

type Item = Task & { link?: string }
type Section = { title: string; items: Item[]; isSliced: boolean; group?: string }

// A section that links to other plans, or a roadmap table, lists slices: each
// item is a phase. Any other section is one phase holding its checkboxes.
export function parsePlan(markdown: string, options: ParseOptions = {}): ParsedPlan {
  const sections: Section[] = []
  let title: string | undefined
  let section: Section | undefined
  let isInFence = false
  let header: string[] | undefined
  let isInTable = false
  let group: { title: string; level: number } | undefined

  const current = () => {
    if (!section) {
      section = { title: 'Tasks', items: [], isSliced: false }
      sections.push(section)
    }
    return section
  }

  for (const line of markdown.split(/\r?\n/)) {
    if (FENCE.test(line)) {
      isInFence = !isInFence
      continue
    }
    if (isInFence) continue

    const row = TABLE_ROW.exec(line)
    if (!row) isInTable = false
    if (row && options.tables) {
      const inner = row[1] ?? ''
      if (TABLE_RULE.test(inner)) continue
      if (!isInTable) {
        header = cells(inner)
        isInTable = true
        continue
      }
      const item = tableItem(cells(inner), header)
      if (item) {
        current().items.push(item)
        current().isSliced = true
      }
      continue
    }

    const [, hashes, text] = HEADING.exec(line) ?? []
    if (hashes && text) {
      const name = clean(text)
      const level = hashes.length
      if (level === 1 && title === undefined) title = name
      if (level > 1 && GROUP.test(name)) group = { title: name, level }
      else if (group && level <= group.level) group = undefined
      section = { title: name, items: [], isSliced: false, group: group?.title }
      sections.push(section)
      continue
    }

    const item = LIST_ITEM.exec(line)
    if (!item) continue
    const [, box, body = ''] = item
    const link = localLink(body)
    if (box === undefined && !link) continue
    current().items.push({
      text: clean(body) || (link?.label ?? ''),
      isDone: box === 'x' || box === 'X',
      link: link?.target,
    })
    if (link) current().isSliced = true
  }

  const phases = sections.flatMap((s): Phase[] =>
    s.isSliced
      ? s.items.map(({ link, ...task }) => ({ title: task.text, link, tasks: [task], group: s.group }))
      : [{ title: s.title, tasks: s.items.map(({ text, isDone }) => ({ text, isDone })), group: s.group }],
  ).filter(p => p.tasks.length > 0)

  // Phase headings holding their own checkboxes are plain phases, not groups.
  const isNested = phases.some(p => p.group !== undefined && p.group !== p.title)
  return { title, phases: isNested ? phases : phases.map(({ group: _, ...p }) => p) }
}

const STOP = new Set(
  'the and for with from into that this then task phase slice step steps implement run add fix review dispatch agent'.split(
    ' ',
  ),
)

const words = (text: string) =>
  new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(w => w.length >= 3 && !STOP.has(w)),
  )

type NumberKey = { word?: string; number: string }

// "Task 8", "Phase 2", "Slice 1b", or a leading "2." / "3:" as in OpenSpec.
function numberKey(text: string): NumberKey | undefined {
  const named = /\b(task|phase|slice|stage|milestone)\s*#?\s*(\d+[a-z]?)\b/i.exec(text)
  if (named?.[1] && named[2]) return { word: named[1].toLowerCase(), number: named[2].toLowerCase() }
  const leading = /^\s*(\d+[a-z]?)[.:)]\s/.exec(text)
  return leading?.[1] ? { number: leading[1].toLowerCase() } : undefined
}

// "Phase 4" is not "Task 4"; a bare "2." matches either.
const sameNumber = (a: NumberKey, b: NumberKey | undefined) =>
  b !== undefined && a.number === b.number && (a.word === undefined || b.word === undefined || a.word === b.word)

// Which phase an agent's task works on, by its number first ("Re-review Task
// 8 fix" is Task 8), else by the words it shares with a phase title.
export function matchPhase(subject: string, titles: readonly string[]): number {
  const key = numberKey(subject)
  if (key !== undefined) {
    const byNumber = titles.findIndex(title => sameNumber(key, numberKey(title)))
    if (byNumber >= 0) return byNumber
  }
  const mine = words(subject)
  let best = -1
  let bestScore = 0
  titles.forEach((title, index) => {
    const theirs = words(title)
    const shared = [...mine].filter(w => theirs.has(w)).length
    const score = shared / Math.max(1, Math.min(mine.size, theirs.size))
    const isMatch = (shared >= 2 && score >= 0.5) || (shared >= 1 && score === 1)
    if (isMatch && score > bestScore) {
      best = index
      bestScore = score
    }
  })
  return best
}

export function dirname(path: string): string {
  const cut = path.lastIndexOf('/')
  return cut < 0 ? '.' : cut === 0 ? '/' : path.slice(0, cut)
}

export function joinPath(dir: string, rel: string): string {
  const isAbsolute = rel.startsWith('/') || dir.startsWith('/')
  const base = rel.startsWith('/') ? [] : dir.split('/')
  const out: string[] = []
  for (const part of [...base, ...rel.split('/')]) {
    if (part === '' || part === '.') continue
    if (part === '..' && out.length > 0 && out[out.length - 1] !== '..') out.pop()
    else out.push(part)
  }
  const joined = out.join('/')
  return isAbsolute ? `/${joined}` : joined || '.'
}
