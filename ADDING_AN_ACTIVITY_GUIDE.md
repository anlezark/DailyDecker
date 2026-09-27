# DailyDeck — Developer Guide: Adding a New Activity (Section)

This guide provides a comprehensive, step-by-step blueprint for developers (or AI assistants) to manually code, register, preview, and export a new **Activity** (also referred to historically as a **Section**) in the DailyDeck application.

---

## 1. Anatomy of an Activity

Every activity in DailyDeck spans five integrated subsystems:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ACTIVITY ARCHITECTURE                           │
├────────────────────┬───────────────────────────────────────────────────┤
│ 1. Metadata Schema │ src/data/sections.js                              │
│                    │ Key, Title, Icon, Type, Description, Fields       │
├────────────────────┼───────────────────────────────────────────────────┤
│ 2. Sequence State  │ src/ui/timeline.js & src/state/state.js           │
│                    │ Data initialization, Defaults, Day inclusions     │
├────────────────────┼───────────────────────────────────────────────────┤
│ 3. Inspector UI    │ src/ui/inspector.js                               │
│                    │ Auto-generated or custom property controls        │
├────────────────────┼───────────────────────────────────────────────────┤
│ 4. Slide Preview   │ src/ui/preview.js                                 │
│                    │ 16:9 SVG/HTML canvas, Pagination, Typography      │
├────────────────────┼───────────────────────────────────────────────────┤
│ 5. Slide Assembly  │ src/export/recipe.js                              │
│                    │ Note tags [tag], Token replacements {{var}}, Notes│
├────────────────────┼───────────────────────────────────────────────────┤
│ 6. Library Config  │ src/main.js & src/data/starters.js                │
│                    │ Literacy vs. Numeracy workspace routing & Starters│
└────────────────────┴───────────────────────────────────────────────────┘
```

---

## 2. Step 1: Define Activity Metadata (`src/data/sections.js`)

Open `src/data/sections.js` and add a unique entry to `SECTION_DEFS`.

### Example: Adding a "Number Bonds" Activity for Numeracy
```javascript
export const SECTION_DEFS = {
    // ... existing activities ...

    'sectNumberBonds': {
        title: 'Number Bonds',
        shortDesc: 'Practise part-part-whole number facts',
        icon: 'fa-diagram-project',         // FontAwesome icon
        color: 'text-amber-500',           // Accent color
        bg: 'bg-amber-100',                // Icon background
        type: 'daily',                     // 'static' | 'daily' | 'weekly' | 'mixed'
        hasTitleSlideOptions: true,        // Allows teachers to toggle a title slide
        description: 'Students practise finding missing parts of a number bond (part-part-whole). Specify target target whole numbers and missing parts below.',
        fields: [
            { id: 'targetSum', label: 'Target Whole Number', type: 'select', options: ['5', '10', '20'], default: '10' },
            { id: 'knownPart', label: 'Known Part', type: 'text', default: '7', placeholder: 'e.g. 7' },
            { id: 'missingPart', label: 'Missing Part (Answer)', type: 'text', default: '3', placeholder: 'e.g. 3' }
        ]
    }
};
```

### Understanding Activity `type` Options:
- **`'static'`**: Runs once per deck or doesn't have daily changing values (e.g. `mainIntro`, `dayDivider`).
- **`'daily'`**: Has different data for each day of the week (Monday through Friday). Form fields are stored under `item.data[day][fieldId]`.
- **`'weekly'`**: Single set of fields that applies across all days. Form fields are stored under `item.data[fieldId]` or `item.data.weekly[fieldId]`.
- **`'mixed'`**: Contains both deck-wide weekly fields (`weeklyFields`) and day-specific fields (`dailyFields`).

---

## 3. Step 2: Initialize Timeline Defaults (`src/ui/timeline.js`)

When a teacher adds the activity to the Deck Sequencer, `addTimelineItem(defKey)` instantiates the item model.

If your activity uses standard fields defined in `SECTION_DEFS[defKey].fields`, **it is initialized automatically**!

If your activity requires custom structured data (e.g., dynamic arrays, child lists, or phonics calculations), handle it inside `addTimelineItem()` in `src/ui/timeline.js`:

```javascript
// In src/ui/timeline.js -> addTimelineItem()
if (defKey === 'sectNumberBonds') {
    DAYS.forEach(day => {
        if (!newItem.data[day]) newItem.data[day] = {};
        // Specific day defaults if needed
        newItem.data[day].targetSum = '10';
        newItem.data[day].knownPart = day === 'Monday' ? '7' : '6';
        newItem.data[day].missingPart = day === 'Monday' ? '3' : '4';
    });
}
```

---

## 4. Step 3: Implement Inspector Controls (`src/ui/inspector.js`)

The Inspector renders properties when an activity is selected.

### Option A: Standard Field Auto-Generation
If you provided standard fields in `SECTION_DEFS` (`text`, `textarea`, `select`, `checkbox`), DailyDeck’s built-in form builder in `inspector.js` will automatically render them with two-way data binding, auto-save, and day switching tabs.

### Option B: Custom Inspector Interface (Optional)
If your activity requires bespoke UI (such as word lists, drag-and-drop sub-items, or dynamic tables):
1. In `src/ui/inspector.js`, locate the field rendering loop or add a specialized block for your `item.defKey`.
2. Attach listeners that update `item.data` and trigger `saveState()` and `renderInspector()`:

```javascript
if (item.defKey === 'sectNumberBonds') {
    contentHtml += `
        <div class="bg-white p-3 rounded-xl border border-slate-200 space-y-3">
            <h4 class="text-xs font-bold text-slate-700">Quick Presets</h4>
            <div class="flex gap-2">
                <button type="button" class="btn-bond-preset px-2.5 py-1 text-xs bg-slate-100 rounded hover:bg-slate-200" data-sum="10">Bonds to 10</button>
                <button type="button" class="btn-bond-preset px-2.5 py-1 text-xs bg-slate-100 rounded hover:bg-slate-200" data-sum="20">Bonds to 20</button>
            </div>
        </div>
    `;
}
```

### Speaker Notes Reference (`getSpeakerNotesText`)
If the activity supports speaker notes, add a case in `getSpeakerNotesText(itemOrKey, data)`:
```javascript
case 'sectNumberBonds':
    return `Prompt: What number pairs with ${dayData.knownPart || '7'} to make ${dayData.targetSum || '10'}?`;
```

---

## 5. Step 4: Build the 16:9 Slide Preview (`src/ui/preview.js`)

`src/ui/preview.js` simulates the Google Slides output directly inside the browser.

### 1. Register in Switch Statement
In `generateSlidePreviewHtml(...)`:
```javascript
case 'sectNumberBonds':
    return renderSectNumberBondsPreview(dayData, customTitle);
```

### 2. Implement Slide Preview Builder
Create the dedicated render function:
```javascript
function renderSectNumberBondsPreview(dayData, customTitle) {
    const targetSum = dayData.targetSum || '10';
    const knownPart = dayData.knownPart || '7';
    const missingPart = dayData.missingPart || '?';

    return `
        <div class="w-full h-full flex flex-col items-center justify-between p-4 select-none bg-white relative overflow-hidden">
            <!-- Header Bar -->
            <div class="w-full flex items-center justify-between border-b border-slate-100 pb-1">
                <span class="text-xs font-bold text-slate-800 edu-font">${customTitle || 'Number Bonds'}</span>
                <span class="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Bonds to ${targetSum}</span>
            </div>

            <!-- Number Bond Diagram -->
            <div class="flex-1 flex flex-col items-center justify-center my-auto">
                <!-- Whole Circle -->
                <div class="w-14 h-14 rounded-full border-2 border-amber-500 bg-amber-50 flex items-center justify-center text-xl font-bold text-slate-900 shadow-2xs">
                    ${targetSum}
                </div>
                <!-- Connector Lines (SVG or HTML) -->
                <div class="w-24 h-4 flex justify-between px-3">
                    <div class="w-0.5 h-full bg-slate-300 transform -rotate-45"></div>
                    <div class="w-0.5 h-full bg-slate-300 transform rotate-45"></div>
                </div>
                <!-- Part Circles -->
                <div class="flex items-center gap-8">
                    <div class="w-12 h-12 rounded-full border-2 border-slate-300 bg-slate-50 flex items-center justify-center text-lg font-bold text-slate-700">
                        ${knownPart}
                    </div>
                    <div class="w-12 h-12 rounded-full border-2 border-dashed border-amber-500 bg-amber-50/50 flex items-center justify-center text-lg font-bold text-amber-700 animate-pulse">
                        ${missingPart}
                    </div>
                </div>
            </div>

            <!-- Student Prompt -->
            <div class="text-[10px] text-slate-500 edu-font text-center">
                What is the missing part? Write it on your whiteboards.
            </div>
        </div>
    `;
}
```

### 3. Support Pagination / Sub-Slides (If Applicable)
If your activity has multiple sub-slides per day (e.g. Question slide -> Answer slide, or word list slides):
In `getPreviewSlideCount(itemOrDefKey, timelineItemData)`:
```javascript
case 'sectNumberBonds':
    return 2; // Slide 0 = Question, Slide 1 = Solution
```

---

## 6. Step 5: Export to Google Slides Recipe (`src/export/recipe.js`)

When the user clicks **Assemble Deck**, `buildPresentationRecipe()` converts active timeline items into slide instructions for the Google Apps Script backend (`Code.gs`).

Inside `src/export/recipe.js`, locate the daily iteration loop:

```javascript
// Inside DAYS.forEach(day => { ... timelineItems.forEach(item => { ... }) })

if (item.defKey === 'sectNumberBonds') {
    const dayData = (data && data[day]) || {};
    const targetSum = dayData.targetSum || '10';
    const knownPart = dayData.knownPart || '7';
    const missingPart = dayData.missingPart || '3';

    // 1. Question Slide
    recipe.slides.push({
        noteId: "[numberBond_question]",
        replacements: {
            "{{targetSum}}": targetSum.toString(),
            "{{knownPart}}": knownPart.toString(),
            "{{missingPart}}": "?"
        },
        injectNotes: `Target Whole: ${targetSum}\nKnown: ${knownPart}\nAsk students for the missing part.`
    });

    // 2. Reveal / Answer Slide
    recipe.slides.push({
        noteId: "[numberBond_answer]",
        replacements: {
            "{{targetSum}}": targetSum.toString(),
            "{{knownPart}}": knownPart.toString(),
            "{{missingPart}}": missingPart.toString()
        },
        injectNotes: `Solution: ${knownPart} + ${missingPart} = ${targetSum}`
    });
}

// 3. For visual Maths activities (Tables, Shapes, Counters): Use the universal "actions" array:
if (item.defKey === 'sectTenFrame') {
    recipe.slides.push({
        noteId: "[tenFrame]",
        actions: [
            // Color first 7 counters red by their Alt Text / Title
            { target: "shapeByName", name: ["counter_1", "counter_2", "counter_3", "counter_4", "counter_5", "counter_6", "counter_7"], fill: "#ef4444" },
            // Table cells can also be colored by matching text or coordinates:
            // { target: "tableCell", matchText: ["6", "12", "18"], fill: "#eeff41" }
        ]
    });
}
```

---

## 7. Step 6: Connect Google Slides Master Template

The backend `Code.gs` works by looking up slides in the master presentation template by the **Speaker Notes tag**.

For the recipe above to work:
1. Open the Google Slides master presentation template (e.g. `DEFAULT_TEMPLATE_ID` or `NUMERACY_DEFAULT_TEMPLATE_ID`).
2. Add a slide for the activity.
3. In the slide's **Speaker Notes**, type the exact tag: `[numberBond_question]`.
4. In the shapes or text boxes on the slide, type the replacement tokens:
   - `{{targetSum}}`
   - `{{knownPart}}`
   - `{{missingPart}}`
5. Repeat for any variant slides (e.g., `[numberBond_answer]`).

When `Code.gs` runs, it clones the slide matching `[numberBond_question]`, performs string replacement on the tokens, and appends it to the new presentation.

---

## 8. Step 7: Register in Library (`src/main.js`)

Determine whether the new activity belongs to **Literacy**, **Numeracy**, or **Both**.

In `src/main.js -> renderLibrary()`:

### For Numeracy:
Add the key to `numeracySectionKeys`:
```javascript
const numeracySectionKeys = ['mainIntro', 'sectNumberBonds'];
```

### For Literacy:
By default, all keys in `SECTION_DEFS` appear in Literacy. If you want it exclusive to Numeracy or Literacy, filter accordingly in `renderLibrary()`:
```javascript
const literacySectionKeys = Object.keys(SECTION_DEFS).filter(k => k !== 'sectNumberBonds');
```

### Adding to a Starter Deck (`src/data/starters.js`):
To include the new activity in pre-made starter decks:
```javascript
export const STARTER_DEFS = {
    'starterNumeracyEarlyStage': {
        title: 'Kindergarten Numeracy Starter',
        // ...
        sections: ['mainIntro', 'sectNumberBonds']
    }
};
```

---

## 9. Developer Verification Checklist

Before deploying, run this verification sequence:

- [ ] **Syntax Check**: Run `node -c` on all modified files:
  ```bash
  node -c src/data/sections.js src/ui/timeline.js src/ui/inspector.js src/ui/preview.js src/export/recipe.js src/main.js
  ```
- [ ] **Library Visibility**: Open the app, switch to the target workspace, and verify the activity appears in the Library panel with the correct icon and title.
- [ ] **Drag & Drop**: Drag the activity into the Deck Sequencer timeline and verify it creates a timeline card.
- [ ] **Inspector Editing**: Click the item in the timeline. Verify that all fields display properly and update reactive state on input.
- [ ] **Slide Preview**: Verify that the 16:9 slide preview matches the layout, reflects user inputs, and scales smoothly.
- [ ] **Recipe Verification**: Click **Assemble Deck** -> expand **"Toggle JSON recipe"**. Check that `recipe.slides` contains the correct `noteId` and token `replacements`.
- [ ] **Applet Compilation**: Run `compile_applet` to ensure there are no build regressions.
