/**
 * Tests for Named Workspace Layouts (Priority 2)
 */

import { test, expect, Page } from '@playwright/test';

const APP_URL = 'http://localhost:3000';

/**
 * Helper: Wait for app to be fully loaded
 */
async function waitForAppReady(page: Page) {
    await page.waitForSelector('.theia-preload', { state: 'hidden', timeout: 30000 });
    await page.waitForSelector('#theia-app-shell', { timeout: 30000 });
    await page.waitForTimeout(2000); // Allow for mode initialization
}

/**
 * Helper: Open command palette and run a command
 */
async function runCommand(page: Page, commandName: string): Promise<boolean> {
    // Open command palette
    await page.keyboard.press('F1');
    await page.waitForSelector('.monaco-quick-input-box input', { timeout: 5000 });

    // Type command name
    await page.fill('.monaco-quick-input-box input', commandName);
    await page.waitForTimeout(500);

    // Check if command appears
    const items = await page.$$('.monaco-list-row');
    return items.length > 0;
}

test.describe('Layout Management', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(APP_URL);
        await waitForAppReady(page);
    });

    test('should register layout management commands', async ({ page }) => {
        // Open command palette
        await page.keyboard.press('F1');
        await page.waitForSelector('.monaco-quick-input-box input');

        // Check if "Switch Workspace Layout" command exists
        await page.fill('.monaco-quick-input-box input', 'Switch Workspace Layout');
        await page.waitForTimeout(500);

        // Get the quick pick items
        const items = await page.$$('.monaco-list-row');
        console.log(`Found ${items.length} items for "Switch Workspace Layout"`);

        // Check if the command appears
        const commandExists = items.length > 0;

        if (!commandExists) {
            console.log('Command not found. Checking kb-view commands...');

            // Clear search and list kb-view commands
            await page.fill('.monaco-quick-input-box input', 'kb-view');
            await page.waitForTimeout(500);

            // Get all kb-view commands
            const kbViewCommands = await page.$$eval('.monaco-list-row', rows => rows.slice(0, 20).map(row => row.textContent?.trim()));
            console.log('KB View commands:', kbViewCommands);
        }

        expect(commandExists, 'Switch Workspace Layout command should be registered').toBe(true);
    });

    test.skip('should have KB View menu with Layouts submenu', async ({ page }) => {
        // This test is skipped for now - will implement menu testing later
    });

    test.skip('should list built-in layouts', async ({ page }) => {
        // This test is skipped for now - requires commands to be working first
    });

    test.skip('should save and switch to custom layout', async ({ page }) => {
        // This test is skipped for now - requires commands to be working first
    });
});
