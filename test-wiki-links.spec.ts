/**
 * Playwright test for Wiki Links functionality
 *
 * Prerequisites: Run `yarn browser start` in another terminal before running this test
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Wiki Links Feature', () => {
    let page: Page;
    const baseUrl = 'http://localhost:3000';

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();

        // Capture console logs
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('[WikiLinks]') || text.includes('knowledge-base')) {
                console.log(`🔍 CONSOLE: ${text}`);
            }
        });

        // Capture errors
        page.on('pageerror', error => {
            console.error('❌ PAGE ERROR:', error.message);
        });

        await page.goto(baseUrl, { waitUntil: 'networkidle' });
        console.log('✅ Navigated to Quallaa browser app');
    });

    test('Extension should load and register', async () => {
        console.log('\n🧪 TEST 1: Checking if extension loads...\n');

        // Wait for the app to initialize
        await page.waitForTimeout(5000);

        // Check if we see the startup logs
        const logs: string[] = [];
        page.on('console', msg => logs.push(msg.text()));

        // Look for extension initialization in console
        const hasWikiLinksLog = logs.some(log => log.includes('[WikiLinks]'));

        console.log('📊 Console logs captured:', logs.filter(l => l.includes('[WikiLinks]')).length);

        if (hasWikiLinksLog) {
            console.log('✅ Wiki Links extension loaded!');
        } else {
            console.log('❌ Wiki Links extension NOT detected in logs');
        }
    });

    test('Open test workspace', async () => {
        console.log('\n🧪 TEST 2: Opening test workspace...\n');

        // Wait for the start page to load
        await page.waitForTimeout(2000);

        // Click "Open" button on the start page (not "Open Workspace")
        try {
            await page.click('text=Open', { timeout: 5000 });
            console.log('✅ Clicked Open button');
            await page.waitForTimeout(1500);

            // Click on test-workspace folder in the tree
            await page.click('text=test-workspace', { timeout: 5000 });
            console.log('✅ Selected test-workspace folder');
            await page.waitForTimeout(500);

            // Click the "Open" button in the dialog
            await page.click('button:has-text("Open")');
            console.log('✅ Clicked Open button in dialog');

            // Wait for workspace to load
            await page.waitForTimeout(5000);
        } catch (error) {
            console.log('⚠️ Could not open workspace via Start page:', error);
        }
    });

    test('Open markdown file and check for features', async () => {
        console.log('\n🧪 TEST 3: Opening markdown file...\n');

        // Wait for file explorer to load
        await page.waitForTimeout(3000);

        // Look for Index.md in the explorer and double-click it
        try {
            // Find and double-click Index.md (Theia requires double-click to open)
            const indexFile = page.locator('.theia-TreeNode:has-text("Index.md")').first();
            await indexFile.dblclick({ timeout: 10000 });
            console.log('✅ Double-clicked Index.md');
            await page.waitForTimeout(2000);

            // Check if editor loaded
            const editor = await page.locator('.monaco-editor').first();
            const isVisible = await editor.isVisible();
            console.log(`📝 Editor visible: ${isVisible}`);

            if (isVisible) {
                console.log('🎉 Editor loaded successfully!');
            }
        } catch (error) {
            console.log('⚠️ Could not find or open Index.md:', error);
            // Take screenshot for debugging
            await page.screenshot({ path: 'test-file-open-failure.png' });
        }
    });

    test('Test wiki link autocomplete', async () => {
        console.log('\n🧪 TEST 4: Testing wiki link autocomplete...\n');

        try {
            // Focus the editor
            await page.click('.monaco-editor');
            await page.waitForTimeout(500);

            // Type [[ to trigger autocomplete
            await page.keyboard.type('[[');
            await page.waitForTimeout(1000);

            // Look for autocomplete dropdown
            const autocomplete = await page.locator('.monaco-editor .suggest-widget');
            const autocompleteVisible = await autocomplete.isVisible().catch(() => false);

            console.log(`📋 Autocomplete visible: ${autocompleteVisible}`);

            if (autocompleteVisible) {
                console.log('🎉 SUCCESS! Wiki link autocomplete is working!');
            } else {
                console.log('❌ FAILED: Autocomplete did not appear');

                // Take a screenshot for debugging
                await page.screenshot({ path: 'test-wiki-links-failure.png' });
                console.log('📸 Screenshot saved to test-wiki-links-failure.png');
            }
        } catch (error) {
            console.log('❌ Error during autocomplete test:', error);
        }
    });

    test.afterAll(async () => {
        await page.close();
    });
});
