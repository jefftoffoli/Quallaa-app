/**
 * Protocol definitions for knowledge base backend/frontend communication
 */

export const KnowledgeBasePath = '/services/knowledge-base';

export const KnowledgeBaseService = Symbol('KnowledgeBaseService');

/**
 * Represents a note in the knowledge base
 */
export interface Note {
    /** File URI */
    uri: string;
    /** Note title (derived from filename or frontmatter) */
    title: string;
    /** File basename without extension */
    basename: string;
    /** Full file path */
    path: string;
}

/**
 * Represents a wiki link found in a document
 */
export interface WikiLink {
    /** The target file/note (before | if piped) */
    target: string;
    /** Optional display text (after | if piped) */
    displayText?: string;
    /** Start position in document */
    start: number;
    /** End position in document */
    end: number;
    /** Whether this link resolves to an existing note */
    resolved: boolean;
    /** The resolved note URI if resolved */
    resolvedUri?: string;
}

/**
 * Service for indexing and querying notes in the workspace
 */
export interface KnowledgeBaseService {
    /**
     * Get all notes in the workspace
     */
    getAllNotes(): Promise<Note[]>;

    /**
     * Find notes matching a search query (for autocomplete)
     */
    searchNotes(query: string): Promise<Note[]>;

    /**
     * Find a note by its title or basename
     */
    findNoteByTitle(title: string): Promise<Note | undefined>;

    /**
     * Parse wiki links from document content
     */
    parseWikiLinks(content: string): WikiLink[];

    /**
     * Check if a wiki link resolves to an existing note
     */
    resolveWikiLink(target: string): Promise<Note | undefined>;

    /**
     * Create a new note at the specified location
     * Returns the URI of the created note
     */
    createNote(target: string, currentFileUri?: string): Promise<string>;

    /**
     * Get the default location for new notes
     * Uses workspace root by default
     */
    getDefaultNoteLocation(): Promise<string>;
}
