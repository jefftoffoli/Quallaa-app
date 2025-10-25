# Next.js vs Theia Architecture

## Core Difference

**Next.js** = Web framework for building applications
**Theia** = IDE framework for building development tools

## Architectural Comparison

### Next.js: Restaurant Metaphor

```
Front door → Living room → Kitchen
(Routes)     (Pages)      (API)
```

- Linear flow: users navigate page to page
- Each page is mostly separate
- File-based routing
- Simple request/response

### Theia: Swiss Army Knife Metaphor

```
Main body with slots for attachments
(Core platform)

├─ Blade (extension)
├─ Scissors (extension)
├─ Screwdriver (extension)
└─ Corkscrew (extension)
```

- Everything plugs into central body
- Extensions communicate with each other
- Core doesn't do much without extensions
- Complex widget-based UI

## Communication Patterns

### Next.js: HTTP Requests

```javascript
// Frontend makes HTTP call
const res = await fetch('/api/users')
const data = await res.json()

// Backend handles request
export default function handler(req, res) {
  res.json({ users: [...] })
}
```

**Metaphor:** Making phone calls (stateless, one-off)

### Theia: RPC (Remote Procedure Calls)

```typescript
// Frontend service
@inject(UserBackendService)
protected backend: UserBackendService

async getUsers() {
  return this.backend.getUsers() // Looks like local call!
}
```

**Metaphor:** Walkie-talkie on same frequency (persistent connection)

See: [[Frontend and Backend Communication]]

## Why This Matters for Our Project

Our knowledge-first IDE needs:
- ✅ Persistent connections (for file watching, real-time updates)
- ✅ Widget-based UI (for flexible layouts)
- ✅ Extension system (for progressive disclosure)
- ✅ Desktop + Web support

**Theia provides all of this. Next.js does not.**

## Related Concepts

- [[Dependency Injection in Theia]]
- [[Widget System]]
- [[Frontend and Backend Communication]]
- [[Theia Application Shell]]
