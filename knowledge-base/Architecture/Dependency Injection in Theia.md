# Dependency Injection in Theia

## What It Is

**Dependency Injection (DI)** = Tell the system what you need, and it delivers it to you.

Theia uses **InversifyJS** for dependency injection.

## Next.js Pattern (No DI)

```javascript
// You go get what you need yourself
import { database } from './db'
import { auth } from './auth'

function getUser() {
  return database.query(...)
}
```

**Metaphor:** Ordering at a counter - you get your own food

## Theia Pattern (With DI)

```typescript
@injectable()
export class UserService {
  @inject(DatabaseService)
  protected database: DatabaseService

  @inject(AuthService)
  protected auth: AuthService

  getUser() {
    return this.database.query(...)
  }
}
```

**Metaphor:** Room service - you tell them what you want, they deliver it

## Why Use DI?

### 1. Loose Coupling
Components don't need to know how to create their dependencies

### 2. Easy Testing
Mock dependencies by binding different implementations

### 3. Swappable Implementations
Change what gets injected without changing the code

### 4. Singleton Management
Container ensures only one instance exists (when needed)

## Registration Pattern

```typescript
// Module binds services
export default new ContainerModule(bind => {
  bind(UserService).toSelf().inSingletonScope()
  bind(DatabaseService).to(PostgresDatabase).inSingletonScope()
})

// Theia loads modules and creates container
// Container delivers dependencies when requested
```

## Common Patterns

### Binding to Self
```typescript
bind(UserService).toSelf()
```
Binds the class to itself

### Binding to Implementation
```typescript
bind(DatabaseService).to(PostgresDatabase)
```
Binds interface to concrete implementation

### Singleton Scope
```typescript
.inSingletonScope()
```
Only one instance created and reused

### Factory Binding
```typescript
bind(WidgetFactory).toDynamicValue(ctx => {
  return new MyFactory(ctx.container)
})
```
Creates new instance each time

## Related Concepts

- [[Widget Factories]]
- [[Contribution Points]]
- [[Theia Application Shell]]
- [[How to Use Contribution Points]]
