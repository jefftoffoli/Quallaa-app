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
    webServer: {
        // Start the browser app with the appropriate workspace
        // Use TEST_WORKSPACE env var or default to test-workspace
        command: `yarn browser start ${process.env.TEST_WORKSPACE || 'test-workspace'} --hostname 0.0.0.0 --port 3000`,
        port: 3000,
        timeout: 120000, // 2 minutes for app startup
        reuseExistingServer: true, // Don't restart if already running
    },
});
