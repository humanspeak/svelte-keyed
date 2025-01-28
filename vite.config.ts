import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    plugins: [sveltekit()],
    test: {
        include: ['src/**/*.test.ts'],
        globals: true,
        coverage: {
            reporter: 'lcov',
            provider: 'v8',
            include: ['src/**/*.ts'],
            exclude: [
                'src/**/*.test.ts',
                'docs/**',
                '.trunk/**',
                '.svelte-kit/**',
                'tests/**',
                'src/routes/**',
                '*.config.js'
            ]
        },
        reporters: ['verbose', ['junit', { outputFile: './junit-vitest.xml' }]]
    }
})
