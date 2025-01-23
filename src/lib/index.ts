import { type Updater, type Writable, derived } from 'svelte/store'
import type { Get } from 'type-fest'

/**
 * Converts a string path with array notation into an array of tokens.
 *
 * @param key - The path string to tokenize (e.g., "users[0].name" or "deeply.nested.property")
 * @returns An array of string tokens representing each path segment
 *
 * @example
 * ```ts
 * getTokens('users[0].name')  // returns ['users', '0', 'name']
 * getTokens('deeply.nested.property')  // returns ['deeply', 'nested', 'property']
 * ```
 */
export const getTokens = (key: string): string[] => {
    let keyWithoutBracket = key.replace(/\[(\d+)\]/g, '.$1')
    if (keyWithoutBracket.startsWith('.')) {
        keyWithoutBracket = keyWithoutBracket.slice(1)
    }
    return keyWithoutBracket.split('.')
}

/**
 * Safely retrieves a nested value from an object using an array of key tokens.
 * Returns undefined if any intermediate value in the path is null or undefined.
 *
 * @param root - The root object to traverse
 * @param keyTokens - Array of string tokens representing the path to the desired value
 * @returns The value at the specified path, or undefined if the path is invalid
 *
 * @internal
 */
/* trunk-ignore(eslint/@typescript-eslint/no-explicit-any) */
const getNested = (root: unknown, keyTokens: string[]): any => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = root
    for (const key of keyTokens) {
        if (current == null) {
            return undefined
        }
        current = current[key]
    }
    return current
}

/**
 * Creates a shallow clone of an object while preserving its prototype chain.
 *
 * @param source - The source object to clone
 * @returns A new object with the same properties and prototype as the source
 *
 * @internal
 */
const clonedWithPrototype = <T extends object>(source: T): T => {
    const clone = Object.create(source)
    Object.assign(clone, source)
    return clone
}

/**
 * Creates a derived writable store that represents a nested value within a parent store.
 * The derived store maintains reactivity with the parent store while allowing direct
 * manipulation of the nested value.
 *
 * @param parent - The parent writable store containing the nested value
 * @param path - The path to the nested value, using dot notation or array indices
 * @returns A writable store for the nested value that syncs with the parent store
 *
 * @throws {Error} If the path contains '__proto__' to prevent prototype pollution
 *
 * @example
 * ```ts
 * const user = writable({
 *   profile: {
 *     name: 'Alice',
 *     settings: { theme: 'dark' }
 *   }
 * });
 *
 * // Create a store for just the theme
 * const theme = keyed(user, 'profile.settings.theme');
 *
 * // Subscribe to changes
 * theme.subscribe(value => console.log('Theme:', value)); // logs: "Theme: dark"
 *
 * // Update the nested value directly
 * theme.set('light'); // Updates user store with new theme
 * ```
 */
export function keyed<Parent extends object, Path extends string>(
    parent: Writable<Parent>,
    path: Path | KeyPath<Parent>
): Writable<Get<Parent, Path>>

export function keyed<Parent extends object, Path extends string>(
    parent: Writable<Parent | undefined | null>,
    path: Path | KeyPath<Parent>
): Writable<Get<Parent, Path> | undefined>

export function keyed<Parent extends object, Path extends string>(
    parent: Writable<Parent | undefined | null>,
    path: Path | KeyPath<Parent>
): Writable<Get<Parent, Path> | undefined> {
    const keyTokens = getTokens(path)
    if (keyTokens.some((token) => token === '__proto__')) {
        throw new Error('key cannot include "__proto__"')
    }
    const branchTokens = keyTokens.slice(0, keyTokens.length - 1)
    const leafToken = keyTokens[keyTokens.length - 1]

    const keyedValue = derived(parent, ($parent) => getNested($parent, keyTokens))

    const set = (value: Get<Parent, Path>) => {
        parent.update(($parent) => {
            if ($parent == null) {
                return $parent
            }
            const newParent = Array.isArray($parent) ? [...$parent] : clonedWithPrototype($parent)
            getNested(newParent, branchTokens)[leafToken] = value
            return newParent as Parent
        })
    }

    const update = (fn: Updater<Get<Parent, Path>>) => {
        parent.update(($parent) => {
            if ($parent == null) {
                return $parent
            }
            const newValue = fn(getNested($parent, keyTokens))
            const newParent = Array.isArray($parent) ? [...$parent] : clonedWithPrototype($parent)
            getNested(newParent, branchTokens)[leafToken] = newValue
            return newParent as Parent
        })
    }

    return {
        subscribe: keyedValue.subscribe,
        set,
        update
    }
}

// UTILITY TYPES
// =============
type KeyPath<T, D extends number = 3> = KeyPath_<T, D, []>

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

type Join<K, P> = K extends string | number
    ? P extends string | number
        ? P extends `[${string}`
            ? `${K}${P}`
            : `${K}${'' extends P ? '' : '.'}${P}`
        : never
    : never
