import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.join(__dirname, 'DailyDeck_Activity_Developer_Guide.pdf');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 40, bottom: 40, left: 45, right: 45 },
  bufferPages: true,
  info: {
    Title: 'DailyDeck Activity Development Guide',
    Author: 'DailyDeck Engineering Team',
    Subject: 'Step-by-step developer guide to adding activities and sections',
    Keywords: 'DailyDeck, Developer Guide, Activity, Section, Code, Tutorial'
  }
});

const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// Color Palette
const COLORS = {
  primary: '#1e3a8a',       // Deep Navy/Blue
  primaryLight: '#2563eb',  // Blue 600
  secondary: '#d97706',     // Amber 600
  secondaryLight: '#fef3c7',// Amber 100
  dark: '#0f172a',          // Slate 900
  body: '#334155',          // Slate 700
  muted: '#64748b',         // Slate 500
  lightBg: '#f8fafc',       // Slate 50
  cardBg: '#f1f5f9',        // Slate 100
  cardBorder: '#cbd5e1',    // Slate 300
  codeBg: '#0f172a',        // Slate 900
  codeText: '#38bdf8',      // Sky 400
  codeComment: '#94a3b8',   // Slate 400
  codeKeyword: '#f472b6',   // Pink 400
  accentGreen: '#059669',   // Emerald 600
  accentBorder: '#e2e8f0'   // Slate 200
};

// Helper Functions
function drawHeader(title = 'DailyDeck Developer Handbook', subtitle = 'Step-by-Step Guide: Adding a New Activity (Section)') {
  doc.rect(45, 40, 505, 68).fill(COLORS.primary);
  
  doc.fillColor('#ffffff')
     .fontSize(20)
     .font('Helvetica-Bold')
     .text(title, 60, 50);

  doc.fillColor('#93c5fd')
     .fontSize(10.5)
     .font('Helvetica')
     .text(subtitle, 60, 75);

  doc.fillColor('#cbd5e1')
     .fontSize(8.5)
     .font('Helvetica')
     .text('Schema Definitions • State Wiring • UI Controls • 16:9 Slide Preview • Slides Recipe Export', 60, 90);

  doc.y = 120;
}

function drawSectionHeading(number, title) {
  if (doc.y > 690) doc.addPage();
  doc.moveDown(0.7);
  const currentY = doc.y;
  
  doc.rect(45, currentY, 4, 17).fill(COLORS.primaryLight);

  doc.fillColor(COLORS.primary)
     .fontSize(13)
     .font('Helvetica-Bold')
     .text(`${number}. ${title}`, 55, currentY + 1);
  
  doc.moveDown(0.5);
}

function drawSubheading(title) {
  if (doc.y > 720) doc.addPage();
  doc.moveDown(0.3);
  doc.fillColor(COLORS.dark)
     .fontSize(10.5)
     .font('Helvetica-Bold')
     .text(title, 45);
  doc.moveDown(0.25);
}

function drawParagraph(text) {
  if (doc.y > 730) doc.addPage();
  doc.fillColor(COLORS.body)
     .fontSize(9)
     .font('Helvetica')
     .lineGap(1.5)
     .text(text, 45, doc.y, { width: 505, align: 'justify' });
  doc.moveDown(0.35);
}

function drawBullet(label, text) {
  if (doc.y > 735) doc.addPage();
  const currentY = doc.y;
  doc.circle(52, currentY + 4.5, 2.5).fill(COLORS.primaryLight);
  
  doc.fillColor(COLORS.dark)
     .fontSize(9)
     .font('Helvetica-Bold')
     .text(label + ': ', 62, currentY, { continued: true, width: 488 });
  
  doc.fillColor(COLORS.body)
     .font('Helvetica')
     .text(text);
  
  doc.moveDown(0.3);
}

function drawCodeBox(codeSnippet, title = 'Code Implementation') {
  const lines = codeSnippet.split('\n');
  const boxHeight = Math.max(45, lines.length * 11 + 24);
  
  if (doc.y + boxHeight > 760) {
    doc.addPage();
  }

  const startY = doc.y;
  doc.roundedRect(45, startY, 505, boxHeight, 5).fill(COLORS.codeBg);

  // Title bar
  doc.rect(45, startY, 505, 18).fill('#1e293b');
  doc.fillColor('#94a3b8')
     .fontSize(8)
     .font('Helvetica-Bold')
     .text(title, 55, startY + 5);

  doc.fillColor(COLORS.codeText)
     .fontSize(7.5)
     .font('Courier')
     .text(codeSnippet, 55, startY + 24, { width: 485, lineGap: 1.5 });

  doc.y = startY + boxHeight + 8;
}

function drawStepCard(stepNumber, title, targetFile, summary) {
  if (doc.y > 720) doc.addPage();
  const cardY = doc.y;
  const cardHeight = 52;

  doc.roundedRect(45, cardY, 505, cardHeight, 5)
     .fillAndStroke(COLORS.lightBg, COLORS.cardBorder);

  // Step Badge
  doc.roundedRect(53, cardY + 7, 20, 20, 4).fill(COLORS.primary);
  doc.fillColor('#ffffff')
     .fontSize(10)
     .font('Helvetica-Bold')
     .text(stepNumber.toString(), 53, cardY + 11, { width: 20, align: 'center' });

  // Title & Target File
  doc.fillColor(COLORS.dark)
     .fontSize(9.5)
     .font('Helvetica-Bold')
     .text(title, 82, cardY + 7, { continued: true });

  doc.fillColor(COLORS.primaryLight)
     .font('Courier')
     .fontSize(8.5)
     .text(`   [${targetFile}]`);

  // Summary
  doc.fillColor(COLORS.body)
     .fontSize(8.5)
     .font('Helvetica')
     .text(summary, 82, cardY + 26, { width: 455 });

  doc.y = cardY + cardHeight + 6;
}

// =============================================================================
// PAGE 1: Overview & Architecture
// =============================================================================
drawHeader();

drawSectionHeading('1', 'Overview of the Activity Lifecycle');
drawParagraph(
  'In DailyDeck, an Activity (historically termed a Section) represents an instructional block that teachers can drag into ' +
  'their deck timeline, configure through the Inspector, preview on an exact 16:9 canvas, and compile into a Google Slides presentation. ' +
  'Adding an activity requires touching six key files in the codebase.'
);

drawSubheading('The Six Required Development Steps:');
drawStepCard(1, 'Define Metadata & Field Schema', 'src/data/sections.js', 'Register the activity key, title, icon, colors, activity type (static/daily/weekly/mixed), and input fields.');
drawStepCard(2, 'Initialize Data Defaults', 'src/ui/timeline.js', 'Provide default structures in addTimelineItem() for items added to the Deck Sequencer.');
drawStepCard(3, 'Configure Inspector Controls', 'src/ui/inspector.js', 'Allow auto-generation from field schemas or attach specialized interactive UI inputs and speaker notes.');
drawStepCard(4, 'Build 16:9 Slide Preview Canvas', 'src/ui/preview.js', 'Create an instant SVG/HTML slide simulation matching the template layout with day tabs and pagination.');
drawStepCard(5, 'Export to Presentation Recipe', 'src/export/recipe.js', 'Translate timeline items into atomic slide commands with template tags [noteId] and token replacements.');
drawStepCard(6, 'Register in Workspace Library', 'src/main.js', 'Expose the activity in the Library panel for Literacy, Numeracy, or Starter Decks.');

drawSectionHeading('2', 'Activity Types (Data Modeling)');
drawBullet('static', 'Executes once per deck or has uniform data that does not vary across days (e.g. Intro Slide, Day Divider).');
drawBullet('daily', 'Contains separate data for each day of the week (Monday through Friday). Stored in item.data[day][fieldId].');
drawBullet('weekly', 'Uniform configuration shared across all days of the deck. Stored in item.data[fieldId].');
drawBullet('mixed', 'Combines deck-wide global settings (weeklyFields) with day-specific custom data (dailyFields).');

// =============================================================================
// PAGE 2: Step 1, 2, 3 Implementation
// =============================================================================
doc.addPage();

drawSectionHeading('3', 'Step 1: Define Metadata (src/data/sections.js)');
drawParagraph(
  'Every activity must have an entry in SECTION_DEFS. This object serves as the single source of truth for UI icons, ' +
  'descriptions, activity types, and form input schemas.'
);

const codeStep1 = `// In src/data/sections.js -> export const SECTION_DEFS = { ... }
'sectNumberBonds': {
    title: 'Number Bonds',
    shortDesc: 'Practise part-part-whole number facts',
    icon: 'fa-diagram-project',         // FontAwesome icon class
    color: 'text-amber-500',           // Icon text color class
    bg: 'bg-amber-100',                // Icon background class
    type: 'daily',                     // 'static' | 'daily' | 'weekly' | 'mixed'
    hasTitleSlideOptions: true,        // Enables "Include section title slide" toggle
    description: 'Students find missing parts of a number bond (part-part-whole).',
    fields: [
        { id: 'targetSum', label: 'Target Whole', type: 'select', options: ['5', '10', '20'], default: '10' },
        { id: 'knownPart', label: 'Known Part', type: 'text', default: '7', placeholder: 'e.g. 7' },
        { id: 'missingPart', label: 'Missing Part (Answer)', type: 'text', default: '3', placeholder: 'e.g. 3' }
    ]
}`;
drawCodeBox(codeStep1, 'src/data/sections.js — Activity Definition');

drawSectionHeading('4', 'Step 2: Timeline Defaults (src/ui/timeline.js)');
drawParagraph(
  'When a teacher adds the activity, addTimelineItem(defKey) instantiates the item. ' +
  'Standard fields defined in def.fields are populated automatically. For specialized arrays or custom defaults, add a hook:'
);

const codeStep2 = `// In src/ui/timeline.js -> addTimelineItem(defKey, index, skipSelectAndRender)
if (defKey === 'sectNumberBonds') {
    DAYS.forEach(day => {
        if (!newItem.data[day]) newItem.data[day] = {};
        newItem.data[day].targetSum = '10';
        newItem.data[day].knownPart = day === 'Monday' ? '7' : '6';
        newItem.data[day].missingPart = day === 'Monday' ? '3' : '4';
    });
}`;
drawCodeBox(codeStep2, 'src/ui/timeline.js — Data Initialization Hook');

drawSectionHeading('5', 'Step 3: Inspector Controls & Speaker Notes');
drawParagraph(
  'If def.fields contains standard text/select/checkbox inputs, inspector.js auto-generates the editing interface. ' +
  'For activities with speaker notes or custom UI, add hooks in inspector.js:'
);

const codeStep3 = `// In src/ui/inspector.js -> getSpeakerNotesText(itemOrKey, data)
case 'sectNumberBonds':
    return \`Prompt: What number pairs with \${dayData.knownPart || '7'} to make \${dayData.targetSum || '10'}?\`;`;
drawCodeBox(codeStep3, 'src/ui/inspector.js — Speaker Notes Hook');

// =============================================================================
// PAGE 3: Step 4 Slide Preview (src/ui/preview.js)
// =============================================================================
doc.addPage();

drawSectionHeading('6', 'Step 4: Slide Preview Canvas (src/ui/preview.js)');
drawParagraph(
  'The slide preview renders an instantaneous 16:9 representation of what the student will see on screen. ' +
  'Add your case to generateSlidePreviewHtml() and create a custom renderer function.'
);

const codeStep4 = `// In src/ui/preview.js -> generateSlidePreviewHtml(...)
switch (defKey) {
    // ...
    case 'sectNumberBonds':
        return renderSectNumberBondsPreview(dayData, item.customTitle);
}

// Preview Renderer Function
function renderSectNumberBondsPreview(dayData, customTitle) {
    const targetSum = dayData.targetSum || '10';
    const knownPart = dayData.knownPart || '7';
    const missingPart = dayData.missingPart || '?';

    return \`
        <div class="w-full h-full flex flex-col items-center justify-between p-4 select-none bg-white relative">
            <div class="w-full flex items-center justify-between border-b border-slate-100 pb-1">
                <span class="text-xs font-bold text-slate-800 edu-font">\${customTitle || 'Number Bonds'}</span>
                <span class="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Bonds to \${targetSum}</span>
            </div>
            <!-- Diagram Body -->
            <div class="flex-1 flex flex-col items-center justify-center my-auto">
                <div class="w-14 h-14 rounded-full border-2 border-amber-500 bg-amber-50 flex items-center justify-center text-xl font-bold text-slate-900">
                    \${targetSum}
                </div>
                <div class="w-24 h-4 flex justify-between px-3">
                    <div class="w-0.5 h-full bg-slate-300 transform -rotate-45"></div>
                    <div class="w-0.5 h-full bg-slate-300 transform rotate-45"></div>
                </div>
                <div class="flex items-center gap-8">
                    <div class="w-12 h-12 rounded-full border-2 border-slate-300 bg-slate-50 flex items-center justify-center text-lg font-bold text-slate-700">
                        \${knownPart}
                    </div>
                    <div class="w-12 h-12 rounded-full border-2 border-dashed border-amber-500 bg-amber-50 flex items-center justify-center text-lg font-bold text-amber-700">
                        \${missingPart}
                    </div>
                </div>
            </div>
            <div class="text-[10px] text-slate-500 edu-font text-center">What is the missing part?</div>
        </div>
    \`;
}`;
drawCodeBox(codeStep4, 'src/ui/preview.js — 16:9 Slide Canvas Renderer');

// =============================================================================
// PAGE 4: Step 5 Recipe Export & Master Template Connection
// =============================================================================
doc.addPage();

drawSectionHeading('7', 'Step 5: Export to Presentation Recipe (src/export/recipe.js)');
drawParagraph(
  'When the user clicks "Assemble Deck", buildPresentationRecipe() compiles timeline items into slide instructions ' +
  'dispatched to the Google Apps Script backend (Code.gs). Each slide requires a noteId, replacements map, and optional injectNotes.'
);

const codeStep5 = `// In src/export/recipe.js -> inside the daily iteration loop:
if (item.defKey === 'sectNumberBonds') {
    const dayData = (data && data[day]) || {};
    const targetSum = dayData.targetSum || '10';
    const knownPart = dayData.knownPart || '7';
    const missingPart = dayData.missingPart || '3';

    // Slide 1: Question Slide
    recipe.slides.push({
        noteId: "[numberBond_question]",
        replacements: {
            "{{targetSum}}": targetSum.toString(),
            "{{knownPart}}": knownPart.toString(),
            "{{missingPart}}": "?"
        },
        injectNotes: \`Target Whole: \${targetSum}\\nKnown: \${knownPart}\\nAsk students for the missing part.\`
    });

    // Slide 2: Reveal / Solution Slide
    recipe.slides.push({
        noteId: "[numberBond_answer]",
        replacements: {
            "{{targetSum}}": targetSum.toString(),
            "{{knownPart}}": knownPart.toString(),
            "{{missingPart}}": missingPart.toString()
        },
        injectNotes: \`Solution: \${knownPart} + \${missingPart} = \${targetSum}\`
    });
}`;
drawCodeBox(codeStep5, 'src/export/recipe.js — Slide Assembly Logic');

drawSectionHeading('8', 'Step 6: Master Template Alignment (Google Slides)');
drawParagraph(
  'The cloud backend (Code.gs) matches the recipe.slides noteId against the Speaker Notes of the master template presentation.'
);
drawBullet('1. Add Template Slide', 'In Google Slides, create the slide layout matching your activity.');
drawBullet('2. Set Note Tag', 'Open the Speaker Notes panel of that slide and enter the exact tag: [numberBond_question].');
drawBullet('3. Insert Tokens', 'In the text boxes on that slide, type placeholder tokens: {{targetSum}}, {{knownPart}}, {{missingPart}}.');

drawSectionHeading('9', 'Step 7: Library Registration (src/main.js)');
drawParagraph(
  'Expose the new activity in the Library panel. In src/main.js -> renderLibrary():'
);
drawBullet('Numeracy Workspace', 'Add the key to numeracySectionKeys: const numeracySectionKeys = [\'mainIntro\', \'sectNumberBonds\'];');
drawBullet('Literacy Workspace', 'All items in SECTION_DEFS are shown by default, or filter out numeracy-specific keys if appropriate.');
drawBullet('Starter Decks', 'Optionally append the key to starter decks in src/data/starters.js under sections: [ ... ].');

drawSectionHeading('10', 'Developer Quality Checklist');
drawBullet('Syntax Check', 'Run node -c on all modified JavaScript files to catch any syntax issues.');
drawBullet('Drag & Drop', 'Verify that dragging from Library to Deck Sequencer instantiates a timeline item.');
drawBullet('State Mutation', 'Verify that typing into Inspector inputs updates data and persists across reload.');
drawBullet('Preview Fidelity', 'Ensure the 16:9 canvas scales properly and renders user inputs accurately.');
drawBullet('Recipe Inspection', 'Click Assemble Deck -> Toggle JSON recipe to verify noteId and {{token}} mappings.');

// =============================================================================
// FOOTERS & PAGE NUMBERING
// =============================================================================
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  
  doc.rect(45, 800, 505, 0.5).fill(COLORS.cardBorder);
  
  doc.fillColor(COLORS.muted)
     .fontSize(8)
     .font('Helvetica')
     .text('DailyDeck Activity Development Guide • Complete Technical Reference', 45, 808);
  
  doc.text(`Page ${i + 1} of ${range.count}`, 45, 808, { align: 'right', width: 505 });
}

doc.end();

stream.on('finish', () => {
  console.log(`PDF successfully generated at: ${outputPath}`);
});
