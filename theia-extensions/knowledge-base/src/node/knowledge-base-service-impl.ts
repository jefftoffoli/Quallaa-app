/********************************************************************************
 * Copyright (C) 2025 Jeff Toffoli
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

/**
 * Backend implementation of the knowledge base service
 */

import { injectable, inject } from '@theia/core/shared/inversify';
import { FileSearchService } from '@theia/file-search/lib/common/file-search-service';
import { WorkspaceServer } from '@theia/workspace/lib/common/workspace-protocol';
import URI from '@theia/core/lib/common/uri';
import { KnowledgeBaseService, Note, WikiLink } from '../common/knowledge-base-protocol';
import { parseWikiLinks } from '../common/wiki-link-parser';
import * as fs from 'fs';
import * as path from 'path';

@injectable()
export class KnowledgeBaseServiceImpl implements KnowledgeBaseService {
    @inject(FileSearchService)
    protected readonly fileSearchService: FileSearchService;

    @inject(WorkspaceServer)
    protected readonly workspaceServer: WorkspaceServer;

    private noteCache: Map<string, Note> = new Map();
    private lastIndexTime = 0;
    private readonly CACHE_DURATION = 5000; // 5 seconds
    private workspaceRoot: URI | undefined;

    /**
     * Get all markdown notes in the workspace
     */
    async getAllNotes(): Promise<Note[]> {
        const now = Date.now();
        if (now - this.lastIndexTime < this.CACHE_DURATION && this.noteCache.size > 0) {
            return Array.from(this.noteCache.values());
        }

        await this.indexNotes();
        return Array.from(this.noteCache.values());
    }

    /**
     * Search notes by title (fuzzy match)
     */
    async searchNotes(query: string): Promise<Note[]> {
        const allNotes = await this.getAllNotes();
        const lowerQuery = query.toLowerCase();

        return allNotes
            .filter(note => note.title.toLowerCase().includes(lowerQuery) || note.basename.toLowerCase().includes(lowerQuery))
            .sort((a, b) => {
                // Prioritize exact matches
                const aExact = a.title.toLowerCase() === lowerQuery || a.basename.toLowerCase() === lowerQuery;
                const bExact = b.title.toLowerCase() === lowerQuery || b.basename.toLowerCase() === lowerQuery;
                if (aExact && !bExact) {
                    return -1;
                }
                if (!aExact && bExact) {
                    return 1;
                }

                // Then prioritize starts-with
                const aStarts = a.title.toLowerCase().startsWith(lowerQuery) || a.basename.toLowerCase().startsWith(lowerQuery);
                const bStarts = b.title.toLowerCase().startsWith(lowerQuery) || b.basename.toLowerCase().startsWith(lowerQuery);
                if (aStarts && !bStarts) {
                    return -1;
                }
                if (!aStarts && bStarts) {
                    return 1;
                }

                // Alphabetical
                return a.title.localeCompare(b.title);
            })
            .slice(0, 50); // Limit results
    }

    /**
     * Find a note by exact title or basename match
     * Follows Obsidian-inspired resolution:
     * 1. Exact filename match (case-insensitive)
     * 2. Normalized match (spaces/-/_ equivalent)
     * 3. Check path if target includes folder (e.g., "Folder/Note")
     * 4. Most recently modified if still ambiguous
     */
    async findNoteByTitle(title: string): Promise<Note | undefined> {
        const allNotes = await this.getAllNotes();

        // Remove .md extension if present
        const cleanTitle = title.replace(/\.md$/i, '');
        const lowerTitle = cleanTitle.toLowerCase();

        // Check if this is a path-based link (contains / or \)
        if (cleanTitle.includes('/') || cleanTitle.includes('\\')) {
            return this.findNoteByPath(allNotes, cleanTitle);
        }

        // 1. Try exact basename match first (most common case)
        let matches = allNotes.filter(n => n.basename.toLowerCase() === lowerTitle);
        if (matches.length === 1) {
            return matches[0];
        }
        if (matches.length > 1) {
            return this.getMostRecentNote(matches);
        }

        // 2. Try normalized match (treat spaces, hyphens, underscores as equivalent)
        const normalized = this.normalizeTitle(lowerTitle);
        matches = allNotes.filter(n => this.normalizeTitle(n.basename.toLowerCase()) === normalized);
        if (matches.length === 1) {
            return matches[0];
        }
        if (matches.length > 1) {
            return this.getMostRecentNote(matches);
        }

        // 3. Try exact title match (from frontmatter, future enhancement)
        matches = allNotes.filter(n => n.title.toLowerCase() === lowerTitle);
        if (matches.length === 1) {
            return matches[0];
        }
        if (matches.length > 1) {
            return this.getMostRecentNote(matches);
        }

        return undefined;
    }

    /**
     * Find note by path (e.g., "Folder/Note")
     */
    private findNoteByPath(allNotes: Note[], pathTarget: string): Note | undefined {
        const normalized = pathTarget.toLowerCase().replace(/\\/g, '/');

        // Try exact path match
        const matches = allNotes.filter(n => {
            const notePath = n.path.toLowerCase().replace(/\\/g, '/');
            return notePath.endsWith(normalized) || notePath.endsWith(normalized + '.md');
        });

        if (matches.length === 1) {
            return matches[0];
        }
        if (matches.length > 1) {
            return this.getMostRecentNote(matches);
        }

        return undefined;
    }

    /**
     * Normalize title for matching (spaces, hyphens, underscores are equivalent)
     */
    private normalizeTitle(title: string): string {
        return title.replace(/[\s\-_]+/g, '-');
    }

    /**
     * Get the most recently modified note from a list
     * Used for disambiguating when multiple notes match
     */
    private getMostRecentNote(notes: Note[]): Note {
        // For now, just return the first one
        // TODO: Add lastModified field to Note interface and use that
        return notes[0];
    }

    /**
     * Parse wiki links from content
     */
    parseWikiLinks(content: string): WikiLink[] {
        return parseWikiLinks(content);
    }

    /**
     * Resolve a wiki link target to a note
     */
    async resolveWikiLink(target: string): Promise<Note | undefined> {
        return this.findNoteByTitle(target);
    }

    /**
     * Get the URI where a new note should be created
     * Returns the URI but does NOT create the file (frontend handles creation)
     */
    async createNote(target: string, currentFileUri?: string): Promise<string> {
        // Remove .md extension if present
        const cleanTarget = target.replace(/\.md$/i, '');

        let noteUri: URI;

        // Check if target includes a path
        if (cleanTarget.includes('/') || cleanTarget.includes('\\')) {
            // Create in specified folder relative to workspace root
            const defaultLocation = await this.getDefaultNoteLocation();
            const baseUri = new URI(defaultLocation);
            const normalized = cleanTarget.replace(/\\/g, '/');
            noteUri = baseUri.resolve(normalized + '.md');
        } else {
            // Create in default location
            const defaultLocation = await this.getDefaultNoteLocation();
            const baseUri = new URI(defaultLocation);
            noteUri = baseUri.resolve(cleanTarget + '.md');
        }

        // Return URI for frontend to create
        console.log(`Will create new note at: ${noteUri.toString()}`);

        // Invalidate cache so it picks up the new file once created
        this.lastIndexTime = 0;

        return noteUri.toString();
    }

    /**
     * Get the default location for new notes
     * Uses workspace root for now (derived from indexed notes)
     * TODO: Add preference knowledgeBase.defaultNoteLocation
     */
    async getDefaultNoteLocation(): Promise<string> {
        // Ensure we have indexed at least once
        if (!this.workspaceRoot) {
            await this.getAllNotes();
        }

        if (!this.workspaceRoot) {
            throw new Error('No workspace root found - no notes indexed yet');
        }

        // Use workspace root
        // TODO: Check preference for custom default location
        return this.workspaceRoot.toString();
    }

    /**
     * Set the workspace root from a file URI
     */
    async setWorkspaceFromFile(fileUri: string): Promise<void> {
        const uri = new URI(fileUri);
        // Get the parent directory (workspace root)
        this.workspaceRoot = uri.parent;
        console.log('[KnowledgeBase] Workspace root set to:', this.workspaceRoot.toString());
        // Clear cache to force re-indexing
        this.lastIndexTime = 0;
    }

    /**
     * Index all markdown files in the workspace
     */
    private async indexNotes(): Promise<void> {
        this.noteCache.clear();

        try {
            if (!this.workspaceRoot) {
                console.warn('[KnowledgeBase] No workspace root set - cannot index notes');
                return;
            }

            // Convert URI to filesystem path
            const fsPath = this.workspaceRoot.path.fsPath();
            console.log('[KnowledgeBase] Searching for .md files in:', fsPath);

            // Recursively find all .md files
            const findMarkdownFiles = (dir: string): string[] => {
                const files: string[] = [];
                try {
                    const entries = fs.readdirSync(dir, { withFileTypes: true });
                    for (const entry of entries) {
                        const fullPath = path.join(dir, entry.name);
                        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                            files.push(...findMarkdownFiles(fullPath));
                        } else if (entry.isFile() && entry.name.endsWith('.md')) {
                            files.push(fullPath);
                        }
                    }
                } catch (err) {
                    console.error('[KnowledgeBase] Error reading directory:', dir, err);
                }
                return files;
            };

            const results = findMarkdownFiles(fsPath);
            console.log('[KnowledgeBase] Found', results.length, 'markdown files in', fsPath);

            for (const result of results) {
                // Convert filesystem path to file:// URI
                const uri = new URI('file://' + result);
                const basename = uri.path.base;
                const name = basename.replace(/\.md$/, '');

                const note: Note = {
                    uri: uri.toString(),
                    title: name, // TODO: Extract from frontmatter in future
                    basename: name,
                    path: uri.path.toString(),
                };

                this.noteCache.set(uri.toString(), note);
            }

            this.lastIndexTime = Date.now();
        } catch (error) {
            console.error('Failed to index notes:', error);
        }
    }
}
