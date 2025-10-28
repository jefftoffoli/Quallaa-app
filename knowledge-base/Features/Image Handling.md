# Image Handling

## Overview

Images play two distinct roles in Quallaa:

1. **Traditional KB images** - Screenshots, diagrams, visual references embedded
   in notes
2. **Visual compression AI** - DeepSeek-OCR cloud service for compressing entire
   knowledge bases (separate from image embedding)

This document covers traditional image handling in notes. For visual compression
AI, see [[Monetization Strategy - AI Cloud Services]] and
[[DeepSeek-OCR Integration Assessment]].

---

## Traditional Image Use Cases

### Documentation Images

- Screenshots of UIs, error messages, configurations
- Code output visualizations
- Terminal session captures
- Browser console screenshots

### Conceptual Diagrams

- Architecture diagrams
- Flowcharts and decision trees
- Concept maps and mind maps
- Entity-relationship diagrams

### Visual References

- Design mockups and wireframes
- Whiteboard photos from meetings
- Sketches and hand-drawn diagrams
- Charts and graphs

### Knowledge Capture

- Photos of physical notes or books
- Conference slides
- Annotated PDFs exported as images
- Visual inspiration and mood boards

---

## Image Embedding Syntax

**Goal**: Follow Obsidian-compatible syntax for easy migration and familiar UX.

### Basic Embedding

```markdown
![[image.png]] ![[screenshots/error-message.png]] ![[diagrams/architecture.png]]
```

### With Size Control

```markdown
![[logo.png|100]] # Width: 100px ![[diagram.png|500x300]] # Width: 500px,
Height: 300px ![[banner.png|100%]] # Full width
```

### With Alt Text

```markdown
![[architecture.png|Architecture diagram showing the widget system]]
```

---

## Phase-by-Phase Implementation

### Phase 1-2: Not Implemented ⏸️

**Status**: Images are deferred until core KB features ship.

**Why**: Focus on [[Wiki Links]], [[Backlinks Panel]], [[Tags System]],
[[Quick Switcher]] first. These provide more value to
[[Natural Language Developers]] who work primarily in text.

### Phase 3: Basic Image Support 📋

**Goal**: Functional image embedding with minimal features.

**Features**:

- Render images in Monaco editor (inline preview)
- Support `![[image.png]]` syntax
- Resolve relative and absolute paths
- Basic file type support (PNG, JPG, GIF, SVG)
- Drag-and-drop image insertion

**Technical Implementation**:

- Monaco editor decorations for inline rendering
- Image path resolution via [[Theia File Service]]
- Wiki link parser extension for image syntax
- File URI scheme handling for local images

**Deliverable**: Can embed images in notes and see them rendered

### Phase 4: Enhanced Image Features 📋

**Goal**: Improve UX to match Obsidian patterns.

**Features**:

- Hover preview for `![[image]]` links
- Image size control (`|100`, `|500x300`)
- Alt text support for accessibility
- Image browser widget (view all images in KB)
- Thumbnail generation for large images

**Technical Implementation**:

- Hover provider showing image preview
- Parser support for size and alt text
- Image indexing service (scan for image files)
- Lazy loading for performance

**Deliverable**: Polished image experience matching Obsidian

### Phase 5: Advanced Image Features 📋

**Goal**: Differentiated features beyond basic embedding.

**Features**:

- Image backlinks ("which notes reference this image?")
- Image nodes in [[Knowledge Graph View]]
- Image search by filename
- Image annotations (draw on images, add notes)
- Image comparison (side-by-side view)

**Technical Implementation**:

- Extend backlink detection to image references
- Graph builder includes image nodes
- Search index includes image metadata
- Canvas overlay for annotations

**Deliverable**: Images as first-class KB citizens

### Future: Advanced AI Features (Phase 7+) 🔮

**Goal**: AI-powered image understanding (separate from visual compression
service).

**Features**:

- OCR for text extraction from screenshots
- Image similarity search
- Auto-captioning and alt text generation
- Extract diagrams/flowcharts as structured data
- Visual question answering ("What's in this image?")

**Technical Implementation**:

- Local OCR models (Tesseract or PaddleOCR)
- CLIP embeddings for similarity search
- LLaVA or similar VLM for image understanding
- Optional: Cloud service for heavy processing

**Deliverable**: Intelligent image features

---

## Storage Strategy

### Location Convention

**Flexible approach** (user preference):

```
workspace/
├── notes/
│   └── Meeting Notes.md
├── images/
│   └── screenshot.png
└── attachments/
    └── diagram.png
```

**OR co-located:**

```
workspace/
├── projects/
│   ├── Project A.md
│   ├── project-a-architecture.png
│   └── project-a-mockup.png
```

**Decision**: Support both patterns. User chooses via preference setting.

**Default**: `images/` folder at workspace root (matches Obsidian default).

### Path Resolution Strategy

Follow Obsidian's link resolution (see [[Wiki Links]]):

1. **Shortest path first**: `![[diagram.png]]` matches any `diagram.png` in
   workspace
2. **Relative paths**: `![[./images/diagram.png]]` for explicit relative
3. **Absolute paths**: `![[/workspace/images/diagram.png]]` for absolute
4. **Folder disambiguation**: `![[projects/diagram.png]]` if multiple exist

**Autocomplete behavior**: Show relative path from workspace root for
disambiguation.

### File Organization

**Recommendation** (in docs, not enforced):

- `/images` - Screenshots and photos
- `/diagrams` - Conceptual diagrams and flowcharts
- `/assets` - Logos, icons, branding
- `/attachments` - Mixed files (PDFs, images, etc.)

Users can organize however they want; KB features adapt.

---

## Image Backlinks

**Feature**: See which notes reference an image.

**Implementation** (Phase 5):

**In Backlinks Panel** (see [[Backlinks Panel]]):

```
📷 screenshot-2025-01-15.png

Referenced in:
- [[Bug Report - Login Issue]]
  "Here's the error: ![[screenshot-2025-01-15.png]]"

- [[Meeting Notes - 2025-01-15]]
  "Architecture diagram: ![[screenshot-2025-01-15.png]]"
```

**Technical Approach**:

- Extend wiki link parser to track image references
- Include images in backlink index
- Show image preview in backlink panel
- Support rename/move with reference updates

---

## Knowledge Graph Integration

**Decision**: Images as secondary nodes (Phase 5).

### Visual Representation

**Image nodes**:

- Different shape (rounded square) vs note nodes (circle)
- Smaller size by default
- Thumbnail preview on hover
- Lower emphasis (muted colors)

**Connections**:

- Note → Image (embedded)
- Image → Multiple Notes (backlinks)
- No Image → Image connections (images don't reference each other)

### Filter Options

**Toggle**: "Show image nodes" (default: off for clarity)

**Rationale**: Images are supporting content, not primary knowledge nodes. Graph
should emphasize note-to-note connections by default.

---

## Image Search

### Phase 3: Filename Search

**Behavior**: Quick Switcher includes images

```
Cmd+O → type "screenshot"

Results:
📄 Screenshot Guide.md
📷 screenshot-error-login.png
📷 screenshot-dashboard.png
```

**Implementation**: Index image files alongside markdown files.

### Phase 5: Content-Based Search

**OCR for text extraction**:

- Index text content from screenshots
- Search finds images containing specific text
- Show extracted text in search results

**Example**:

```
Search: "authentication failed"

Results:
📷 error-log-2025-01-15.png
  Contains: "Error: authentication failed at line 42"
```

**Implementation**: Tesseract OCR during indexing, extracted text stored in
search index.

### Future: Visual Similarity

**Feature**: "Find similar images"

**Use Case**: Find related screenshots, duplicate diagrams, visual concepts

**Implementation**: CLIP embeddings + vector similarity search

---

## Accessibility

### Alt Text

**Syntax**: `![[image.png|Alt text describing the image]]`

**Automatic generation** (Phase 7+):

- VLM generates alt text if not provided
- User can edit/override generated text
- Stored as frontmatter in referencing note

### Screen Reader Support

**Requirements**:

- Proper `alt` attributes in rendered HTML
- Keyboard navigation for image galleries
- Announce image presence in note structure
- Focus management for inline images

---

## Performance Considerations

### Lazy Loading

**Strategy**: Only render images in viewport

**Implementation**:

- Virtual scrolling for image-heavy notes
- Thumbnail generation on-demand
- Cache rendered previews

### Large Image Handling

**Automatic optimization**:

- Warn if image >5MB
- Offer to compress/resize
- Generate web-optimized versions
- Original preserved in `/originals` folder

### Thumbnail Generation

**Approach**:

- Generate on first view
- Cache in `.quallaa/thumbnails/`
- Max dimensions: 400x400px
- WebP format for efficiency

---

## Integration with Other Features

### Wiki Links

- Extend parser to recognize `![[image]]` syntax
- Include images in link autocomplete
- Show preview icon to distinguish images from notes

### Backlinks Panel

- Track image references
- Show context snippets including images
- Inline image preview in backlinks

### Knowledge Graph View

- Optional image nodes
- Visual distinction from note nodes
- Filter controls

### Quick Switcher

- Images appear in search results
- Visual icon (📷) to identify type
- Fuzzy matching on filename

### Tags System

- Tag images via frontmatter in referencing note
- OR via image metadata (EXIF, IPTC)
- Filter images by tag

### Daily Notes

- Quick image insertion
- Auto-organize by date (`images/2025-01-15/`)
- Journal-style photo capture

---

## Design Decisions

### Why Not Visual Compression in Storage?

See: [[DeepSeek-OCR Integration Assessment]]

**Decision**: Do NOT use visual compression (DeepSeek-OCR) for storing images or
notes.

**Rationale**:

- Breaks [[Wiki Links]], [[Backlinks Panel]], full-text search
- 5-second latency (too slow for editing)
- 97% accuracy insufficient for code
- Complexity outweighs benefits for markdown-native content

**Alternative**: Visual compression as **cloud AI service** (separate
architecture)

### Why Defer Images to Phase 3?

**Decision**: Ship core KB features (wiki links, backlinks, tags, graph) before
images.

**Rationale**:

- [[Natural Language Developers]] work primarily in text
- Images are supporting content, not primary workflow
- Core KB features provide more value
- Can always add images later without breaking changes

**Trade-off**: Early users can't embed images, but they get faster feature
velocity on core KB.

### Why Follow Obsidian Syntax?

**Decision**: Compatible `![[image]]` syntax, resolution strategy, size control.

**Rationale**:

- User expectations (target audience knows Obsidian)
- Easy migration (import Obsidian vaults)
- Proven UX patterns
- Community-standard conventions

**Distinction**: Not aiming for 100% compatibility (see
[[Architecture Decisions]]), but adopting best patterns.

---

## Clear Separation: Images vs Visual Compression

### Images as Content (This Document)

**What**: Traditional image embedding in notes (screenshots, diagrams, photos)

**Where**: Local files in workspace, referenced by markdown

**How**: `![[image.png]]` syntax, rendered inline

**Purpose**: Visual documentation and knowledge capture

**Technology**: Standard image formats (PNG, JPG, SVG)

### Visual Compression AI (Separate Feature)

**What**: DeepSeek-OCR compresses entire knowledge base as visual
representations

**Where**: Cloud service, batch processing overnight

**How**: Backend compression pipeline, not visible in IDE

**Purpose**: Enable AI features (semantic search, cross-document synthesis)

**Technology**: 3B-parameter vision-language model on GPUs

See: [[Monetization Strategy - AI Cloud Services]]

**Key Insight**: These are two completely different use cases and architectures.
Do NOT conflate them.

---

## Success Metrics

### Phase 3 (Basic Support)

- [ ] Image embedding renders correctly
- [ ] Drag-and-drop works
- [ ] File paths resolve properly
- [ ] <100ms render time per image

### Phase 4 (Enhanced UX)

- [ ] Hover preview functional
- [ ] Size control works
- [ ] Image browser usable
- [ ] Users report "feels like Obsidian"

### Phase 5 (Advanced Features)

- [ ] Image backlinks accurate
- [ ] Graph view includes images
- [ ] OCR search finds text in images
- [ ] Users consider images "first-class"

---

## Related Concepts

- [[Wiki Links]] - Core syntax extended for images
- [[Backlinks Panel]] - Extended to track image references
- [[Knowledge Graph View]] - Includes image nodes
- [[Quick Switcher]] - Searches images by filename
- [[Theia File Service]] - Handles image file operations
- [[Obsidian-Like Experience]] - UI/UX inspiration
- [[Monetization Strategy - AI Cloud Services]] - Visual compression AI
  (separate feature)
- [[DeepSeek-OCR Integration Assessment]] - Why NOT to use visual compression
  for storage

---

## Implementation Notes

### Monaco Integration

**Approach**: Decoration API for inline rendering

```typescript
// Pseudo-code
const imageDecoration = {
    range: imageRange,
    options: {
        afterContentClassName: 'image-preview',
        after: { contentText: '', attachedData: imageUri },
    },
};
```

### File Watching

**Behavior**: Re-render when image file changes

**Implementation**:

- Subscribe to FileService events
- Invalidate cache on file change
- Re-render affected decorations

### Memory Management

**Strategy**: Limit in-memory images

**Approach**:

- LRU cache (max 50 images)
- Evict least-recently-used
- Reload from disk on cache miss

---

## Open Questions

These are questions to resolve during implementation:

1. **Image optimization**: Automatic or user-triggered?
2. **Thumbnail size**: 200px, 400px, or user preference?
3. **Storage location default**: `/images` or `/attachments`?
4. **Clipboard handling**: Auto-save pasted images?
5. **External images**: Support `![](https://...)` syntax?
6. **GIF handling**: Animate or static frame?
7. **SVG security**: Sanitize to prevent XSS?

These will be resolved during Phase 3 implementation based on user feedback.
