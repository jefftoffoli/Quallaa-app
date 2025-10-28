/**
 * Simplified Playwright test for Wiki Links functionality
 *
 * MANUAL SETUP REQUIRED:
 * 1. Run `yarn browser start` in terminal
 * 2. Open http://localhost:3000 in browser
 * 3. Open the test-workspace folder manually
 * 4. Then run this test: `npx playwright test test-wiki-links-simple.spec.ts`
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Wiki Links Feature (Simplified)', () => {
    const baseUrl = 'http://localhost:3000';

    test('Complete wiki links test', async ({ page }) => {
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

        console.log('\n🧪 TEST: Complete Wiki Links Feature Test\n');

        // 1. Navigate to Quallaa
        await page.goto(baseUrl, { waitUntil: 'networkidle' });
        console.log('✅ Navigated to Quallaa browser app');
        await page.waitForTimeout(3000);

        // 2. Check if extension loaded
        console.log('\n📋 Checking if extension loaded...');
        await page.waitForTimeout(2000);

        // 3. Take a screenshot of current state
        await page.screenshot({ path: 'test-current-state.png' });
        console.log('📸 Screenshot saved: test-current-state.png');

        // 4. Wait for user to manually open workspace
        console.log('\n⏸️  MANUAL STEP: Please open test-workspace in the browser');
        console.log('   Then the test will continue automatically...\n');
        await page.waitForTimeout(10000);

        // 5. Look for file explorer
        const fileExplorer = page.locator('.theia-FileTree');
        const explorerVisible = await fileExplorer.isVisible().catch(() => false);
        console.log(`📂 File Explorer visible: ${explorerVisible}`);

        if (explorerVisible) {
            await page.screenshot({ path: 'test-explorer-visible.png' });
            console.log('📸 Screenshot saved: test-explorer-visible.png');

            // 6. Try to find and open Index.md
            console.log('\n📝 Looking for Index.md...');
            const indexFiles = await page.locator('text=Index.md').all();
            console.log(`   Found ${indexFiles.length} elements with "Index.md"`);

            if (indexFiles.length > 0) {
                // Double-click the first Index.md
                await indexFiles[0].dblclick();
                console.log('✅ Double-clicked Index.md');
                await page.waitForTimeout(3000);

                // 7. Check if editor is visible
                const editor = page.locator('.monaco-editor').first();
                const editorVisible = await editor.isVisible();
                console.log(`📝 Monaco Editor visible: ${editorVisible}`);

                if (editorVisible) {
                    await page.screenshot({ path: 'test-editor-open.png' });
                    console.log('📸 Screenshot saved: test-editor-open.png');

                    // 8. Test autocomplete
                    console.log('\n🧪 Testing wiki link autocomplete...');

                    // Click in the editor
                    await editor.click();
                    await page.waitForTimeout(500);

                    // Go to end of document
                    await page.keyboard.press('Control+End');
                    await page.waitForTimeout(500);

                    // Add a new line
                    await page.keyboard.press('Enter');
                    await page.keyboard.press('Enter');

                    // Type [[
                    console.log('   Typing "[["...');
                    await page.keyboard.type('[[');
                    await page.waitForTimeout(2000);

                    // Look for autocomplete
                    const autocomplete = page.locator('.monaco-editor .suggest-widget');
                    const autocompleteVisible = await autocomplete.isVisible().catch(() => false);

                    console.log(`📋 Autocomplete widget visible: ${autocompleteVisible}`);

                    if (autocompleteVisible) {
                        console.log('🎉 SUCCESS! Wiki link autocomplete is working!');
                        await page.screenshot({ path: 'test-autocomplete-success.png' });
                        console.log('📸 Screenshot saved: test-autocomplete-success.png');
                    } else {
                        console.log('❌ FAILED: Autocomplete did not appear');
                        await page.screenshot({ path: 'test-autocomplete-failure.png' });
                        console.log('📸 Screenshot saved: test-autocomplete-failure.png');

                        // Check if there are any suggestions at all
                        const suggestions = await page.locator('.monaco-editor .suggest-widget .monaco-list-row').all();
                        console.log(`   Found ${suggestions.length} suggestion items`);
                    }
                } else {
                    console.log('❌ Editor not visible after opening Index.md');
                }
            } else {
                console.log('❌ Index.md not found in file explorer');
                await page.screenshot({ path: 'test-no-index-file.png' });
            }
        } else {
            console.log('❌ File explorer not visible');
        }

        // Keep browser open for debugging
        await page.waitForTimeout(3000);
    });
});
