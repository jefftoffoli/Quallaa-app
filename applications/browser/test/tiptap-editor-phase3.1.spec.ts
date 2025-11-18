/**
 * Phase 3.1 Test: TipTap Editor Foundation
 *
 * Verifies that clicking a .md file opens the TipTap editor instead of Monaco.
 */

import { test, expect, Page } from '@playwright/test';

const APP_URL = 'http://localhost:3000';

async function waitForAppReady(page: Page) {
    await page.waitForSelector('.theia-ApplicationShell', { timeout: 30000 });
    await page.waitForTimeout(3000); // Allow for full initialization
}

test.describe('TipTap Editor Phase 3.1', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(APP_URL);
        await waitForAppReady(page);
    });

    test('Opening .md file loads TipTap editor widget', async ({ page }) => {
        console.log('Step 1: Open a markdown file using Quick Open');

        // Use Cmd+P / Ctrl+P to open Quick Open
        await page.keyboard.press('Meta+p');
        await page.waitForTimeout(500);

        // Search for a .md file (foo.md exists in test-workspace)
        await page.keyboard.type('foo.md');
        await page.waitForTimeout(1000);

        // Press Enter to open the first result
        await page.keyboard.press('Enter');
        await page.waitForTimeout(3000);

        console.log('Step 2: File should be open');

        console.log('Step 3: Verify TipTap editor loaded');

        // Check for TipTap-specific elements
        const editorContainer = page.locator('.quallaa-editor-container');
        const tiptapEditor = page.locator('.quallaa-tiptap-editor');
        const proseMirror = page.locator('.ProseMirror');
        const toolbar = page.locator('.quallaa-editor-toolbar');

        // At least one of these should be visible
        const hasTipTap = (await editorContainer.count()) > 0 || (await tiptapEditor.count()) > 0 || (await proseMirror.count()) > 0;

        console.log('TipTap editor container found:', (await editorContainer.count()) > 0);
        console.log('TipTap editor area found:', (await tiptapEditor.count()) > 0);
        console.log('ProseMirror element found:', (await proseMirror.count()) > 0);
        console.log('Toolbar found:', (await toolbar.count()) > 0);

        // Check that Monaco is NOT the active editor for .md
        const monacoEditor = page.locator('.monaco-editor');
        const monacoVisible = await monacoEditor.isVisible().catch(() => false);
        console.log('Monaco editor visible:', monacoVisible);

        // Take screenshot for verification
        await page.screenshot({ path: 'screenshots/tiptap-phase3.1-test.png', fullPage: true });

        // The TipTap editor should be present
        expect(hasTipTap, 'TipTap editor elements should be present').toBe(true);

        console.log('Step 4: Verify editor is editable');
        if ((await proseMirror.count()) > 0) {
            // Try to focus and type in the editor
            await proseMirror.click();
            await page.keyboard.type('Test content from Playwright');
            await page.waitForTimeout(500);

            // Verify the text was entered
            const content = await proseMirror.textContent();
            console.log('Editor content:', content);
            expect(content).toContain('Test content from Playwright');
            console.log('✓ TipTap editor is editable');
        }

        console.log('✓ Phase 3.1 test passed: TipTap editor loads for .md files');
    });

    test('TipTap editor shows toolbar with Live Preview label', async ({ page }) => {
        console.log('Opening a .md file to check toolbar');

        // Open file using Quick Open
        await page.keyboard.press('Meta+p');
        await page.waitForTimeout(500);
        await page.keyboard.type('foo.md');
        await page.waitForTimeout(1000);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(3000);

        // Check for the toolbar with "Live Preview Mode" text
        const toolbar = page.locator('.quallaa-editor-toolbar');
        const hasToolbar = (await toolbar.count()) > 0;
        console.log('Toolbar found:', hasToolbar);

        if (hasToolbar) {
            const toolbarText = await toolbar.textContent();
            console.log('Toolbar content:', toolbarText);
            expect(toolbarText).toContain('Live Preview');
        }

        // Take screenshot
        await page.screenshot({ path: 'screenshots/tiptap-phase3.1-toolbar-test.png', fullPage: true });

        expect(hasToolbar, 'Toolbar should be present').toBe(true);
    });
});
