# Singleton

## Intent

Guarantee that a class has exactly one instance, and give everything in the program a way to reach it.

## The Pattern

A class hides its constructor and exposes a static `getInstance()` that lazily creates and returns the one instance.

## Nystrom's actual position

The Singleton chapter is famously titled with the qualifier *"and why you shouldn't use it."* The book's point is that Singleton conflates two separate concerns: (1) "there is only one" and (2) "everybody can reach it globally." You almost always want (2) without committing to (1).

## When (not) to Use It

Most of the time: don't.

- If something only needs to exist once, construct it once at startup and **pass it in**. That's dependency injection, not Singleton.
- If you really need global access to a service, use [Service Locator](./service-locator.md) — it decouples "global access" from "one instance" and lets you swap implementations (fake audio for tests, null-object for missing services, etc.).

Legitimate-ish cases: true singletons of the environment (the browser `window`, `document`, `performance.now`). Even there you don't write a Singleton class; you just use the thing.

## Keep in Mind

- Singletons are global state in a lab coat. They hide coupling in constructors-that-secretly-touch-the-world.
- They make unit tests painful: every test inherits the state of the last one.
- They don't solve concurrency; in JS you dodge threads, but Strict Mode double-invocation + hot reload will surface the same bugs.

## In JS/TS

- `export const foo = new Foo()` at module scope is a module-level singleton. It's still a singleton, even if it doesn't use `getInstance()`. Use with care for the same reasons.
- Prefer a factory at the composition root (e.g. `[src/App.tsx](../../src/App.tsx)` / `[src/components/Game.tsx](../../src/components/Game.tsx)`) that wires dependencies and hands them down.

## In this repo

- **No classic Singleton classes.** The closest thing is the module-level `bridgeStore` in `[src/shared/bridge/store.ts](../../src/shared/bridge/store.ts)` — but that is deliberately framed as a **service locator**, not a Singleton-the-pattern. See `[service-locator.md](./service-locator.md)`.
- Rule for this codebase: **do not introduce new globals.** If a component or system needs a dependency, pass it into the constructor or read it from the bridge.

## Status

`skip-for-now` (as a pattern). The role it usually fills is covered by the bridge store / service locator arrangement.

## See also

- Book chapter: [Singleton](https://gameprogrammingpatterns.com/singleton.html)
- Related: [Service Locator](./service-locator.md), [Subclass Sandbox](./subclass-sandbox.md)