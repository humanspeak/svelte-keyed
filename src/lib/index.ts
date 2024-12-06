// Import core Svelte store functionality and type utilities
import { derived, type Updater, type Writable } from 'svelte/store'
import type { Get } from 'type-fest'

// Cache to store parsed path tokens for better performance
// Example: "user.profile.name" -> ["user", "profile", "name"]
const tokenCache = new Map<string, string[]>()

/**
 * Converts a string path into an array of property tokens
 * Examples:
 * - "users.name" becomes ["users", "name"]
 * - "users[0].profile" becomes ["users", "0", "profile"]
 *
 * @param key - The path string to parse (e.g., "user.profile.name")
 * @param shouldCache - Whether to cache the result for performance (default: true)
 * @returns Array of path segments
 */
export const getTokens = (key: string, shouldCache = true): string[] => {
    // Check cache first if caching is enabled
    if (tokenCache.has(key) && shouldCache) {
        return tokenCache.get(key)!
    }

    // Convert array notation [0] to dot notation .0
    // Example: "users[0]" -> "users.0"
    let keyWithoutBracket = key.replace(/\[(\d+)\]/g, '.$1')

    // Remove leading dot if present
    // Example: ".users" -> "users"
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
 * Safely retrieves a nested value from an object using an array of property names
 * Examples:
 * - getNested({user: {name: 'John'}}, ['user', 'name']) returns 'John'
 * - getNested({items: [{id: 1}]}, ['items', '0', 'id']) returns 1
 *
 * @param root - The root object to traverse
 * @param keyTokens - Array of property names forming the path
 * @returns The value at the specified path or undefined if not found
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getNested = (root: unknown, keyTokens: string[]): any => {
    // Safety check: ensure root is an object
    if (typeof root !== 'object' || root === null) {
        return undefined
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = root
    for (const key of keyTokens) {
        // Security: Validate key format to prevent injection attacks
        // Only allows: numbers, letters, underscore, and dollar sign
        if (!/^(?:\d+|[a-zA-Z_$][a-zA-Z0-9_$]*)$/.test(key)) {
            throw new Error('Invalid property key format')
        }

        // Return undefined if we hit a null/undefined value before reaching the end
        if (current == null) {
            return undefined
        }
        current = current[key]
    }
    return current
}

/**
 * Creates a shallow clone of an object while preserving its prototype chain
 * Important for maintaining class instances and their methods
 *
 * @param source - The object to clone
 * @returns A new object with the same properties and prototype
 */
const clonedWithPrototype = <T extends object>(source: T): T => {
    // Handle arrays specially to maintain their type
    if (Array.isArray(source)) {
        return [...source] as T
    }
    // Create new object with same prototype and copy properties
    return Object.assign(Object.create(Object.getPrototypeOf(source)), source)
}

// TypeScript function overloads for better type safety:

/**
 * Creates a derived store for a nested value in a parent store
 * Version 1: For non-nullable parent stores
 */
export function keyed<Parent extends object, Path extends string>(
    parent: Writable<Parent>, // eslint-disable-line no-unused-vars
    path: Path | KeyPath<Parent> // eslint-disable-line no-unused-vars
): Writable<Get<Parent, Path>>

/**
 * Creates a derived store for a nested value in a parent store
 * Version 2: For nullable parent stores
 */
export function keyed<Parent extends object, Path extends string>(
    parent: Writable<Parent | undefined | null>, // eslint-disable-line no-unused-vars
    path: Path | KeyPath<Parent> // eslint-disable-line no-unused-vars
): Writable<Get<Parent, Path> | undefined>

/**
 * Main implementation of the keyed function
 * Creates a derived store that tracks and allows modification of a nested value
 *
 * @param parent - The parent store containing the nested value
 * @param path - The path to the nested value (e.g., "user.profile.name")
 * @returns A writable store for the nested value
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
