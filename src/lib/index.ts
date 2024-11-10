// Import necessary types and functions from Svelte's store system and type-fest library
import { derived, type Updater, type Writable } from 'svelte/store'
import type { Get } from 'type-fest'

// Converts a string path like "foo[0].bar" into an array of tokens ["foo", "0", "bar"]
export const getTokens = (key: string): string[] => {
    // Convert array notation [0] to dot notation .0
    let keyWithoutBracket = key.replace(/\[(\d+)\]/g, '.$1')
    // Remove leading dot if present
    if (keyWithoutBracket.startsWith('.')) {
        keyWithoutBracket = keyWithoutBracket.slice(1)
    }
    return keyWithoutBracket.split('.')
}

// Gets a nested value from an object using an array of property names
// Example: getNested({a: {b: 1}}, ['a', 'b']) returns 1
const getNested = (root: unknown, keyTokens: string[]): any => {
    let current: any = root
    // Walk through each token in the path
    for (const key of keyTokens) {
        // Return undefined if we hit a null/undefined value before reaching the end
        if (current == null) {
            return undefined
        }
        current = current[key]
    }
    return current
}

// Creates a clone of an object that preserves its prototype chain
const clonedWithPrototype = <T extends object>(source: T): T => {
    const clone = Object.create(source)
    Object.assign(clone, source)
    return clone
}

// Function overloads to provide better type safety:
// 1. When parent is guaranteed to be an object (not null/undefined)
export function keyed<Parent extends object, Path extends string>(
    parent: Writable<Parent>,
    path: Path | KeyPath<Parent>
): Writable<Get<Parent, Path>>

// 2. When parent might be null/undefined
export function keyed<Parent extends object, Path extends string>(
    parent: Writable<Parent | undefined | null>,
    path: Path | KeyPath<Parent>
): Writable<Get<Parent, Path> | undefined>

// Main implementation of the keyed function
// Creates a derived store that tracks a nested value within a parent store
export function keyed<Parent extends object, Path extends string>(
    parent: Writable<Parent | undefined | null>,
    path: Path | KeyPath<Parent>
): Writable<Get<Parent, Path> | undefined> {
    // Split the path into tokens (e.g., "foo.bar[0]" -> ["foo", "bar", "0"])
    const keyTokens = getTokens(path)
    // Prevent prototype pollution attacks
    if (keyTokens.some((token) => token === '__proto__')) {
        throw new Error('key cannot include "__proto__"')
    }
    // Separate the path into branch (all but last token) and leaf (last token)
    const branchTokens = keyTokens.slice(0, keyTokens.length - 1)
    const leafToken = keyTokens[keyTokens.length - 1]

    // Create a derived store that reads the nested value
    const keyedValue = derived(parent, ($parent) => getNested($parent, keyTokens))

    // Function to set a new value at the nested path
    const set = (value: Get<Parent, Path>) => {
        parent.update(($parent) => {
            if ($parent == null) {
                return $parent
            }
            // Create a shallow copy of the parent to avoid mutating the original
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

// UTILITY TYPES
// =============

// KeyPath is a type that generates all possible nested path strings for a type
// D is the maximum depth to prevent infinite recursion (default: 3)
type KeyPath<T, D extends number = 3> = KeyPath_<T, D, []>

// Helper type that does the actual path generation
// T: The type to generate paths for
// D: Maximum depth
// S: Array to track recursion depth
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

// Helper type to join path segments
// Handles both dot notation (foo.bar) and array notation (foo[0])
type Join<K, P> = K extends string | number
    ? P extends string | number
        ? P extends `[${string}`
            ? `${K}${P}`
            : `${K}${'' extends P ? '' : '.'}${P}`
        : never
    : never
