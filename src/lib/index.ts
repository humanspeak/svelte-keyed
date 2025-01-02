// Import core Svelte store functionality and type utilities
import { derived, type Updater, type Writable } from 'svelte/store'
import type { Get } from 'type-fest'

// Cache to store parsed path tokens for better performance
// Example: "user.profile.name" -> ["user", "profile", "name"]
const tokenCache = new Map<string, string[]>()

/**
 * Parses a path string into an array of property tokens. Handles both dot notation
 * and array bracket notation.
 *
 * @param {string} key - The path string to parse (e.g., 'users[0].profile.name')
 * @param {boolean} [shouldCache=true] - Enable/disable caching of parsed results
 * @returns {string[]} Array of path segments
 * @throws {Error} If the path string is empty or invalid
 *
 * @example
 * // Dot notation
 * getTokens('user.profile.name') // → ['user', 'profile', 'name']
 *
 * // Array notation
 * getTokens('users[0].posts[1]') // → ['users', '0', 'posts', '1']
 *
 * // Mixed notation
 * getTokens('items[0].tags.primary') // → ['items', '0', 'tags', 'primary']
 */
export const getTokens = (key: string, shouldCache = true): string[] => {
    if (!key) {
        throw new Error('Path string cannot be empty')
    }

    // Check cache first if caching is enabled
    if (shouldCache && tokenCache.has(key)) {
        return tokenCache.get(key)!
    }

    // Convert array notation [0] to dot notation .0
    let keyWithoutBracket = key.replace(/\[(\d+)\]/g, '.$1')

    // Remove leading dot if present
    if (keyWithoutBracket.startsWith('.')) {
        keyWithoutBracket = keyWithoutBracket.slice(1)
    }

    // Split the path into tokens
    const tokens = keyWithoutBracket.split('.')

    // Cache the result if caching is enabled
    if (shouldCache) {
        tokenCache.set(key, tokens)
    }
    return tokens
}

/**
 * Safely retrieves a nested value from an object using a path array.
 * Handles traversing through objects and arrays while protecting against
 * invalid property access.
 *
 * @param {unknown} root - The root object/array to traverse
 * @param {string[]} keyTokens - Array of property names or array indices
 * @returns {unknown} The value at the specified path, or undefined if:
 *   - The path doesn't exist
 *   - A null/undefined value is encountered while traversing
 *   - The root is not an object/array
 * @throws {Error} If any path segment contains invalid characters (only allows alphanumeric, _, $, and digits)
 *
 * @example
 * // Object traversal
 * getNested({user: {name: 'John'}}, ['user', 'name']) // → 'John'
 *
 * // Array traversal
 * getNested({posts: [{id: 1}]}, ['posts', '0', 'id']) // → 1
 *
 * // Undefined cases
 * getNested({}, ['missing', 'path']) // → undefined
 * getNested(null, ['any', 'path']) // → undefined
 * getNested({a: null}, ['a', 'b']) // → undefined
 */
const getNested = (root: unknown, keyTokens: string[]): unknown => {
    // Safety check: ensure root is an object or array
    if (typeof root !== 'object' || root === null) {
        return undefined
    }

    let current: unknown = root
    for (const key of keyTokens) {
        // Security: Validate key format to prevent injection attacks
        if (!/^(?:\d+|[a-zA-Z_$][a-zA-Z0-9_$]*)$/.test(key)) {
            throw new Error(`Invalid property key format: "${key}"`)
        }

        // Return undefined if we hit a null/undefined value before reaching the end
        if (current == null) {
            return undefined
        }

        // Type assertion since we know current is an object at this point
        current = (current as Record<string, unknown>)[key]
    }
    return current
}

/**
 * Creates a shallow clone of an object or array while preserving the prototype chain.
 * This is crucial for maintaining class instances and their methods during state updates.
 *
 * @template T - Type of the source object
 * @param {T} source - The object or array to clone
 * @returns {T} A shallow clone with the same prototype chain
 *
 * @example
 * // Cloning arrays
 * const arr = [1, 2, 3];
 * const clonedArr = clonedWithPrototype(arr); // → [1, 2, 3]
 *
 * // Preserving class instances
 * class User {
 *   constructor(public name: string) {}
 *   greet() { return `Hello, ${this.name}!`; }
 * }
 * const user = new User('John');
 * const clonedUser = clonedWithPrototype(user);
 * clonedUser.greet(); // → "Hello, John!"
 *
 * @throws {TypeError} If source is not an object or array
 */
const clonedWithPrototype = <T extends object>(source: T): T => {
    if (source === null || typeof source !== 'object') {
        throw new TypeError('Source must be an object or array')
    }

    // Handle arrays specially to maintain their type
    if (Array.isArray(source)) {
        return [...source] as T
    }

    // Create new object with same prototype and copy properties
    return Object.assign(Object.create(Object.getPrototypeOf(source)), source)
}

// TypeScript function overloads for better type safety:

/**
 * Creates a derived store for accessing and modifying nested values in a non-nullable parent store.
 *
 * @template Parent
 * @template Path
 * @param {Writable<Parent>} parent - The parent store containing the nested value
 * @param {Path | KeyPath<Parent>} path - The path to the nested value
 * @returns {Writable<Get<Parent, Path>>} A writable store for the nested value
 */
export function keyed<Parent extends object, Path extends string>(
    parent: Writable<Parent>, // eslint-disable-line no-unused-vars
    path: Path | KeyPath<Parent> // eslint-disable-line no-unused-vars
): Writable<Get<Parent, Path>>

/**
 * Creates a derived store for accessing and modifying nested values in a nullable parent store.
 *
 * @template Parent
 * @template Path
 * @param {Writable<Parent | undefined | null>} parent - The nullable parent store
 * @param {Path | KeyPath<Parent>} path - The path to the nested value
 * @returns {Writable<Get<Parent, Path> | undefined>} A writable store for the nested value
 */
export function keyed<Parent extends object, Path extends string>(
    parent: Writable<Parent | undefined | null>, // eslint-disable-line no-unused-vars
    path: Path | KeyPath<Parent> // eslint-disable-line no-unused-vars
): Writable<Get<Parent, Path> | undefined>

/**
 * Creates a derived store for accessing and modifying nested values in a parent store.
 *
 * @template Parent
 * @template Path
 * @param {Writable<Parent | undefined | null>} parent - The parent store containing the nested value
 * @param {Path | KeyPath<Parent>} path - The path to the nested value
 * @returns {Writable<Get<Parent, Path> | undefined>} A writable store for the nested value
 *
 * @example
 * const store = writable({ user: { profile: { name: 'John' } } });
 * const nameStore = keyed(store, 'user.profile.name');
 *
 * // Read value
 * nameStore.subscribe(name => console.log(name)); // Logs: 'John'
 *
 * // Update value
 * nameStore.set('Jane'); // Updates to { user: { profile: { name: 'Jane' } } }
 *
 * @throws {Error} If the path contains forbidden property names
 */
export function keyed<Parent extends object, Path extends string>(
    parent: Writable<Parent | undefined | null>,
    path: Path | KeyPath<Parent>
): Writable<Get<Parent, Path> | undefined> {
    // Split the path into tokens and perform security checks
    const keyTokens = getTokens(path)

    // Prevent prototype pollution attacks by blocking access to dangerous properties
    const FORBIDDEN_TOKENS = ['__proto__', 'constructor', 'prototype']
    const forbiddenToken = keyTokens.find((token) => FORBIDDEN_TOKENS.includes(token))
    if (forbiddenToken) {
        throw new Error(`Key contains forbidden property name "${forbiddenToken}"`)
    }

    // Separate the path into branch (all but last token) and leaf (last token)
    const leafToken = keyTokens[keyTokens.length - 1]
    const branchTokens = keyTokens.slice(0, -1)

    // Create a derived store that reads the nested value
    const keyedValue = derived(parent, ($parent) => getNested($parent, keyTokens))

    // Function to set a new value at the nested path
    const set = (value: Get<Parent, Path>) => {
        parent.update(($parent) => {
            if ($parent == null) {
                return $parent
            }
            // Create a shallow copy to avoid mutating the original
            const newParent = Array.isArray($parent) ? [...$parent] : clonedWithPrototype($parent)
            // Set the new value at the nested path
            getNested(newParent, branchTokens)[leafToken] = value
            return newParent as Parent
        })
    }

    // Function to update the nested value using a callback function
    const update = (fn: Updater<Get<Parent, Path>>) => {
        parent.update(($parent) => {
            if ($parent == null) {
                return $parent
            }
            // Get current value and apply the update function
            const newValue = fn(getNested($parent, keyTokens))
            // Create a shallow copy and set the new value
            const newParent = Array.isArray($parent) ? [...$parent] : clonedWithPrototype($parent)
            getNested(newParent, branchTokens)[leafToken] = newValue
            return newParent as Parent
        })
    }

    // Return a writable store interface
    return {
        subscribe: keyedValue.subscribe,
        set,
        update
    }
}

// Type Definitions
// These help TypeScript understand and validate nested paths
type KeyPath<T, D extends number = 3> = KeyPath_<T, D, []>

// Helper type for generating nested path strings
type KeyPath_<T, D extends number, S extends unknown[]> = D extends S['length']
    ? never
    : T extends object
      ? {
            [K in keyof T]-?: K extends string
                ? `${K}` | Join<K, KeyPath_<T[K], D, [never, ...S]>>
                : K extends number
                  ? `[${K}]` | Join<`[${K}]`, KeyPath_<T[K], D, [never, ...S]>>
                  : never
        }[keyof T]
      : ''

// Helper type for joining path segments
type Join<K, P> = K extends string | number
    ? P extends string | number
        ? P extends `[${string}`
            ? `${K}${P}`
            : `${K}${'' extends P ? '' : '.'}${P}`
        : never
    : never
