/********************************************************************************
 * Copyright (C) 2025 Jeff Toffoli
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

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
    /** Last modified timestamp (Unix milliseconds) */
    lastModified: number;
    /** Aliases from frontmatter (alternative names for this note) */
    aliases?: string[];
    /** Tags from frontmatter or content */
    tags?: string[];
    /** Full frontmatter data (for future extensions) */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    frontmatter?: Record<string, any>;
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
 * Represents a backlink (incoming link) to a note
 */
export interface Backlink {
    /** Source note URI (the note containing the link) */
    sourceUri: string;
    /** Source note title */
    sourceTitle: string;
    /** Line number where the link appears */
    line: number;
    /** The full line of text containing the link */
    context: string;
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

    /**
     * Index a workspace
     * Called by frontend with explicit workspace root URI
     */
    indexWorkspace(workspaceRoot: string): Promise<void>;

    /**
     * Get all backlinks (incoming links) to a note
     * Following Foam's connections pattern
     */
    getBacklinks(noteUri: string): Promise<Backlink[]>;
}
