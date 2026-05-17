import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@features': path.resolve(__dirname, './src/features'),
      '@auth': path.resolve(__dirname, './src/features/auth'),
      '@posts': path.resolve(__dirname, './src/features/posts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/**/*.{test,spec}.{js,jsx}',
        'src/**/__tests__/**',
        'src/pages/**',
        'src/components/layout/**',
        'src/components/editor/**',
        'src/components/shared/Newsletter.jsx',
        'src/components/shared/NotFound.jsx',
        'src/components/shared/NotificationCenter.jsx',
        'src/components/shared/OptimizedImage.jsx',
        'src/features/posts/components/**',
        'src/features/auth/components/**',
        'src/lib/supabase.js',
        'src/App.jsx',
        'src/**/*.index.js',
        'src/**/*.config.js',
        'src/setupTests.js',
        'src/main.jsx',
      ],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
    testTimeout: 10000,
    retry: 0,
  },
})
