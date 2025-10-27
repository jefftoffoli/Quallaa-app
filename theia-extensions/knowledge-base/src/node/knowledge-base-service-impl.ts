/**
 * Backend implementation of the knowledge base service
 */

import { injectable, inject } from '@theia/core/shared/inversify';
import { FileSearchService } from '@theia/file-search/lib/common/file-search-service';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import URI from '@theia/core/lib/common/uri';
import { KnowledgeBaseService, Note, WikiLink } from '../common/knowledge-base-protocol';
import { parseWikiLinks } from '../common/wiki-link-parser';

@injectable()
export class KnowledgeBaseServiceImpl implements KnowledgeBaseService {
    @inject(FileSearchService)
    protected readonly fileSearchService: FileSearchService;

    @inject(FileService)
    protected readonly fileService: FileService;

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
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;

                // Then prioritize starts-with
                const aStarts = a.title.toLowerCase().startsWith(lowerQuery) || a.basename.toLowerCase().startsWith(lowerQuery);
                const bStarts = b.title.toLowerCase().startsWith(lowerQuery) || b.basename.toLowerCase().startsWith(lowerQuery);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;

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
        if (matches.length === 1) return matches[0];
        if (matches.length > 1) return this.getMostRecentNote(matches);

        // 2. Try normalized match (treat spaces, hyphens, underscores as equivalent)
        const normalized = this.normalizeTitle(lowerTitle);
        matches = allNotes.filter(n => this.normalizeTitle(n.basename.toLowerCase()) === normalized);
        if (matches.length === 1) return matches[0];
        if (matches.length > 1) return this.getMostRecentNote(matches);

        // 3. Try exact title match (from frontmatter, future enhancement)
        matches = allNotes.filter(n => n.title.toLowerCase() === lowerTitle);
        if (matches.length === 1) return matches[0];
        if (matches.length > 1) return this.getMostRecentNote(matches);

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

        if (matches.length === 1) return matches[0];
        if (matches.length > 1) return this.getMostRecentNote(matches);

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
     * Create a new note file
     * If target contains a path (e.g., "Folder/Note"), creates in that folder
     * Otherwise, creates in default note location (workspace root for now)
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

        // Create empty file
        try {
            await this.fileService.create(noteUri, '');
            console.log(`Created new note: ${noteUri.toString()}`);

            // Invalidate cache to pick up new file
            this.lastIndexTime = 0;

            return noteUri.toString();
        } catch (error) {
            console.error(`Failed to create note ${noteUri.toString()}:`, error);
            throw error;
        }
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
     * Index all markdown files in the workspace
     */
    private async indexNotes(): Promise<void> {
        this.noteCache.clear();

        try {
            // Search for all .md files in the workspace
            const results = await this.fileSearchService.find('*.md', {
                limit: 10000,
                useGitIgnore: true
            });

            // Derive workspace root from first result if not set
            if (results.length > 0 && !this.workspaceRoot) {
                const firstUri = new URI(results[0]);
                // Find the common ancestor - for simplicity, go up until we find a reasonable root
                // This heuristic works for most cases
                let current = firstUri.parent;
                while (current.path.dir !== current.path.root && current.parent.toString() !== current.toString()) {
                    // Check if this looks like a project root (has .git, package.json, etc.)
                    // For Phase 1.2, just use a reasonable ancestor
                    const depth = current.path.toString().split('/').length;
                    if (depth <= 5) break; // Don't go too far up
                    current = current.parent;
                }
                this.workspaceRoot = current;
                console.log('Derived workspace root:', this.workspaceRoot.toString());
            }

            for (const result of results) {
                const uri = new URI(result);
                const basename = uri.path.base;
                const name = basename.replace(/\.md$/, '');

                const note: Note = {
                    uri: uri.toString(),
                    title: name, // TODO: Extract from frontmatter in future
                    basename: name,
                    path: uri.path.toString()
                };

                this.noteCache.set(uri.toString(), note);
            }

            this.lastIndexTime = Date.now();
        } catch (error) {
            console.error('Failed to index notes:', error);
        }
    }
}
