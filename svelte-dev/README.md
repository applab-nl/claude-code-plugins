# Svelte-Dev Plugin

**Svelte 5 Development Specialist** - A comprehensive Claude Code plugin that provides expert Svelte 5 development capabilities with integrated MCP server for documentation access, static code analysis, and comprehensive runes expertise.

## Overview

The Svelte-Dev plugin enhances your Svelte 5 development workflow by:
- Providing a specialized **svelte-specialist** agent with deep Svelte 5 runes knowledge
- Integrating the **@sveltejs/mcp** server for documentation and code analysis
- Enabling static code analysis with svelte-autofixer
- Offering instant access to Svelte 5 and SvelteKit documentation
- Ensuring code quality through automated validation

## Features

### ⚡ Specialized Svelte 5 Agent

The **svelte-specialist** agent automatically activates when working in Svelte projects and provides:
- **Runes Expertise**: Deep knowledge of Svelte 5's new reactivity system
- **Fine-Grained Reactivity**: $state, $derived, $effect, $props, $bindable
- **SvelteKit Patterns**: File-based routing, data loading, form actions
- **Code Quality**: Automatic static analysis before code delivery
- **TypeScript**: Full type safety for all Svelte 5 APIs
- **Performance**: Compiler-based optimization patterns

### 🔧 Integrated MCP Tools

#### 1. list-sections
Discover all available documentation sections:
- Returns titles, use cases, and paths for documentation
- Should be called FIRST when addressing Svelte topics
- Helps navigate comprehensive Svelte 5 and SvelteKit docs

#### 2. get-documentation
Retrieve full documentation content:
- Supports single or multiple section queries
- Access comprehensive Svelte 5 documentation
- Core concepts, advanced patterns, routing, data loading

#### 3. svelte-autofixer
Static code analysis and improvement:
- **CRITICAL**: Runs before delivering ANY Svelte code
- Identifies issues and suggests improvements
- Iterates until no further issues remain
- Essential for code quality assurance

#### 4. playground-link
Generate Svelte Playground links:
- Only after explicit user confirmation
- For sharing examples and demonstrations
- Not for project files

## Installation

### From Marketplace

```bash
/plugin marketplace add applab-nl/claude-code-plugins
/plugin install svelte-dev@applab-plugins
```

### Manual Installation

1. Clone this repository
2. Copy the `svelte-dev` directory to your Claude Code plugins location
3. The MCP server will be automatically configured when the plugin is enabled

## Requirements

- **Claude Code CLI**
- **Node.js 18+** (for @sveltejs/mcp)
- **Svelte 5** project (or SvelteKit with Svelte 5)

## Usage

### Automatic Agent Activation

The **svelte-specialist** agent automatically activates when:
- Working in a Svelte project (detects `"svelte"` in package.json)
- Files with `.svelte` extension exist
- `svelte.config.js` is present
- SvelteKit project structure detected

### Example Workflows

#### 1. Converting from Svelte 4 to Svelte 5 Runes

```
User: Help me convert this Svelte 4 component to use Svelte 5 runes

svelte-specialist:
I'll help you convert to Svelte 5 runes. Let me first check the documentation.

[Uses list-sections and get-documentation to verify patterns]

Here's your component converted to Svelte 5:

Before (Svelte 4):
```svelte
<script>
  let count = 0;
  $: doubled = count * 2;

  function increment() {
    count += 1;
  }
</script>
```

After (Svelte 5):
```svelte
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);

  function increment() {
    count += 1;
  }
</script>
```

[Runs svelte-autofixer to validate the code]

✓ Code validated with no issues!
```

#### 2. Creating Reactive State with $state and $derived

```
User: Create a shopping cart component with reactive totals

svelte-specialist:
I'll create a shopping cart with Svelte 5 runes for reactive state management.

[Consults documentation for best practices]

```svelte
<script lang="ts">
  interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }

  let items = $state<CartItem[]>([
    { id: '1', name: 'Apple', price: 1.99, quantity: 3 },
    { id: '2', name: 'Banana', price: 0.99, quantity: 5 }
  ]);

  // Derived values automatically update
  let subtotal = $derived(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  let tax = $derived(subtotal * 0.1);
  let total = $derived(subtotal + tax);

  function updateQuantity(id: string, quantity: number) {
    const item = items.find(i => i.id === id);
    if (item) item.quantity = quantity;
  }

  function removeItem(id: string) {
    items = items.filter(i => i.id !== id);
  }
</script>

<div class="cart">
  {#each items as item (item.id)}
    <div class="cart-item">
      <span>{item.name}</span>
      <span>${item.price}</span>
      <input
        type="number"
        value={item.quantity}
        oninput={(e) => updateQuantity(item.id, +e.currentTarget.value)}
      />
      <button onclick={() => removeItem(item.id)}>Remove</button>
    </div>
  {/each}

  <div class="totals">
    <p>Subtotal: ${subtotal.toFixed(2)}</p>
    <p>Tax: ${tax.toFixed(2)}</p>
    <p><strong>Total: ${total.toFixed(2)}</strong></p>
  </div>
</div>
```

[Runs svelte-autofixer]

✓ Code validated successfully!
```

#### 3. Using svelte-autofixer for Code Quality

```
User: Check this component for issues

svelte-specialist:
I'll analyze your code with svelte-autofixer.

[Runs svelte-autofixer on the provided code]

Found 2 issues:
1. Missing type annotation for props
2. Event handler could be simplified

Here's the improved code:

```svelte
<script lang="ts">
  interface Props {
    count: number;
    onIncrement?: () => void;
  }

  let { count, onIncrement }: Props = $props();
</script>

<button onclick={onIncrement}>
  Count: {count}
</button>
```

[Runs svelte-autofixer again]

✓ No issues found! Code is ready.
```

#### 4. Building SvelteKit Routes with Load Functions

```
User: Create a blog post page that loads data from the server

svelte-specialist:
I'll create a SvelteKit route with server-side data loading.

[Checks documentation for load function patterns]

```typescript
// src/routes/blog/[slug]/+page.server.ts
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  const post = await db.post.findUnique({
    where: { slug: params.slug },
    include: { author: true, comments: true }
  });

  if (!post) {
    error(404, 'Post not found');
  }

  return {
    post
  };
};
```

```svelte
<!-- src/routes/blog/[slug]/+page.svelte -->
<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<article>
  <h1>{data.post.title}</h1>
  <p>By {data.post.author.name}</p>
  <div>{@html data.post.content}</div>

  <section class="comments">
    <h2>Comments ({data.post.comments.length})</h2>
    {#each data.post.comments as comment}
      <div class="comment">
        <strong>{comment.author}</strong>
        <p>{comment.text}</p>
      </div>
    {/each}
  </section>
</article>
```

[Validates with svelte-autofixer]

✓ Code validated!
```

#### 5. Creating Rune-Based Stores

```
User: Create a reusable counter store with history

svelte-specialist:
I'll create a rune-based store in a .svelte.ts file.

```typescript
// lib/stores/counter.svelte.ts
export function createCounter(initial = 0) {
  let count = $state(initial);
  let history = $state<number[]>([]);

  let doubled = $derived(count * 2);
  let isEven = $derived(count % 2 === 0);

  return {
    get count() {
      return count;
    },
    get doubled() {
      return doubled;
    },
    get isEven() {
      return isEven;
    },
    get history() {
      return history;
    },
    increment() {
      history.push(count);
      count++;
    },
    decrement() {
      history.push(count);
      count--;
    },
    reset() {
      count = initial;
      history = [];
    }
  };
}
```

Usage:
```svelte
<script>
  import { createCounter } from '$lib/stores/counter.svelte';

  const counter = createCounter(0);
</script>

<button onclick={() => counter.increment()}>
  Count: {counter.count} (Doubled: {counter.doubled})
</button>

<p>Is even: {counter.isEven}</p>

<h3>History:</h3>
<ul>
  {#each counter.history as value}
    <li>{value}</li>
  {/each}
</ul>
```

[Runs svelte-autofixer]

✓ Store validated successfully!
```

## MCP Tools Reference

### list-sections

**Discover available documentation sections**

```typescript
// Call at conversation start
mcp__svelte__list_sections()

// Returns: Array of {title, useCase, path}
```

### get-documentation

**Retrieve documentation content**

```typescript
// Single section
mcp__svelte__get_documentation(sections: ["runes"])

// Multiple sections
mcp__svelte__get_documentation(sections: ["runes", "sveltekit-routing", "load-functions"])
```

### svelte-autofixer

**Static code analysis (REQUIRED before code delivery)**

```typescript
mcp__svelte__svelte_autofixer(code: `
<script>
  let count = $state(0);
</script>

<button onclick={() => count++}>
  Count: {count}
</button>
`)
```

### playground-link

**Generate playground links (requires user approval)**

```typescript
// Only after user confirms
mcp__svelte__playground_link(code: "...")
```

## Svelte 5 Runes Guide

### $state - Reactive State

```typescript
<script>
  // Primitives
  let count = $state(0);
  let message = $state('Hello');

  // Objects
  let user = $state({ name: 'Alice', age: 30 });

  // Arrays
  let items = $state([1, 2, 3]);

  function increment() {
    count++; // Direct mutation works
  }

  function updateUser() {
    user.age++; // Direct mutation works
  }
</script>
```

### $derived - Computed Values

```typescript
<script>
  let count = $state(0);

  // Simple derivation
  let doubled = $derived(count * 2);

  // Complex derivation
  let items = $state([1, 2, 3, 4, 5]);
  let evenItems = $derived(items.filter(n => n % 2 === 0));
  let sum = $derived(items.reduce((a, b) => a + b, 0));
</script>
```

### $effect - Side Effects

```typescript
<script>
  let count = $state(0);

  $effect(() => {
    console.log('Count:', count);
    document.title = `Count: ${count}`;

    // Cleanup
    return () => {
      console.log('Cleanup');
    };
  });
</script>
```

### $props - Component Props

```typescript
<script lang="ts">
  interface Props {
    title: string;
    count?: number;
    onUpdate?: (value: number) => void;
  }

  let {
    title,
    count = 0,
    onUpdate
  }: Props = $props();
</script>

<h1>{title}</h1>
<p>Count: {count}</p>
```

### $bindable - Two-Way Binding

**Child:**
```typescript
<script>
  let { value = $bindable(0) } = $props();
</script>

<button onclick={() => value++}>
  {value}
</button>
```

**Parent:**
```typescript
<script>
  let count = $state(0);
</script>

<Counter bind:value={count} />
<p>From parent: {count}</p>
```

## SvelteKit Patterns

### File-Based Routing

```
src/routes/
├── +page.svelte              # /
├── +layout.svelte            # Root layout
├── about/+page.svelte        # /about
├── blog/
│   ├── +page.svelte          # /blog
│   ├── +page.server.ts       # Server load
│   └── [slug]/
│       └── +page.svelte      # /blog/[slug]
└── api/
    └── posts/+server.ts      # /api/posts
```

### Data Loading

```typescript
// +page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  return {
    post: await db.post.findUnique({ where: { slug: params.slug } })
  };
};
```

### Form Actions

```typescript
// +page.server.ts
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const title = data.get('title') as string;

    if (!title) {
      return fail(400, { error: 'Title required' });
    }

    await db.post.create({ data: { title } });
  }
};
```

## Best Practices

### 1. Always Use svelte-autofixer

Run before presenting any Svelte code to ensure quality:
```typescript
mcp__svelte__svelte_autofixer(code: "...")
```

### 2. Consult Documentation

Use list-sections and get-documentation for uncertain patterns:
```typescript
mcp__svelte__list_sections()
mcp__svelte__get_documentation(sections: ["runes"])
```

### 3. Use Runes (Not Legacy Syntax)

**Don't:**
```svelte
<script>
  let count = 0;
  $: doubled = count * 2;
</script>
```

**Do:**
```svelte
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);
</script>
```

### 4. Type Everything

```typescript
<script lang="ts">
  interface Props {
    title: string;
    count?: number;
  }

  let { title, count = 0 }: Props = $props();
</script>
```

### 5. Follow SvelteKit Conventions

- Use `+page.svelte` for pages
- Use `+layout.svelte` for layouts
- Use `+page.server.ts` for server-side loading
- Use `+server.ts` for API routes

## Agent Capabilities

The **svelte-specialist** agent knows:

### Svelte 5 Runes
- $state for reactive state
- $derived for computed values
- $effect for side effects
- $props for component props
- $bindable for two-way binding
- $inspect for debugging

### SvelteKit
- File-based routing
- Data loading (load functions)
- Form actions
- API routes
- Layouts and nested routes
- SSR and SSG

### Component Patterns
- Snippets (render blocks)
- Event handling
- Bindings
- Transitions and animations
- Context API

### State Management
- Rune-based stores (.svelte.ts)
- Context API
- When to use each

### TypeScript
- Props types
- Load function types
- Action types
- Component types

## Troubleshooting

### MCP Server Not Starting

If the @sveltejs/mcp server doesn't start:

```bash
# Check Node.js version
node --version  # Should be 18+

# Manually test the MCP server
npx -y @sveltejs/mcp@latest
```

### Agent Not Activating

Ensure your project has:
- `package.json` with `"svelte"` dependency
- `.svelte` files in the project
- Or `svelte.config.js`

### svelte-autofixer Fails

The autofixer requires valid Svelte code. Ensure:
- Proper `<script>` and `<style>` blocks
- Valid HTML in template
- No syntax errors

## Contributing

Contributions are welcome! Please submit issues and pull requests to the main repository.

## License

MIT License - See LICENSE file for details

## Version

Current version: 1.0.0

## Support

For issues, feature requests, or questions:
- GitHub Issues: https://github.com/applab-nl/claude-code-plugins/issues
- Svelte MCP Server: https://svelte.dev/docs/mcp/overview
- Svelte Documentation: https://svelte.dev/docs

## Acknowledgments

This plugin integrates with the official [@sveltejs/mcp](https://svelte.dev/docs/mcp/overview) server created by the Svelte team.
