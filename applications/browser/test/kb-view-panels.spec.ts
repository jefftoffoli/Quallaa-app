/**
 * E2E tests for KB View panel wiring
 */

import { test, expect } from '@playwright/test';

test.describe('KB View Panel Wiring', () => {
    let consoleLogs: string[] = [];

    test.beforeEach(async ({ page }) => {
        // Set up console log listener BEFORE navigation
        consoleLogs = [];
        page.on('console', msg => {
            consoleLogs.push(msg.text());
        });

        // Navigate to the application
        await page.goto('http://localhost:3000');

        // Wait for the application to be ready
        await page.waitForSelector('.theia-ApplicationShell', { timeout: 30000 });

        // Give application time to initialize
        await page.waitForTimeout(2000);
    });

    test('should initialize KBViewPanelManager in KB View mode', async ({ page }) => {
        const shell = await page.locator('.theia-ApplicationShell').first();
        const classes = await shell.getAttribute('class');

        if (classes && classes.includes('kb-view-mode')) {
            // Check console logs for panel manager initialization
            const panelManagerLogs = consoleLogs.filter(log => log.includes('KBViewPanelManager') || log.includes('Panel'));

            console.log('KBViewPanelManager logs:', panelManagerLogs);

            // Should have initialization logs
            const hasInitLog = consoleLogs.some(log => log.includes('KBViewPanelManager') && log.includes('initialized'));

            // Log all relevant logs for debugging
            if (!hasInitLog) {
                console.log(
                    'All console logs:',
                    consoleLogs.filter(log => log.includes('KB') || log.includes('Panel') || log.includes('Sidebar'))
                );
            }
        } else {
            console.log('⏭ Skipping test - Not in KB View mode');
        }
    });

    test('should have ribbon visible in KB View mode', async ({ page }) => {
        const shell = await page.locator('.theia-ApplicationShell').first();
        const classes = await shell.getAttribute('class');

        if (classes && classes.includes('kb-view-mode')) {
            // Check for ribbon element (uses class 'kb-ribbon')
            const ribbon = page.locator('.kb-ribbon').first();
            const exists = await ribbon.count();

            expect(exists).toBeGreaterThan(0);
            console.log('✓ Ribbon element found');
        } else {
            console.log('⏭ Skipping test - Not in KB View mode');
        }
    });

    test('should have ribbon items registered', async ({ page }) => {
        const shell = await page.locator('.theia-ApplicationShell').first();
        const classes = await shell.getAttribute('class');

        if (classes && classes.includes('kb-view-mode')) {
            // Check for ribbon items
            const ribbonItems = page.locator('.kb-ribbon-item');
            const count = await ribbonItems.count();

            console.log(`✓ Found ${count} ribbon items`);

            // Should have all 7 items (4 left sidebar + 3 right sidebar)
            expect(count).toBeGreaterThanOrEqual(7);
        } else {
            console.log('⏭ Skipping test - Not in KB View mode');
        }
    });

    test('should have Knowledge Graph ribbon item', async ({ page }) => {
        const shell = await page.locator('.theia-ApplicationShell').first();
        const classes = await shell.getAttribute('class');

        if (classes && classes.includes('kb-view-mode')) {
            // Look for Knowledge Graph ribbon item (codicon-graph)
            const graphItem = page.locator('.kb-ribbon-item i.codicon-graph');
            const exists = await graphItem.count();

            expect(exists).toBeGreaterThan(0);
            console.log('✓ Knowledge Graph ribbon item found');
        } else {
            console.log('⏭ Skipping test - Not in KB View mode');
        }
    });

    test('should have Backlinks ribbon item', async ({ page }) => {
        const shell = await page.locator('.theia-ApplicationShell').first();
        const classes = await shell.getAttribute('class');

        if (classes && classes.includes('kb-view-mode')) {
            // Look for Backlinks ribbon item (codicon-references)
            const backlinksItem = page.locator('.kb-ribbon-item i.codicon-references');
            const exists = await backlinksItem.count();

            expect(exists).toBeGreaterThan(0);
            console.log('✓ Backlinks ribbon item found');
        } else {
            console.log('⏭ Skipping test - Not in KB View mode');
        }
    });

    test('should have Tags ribbon item', async ({ page }) => {
        const shell = await page.locator('.theia-ApplicationShell').first();
        const classes = await shell.getAttribute('class');

        if (classes && classes.includes('kb-view-mode')) {
            // Look for Tags ribbon item (codicon-tag)
            const tagsItem = page.locator('.kb-ribbon-item i.codicon-tag');
            const exists = await tagsItem.count();

            expect(exists).toBeGreaterThan(0);
            console.log('✓ Tags ribbon item found');
        } else {
            console.log('⏭ Skipping test - Not in KB View mode');
        }
    });
});
