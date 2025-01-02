# svelte-keyed

[![NPM version](https://img.shields.io/npm/v/@humanspeak/svelte-keyed.svg)](https://www.npmjs.com/package/@humanspeak/svelte-keyed)
[![Build Status](https://github.com/humanspeak/svelte-keyed/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/humanspeak/svelte-keyed/actions/workflows/npm-publish.yml)
<!-- [![Coverage Status](https://coveralls.io/repos/github/humanspeak/svelte-keyed/badge.svg?branch=main)](https://coveralls.io/github/humanspeak/svelte-keyed?branch=main) -->
[![License](https://img.shields.io/npm/l/@humanspeak/svelte-keyed.svg)](https://github.com/humanspeak/svelte-keyed/blob/main/LICENSE)
<!-- [![Bundle Size](https://img.shields.io/bundlephobia/minzip/@humanspeak/svelte-keyed)](https://bundlephobia.com/package/@humanspeak/svelte-keyed) -->
[![Downloads](https://img.shields.io/npm/dm/@humanspeak/svelte-keyed.svg)](https://www.npmjs.com/package/@humanspeak/svelte-keyed)
[![CodeQL](https://github.com/humanspeak/svelte-keyed/actions/workflows/codeql.yml/badge.svg)](https://github.com/humanspeak/svelte-keyed/actions/workflows/codeql.yml)
<!-- [![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md) -->
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Types](https://img.shields.io/npm/types/@humanspeak/svelte-keyed.svg)](https://www.npmjs.com/package/@humanspeak/svelte-keyed)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/humanspeak/svelte-keyed/graphs/commit-activity)

A **writable** derived store for objects and arrays!

```js
const user = writable({ name: { first: 'Rich', last: 'Harris' } })
const firstName = keyed(user, 'name.first')

$firstName = 'Bryan'

console.log($user) // { name: { first: 'Bryan', last: 'Harris' } };
```

## Installation

```bash
npm i -D @humanspeak/svelte-keyed
```

Since Svelte automatically bundles all required dependencies, you only need to install this package as a dev dependency with the `-D` flag.

## API

`keyed` takes a writable object store and a **keypath**, and returns a writable store whose _changes are reflected on the original store_.

Properties are accessed with dot notation, and arrays can be indexed with bracket notation.

```js
const email = keyed(settings, 'profiles[0].email')
```

### Nullable parents

If the parent store is nullable, then the child store will also be nullable.

```ts
type User = {
    name: {
        first: string
        last: string
    }
    relations: {
        partner?: User
    }
}

const maybeUser = writable<User | undefined>(undefined)
// Writable<string | undefined>
const firstName = keyed(maybeUser, 'name.first')
```

### Nullable properties

Nullable properties are accessed with [optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining) behaviour.

```ts
const user = writable(initUser)
// Writable<Name | undefined>
const partnerName = keyed(user, 'relations.partner.name')
```

### TypeScript

`keyed` infers the return type of the keyed store from the keypath.

```ts
const user = writable(initUser)
// Writable<string>
const firstName = keyed(user, 'name.first')
```

`keyed` will also try to guess all possible keypaths up to a depth limit of 3.

```ts
keyed(user, '...');
            ┌───────────────────────────────┐
            │ • name                        │
            │ • name.first                  │
            │ • name.last                   │
            │ • relations                   │
            │ • relations.partner           │
            │ • relations.partner.name      │
            └───────────────────────────────┘
```

_This limit is due to a TypeScript limitation where structured types must be generated statically. Increasing the depth limit slows down type compilation._

Type hints will not be provided for keypaths with a depth greater than 3 but this does not affect the return type.

```ts
const user = writable(user)
// Writable<string | undefined>
const firstName = keyed(user, 'relations.partner.name.first')
```

## Motivations

We usually read and write properties of an object store with [auto-subscriptions](https://svelte.dev/tutorial/auto-subscriptions).

```svelte
<input bind:value={$name.first} />
```

However, auto-subscriptions are isolated to a Svelte component. `svelte-keyed` aims to solve several common limitations listed below.

### Context stores

Often, we want to set a property or element of a store into component context, then allow child components to read / write to the property.

```svelte
<!-- Settings.svelte -->
<script>
    setContext('profileSettings', keyed(settings, 'profile'))
</script>

<GeneralSettings />
<ProfileSettings />
```

```svelte
<!-- ProfileSettings.svelte -->
<script>
    const profileSettings = getContext('profileSettings')
</script>

<input type="text" bind:value={$profileSettings.username} />
```

### Helper functions

One important method to reduce clutter on your component is to extract functionality into external helper functions. `svelte-keyed` allows you to create derived `Writable` stores that can be passed into or returned from helper functions.

```svelte
<!-- Settings.svelte -->
<script>
    const stats = writable({ userClicks: 0, userTaps: 0 })
    const clicks = keyed(stats, 'userClicks')
</script>

<div use:trackClicks={clicks} />
<input use:trackClicks={clicks} />
```

```js
export const trackClicks = (node, clicks) => {
    const listen = () => {
        clicks.update(($clicks) => $clicks + 1)
    }
    node.addEventListener('click', listen)
    return {
        destroy() {
            node.removeEventListener('click', listen)
        }
    }
}
```
