import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './',
    testMatch: '**/*.spec.ts',
    timeout: 60000,
    use: {
        headless: false, // Show browser for debugging
        viewport: { width: 1280, height: 720 },
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    workers: 1, // Run tests sequentially
});
