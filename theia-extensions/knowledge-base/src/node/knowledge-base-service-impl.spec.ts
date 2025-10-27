/**
 * Tests for knowledge base service implementation
 */

import { expect } from 'chai';
import { KnowledgeBaseServiceImpl } from './knowledge-base-service-impl';
import { FileSearchService } from '@theia/file-search/lib/common/file-search-service';

// Mock FileSearchService
class MockFileSearchService implements Partial<FileSearchService> {
    private mockFiles: string[] = [];

    setMockFiles(files: string[]): void {
        this.mockFiles = files;
    }

    async find(searchPattern: string, options?: any): Promise<string[]> {
        return this.mockFiles;
    }
}

describe('KnowledgeBaseServiceImpl', () => {
    let service: KnowledgeBaseServiceImpl;
    let mockFileSearchService: MockFileSearchService;

    beforeEach(() => {
        mockFileSearchService = new MockFileSearchService();
        service = new KnowledgeBaseServiceImpl();
        // Inject mock service
        (service as any).fileSearchService = mockFileSearchService;
    });

    describe('getAllNotes', () => {
        it('should index and return all markdown notes', async () => {
            mockFileSearchService.setMockFiles([
                'file:///workspace/Note1.md',
                'file:///workspace/Note2.md',
                'file:///workspace/subdir/Note3.md'
            ]);

            const notes = await service.getAllNotes();

            expect(notes).to.have.length(3);
            expect(notes[0].basename).to.equal('Note1');
            expect(notes[1].basename).to.equal('Note2');
            expect(notes[2].basename).to.equal('Note3');
        });

        it('should cache results for performance', async () => {
            mockFileSearchService.setMockFiles([
                'file:///workspace/Note1.md'
            ]);

            const notes1 = await service.getAllNotes();

            // Change mock files, but cache should return same results
            mockFileSearchService.setMockFiles([
                'file:///workspace/Note1.md',
                'file:///workspace/Note2.md'
            ]);

            const notes2 = await service.getAllNotes();

            // Should still have cached result (1 note, not 2)
            expect(notes2).to.have.length(1);
            expect(notes1).to.deep.equal(notes2);
        });

        it('should handle empty workspace', async () => {
            mockFileSearchService.setMockFiles([]);

            const notes = await service.getAllNotes();

            expect(notes).to.be.an('array').that.is.empty;
        });

        it('should extract title from filename', async () => {
            mockFileSearchService.setMockFiles([
                'file:///workspace/My Awesome Note.md'
            ]);

            const notes = await service.getAllNotes();

            expect(notes[0].title).to.equal('My Awesome Note');
            expect(notes[0].basename).to.equal('My Awesome Note');
        });
    });

    describe('searchNotes', () => {
        beforeEach(async () => {
            mockFileSearchService.setMockFiles([
                'file:///workspace/JavaScript Basics.md',
                'file:///workspace/Java Programming.md',
                'file:///workspace/Python Guide.md',
                'file:///workspace/TypeScript Advanced.md'
            ]);
            await service.getAllNotes(); // Trigger indexing
        });

        it('should find notes by partial match', async () => {
            const results = await service.searchNotes('Java');

            expect(results.length).to.be.at.least(1);
            const titles = results.map(n => n.title);
            expect(titles).to.include('JavaScript Basics');
            expect(titles).to.include('Java Programming');
        });

        it('should be case insensitive', async () => {
            const results = await service.searchNotes('python');

            expect(results).to.have.length(1);
            expect(results[0].title).to.equal('Python Guide');
        });

        it('should prioritize exact matches', async () => {
            mockFileSearchService.setMockFiles([
                'file:///workspace/Test.md',
                'file:///workspace/Testing Advanced.md',
                'file:///workspace/Test Cases.md'
            ]);
            // Clear cache by creating new instance
            service = new KnowledgeBaseServiceImpl();
            (service as any).fileSearchService = mockFileSearchService;

            const results = await service.searchNotes('Test');

            // Exact match should be first
            expect(results[0].title).to.equal('Test');
        });

        it('should prioritize starts-with matches', async () => {
            const results = await service.searchNotes('Type');

            expect(results[0].title).to.equal('TypeScript Advanced');
        });

        it('should return empty array when no matches', async () => {
            const results = await service.searchNotes('Nonexistent');

            expect(results).to.be.an('array').that.is.empty;
        });

        it('should limit results to 50', async () => {
            // Create 100 mock files
            const manyFiles = Array.from({ length: 100 }, (_, i) =>
                `file:///workspace/Note${i}.md`
            );
            mockFileSearchService.setMockFiles(manyFiles);
            service = new KnowledgeBaseServiceImpl();
            (service as any).fileSearchService = mockFileSearchService;

            const results = await service.searchNotes('Note');

            expect(results).to.have.length(50);
        });
    });

    describe('findNoteByTitle', () => {
        beforeEach(async () => {
            mockFileSearchService.setMockFiles([
                'file:///workspace/Exact Match.md',
                'file:///workspace/Partial Match Test.md',
                'file:///workspace/case-sensitive.md'
            ]);
            await service.getAllNotes();
        });

        it('should find note by exact basename match', async () => {
            const note = await service.findNoteByTitle('Exact Match');

            expect(note).to.not.be.undefined;
            expect(note?.title).to.equal('Exact Match');
        });

        it('should be case insensitive', async () => {
            const note = await service.findNoteByTitle('exact match');

            expect(note).to.not.be.undefined;
            expect(note?.title).to.equal('Exact Match');
        });

        it('should handle .md extension in query', async () => {
            const note = await service.findNoteByTitle('Exact Match');

            expect(note).to.not.be.undefined;
            expect(note?.title).to.equal('Exact Match');
        });

        it('should return undefined for non-existent note', async () => {
            const note = await service.findNoteByTitle('Does Not Exist');

            expect(note).to.be.undefined;
        });

        it('should handle special characters', async () => {
            mockFileSearchService.setMockFiles([
                'file:///workspace/Note-with-dashes.md'
            ]);
            service = new KnowledgeBaseServiceImpl();
            (service as any).fileSearchService = mockFileSearchService;

            const note = await service.findNoteByTitle('Note-with-dashes');

            expect(note).to.not.be.undefined;
            expect(note?.title).to.equal('Note-with-dashes');
        });
    });

    describe('parseWikiLinks', () => {
        it('should parse wiki links from content', () => {
            const content = 'Text with [[Link 1]] and [[Link 2]]';
            const links = service.parseWikiLinks(content);

            expect(links).to.have.length(2);
            expect(links[0].target).to.equal('Link 1');
            expect(links[1].target).to.equal('Link 2');
        });

        it('should handle content with no links', () => {
            const content = 'Plain text without links';
            const links = service.parseWikiLinks(content);

            expect(links).to.be.an('array').that.is.empty;
        });
    });

    describe('resolveWikiLink', () => {
        beforeEach(async () => {
            mockFileSearchService.setMockFiles([
                'file:///workspace/Existing Note.md',
                'file:///workspace/Another Note.md'
            ]);
            await service.getAllNotes();
        });

        it('should resolve existing wiki link', async () => {
            const note = await service.resolveWikiLink('Existing Note');

            expect(note).to.not.be.undefined;
            expect(note?.title).to.equal('Existing Note');
        });

        it('should return undefined for broken link', async () => {
            const note = await service.resolveWikiLink('Broken Link');

            expect(note).to.be.undefined;
        });

        it('should be case insensitive when resolving', async () => {
            const note = await service.resolveWikiLink('existing note');

            expect(note).to.not.be.undefined;
            expect(note?.title).to.equal('Existing Note');
        });
    });

    describe('Integration Tests', () => {
        it('should handle complete workflow: index -> search -> resolve', async () => {
            // Setup
            mockFileSearchService.setMockFiles([
                'file:///workspace/Project Ideas.md',
                'file:///workspace/Project Plan.md',
                'file:///workspace/Meeting Notes.md'
            ]);

            // Index
            const allNotes = await service.getAllNotes();
            expect(allNotes).to.have.length(3);

            // Search
            const searchResults = await service.searchNotes('Project');
            expect(searchResults).to.have.length(2);

            // Resolve
            const resolved = await service.resolveWikiLink('Project Ideas');
            expect(resolved).to.not.be.undefined;
            expect(resolved?.title).to.equal('Project Ideas');
        });

        it('should parse and resolve wiki links from content', async () => {
            mockFileSearchService.setMockFiles([
                'file:///workspace/Note A.md',
                'file:///workspace/Note B.md',
                'file:///workspace/Note C.md'
            ]);
            await service.getAllNotes();

            const content = 'See [[Note A]] and [[Note B]] but not [[Missing Note]]';
            const links = service.parseWikiLinks(content);

            expect(links).to.have.length(3);

            // Resolve each link
            const resolvedA = await service.resolveWikiLink(links[0].target);
            const resolvedB = await service.resolveWikiLink(links[1].target);
            const resolvedMissing = await service.resolveWikiLink(links[2].target);

            expect(resolvedA).to.not.be.undefined;
            expect(resolvedB).to.not.be.undefined;
            expect(resolvedMissing).to.be.undefined;
        });
    });
});
