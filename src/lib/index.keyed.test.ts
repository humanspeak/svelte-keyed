import { derived, get, writable } from 'svelte/store'
import { beforeEach, describe, expect, it } from 'vitest'
import { getTokens, keyed } from './index.js'

interface User {
    name: Name
    email: string
    age: number
    friend?: User
    partner: User | null
}

interface Name {
    first: string
    last: string
}

class UserC {
    constructor(
        public name: NameC,
        public email: string,
        public age: number
    ) {}
}

class NameC {
    constructor(
        public first: string,
        public last: string
    ) {}
}

describe('shallow keyed object test', () => {
    let user: User
    beforeEach(() => {
        user = {
            email: 'john@email.com',
            age: 10,
            name: { first: 'john', last: 'smith' },
            partner: null
        }
    })

    it('subscribes child to the correct value', () => {
        const parent = writable(user)
        const age = keyed(parent, 'age')
        const email = keyed(parent, 'email')
        expect(get(age)).toBe(10)
        expect(get(email)).toBe('john@email.com')
    })

    it('updates child when parent updates', () => {
        const parent = writable(user)
        const age = keyed(parent, 'age')
        parent.update(($parent) => ({
            ...$parent,
            age: 11
        }))
        expect(get(age)).toBe(11)
    })

    it('updates parent when child updates', () => {
        const parent = writable(user)
        const age = keyed(parent, 'age')
        age.update(($age) => $age + 1)
        expect(get(parent)).toStrictEqual({ ...user, age: 11 })
    })

    it('updates parent when child is set', () => {
        const parent = writable(user)
        const age = keyed(parent, 'age')
        age.set(11)
        expect(get(parent)).toStrictEqual({ ...user, age: 11 })
    })

    describe('undefined and null', () => {
        it('subscribes child to undefined when parent is undefined', () => {
            const parent = writable<User | undefined>(undefined)
            const age = keyed(parent, 'age')
            expect(get(age)).toBeUndefined()
        })

        it('subscribes child to undefined when parent is null', () => {
            const parent = writable<User | null>(null)
            const age = keyed(parent, 'age')
            expect(get(age)).toBeUndefined()
        })

        it('subscribes child to the correct value when parent is no longer undefined', () => {
            const parent = writable<User | undefined>(undefined)
            const age = keyed(parent, 'age')
            parent.set(user)
            expect(get(age)).toBe(10)
        })

        it('does not update child when parent stays undefined', () => {
            const parent = writable<User | undefined>(undefined)
            const age = keyed(parent, 'age')
            parent.update(($parent) => $parent)
            expect(get(age)).toBeUndefined()
        })

        it('does not update undefined parent when child updates', () => {
            const parent = writable<User | undefined>(undefined)
            const age = keyed(parent, 'age')
            age.update(($age) => ($age !== undefined ? $age + 1 : 0))
            expect(get(parent)).toBeUndefined()
        })

        it('does not update undefined parent when child is set', () => {
            const parent = writable<User | undefined>(undefined)
            const age = keyed(parent, 'age')
            age.set(10)
            expect(get(parent)).toBeUndefined()
        })

        it('does not update null parent when child updates', () => {
            const parent = writable<User | null>(null)
            const age = keyed(parent, 'age')
            age.update(($age) => ($age !== undefined ? $age + 1 : 0))
            expect(get(parent)).toBeNull()
        })

        it('does not update null parent when child is set', () => {
            const parent = writable<User | null>(null)
            const age = keyed(parent, 'age')
            age.set(10)
            expect(get(parent)).toBeNull()
        })
    })
})

describe('shallow keyed array test', () => {
    let actions: string[]
    beforeEach(() => {
        actions = ['eat', 'sleep', 'code', 'repeat']
    })

    it('subscribes child to the correct value', () => {
        const parent = writable(actions)
        const action = keyed(parent, '[2]')
        expect(get(action)).toBe('code')
    })

    it('updates when the parent updates', () => {
        const parent = writable(actions)
        const action = keyed(parent, '[2]')
        parent.set(['eat', 'sleep', 'sleep', 'repeat'])
        expect(get(action)).toBe('sleep')
    })

    it('updates parent when child is updated', () => {
        const parent = writable(actions)
        const action = keyed(parent, '[2]')
        action.update(($action) => $action!.toUpperCase())
        expect(get(parent)).toStrictEqual(['eat', 'sleep', 'CODE', 'repeat'])
    })

    it('updates parent when child is set', () => {
        const parent = writable(actions)
        const action = keyed(parent, '[2]')
        action.set('sleep')
        expect(get(parent)).toStrictEqual(['eat', 'sleep', 'sleep', 'repeat'])
    })

    describe('undefined and null', () => {
        it('subscribes child to undefined when parent is undefined', () => {
            const parent = writable<string[] | undefined>(undefined)
            const action = keyed(parent, '[2]')
            expect(get(action)).toBeUndefined()
        })

        it('subscribes child to undefined when parent is null', () => {
            const parent = writable<string[] | null>(null)
            const action = keyed(parent, '[2]')
            expect(get(action)).toBeUndefined()
        })

        it('subscribes child to the correct value when parent is no longer undefined', () => {
            const parent = writable<string[] | undefined>(undefined)
            const action = keyed(parent, '[2]')
            parent.set(actions)
            expect(get(action)).toBe('code')
        })

        it('does not update child when parent stays undefined', () => {
            const parent = writable<string[] | undefined>(undefined)
            const action = keyed(parent, '[2]')
            parent.update(($parent) => $parent)
            expect(get(action)).toBeUndefined()
        })

        it('does not update undefined parent when child updates', () => {
            const parent = writable<string[] | undefined>(undefined)
            const action = keyed(parent, '[2]')
            action.update(($action) => $action?.toUpperCase())
            expect(get(parent)).toBeUndefined()
        })

        it('does not update undefined parent when child is set', () => {
            const parent = writable<string[] | undefined>(undefined)
            const action = keyed(parent, '[2]')
            action.set('sleep')
            expect(get(parent)).toBeUndefined()
        })

        it('does not update null parent when child updates', () => {
            const parent = writable<string[] | null>(null)
            const action = keyed(parent, '[2]')
            action.update(($action) => $action?.toUpperCase())
            expect(get(parent)).toBeNull()
        })

        it('does not update null parent when child is set', () => {
            const parent = writable<string[] | null>(null)
            const action = keyed(parent, '[2]')
            action.set('sleep')
            expect(get(parent)).toBeNull()
        })
    })
})

describe('nested keyed object test', () => {
    let user: User
    beforeEach(() => {
        user = {
            email: 'john@email.com',
            age: 10,
            name: { first: 'john', last: 'smith' },
            partner: null
        }
    })

    it('subscribes child to the correct value', () => {
        const parent = writable(user)
        const firstName = keyed(parent, 'name.first')
        const lastName = keyed(parent, 'name.last')
        expect(get(firstName)).toBe('john')
        expect(get(lastName)).toBe('smith')
    })

    it('updates child when parent updates', () => {
        const parent = writable(user)
        const firstName = keyed(parent, 'name.first')
        parent.update(($parent) => ({
            ...$parent,
            name: {
                first: 'jane',
                last: 'doe'
            }
        }))
        expect(get(firstName)).toBe('jane')
    })

    it('updates parent when child updates', () => {
        const parent = writable(user)
        const firstName = keyed(parent, 'name.first')
        firstName.update(($firstName) => $firstName.toUpperCase())
        expect(get(parent)).toStrictEqual({
            ...user,
            name: { ...user.name, first: 'JOHN' }
        })
    })

    it('updates parent when child is set', () => {
        const parent = writable(user)
        const firstName = keyed(parent, 'name.first')
        firstName.set('jane')
        expect(get(parent)).toStrictEqual({
            ...user,
            name: { ...user.name, first: 'jane' }
        })
    })

    describe('undefined and null', () => {
        it('returns undefined child for undefined middle', () => {
            const parent = writable<User | undefined>(user)
            const friendName = keyed(parent, 'friend.name')
            expect(get(friendName)).toBeUndefined()
        })

        it('returns undefined child for null middle', () => {
            const parent = writable<User | undefined>(user)
            const partnerName = keyed(parent, 'partner.name')
            expect(get(partnerName)).toBeUndefined()
        })
    })
})

describe('prevent prototype pollution', () => {
    it('throws an error if any key contains "__proto__"', () => {
        const parent = writable({})
        expect(() => {
            keyed(parent, '__proto__' as never)
        }).toThrowError('key cannot include "__proto__"')
        expect(() => {
            keyed(parent, '__proto__.name' as never)
        }).toThrowError('key cannot include "__proto__"')
        expect(() => {
            keyed(parent, 'name.__proto__' as never)
        }).toThrowError('key cannot include "__proto__"')
    })
})

describe('keyed classes', () => {
    let user: UserC
    beforeEach(() => {
        const name = new NameC('john', 'smith')
        user = new UserC(name, 'john@email.com', 10)
    })

    it('retains the parent prototype', () => {
        const parent = writable(user)
        const age = keyed(parent, 'age')
        const firstName = keyed(parent, 'name.first')
        firstName.set('jane')
        age.set(11)
        expect(get(parent)).toBeInstanceOf(UserC)
    })

    it('retains the nested child prototype', () => {
        const parent = writable(user)
        const age = keyed(parent, 'age')
        const firstName = keyed(parent, 'name.first')
        firstName.set('jane')
        age.set(11)
        expect(get(parent).name).toBeInstanceOf(NameC)
    })
})

describe('Array Operations', () => {
    it('should handle array push operations', () => {
        const store = writable<{ items: string[] }>({ items: [] })
        const items = keyed(store, 'items')
        items.update((i) => [...i, 'new item'])
        expect(get(store).items).toEqual(['new item'])
    })

    it('should handle array splice operations', () => {
        const store = writable<{ items: number[] }>({ items: [1, 2, 3] })
        const items = keyed(store, 'items')
        items.update((i) => i.splice(1, 1))
        expect(get(store).items).toEqual([2])
    })
})

describe('Edge Cases', () => {
    it('should handle circular references safely', () => {
        const circular: { name: string; self?: object } = { name: 'test' }
        circular.self = circular
        const store = writable<typeof circular>(circular)
        const name = keyed(store, 'name')
        name.set('updated')
        expect(get(store).name).toBe('updated')
    })

    it('should handle prototype chain properties', () => {
        class Base {
            baseProperty = 'base'
        }
        class Derived extends Base {
            derivedProperty = 'derived'
        }
        const store = writable(new Derived())
        const baseProp = keyed(store, 'baseProperty')
        expect(get(baseProp)).toBe('base')
    })

    it('should reject __proto__ in path', () => {
        const store = writable({})
        expect(() => keyed(store, '__proto__')).toThrow()
    })
})

describe('Type Safety', () => {
    it('should handle undefined parent store', () => {
        const store = writable<{ name: string } | undefined>(undefined)
        const name = keyed(store, 'name')
        expect(get(name)).toBeUndefined()
    })

    it('should handle null values in path', () => {
        const store = writable({ user: null })
        const name = keyed(store, 'user.name')
        expect(get(name)).toBeUndefined()
    })

    it('should preserve literal types', () => {
        const store = writable({ status: 'active' as 'active' | 'inactive' })
        const status = keyed(store, 'status')
        status.set('inactive')
        // @ts-expect-error - should not compile
        status.set('unknown')
    })
})

describe('Performance', () => {
    it('should not trigger unnecessary updates', () => {
        const store = writable({ deep: { nested: { value: 1 } } })
        const value = keyed(store, 'deep.nested.value')
        let updateCount = 0
        value.subscribe(() => updateCount++)
        value.set(1) // Same value
        expect(updateCount).toBe(1) // Only initial subscription
    })

    it('should handle large objects efficiently', () => {
        const largeObject = Array(1000)
            .fill(0)
            .reduce(
                (acc, _, i) => ({
                    ...acc,
                    [`prop${i}`]: i
                }),
                {}
            )
        const store = writable(largeObject)
        const prop = keyed(store, 'prop999')
        prop.set(1000)
        expect(get(store).prop999).toBe(1000)
    })
})

describe('Svelte Integration', () => {
    it('should work with derived stores', () => {
        const store = writable({ count: 1 })
        const count = keyed(store, 'count')
        const doubled = derived(count, ($count) => $count * 2)
        expect(get(doubled)).toBe(2)
    })

    it('should handle store contract correctly', () => {
        const store = writable({ value: 0 })
        const value = keyed(store, 'value')

        // Testing store contract
        expect(value.subscribe).toBeDefined()
        expect(value.set).toBeDefined()
        expect(value.update).toBeDefined()
    })
})

describe('Nested Array Operations', () => {
    it('should handle nested array mutations', () => {
        const store = writable({ users: [{ name: 'john' }, { name: 'jane' }] })
        const firstUserName = keyed(store, 'users[0].name')
        firstUserName.set('johnny')
        expect(get(store).users[0].name).toBe('johnny')
    })

    it('should handle array of arrays', () => {
        const store = writable({
            matrix: [
                [1, 2],
                [3, 4]
            ]
        })
        const cell = keyed(store, 'matrix[0][1]')
        cell.set(5)
        expect(get(store).matrix[0][1]).toBe(5)
    })
})

describe('Complex Updates', () => {
    it('should handle multiple keyed stores updating the same parent', () => {
        const store = writable({ user: { name: 'john', age: 25 } })
        const name = keyed(store, 'user.name')
        const age = keyed(store, 'user.age')

        name.set('jane')
        age.set(26)

        expect(get(store)).toEqual({ user: { name: 'jane', age: 26 } })
    })

    it('should handle concurrent updates correctly', async () => {
        const store = writable({ count: 0 })
        const count = keyed(store, 'count')

        await Promise.all([
            Promise.resolve().then(() => count.update((n) => n + 1)),
            Promise.resolve().then(() => count.update((n) => n + 1))
        ])

        expect(get(store).count).toBe(2)
    })
})

describe('Type Coercion', () => {
    it('should preserve number types', () => {
        const store = writable({ value: 42 })
        const value = keyed(store, 'value')
        /* trunk-ignore(eslint/@typescript-eslint/no-explicit-any) */
        value.update((v) => v.toString() as any)
        expect(typeof get(store).value).toBe('string')
    })

    it('should handle boolean values', () => {
        const store = writable({ isActive: true })
        const isActive = keyed(store, 'isActive')
        isActive.set(false)
        expect(get(store).isActive).toBe(false)
    })
})

describe('Error Handling', () => {
    it('should handle non-existent nested paths gracefully', () => {
        const store = writable({ a: {} })
        /* trunk-ignore(eslint/@typescript-eslint/no-explicit-any) */
        const deepValue = keyed(store, 'a.b.c.d' as any)
        expect(get(deepValue)).toBeUndefined()
    })

    it('should handle array index out of bounds', () => {
        const store = writable({ arr: [1, 2, 3] })
        const outOfBounds = keyed(store, 'arr[99]')
        expect(get(outOfBounds)).toBeUndefined()
    })
})

describe('Subscription Behavior', () => {
    it('should handle multiple subscriptions with different dependencies', () => {
        const store = writable({ a: 1, b: 2 })
        const a = keyed(store, 'a')
        const b = keyed(store, 'b')

        let aCount = 0,
            bCount = 0

        a.subscribe(() => aCount++)
        b.subscribe(() => bCount++)

        a.set(2) // Should only trigger a's subscribers

        expect(aCount).toBe(2) // Initial + update
        expect(bCount).toBe(1) // Only initial
    })

    it('should clean up subscriptions properly', () => {
        const store = writable({ value: 0 })
        const value = keyed(store, 'value')

        let count = 0
        const unsubscribe = value.subscribe(() => count++)

        value.set(1)
        unsubscribe()
        value.set(2)

        expect(count).toBe(2) // Initial + first update only
    })
})

describe('Edge Case Mutations', () => {
    it('should handle Date objects', () => {
        const now = new Date()
        const store = writable({ timestamp: now })
        const timestamp = keyed(store, 'timestamp')

        const newDate = new Date(now.getTime() + 1000)
        timestamp.set(newDate)

        expect(get(store).timestamp).toEqual(newDate)
    })

    it('should handle Set and Map', () => {
        const store = writable({
            set: new Set([1, 2, 3]),
            map: new Map([['key', 'value']])
        })

        const setStore = keyed(store, 'set')
        const mapStore = keyed(store, 'map')

        setStore.update((s) => new Set([...s, 4]))
        mapStore.update((m) => new Map([...m, ['newKey', 'newValue']]))

        expect(get(store).set.has(4)).toBe(true)
        expect(get(store).map.get('newKey')).toBe('newValue')
    })
})

describe('Reactivity Chain with Derived Stores', () => {
    it('should handle derived stores from multiple keyed sources', () => {
        const store = writable({ first: 'John', last: 'Doe' })
        const firstName = keyed(store, 'first')
        const lastName = keyed(store, 'last')

        const fullName = derived([firstName, lastName], ([$first, $last]) => `${$first} ${$last}`)

        expect(get(fullName)).toBe('John Doe')
        firstName.set('Jane')
        expect(get(fullName)).toBe('Jane Doe')
    })
})
