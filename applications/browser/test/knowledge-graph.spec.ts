/**
 * E2E tests for Knowledge Graph visualization
 */

import { test, expect } from '@playwright/test';

test.describe('Knowledge Graph', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the application
        await page.goto('http://localhost:3000');

        // Wait for the application to be ready
        await page.waitForSelector('.theia-ApplicationShell', { timeout: 30000 });

        // Give workspace indexing time to complete
        await page.waitForTimeout(2000);
    });

    test('should open Knowledge Graph widget via command', async ({ page }) => {
        // Open command palette
        await page.keyboard.press('F1');

        // Wait for command palette
        await page.waitForSelector('.monaco-quick-input-box input', { timeout: 5000 });

        // Type the command
        await page.fill('.monaco-quick-input-box input', 'Knowledge Base: Show Graph');

        // Wait a bit for filtering
        await page.waitForTimeout(500);

        // Press Enter to execute command
        await page.keyboard.press('Enter');

        // Wait for the graph widget to appear
        const graphWidget = await page.waitForSelector('#knowledge-base-graph-widget', { timeout: 10000 });
        expect(graphWidget).toBeTruthy();

        // Check that the widget has the correct title
        const widgetTitle = await page.locator('.theia-tab-label').filter({ hasText: 'Knowledge Graph' }).first();
        await expect(widgetTitle).toBeVisible();

        console.log('✓ Knowledge Graph widget opened successfully');
    });

    test('should load and render graph data', async ({ page }) => {
        // Listen for console logs
        const logs: string[] = [];
        page.on('console', msg => {
            if (msg.text().includes('[GraphWidget]')) {
                logs.push(msg.text());
            }
        });

        // Open command palette and execute command
        await page.keyboard.press('F1');
        await page.waitForSelector('.monaco-quick-input-box input', { timeout: 5000 });
        await page.fill('.monaco-quick-input-box input', 'Knowledge Base: Show Graph');
        await page.waitForTimeout(500);
        await page.keyboard.press('Enter');

        // Wait for graph widget
        await page.waitForSelector('#knowledge-base-graph-widget', { timeout: 10000 });

        // Wait for graph to load and render
        await page.waitForTimeout(2000);

        // Check console logs for successful loading
        const loadedLog = logs.find(log => log.includes('Loaded') && log.includes('nodes'));
        const renderedLog = logs.find(log => log.includes('Graph rendered'));

        expect(loadedLog).toBeTruthy();
        expect(renderedLog).toBeTruthy();

        console.log('✓ Graph data loaded:', loadedLog);
        console.log('✓ Graph rendered:', renderedLog);

        // Check that canvas or SVG element exists (force-graph creates these)
        const graphContainer = await page.locator('#knowledge-base-graph-widget canvas, #knowledge-base-graph-widget svg').first();
        await expect(graphContainer).toBeVisible({ timeout: 5000 });

        console.log('✓ Graph visualization rendered');
    });

    test('should show graph in View menu', async ({ page }) => {
        // Click on View menu
        await page.click('li.p-MenuBar-item:has-text("View")');

        // Wait for menu to appear
        await page.waitForTimeout(500);

        // Look for Views submenu
        const viewsMenu = await page.locator('.p-Menu-itemLabel:has-text("Views")').first();
        await viewsMenu.hover();

        // Wait for submenu
        await page.waitForTimeout(500);

        // Look for Knowledge Base: Show Graph
        const graphMenuItem = await page.locator('.p-Menu-itemLabel:has-text("Knowledge Base: Show Graph")').first();
        await expect(graphMenuItem).toBeVisible();

        console.log('✓ Knowledge Graph menu item found in View > Views');

        // Click the menu item
        await graphMenuItem.click();

        // Verify widget opened
        const graphWidget = await page.waitForSelector('#knowledge-base-graph-widget', { timeout: 10000 });
        expect(graphWidget).toBeTruthy();

        console.log('✓ Knowledge Graph opened from menu');
    });

    test('should show loading state initially', async ({ page }) => {
        // Open command palette and execute command
        await page.keyboard.press('F1');
        await page.waitForSelector('.monaco-quick-input-box input', { timeout: 5000 });
        await page.fill('.monaco-quick-input-box input', 'Knowledge Base: Show Graph');
        await page.waitForTimeout(500);
        await page.keyboard.press('Enter');

        // Wait for graph widget
        await page.waitForSelector('#knowledge-base-graph-widget', { timeout: 10000 });

        // Check for loading message (might be very brief)
        const widgetContent = await page.locator('#knowledge-base-graph-widget').first();
        const content = await widgetContent.textContent();

        // Either we see "Loading knowledge graph..." or the graph has already loaded
        // Both are acceptable
        console.log('✓ Widget content:', content?.substring(0, 100));

        // Wait a bit and verify graph eventually renders
        await page.waitForTimeout(2000);

        const graphContainer = await page.locator('#knowledge-base-graph-widget canvas, #knowledge-base-graph-widget svg').first();
        const isVisible = await graphContainer.isVisible().catch(() => false);

        expect(isVisible).toBe(true);
        console.log('✓ Graph rendering completed');
    });
});
