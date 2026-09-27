import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.join(__dirname, 'DailyDeck_Backend_Structure_Guide.pdf');

// Create document with margins
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 40, bottom: 40, left: 45, right: 45 },
  bufferPages: true,
  info: {
    Title: 'DailyDeck Backend & Architecture Guide',
    Author: 'DailyDeck Engineering Team',
    Subject: 'Architecture, Files Purpose, and System Interaction Guide',
    Keywords: 'DailyDeck, Architecture, Backend, Google Apps Script, Node.js, Express'
  }
});

const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// Color Palette
const COLORS = {
  primary: '#1e3a8a',       // Deep Blue
  primaryLight: '#3b82f6',  // Blue
  secondary: '#d97706',     // Amber
  dark: '#0f172a',          // Slate 900
  body: '#334155',          // Slate 700
  muted: '#64748b',         // Slate 500
  lightBg: '#f8fafc',       // Slate 50
  cardBg: '#f1f5f9',        // Slate 100
  cardBorder: '#cbd5e1',    // Slate 300
  codeBg: '#1e293b',        // Slate 800
  codeText: '#38bdf8',      // Sky 400
  accentGreen: '#059669',   // Emerald 600
  accentBorder: '#e2e8f0'   // Slate 200
};

// Helper Functions
function drawHeader(title, subtitle) {
  // Brand / Header Bar
  doc.rect(45, 40, 505, 70).fill(COLORS.primary);
  
  doc.fillColor('#ffffff')
     .fontSize(22)
     .font('Helvetica-Bold')
     .text('DailyDeck', 60, 52);

  doc.fillColor('#93c5fd')
     .fontSize(11)
     .font('Helvetica')
     .text('Architecture & Backend Structure Guide', 60, 78);

  doc.fillColor('#cbd5e1')
     .fontSize(9)
     .font('Helvetica')
     .text('System Blueprint • File Responsibilities • Integration Flows', 60, 92);

  doc.y = 125;
}

function drawSectionHeading(number, title) {
  doc.moveDown(0.8);
  const currentY = doc.y;
  
  // Section accent bar
  doc.rect(45, currentY, 4, 18).fill(COLORS.primaryLight);

  doc.fillColor(COLORS.primary)
     .fontSize(14)
     .font('Helvetica-Bold')
     .text(`${number}. ${title}`, 55, currentY + 1);
  
  doc.moveDown(0.6);
}

function drawSubheading(title) {
  doc.moveDown(0.4);
  doc.fillColor(COLORS.dark)
     .fontSize(11)
     .font('Helvetica-Bold')
     .text(title, 45);
  doc.moveDown(0.3);
}

function drawParagraph(text) {
  doc.fillColor(COLORS.body)
     .fontSize(9.5)
     .font('Helvetica')
     .lineGap(2)
     .text(text, 45, doc.y, { width: 505, align: 'justify' });
  doc.moveDown(0.4);
}

function drawBullet(label, text) {
  const currentY = doc.y;
  doc.circle(52, currentY + 5, 2.5).fill(COLORS.primaryLight);
  
  doc.fillColor(COLORS.dark)
     .fontSize(9.5)
     .font('Helvetica-Bold')
     .text(label + ': ', 62, currentY, { continued: true, width: 488 });
  
  doc.fillColor(COLORS.body)
     .font('Helvetica')
     .text(text);
  
  doc.moveDown(0.35);
}

function drawFileCard(fileName, category, role, details) {
  const cardY = doc.y;
  const cardHeight = 65;

  // Background Box
  doc.roundedRect(45, cardY, 505, cardHeight, 5)
     .fillAndStroke(COLORS.lightBg, COLORS.cardBorder);

  // File Tag
  doc.roundedRect(55, cardY + 8, 8, 8, 2).fill(COLORS.primaryLight);

  doc.fillColor(COLORS.primary)
     .fontSize(10)
     .font('Helvetica-Bold')
     .text(fileName, 68, cardY + 7);

  // Category Badge
  const catWidth = doc.widthOfString(category) + 12;
  doc.roundedRect(550 - catWidth - 10, cardY + 6, catWidth, 14, 3).fill(COLORS.cardBg);
  doc.fillColor(COLORS.muted)
     .fontSize(7.5)
     .font('Helvetica-Bold')
     .text(category.toUpperCase(), 550 - catWidth - 4, cardY + 9);

  // Role
  doc.fillColor(COLORS.dark)
     .fontSize(8.5)
     .font('Helvetica-Bold')
     .text('Purpose: ', 55, cardY + 24, { continued: true });
  doc.fillColor(COLORS.body)
     .font('Helvetica')
     .text(role);

  // Details
  doc.fillColor(COLORS.muted)
     .fontSize(8)
     .font('Helvetica')
     .text(details, 55, cardY + 38, { width: 485 });

  doc.y = cardY + cardHeight + 8;
}

// -----------------------------------------------------------------------------
// PAGE 1: System Overview & Architecture Diagram
// -----------------------------------------------------------------------------
drawHeader();

drawSectionHeading('1', 'Executive Architecture Overview');
drawParagraph(
  'DailyDeck operates on a decoupled client-server architecture designed specifically for educational slide automation. ' +
  'The system consists of two primary runtime engines: a high-performance frontend client with local state management, ' +
  'and a cloud-native Google Apps Script backend API that controls Google Drive and Google Slides.'
);

drawSubheading('Core Architecture Components:');
drawBullet('Frontend Client (SPA)', 'Modular ES6 application running in the teacher\'s browser. Coordinates section management, state persistence, 16:9 real-time slide preview, and recipe construction.');
drawBullet('Web Server Layer (server.js)', 'Lightweight Node.js Express server providing zero-cache asset delivery and single-page routing over HTTP/3000.');
drawBullet('Slide Assembly Engine (Code.gs)', 'Google Apps Script cloud microservice (doPost API). Executes inside Google Workspace to clone master templates, substitute dynamic text tokens, inject speaker notes, convert to PPTX, and manage permissions.');
drawBullet('Data Compilation Pipeline (recipe.js)', 'The abstraction bridge transforming high-level UI deck models into atomic, idempotent slide-assembly command objects.');

drawSectionHeading('2', 'End-to-End System Data Flow');

// Flow Diagram Box
const flowY = doc.y;
doc.roundedRect(45, flowY, 505, 120, 6)
   .fillAndStroke('#f8fafc', '#cbd5e1');

doc.fillColor(COLORS.primary)
   .fontSize(9.5)
   .font('Helvetica-Bold')
   .text('DATA INTERACTION & ASSEMBLY FLOW', 55, flowY + 10);

// Draw 4 Steps
const steps = [
  { step: '1. Configure', sub: 'Teacher defines items in UI', x: 55, w: 105, bg: '#e0f2fe', stroke: '#38bdf8' },
  { step: '2. Compile', sub: 'recipe.js builds JSON payload', x: 175, w: 115, bg: '#fef3c7', stroke: '#f59e0b' },
  { step: '3. Transmit', sub: 'POST request to Apps Script URL', x: 305, w: 115, bg: '#e0e7ff', stroke: '#6366f1' },
  { step: '4. Assemble', sub: 'Code.gs clones & mutates Slides', x: 435, w: 105, bg: '#dcfce7', stroke: '#10b981' }
];

steps.forEach((s) => {
  doc.roundedRect(s.x, flowY + 30, s.w, 55, 4)
     .fillAndStroke(s.bg, s.stroke);
  
  doc.fillColor(COLORS.dark)
     .fontSize(8.5)
     .font('Helvetica-Bold')
     .text(s.step, s.x + 6, flowY + 40, { width: s.w - 12, align: 'center' });

  doc.fillColor(COLORS.body)
     .fontSize(7.5)
     .font('Helvetica')
     .text(s.sub, s.x + 4, flowY + 54, { width: s.w - 8, align: 'center' });
});

// Response arrow
doc.fillColor(COLORS.accentGreen)
   .fontSize(8)
   .font('Helvetica-Bold')
   .text('← Response Payload: { status: "success", url: "https://docs.google.com/...", copyUrl: "...", pptxUrl: "..." }', 55, flowY + 98);

doc.y = flowY + 130;

drawSectionHeading('3', 'Primary Backend & Server Files');

drawFileCard(
  'server.js',
  'Node.js / Express Server',
  'Application host and static file distributor.',
  'Express 4 server running on host 0.0.0.0, port 3000. Implements strict no-cache headers (no-store, must-revalidate) during development to prevent stale script caching. Handles SPA wildcard routing fallback to index.html.'
);

drawFileCard(
  'Code.gs',
  'Google Apps Script Backend Engine',
  'The remote microservice orchestrating Google Drive and Google Slides operations.',
  'Implements doPost(e) HTTP endpoint. Parses JSON assembly recipes, invokes DriveApp to duplicate the master presentation template into the target folder, indexes slide speaker notes for [tags], duplicates matching slides, executes text substitution, and injects speaker notes.'
);

// -----------------------------------------------------------------------------
// PAGE 2: File Structure & Role Guide
// -----------------------------------------------------------------------------
doc.addPage();

drawSectionHeading('4', 'Comprehensive File Directory & Roles');

drawFileCard(
  'src/export/recipe.js',
  'Compilation Engine',
  'Transforms state items into the standardized slide assembly schema.',
  'Translates timeline items across active days into atomic slide commands ({ noteId, replacements, injectNotes }). Computes sound pyramid breakdowns, pairs, sentence type slides, and metadata speaker notes.'
);

drawFileCard(
  'src/state/state.js',
  'State Manager & Store',
  'Centralized data repository and localStorage persistence layer.',
  'Maintains state for dual workspaces (Literacy and Numeracy), globalSettings (year level, term, week, templateId, folderId), timelineItems array, and shared custom templates. Serializes data to versioned LocalStorage keys.'
);

drawFileCard(
  'src/data/constants.js',
  'Constants & Configuration',
  'Immutable system definitions, template identifiers, and grammar dictionaries.',
  'Defines DEFAULT_TEMPLATE_ID, NUMERACY_DEFAULT_TEMPLATE_ID, DAYS list ("Monday"-"Friday"), Sounds-Write phonic units, and definitions for sentence types (Declarative, Imperative, Interrogative, Exclamatory).'
);

drawFileCard(
  'src/data/sections.js',
  'Activity Catalog',
  'Single source of truth for all activity types and form field schemas.',
  'Defines SECTION_DEFS: activity metadata, icon, background styling, activity type (static, daily, weekly, mixed), and dynamic form field structures used by inspector.js to auto-generate editors.'
);

drawFileCard(
  'src/data/starters.js',
  'Curated Starters',
  'Pre-configured turnkey deck starter blueprints.',
  'Defines STARTER_DEFS for Kindergarten Core, Stage 1 Foundation, Stage 2 Phonics & Grammar, and custom decks with pre-populated activity sequences and sample teacher data.'
);

drawFileCard(
  'src/data/phonics.js',
  'Curriculum Word Bank',
  'Sounds-Write phonics pool index and level matrix.',
  'Contains target sound mappings, high-frequency words, and level metadata for systematic synthetic phonics progression.'
);

// -----------------------------------------------------------------------------
// PAGE 3: UI Layer, Interaction Protocols & API Contract
// -----------------------------------------------------------------------------
doc.addPage();

drawSectionHeading('5', 'UI Controller Files (Interface & Preview)');

drawFileCard(
  'src/main.js',
  'Application Orchestrator',
  'Main entry point, event listeners, and API network dispatcher.',
  'Initializes workspace toggles (Literacy/Numeracy), accordions, drag-and-drop sequencing via SortableJS, and executes the fetch() POST call to sendRecipeToAppsScript(). Controls toast alerts and assembly dialogs.'
);

drawFileCard(
  'src/ui/inspector.js',
  'Form Builder & Template Inspector',
  'Dynamic property inspector and template management interface.',
  'Builds form fields reactively based on section schema definitions, synchronizes template dropdown options, manages custom user templates, and triggers state saves.'
);

drawFileCard(
  'src/ui/timeline.js',
  'Deck Sequencer Manager',
  'Interactive visual deck timeline manager.',
  'Renders ordered activity cards, drag handles, active day badges (e.g., M-W-F), delete triggers, and contextual empty-state guidance.'
);

drawFileCard(
  'src/ui/preview.js',
  '16:9 Slide Preview Renderer',
  'High-fidelity browser-side SVG/HTML slide preview simulation.',
  'Generates instantaneous visual representations of slides as they will appear on Google Slides canvas, supporting day tabs, casing toggles, and sub-slide pagination.'
);

drawSectionHeading('6', 'Backend JSON Assembly Contract');
drawParagraph(
  'When the user triggers deck assembly, src/export/recipe.js compiles an explicit JSON recipe payload ' +
  'transmitted directly to Code.gs. The contract follows this schema:'
);

// Code Box
const codeY = doc.y;
doc.roundedRect(45, codeY, 505, 145, 5)
   .fill(COLORS.codeBg);

const jsonSample = [
  '{',
  '  "templateId": "12f9hl__t2nghjPeZSO1Ag1P-dLmJXXDKzCSVejT2QbY",',
  '  "deckName": "Kindergarten Term 1 Week 5 Literacy Daily Review",',
  '  "folderId": "1AbC...optional_drive_folder_id",',
  '  "exportPptx": true,',
  '  "slides": [',
  '    {',
  '      "noteId": "[mainTitle]",',
  '      "replacements": { "{{yearLevel}}": "Kindergarten", "{{termNumber}}": "1", "{{weekNumber}}": "5" },',
  '      "injectNotes": "Deck Name: K Review\\nAuthor: Teacher\\nCreated on: Wed 24 Sep"',
  '    },',
  '    {',
  '      "noteId": "[pyramid3]",',
  '      "replacements": { "{{letter1}}": "s", "{{letter2}}": "a", "{{letter3}}": "t", "{{word}}": "sat" }',
  '    }',
  '  ]',
  '}'
];

doc.fillColor(COLORS.codeText)
   .fontSize(7.5)
   .font('Courier')
   .text(jsonSample.join('\n'), 55, codeY + 10, { lineGap: 1.5 });

doc.y = codeY + 155;

drawSectionHeading('7', 'Backend Security & Google API Integration');
drawBullet('Zero Backend Credentials Stored', 'The Node.js server does not store or process user credentials. All slide creation happens in the user\'s or organization\'s Google Workspace domain.');
drawBullet('Google Drive & Slides Scopes', 'Code.gs runs with standard Workspace scopes (DriveApp, SlidesApp, UrlFetchApp) with execute-as-user authorization, ensuring teachers retain full document ownership.');
drawBullet('Idempotent Assembly', 'Each assembly run produces a fresh duplicate of the template presentation without mutating or overwriting the original master library.');

// -----------------------------------------------------------------------------
// PAGE NUMBERS & FOOTER
// -----------------------------------------------------------------------------
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  
  // Footer Line
  doc.rect(45, 800, 505, 0.5).fill(COLORS.cardBorder);
  
  // Footer Text
  doc.fillColor(COLORS.muted)
     .fontSize(8)
     .font('Helvetica')
     .text('DailyDeck System Architecture Guide • Generated September 2026', 45, 808);
  
  doc.text(`Page ${i + 1} of ${range.count}`, 45, 808, { align: 'right', width: 505 });
}

doc.end();

stream.on('finish', () => {
  console.log(`PDF successfully generated at: ${outputPath}`);
});
