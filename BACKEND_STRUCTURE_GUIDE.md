# DailyDeck — System Architecture & Backend Structure Guide

## 1. Executive Architecture Overview

DailyDeck operates on a decoupled client-server architecture tailored for educational presentation automation. The solution consists of:

1. **Frontend Client (SPA)**: A single-page application built with modular ES6 JavaScript that manages activities, visual deck sequencing, real-time 16:9 slide previews, template options, and recipe compilation.
2. **Web Server Layer (`server.js`)**: A Node.js Express server that hosts and serves the application assets and static files over HTTP/3000 with cache-control headers.
3. **Cloud Slide Assembly Backend (`Code.gs`)**: A Google Apps Script microservice deployed as a Web App (`doPost`). It interfaces directly with the Google Drive and Google Slides APIs to clone master templates, substitute text tokens, inject speaker notes, convert presentations to PowerPoint (`.pptx`), and configure permissions.
4. **Data Compilation Bridge (`src/export/recipe.js`)**: The engine that transforms the in-memory timeline state into an exact, ordered JSON assembly recipe.

---

## 2. End-to-End System Data Flow

```
[Teacher in UI]
       │
       ▼ (1. Configure Deck)
[State Manager: src/state/state.js]
       │
       ▼ (2. Click "Assemble Deck")
[Recipe Compiler: src/export/recipe.js]
       │
       ▼ (3. HTTP POST JSON Payload)
[Google Apps Script Backend: Code.gs]
       │
       ├─► 3a. DriveApp.getFileById(templateId).makeCopy(...)
       ├─► 3b. SlidesApp.openById(...) & map master slides via [tags]
       ├─► 3c. Duplicate slides, replace {{tags}}, inject speaker notes
       ├─► 3d. Delete original master template slides & save
       ├─► 3e. Set sharing permissions (Anyone with link)
       └─► 3f. Optional: UrlFetchApp download PPTX blob
       │
       ▼ (4. Return JSON Response)
[Frontend: src/main.js]
       │
       ▼ (5. Display Direct Links & Confetti)
[Google Slides Presentation / PowerPoint Download]
```

---

## 3. Directory & File Reference

### Root Files

| File | Type | Purpose & Core Responsibility |
| :--- | :--- | :--- |
| **`server.js`** | Node.js Express | Local web server listening on port 3000. Serves static files with `no-cache` development headers and routes wildcard requests to `index.html`. |
| **`Code.gs`** | Google Apps Script | Remote backend API script. Implements `doPost(e)` to process presentation assembly recipes, mutate Google Slides decks via SlidesApp and DriveApp, and export `.pptx`. |
| **`index.html`** | HTML5 Application Shell | Main layout containing the 3-column workspace (Library, Deck Sequencer, Inspector/Preview), modal dialogs, and external stylesheets/fonts. |
| **`package.json`** | Configuration | NPM package manifest, scripts (`dev`, `start`, `lint`, `build`), and dependencies (`express`, `pdfkit`). |
| **`metadata.json`** | Configuration | Applet capabilities and runtime permissions. |
| **`AGENTS.md`** | Documentation | Development backlog, active feature roadmap, and session notes. |
| **`DailyDeck_Backend_Structure_Guide.pdf`** | Document | Exported PDF architecture guide generated from the codebase. |

---

### Core Frontend Source Modules (`src/`)

| File | Purpose & Responsibilities | Interactions & Collaborators |
| :--- | :--- | :--- |
| **`src/main.js`** | **Application Orchestrator & Network Dispatcher**<br>Initializes UI, toggles workspaces (Literacy vs. Numeracy), configures SortableJS drag-and-drop, binds modal dialogs, and triggers the `sendRecipeToAppsScript` fetch request. | Coordinates `state.js`, `timeline.js`, `inspector.js`, and `recipe.js`. |
| **`src/export/recipe.js`** | **Presentation Recipe Compiler**<br>Constructs the JSON array of slide instructions. Processes each timeline item across selected days (Monday–Friday) or weekly intervals, builds sound pyramid slide sequences, substitutes target words, and formats speaker notes. | Reads `globalSettings` and `timelineItems` from `state.js`; relies on `phonics.js` and `helpers.js`. |
| **`src/state/state.js`** | **Centralized Reactive State Store**<br>Maintains application state for both Literacy and Numeracy workspaces (`defaultLiteracySettings`, `defaultNumeracySettings`, `timelineItems`, `customTemplates`). Serializes to LocalStorage with versioned keys. | Imported by all UI controllers, `recipe.js`, and `main.js`. |
| **`src/data/constants.js`** | **Constants & Dictionaries**<br>Contains default template IDs (`DEFAULT_TEMPLATE_ID`, `NUMERACY_DEFAULT_TEMPLATE_ID`), day lists, Sounds-Write unit levels, and grammar/sentence type definitions. | Consumed by `state.js`, `inspector.js`, `recipe.js`, and `preview.js`. |
| **`src/data/sections.js`** | **Activity Catalog (`SECTION_DEFS`)**<br>Defines all activity templates (Intro Slide, Alphabet Sounds, Sound Pack, Word Building, Sentence Types, etc.), form field specifications, and styling metadata. | Used by `main.js` (Library), `timeline.js`, and `inspector.js`. |
| **`src/data/starters.js`** | **Pre-packaged Deck Starters (`STARTER_DEFS`)**<br>Defines turnkey decks (Kindergarten Core, Stage 1 Foundation, etc.) with pre-populated activity sequences and sample teacher data. | Used by `main.js` to populate starter deck items. |
| **`src/data/phonics.js`** | **Curriculum Phonics Word Pool**<br>Sounds-Write systematic synthetic phonics dictionary, unit sound matrices, and target vocabulary tiers. | Used by `recipe.js` and `inspector.js`. |
| **`src/ui/inspector.js`** | **Dynamic Inspector & Form Builder**<br>Renders contextual form controls for the selected activity or global settings. Manages template dropdown selection, custom template additions, and synchronizes inputs to state. | Mutates `state.js`; updates `preview.js`. |
| **`src/ui/preview.js`** | **16:9 Slide Preview Renderer**<br>Simulates high-fidelity Google Slides visuals in the browser using SVG and Tailwind CSS before compilation. Supports day tabs and slide pagination. | Reads `state.js`, `sections.js`, and `constants.js`. |
| **`src/ui/timeline.js`** | **Deck Sequencer Timeline Controller**<br>Renders the active deck list, day limitation badges, reorder drag handles, delete actions, and workspace empty states. | Coordinates with `state.js` and `SortableJS`. |
| **`src/utils/helpers.js`** | **Pure Utility Functions**<br>Provides text sanitization, phoneme slash bracket formatting (`formatPhonemeSymbols`), word parsing, and case randomization. | Used across UI and export modules. |

---

## 4. Backend JSON Recipe Contract

The payload sent from `src/main.js` to `Code.gs` adheres to the following specification:

```json
{
  "templateId": "12f9hl__t2nghjPeZSO1Ag1P-dLmJXXDKzCSVejT2QbY",
  "deckName": "Kindergarten Term 1 Week 5 Literacy Daily Review",
  "folderId": "1AbC...optional_drive_folder_id",
  "exportPptx": true,
  "slides": [
    {
      "noteId": "[mainTitle]",
      "replacements": {
        "{{yearLevel}}": "Kindergarten",
        "{{termNumber}}": "1",
        "{{weekNumber}}": "5"
      },
      "injectNotes": "Deck Name: K Review\nAuthor: Teacher\nCreated on: Wed 24 Sep"
    },
    {
      "noteId": "[pyramid3]",
      "replacements": {
        "{{letter1}}": "s",
        "{{letter2}}": "a",
        "{{letter3}}": "t",
        "{{word}}": "sat"
      }
    },
    {
      "noteId": "[hundredsChart]",
      "replacements": {
        "{{content}}": "Skip count by 6s."
      },
      "actions": [
        {
          "target": "tableCell",
          "matchText": ["6", "12", "18", "24", "30", "36", "42", "48", "54", "60", "66", "72", "78", "84", "90", "96"],
          "fill": "#eeff41"
        }
      ]
    }
  ]
}
```

### Universal Slide Actions (`actions` array in slide instructions):

`Code.gs` contains a declarative mutation engine that allows slides to be restyled dynamically without code changes:

- **Table Cell Coloring by Text / Number (`target: "tableCell"` or `"tableCellByText"`)**:
  - `matchText`: Array of strings/numbers or single value to match against cell content.
  - `fill`: Hex background color (e.g. `"#eeff41"`).
  - `textColor`: Hex text color (e.g. `"#000000"`).
  - `bold`: Boolean to bold cell text.
- **Table Cell by Coordinate (`target: "tableCellByCoordinate"`)**:
  - `row`: 0-indexed row number.
  - `col`: 0-indexed column number.
  - `tableIndex`: Optional index if slide has multiple tables (default `0`).
  - `fill`, `textColor`, `bold`, `text`.
- **Shapes by Alt Text / Title (`target: "shapeByName"` or `"shapeByTitle"`)**:
  - `name`: String or array of names matching the shape's Alt Text Title or Description (set via right-click $\rightarrow$ *Format options* $\rightarrow$ *Alt text* in Google Slides).
  - `fill`: Hex background color.
  - `stroke`: Hex border color.
  - `strokeWeight`: Number for border thickness.
  - `text`: Replacement text inside shape.
  - `textColor`: Hex font color.
  - `remove` / `visible: false`: Removes the element from the slide (e.g., hiding answer overlays or unused counters).
- **Shapes by Marker Token (`target: "shapeByText"`)**:
  - `matchText` / `token`: Marker string inside shape (e.g. `{{counter_1}}`).
  - `fill`, `stroke`, `clearText: true`, `text`, `textColor`, `remove`.
```

### Backend Execution in `Code.gs`:

1. **`templateFile.makeCopy(deckName, targetFolder)`**: Creates a brand new Google Slides presentation in the teacher's designated folder without touching the master template.
2. **`slide.getNotesPage().getSpeakerNotesShape()`**: Scans speaker notes on each slide to index master template slides by bracketed identifier tags (e.g. `[mainTitle]`, `[pyramid3]`, `[readWord]`).
3. **`presentation.appendSlide(masterSlide)`**: Appends slide duplicates according to the exact order defined in the `slides` array.
4. **`newSlide.replaceAllText(token, value, true)`**: Replaces template tokens (`{{...}}`) with teacher-provided words and metadata.
5. **`originalSlides[k].remove()`**: Deletes the original master template blueprint slides, leaving only the assembled deck.
6. **`newFile.setSharing(...)`**: Grants access permissions (Anyone with link can view/copy).
7. **Optional PPTX Export**: Downloads the presentation as a `.pptx` binary blob using `UrlFetchApp` and returns a direct download link.

---

## 5. Security & Isolation Model

- **No Server-Side Secrets**: `server.js` hosts client assets and does not store or process user passwords or API keys.
- **Google Cloud Sandboxing**: `Code.gs` executes within the Google Workspace cloud environment using native OAuth delegation (`DriveApp`, `SlidesApp`, `UrlFetchApp`). Documents are created directly inside the teacher's or institution's Google Drive.
- **Idempotency**: Master presentation templates are read-only blueprints; deck generation creates clean copies without risking template corruption.
