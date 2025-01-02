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

A **writable** derived store for objects and arrays with TypeScript support!

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

`keyed` takes a writable store and a **keypath**, and returns a writable store whose _changes are reflected on the original store_. The keypath can target nested properties in objects or elements in arrays.

Properties are accessed with dot notation, and arrays can be indexed with bracket notation:

```js
const email = keyed(settings, 'profiles[0].email')
const firstItem = keyed(list, '[0]')
```

### Nullable parents

If the parent store is nullable, then the child store will also be nullable:

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

Properties are accessed with [optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining) behavior:

```ts
const user = writable(initUser)
// Writable<Name | undefined>
const partnerName = keyed(user, 'relations.partner.name')
```

### Array Operations

The store supports array operations through bracket notation:

```ts
const list = writable(['a', 'b', 'c'])
const firstItem = keyed(list, '[0]')
const lastItem = keyed(list, '[-1]') // Access last element
```

### TypeScript

`keyed` provides full TypeScript support with type inference from the keypath:

```ts
const user = writable(initUser)
// Writable<string>
const firstName = keyed(user, 'name.first')
```

Type hints are provided for keypaths up to a depth of 3:

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

_Note: The depth limit is due to TypeScript's requirement that structured types be generated statically. While deeper paths will work, they won't show in autocomplete._

## Use Cases

### Context Stores

Perfect for setting store properties in component context:

```svelte
<!-- Settings.svelte -->
<script>
    setContext('profileSettings', keyed(settings, 'profile'))
</script>

<GeneralSettings />
<ProfileSettings />
```

### Action Parameters

Ideal for passing store segments to Svelte actions:

```svelte
<!-- Settings.svelte -->
<script>
    const stats = writable({ userClicks: 0, userTaps: 0 })
    const clicks = keyed(stats, 'userClicks')
</script>

<div use:trackClicks={clicks} />
```

### Store Composition

Combine with other store operations for complex state management:

```ts
const settings = writable({ theme: 'light', fontSize: 16 })
const theme = keyed(settings, 'theme')
const isDarkMode = derived(theme, $theme => $theme === 'dark')
```
