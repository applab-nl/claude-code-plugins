# Shape vocabulary

The recurring cast. A node of a given kind must look identical in every diagram of every document, so a reader never sees a visual difference that does not correspond to a real one.

Assign a class with `:::name`. Never set colour in the diagram.

| Class | Means | Required shape syntax | Renders as |
|---|---|---|---|
| `consumer` | A system that calls us. Outside our boundary, but in scope | `["..."]` rectangle | Warm sand fill, amber border |
| `platform` | The component this document is proposing or is about | `["..."]` rectangle | Blue fill, heavy border. The eye should land here first |
| `service` | An existing service we own | `["..."]` rectangle | Neutral grey |
| `datastore` | Persistence: database, topic, cache, bucket | `[("...")]` cylinder | Green-grey fill |
| `external` | Out of scope, another domain, or not ours to change | `["..."]` rectangle | White fill, dashed border |
| `decision` | A question in a flowchart | `{"..."}` rhombus | White fill, dark border |
| `outcome` | A recommended or accepted end state | `["..."]` rectangle | Green fill |
| `warn` | A rejected option, or an outcome to avoid | `["..."]` rectangle | Red fill |
| `muted` | Background context, deliberately de-emphasised | `["..."]` rectangle | White fill, grey border and grey text |
| `artefact` | Something authored and versioned rather than deployed: content, a definition, a prompt, a spec | `["..."]` rectangle | Violet-grey fill |

## Rules

**At most one `platform` node per diagram.** It is the subject. Two subjects means the diagram is answering two questions and should be two diagrams.

**`warn` is for a rejected option, not for a risk.** A risk belongs in the prose, where it can be qualified. A diagram cannot express "unless the team is funded".

**Colour never carries information on its own.** The class is a shorthand for a label the node should already have. If removing colour makes the diagram ambiguous, the labels are too thin. This also keeps the diagram readable in greyscale print and for colour-blind readers.

**Every node gets a class.** An unclassed node renders in the default grey and will silently read as a `service`. The linter flags these.

## Adding a class

Add it to `themeCSS` in `theme.json` and to the table above, then re-render every document. Never define it inline in one diagram: that is the drift this skill exists to prevent.

Before adding one, check whether an existing class covers it. Ten kinds is already close to the limit of what a reader can hold; a vocabulary that grows per diagram is not a vocabulary.
