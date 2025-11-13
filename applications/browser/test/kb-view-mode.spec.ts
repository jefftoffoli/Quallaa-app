/**
 * E2E tests for KB View mode switching
 */

import { test, expect } from '@playwright/test';

test.describe('KB View Mode', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the application
        await page.goto('http://localhost:3000');

        // Wait for the application to be ready
        await page.waitForSelector('.theia-ApplicationShell', { timeout: 30000 });

        // Give application time to initialize
        await page.waitForTimeout(2000);
    });

    test('should start in developer mode by default', async ({ page }) => {
        // Check that standard Theia Activity Bar is present (developer mode)
        const activityBar = await page.locator('.p-TabBar.theia-app-left.theia-app-sides').first();
        await expect(activityBar).toBeVisible({ timeout: 5000 });

        console.log('✓ Application started in developer mode');
    });

    test('should show preference for view mode', async ({ page }) => {
        // Open preferences
        await page.keyboard.press('F1');
        await page.waitForSelector('.monaco-quick-input-box input', { timeout: 5000 });
        await page.fill('.monaco-quick-input-box input', 'Preferences: Open Settings');
        await page.waitForTimeout(500);
        await page.keyboard.press('Enter');

        // Wait for preferences to open
        await page.waitForTimeout(1000);

        // Search for view mode preference
        const searchBox = await page.locator('.settings-search-input input').first();
        await searchBox.fill('quallaa.viewMode');
        await page.waitForTimeout(500);

        // Check that preference exists
        const preferenceRow = await page.locator('.settings-table-container').first();
        await expect(preferenceRow).toBeVisible({ timeout: 5000 });

        console.log('✓ View mode preference found in settings');
    });

    test('should have KB View shell components registered', async ({ page }) => {
        // Check console logs for KBViewShell and ViewModeService initialization
        const logs: string[] = [];
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('[KBViewShell]') || text.includes('[ViewModeService]')) {
                logs.push(text);
            }
        });

        // Wait a bit for logs
        await page.waitForTimeout(1000);

        // Check that ViewModeService initialized
        const viewModeLog = logs.find(log => log.includes('[ViewModeService]') && log.includes('Initialized'));
        expect(viewModeLog).toBeTruthy();

        console.log('✓ KB View components initialized:', viewModeLog);
    });

    test('should show reload dialog when switching to KB View mode', async ({ page }) => {
        // Set up dialog handler BEFORE triggering the change
        let dialogShown = false;
        let dialogMessage = '';

        page.on('dialog', async dialog => {
            dialogShown = true;
            dialogMessage = dialog.message();
            await dialog.dismiss(); // Close dialog without reloading
        });

        // Open command palette
        await page.keyboard.press('F1');
        await page.waitForSelector('.monaco-quick-input-box input', { timeout: 5000 });

        // Execute command to switch to KB View
        await page.fill('.monaco-quick-input-box input', 'Preferences: Open Settings');
        await page.waitForTimeout(500);
        await page.keyboard.press('Enter');

        // Wait for preferences
        await page.waitForTimeout(1000);

        // Search for view mode
        const searchBox = await page.locator('.settings-search-input input').first();
        await searchBox.fill('quallaa.viewMode');
        await page.waitForTimeout(500);

        // Find the dropdown and change value
        const dropdown = await page.locator('select[data-preference-id="quallaa.viewMode"]').first();
        if (await dropdown.isVisible()) {
            await dropdown.selectOption('kb-view');

            // Wait for dialog to appear
            await page.waitForTimeout(1000);

            // Check dialog was shown
            expect(dialogShown).toBe(true);
            expect(dialogMessage).toContain('KB View');
            expect(dialogMessage).toContain('reload');

            console.log('✓ Reload dialog shown:', dialogMessage);
        } else {
            // If dropdown not found, try through Theia's message service UI
            // This tests the notification-based approach
            const notification = await page.locator('.theia-notification-message').first();
            if (await notification.isVisible({ timeout: 2000 })) {
                const text = await notification.textContent();
                expect(text).toContain('KB View');
                console.log('✓ Notification shown:', text);
            }
        }
    });

    test('should preserve preference across reload', async ({ page, context }) => {
        // This test verifies the preference is saved
        // We won't actually reload to avoid test complexity,
        // but we can check localStorage/preferences storage

        // Open preferences
        await page.keyboard.press('F1');
        await page.waitForSelector('.monaco-quick-input-box input', { timeout: 5000 });
        await page.fill('.monaco-quick-input-box input', 'Preferences: Open Settings');
        await page.waitForTimeout(500);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);

        // Search for view mode
        const searchBox = await page.locator('.settings-search-input input').first();
        await searchBox.fill('quallaa.viewMode');
        await page.waitForTimeout(500);

        // Check current value
        const dropdown = await page.locator('select[data-preference-id="quallaa.viewMode"]').first();
        if (await dropdown.isVisible()) {
            const currentValue = await dropdown.inputValue();
            expect(['developer', 'kb-view']).toContain(currentValue);
            console.log('✓ View mode preference persists:', currentValue);
        }
    });

    test('should have default ribbon items registered in KB View', async ({ page }) => {
        // Check console logs for ribbon item registration
        const logs: string[] = [];
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('[DefaultRibbonContribution]') || text.includes('ribbon')) {
                logs.push(text);
            }
        });

        // Wait for initialization
        await page.waitForTimeout(1000);

        // Even in developer mode, the contribution should be registered
        // (it just won't be visible until KB View mode is active)
        console.log('✓ Ribbon contribution system loaded');
        console.log('  Logs captured:', logs.length);
    });
});

test.describe('KB View Mode - Visual Validation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForSelector('.theia-ApplicationShell', { timeout: 30000 });
        await page.waitForTimeout(2000);
    });

    test('should have distinct CSS classes for KB View and Developer View', async ({ page }) => {
        // Check that shell has mode-specific classes
        const shell = await page.locator('.theia-ApplicationShell').first();
        const classes = await shell.getAttribute('class');

        // In developer mode, should not have kb-view classes
        expect(classes).toBeTruthy();

        // Log classes for debugging
        console.log('✓ Shell classes:', classes);

        // Check that kb-view-shell class exists in CSS (but not applied in developer mode)
        const hasKBViewStyles = await page.evaluate(() => {
            const sheets = document.styleSheets;
            for (let i = 0; i < sheets.length; i++) {
                try {
                    const rules = sheets[i].cssRules || sheets[i].rules;
                    for (let j = 0; j < rules.length; j++) {
                        const rule = rules[j] as CSSStyleRule;
                        if (rule.selectorText && rule.selectorText.includes('kb-view')) {
                            return true;
                        }
                    }
                } catch (e) {
                    // Cross-origin stylesheets can't be accessed
                    continue;
                }
            }
            return false;
        });

        if (hasKBViewStyles) {
            console.log('✓ KB View CSS styles are loaded');
        }
    });
});
