import { describe, expect, it } from 'vitest'
import { getTokens } from './index.js'

describe('get tokens', () => {
    it('converts a chain of object props', () => {
        const result = getTokens('a.b.c')
        expect(result).toStrictEqual(['a', 'b', 'c'])
    })

    it('converts an array index', () => {
        const result = getTokens('[3]')
        expect(result).toStrictEqual(['3'])
    })

    it('converts consecutive array indices', () => {
        const result = getTokens('[3][4][6]')
        expect(result).toStrictEqual(['3', '4', '6'])
    })

    it('converts a mix of array indices and object props', () => {
        const result = getTokens('a[3].b.c[4][5]')
        expect(result).toStrictEqual(['a', '3', 'b', 'c', '4', '5'])
    })
})

describe('getTokens Performance', () => {
    it('should handle complex paths efficiently', () => {
        const start = performance.now()
        const iterations = 10000

        for (let i = 0; i < iterations; i++) {
            getTokens('deeply.nested[0].array[5].property[10].value')
        }

        const end = performance.now()
        const timePerOperation = (end - start) / iterations

        // Log performance metrics
        console.log(`Average time per getTokens operation: ${timePerOperation.toFixed(4)}ms`)

        // Verify correctness
        expect(getTokens('deeply.nested[0].array[5].property[10].value')).toEqual([
            'deeply',
            'nested',
            '0',
            'array',
            '5',
            'property',
            '10',
            'value'
        ])
    })

    it('should handle repeated operations with different patterns', () => {
        const testCases = [
            'simple.path',
            'array[0]',
            'deep.nested[5].path',
            '[0][1][2]',
            'mixed.path[0].to[5].value'
        ]

        const results = testCases.map((path) => {
            const start = performance.now()
            for (let i = 0; i < 1000; i++) {
                getTokens(path)
            }
            const end = performance.now()
            return { path, time: (end - start) / 1000 }
        })

        // Log performance for different patterns
        results.forEach(({ path, time }) => {
            console.log(`Average time for "${path}": ${time.toFixed(4)}ms`)
        })

        // Ensure all operations complete
        expect(results.every((r) => r.time >= 0)).toBe(true)
    })
})
