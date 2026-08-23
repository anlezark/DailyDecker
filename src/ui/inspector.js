// Inspector panel rendering and form bindings
import { SECTION_DEFS } from '../data/sections.js';
import { STARTER_DEFS } from '../data/starters.js';
import { DAYS, DAY_ABBR, SENTENCE_TYPE_DEFINITIONS, SOUNDS_WRITE_LEVELS, COMMON_DIGRAPHS, DEFAULT_TEMPLATE_ID } from '../data/constants.js';
import { getPhonicsPoolInfo } from '../data/phonics.js';
import { 
    globalSettings, 
    timelineItems, 
    selectedItemId, 
    selectedLibraryKey, 
    setSelectedItemId, 
    setSelectedLibraryKey, 
    saveState 
} from '../state/state.js';
import { 
    showToast, 
    getItemIncludedDays, 
    parseWordWithPhonemes 
} from '../utils/helpers.js';
import { renderTimeline, addTimelineItem } from './timeline.js';
import { 
    generateSlidePreviewHtml, 
    getPreviewSlideCount,
    setPreviewSubIndex,
    getPreviewSubIndex
} from './preview.js';

export function refreshInspectorSlidePreview() {
    const previewFrame = document.getElementById('slide-preview-frame');
    if (!previewFrame) return;

    if (selectedItemId) {
        const item = timelineItems.find(i => i.id === selectedItemId);
        if (item) {
            previewFrame.innerHTML = generateSlidePreviewHtml(item, false, globalSettings, item.data, item.includedDays);
            updatePreviewSubDots(item, item.data);
            updateSpeakerNotesMockup(item, item.data);
        }
    } else if (selectedLibraryKey) {
        previewFrame.innerHTML = generateSlidePreviewHtml(selectedLibraryKey, true, globalSettings);
        updatePreviewSubDots(selectedLibraryKey);
        updateSpeakerNotesMockup(selectedLibraryKey);
    }
}

export function getSpeakerNotesText(itemOrDefKey, itemData = null) {
    const defKey = typeof itemOrDefKey === 'string' ? itemOrDefKey : itemOrDefKey?.defKey;
    let defaultPrompt = 'Find picture of kids playing in park.';
    if (defKey === 'generic') {
        defaultPrompt = 'Make a slide with a grammar quiz.';
    }

    let prompt = '';
    const d = (typeof itemOrDefKey === 'object' && itemOrDefKey?.data) ? itemOrDefKey.data : itemData;

    if (d?.Monday) {
        if (defKey === 'generic') {
            if (d.Monday.notes && d.Monday.notes.trim()) {
                prompt = d.Monday.notes.trim();
            }
        } else {
            if (d.Monday.prompt && d.Monday.prompt.trim()) {
                prompt = d.Monday.prompt.trim();
            }
        }
    }
    
    const text = prompt || defaultPrompt;
    return text.length > 40 ? text.slice(0, 40) + '...' : text;
}

function updateSpeakerNotesMockup(itemOrDefKey, itemData = null) {
    const notesContainer = document.getElementById('slide-preview-speaker-notes');
    if (!notesContainer) return;
    const defKey = typeof itemOrDefKey === 'string' ? itemOrDefKey : itemOrDefKey?.defKey;
    if (defKey !== 'sectA' && defKey !== 'generic') {
        notesContainer.classList.add('hidden');
        return;
    }
    notesContainer.classList.remove('hidden');
    const txtEl = document.getElementById('speaker-notes-text');
    if (txtEl) {
        txtEl.textContent = getSpeakerNotesText(itemOrDefKey, itemData);
    }
}

function updatePreviewSubDots(itemOrDefKey, itemData = null) {
    const dotsContainer = document.getElementById('slide-preview-sub-dots');
    if (!dotsContainer) return;
    const slides = getPreviewSlideCount(itemOrDefKey, itemData);
    if (slides.length <= 1) {
        dotsContainer.classList.add('hidden');
        dotsContainer.innerHTML = '';
        return;
    }
    dotsContainer.classList.remove('hidden');
    const currentIdx = getPreviewSubIndex();
    dotsContainer.innerHTML = slides.map((slide, idx) => {
        let title = `Slide ${idx + 1}`;
        if (slide === 'rra') title = 'Recite, Recall, Apply';
        else if (slide === 'lisc') title = 'LISC';
        else if (slide === 'intro') title = 'Intro Slide';
        else if (slide === 'activity') title = 'Activity Slide';
        else if (slide === 'read') title = 'Slide 1: Read';
        else if (slide === 'write') title = 'Slide 2: Write (Phonemes)';
        else if (slide === 'review1') title = 'Review 1: Simple & Compound';
        else if (slide === 'review2') title = 'Review 2: FANBOYS';
        else if (slide === 'sentence') title = 'Sentence Slide';
        else if (slide === 'st_def') title = 'Slide 1: Definition';
        else if (slide === 'st_stim') title = 'Slide 2: Find Sentence';
        else if (slide === 'ss_def') title = 'Slide 1: Definition';
        else if (slide === 'ss_stim') title = 'Slide 2: Simple Sentence';
        else if (slide === 'cs_def') title = 'Slide 1: Definition';
        else if (slide === 'cs_stim') title = 'Slide 2: Compound Sentence';
        return `
            <button type="button" class="btn-preview-sub-dot w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${idx === currentIdx ? 'bg-blue-600 scale-125 shadow-2xs' : 'bg-slate-300 hover:bg-slate-400'}" data-index="${idx}" title="${title}"></button>
        `;
    }).join('');

    dotsContainer.querySelectorAll('.btn-preview-sub-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(dot.dataset.index) || 0;
            setPreviewSubIndex(idx);
            refreshInspectorSlidePreview();
        });
    });
}

export function updateLibrarySelection() {
    const items = document.querySelectorAll('.library-part-content [data-key]');
    items.forEach(el => {
        if (el.dataset.key === selectedLibraryKey) {
            el.classList.add('border-blue-500', 'shadow-md', 'ring-2', 'ring-blue-100');
            el.classList.remove('border-slate-200');
        } else {
            el.classList.remove('border-blue-500', 'shadow-md', 'ring-2', 'ring-blue-100');
            el.classList.add('border-slate-200');
        }
    });
}

export function getTemplateOptionsHtml() {
    const customTemplates = Array.isArray(globalSettings.customTemplates) ? globalSettings.customTemplates : [];
    const currentOptKey = globalSettings.templateOptionKey || (globalSettings.templateName === 'Jesmond PS K-2' ? 'jesmond_ps_k2' : globalSettings.templateId || DEFAULT_TEMPLATE_ID);

    let html = `
        <option value="${DEFAULT_TEMPLATE_ID}" ${(currentOptKey === DEFAULT_TEMPLATE_ID || globalSettings.templateName === 'Default Template' || (!globalSettings.templateOptionKey && globalSettings.templateId === DEFAULT_TEMPLATE_ID)) ? 'selected' : ''}>Default Template</option>
        <option value="jesmond_ps_k2" ${(currentOptKey === 'jesmond_ps_k2' || globalSettings.templateName === 'Jesmond PS K-2') ? 'selected' : ''}>Jesmond PS K-2</option>
    `;

    if (customTemplates.length > 0) {
        html += customTemplates.map(ct => 
            `<option value="${ct.id}" ${currentOptKey === ct.id ? 'selected' : ''}>${ct.name || 'Custom Template'}</option>`
        ).join('');
    }

    html += `
        <option disabled>──────────</option>
        <option value="__add_custom__">+ Add custom template...</option>
    `;
    return html;
}

export function syncTemplateSelects() {
    const html = getTemplateOptionsHtml();
    const gSelect = document.getElementById('g-template-select');
    const mSelect = document.getElementById('modal-template-select');
    if (gSelect) gSelect.innerHTML = html;
    if (mSelect) mSelect.innerHTML = html;
}

export function handleTemplateSelection(val) {
    if (val === '__add_custom__') {
        openCustomTemplateModal();
        return;
    }
    if (val === 'jesmond_ps_k2') {
        globalSettings.templateId = DEFAULT_TEMPLATE_ID;
        globalSettings.templateName = 'Jesmond PS K-2';
        globalSettings.templateOptionKey = 'jesmond_ps_k2';
        saveState();
        syncTemplateSelects();
        showToast('Selected "Jesmond PS K-2" template', 'fa-palette text-blue-400');
    } else if (val === DEFAULT_TEMPLATE_ID) {
        globalSettings.templateId = DEFAULT_TEMPLATE_ID;
        globalSettings.templateName = 'Default Template';
        globalSettings.templateOptionKey = DEFAULT_TEMPLATE_ID;
        saveState();
        syncTemplateSelects();
        showToast('Selected "Default Template"', 'fa-palette text-blue-400');
    } else {
        const custom = (globalSettings.customTemplates || []).find(ct => ct.id === val);
        globalSettings.templateId = val;
        globalSettings.templateName = custom ? custom.name : 'Custom Template';
        globalSettings.templateOptionKey = val;
        saveState();
        syncTemplateSelects();
        showToast(`Selected "${globalSettings.templateName}"`, 'fa-palette text-blue-400');
    }

    if (window.currentRecipe) {
        window.currentRecipe.templateId = globalSettings.templateId;
        const output = document.getElementById('json-output');
        if (output) {
            output.textContent = JSON.stringify(window.currentRecipe, null, 4);
        }
    }
}

export function openCustomTemplateModal() {
    const modal = document.getElementById('custom-template-modal');
    const content = document.getElementById('custom-template-modal-content');
    const txtName = document.getElementById('txt-custom-template-name');
    const txtLink = document.getElementById('txt-custom-template-link');
    const feedbackEl = document.getElementById('custom-template-feedback');
    const btnSave = document.getElementById('btn-save-custom-template');
    if (txtName) txtName.value = '';
    if (txtLink) txtLink.value = '';
    if (feedbackEl) {
        feedbackEl.classList.add('hidden');
        feedbackEl.innerHTML = '';
    }
    if (btnSave) {
        btnSave.disabled = false;
        btnSave.innerHTML = '<i class="fa-solid fa-check"></i> Add Template';
    }
    if (!modal || !content) return;
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
        if (txtName) txtName.focus();
    }, 10);
}

export function closeCustomTemplateModal() {
    const modal = document.getElementById('custom-template-modal');
    const content = document.getElementById('custom-template-modal-content');
    if (!modal || !content) return;
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => { 
        modal.classList.add('hidden'); 
        syncTemplateSelects();
    }, 250);
}

export function renderInspector() {
    const header = document.getElementById('inspector-header');
    const title = document.getElementById('inspector-title');
    const content = document.getElementById('inspector-content');
    if (!header || !title || !content) return;
    content.innerHTML = '';

    if (!selectedItemId && !selectedLibraryKey) {
        header.className = 'bg-slate-100 border-b border-slate-200 px-4 py-3 font-bold text-slate-700 shrink-0 transition-colors flex items-center justify-start';
        title.className = 'flex items-center gap-2 truncate text-left w-full';
        title.innerHTML = `<i class="fa-solid fa-globe text-slate-500 shrink-0"></i><span class="truncate font-bold">Global Settings</span>`;

        let phonicsOptions = SOUNDS_WRITE_LEVELS.map(level => 
            `<option value="${level}" ${globalSettings.phonicsLevel === level ? 'selected' : ''}>${level}</option>`
        ).join('');

        content.innerHTML = `
            <div class="space-y-5">
                <div>
                    <h3 class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 border-b border-slate-100 pb-1">Deck Details</h3>
                    
                    <div class="mb-3">
                        <label class="block text-xs font-semibold text-slate-600 mb-1">Deck Name</label>
                        <input type="text" id="g-name" value="${globalSettings.deckName}" class="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    </div>

                    <div class="mb-3">
                        <label class="block text-xs font-semibold text-slate-600 mb-1">Prepared by</label>
                        <input type="text" id="g-author" value="${globalSettings.preparedBy || ''}" placeholder="your name" class="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    </div>

                    <div class="mb-3">
                        <label class="block text-xs font-semibold text-slate-600 mb-1">Current Phonics Level</label>
                        <select id="g-phonics" class="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                            ${phonicsOptions}
                        </select>
                    </div>
                    
                    <div class="mb-3">
                        <label class="block text-xs font-semibold text-slate-600 mb-1">Year Level</label>
                        <input type="text" id="g-yearLevel" value="${globalSettings.yearLevel || 'Kindergarten'}" placeholder="e.g. Kindergarten" class="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    </div>

                    <div class="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 mb-1">Term</label>
                            <input type="number" id="g-term" value="${globalSettings.term}" min="1" max="4" class="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 mb-1">Week</label>
                            <input type="number" id="g-week" value="${globalSettings.week}" min="1" max="11" class="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        </div>
                    </div>
                </div>

                <div>
                    <h3 class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">Days to Include</h3>
                    <div class="flex justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                        ${DAYS.map(day => `
                            <label class="flex flex-col items-center gap-1 cursor-pointer">
                                <span class="text-[10px] font-bold text-slate-500 uppercase">${DAY_ABBR[day]}</span>
                                <input type="checkbox" class="g-day-chk rounded text-blue-600 focus:ring-blue-500" data-day="${day}" ${globalSettings.activeDays[day] ? 'checked' : ''}>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="pt-2 border-t border-slate-100">
                    <h3 class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Presentation Template</h3>
                    <div class="flex items-center gap-2">
                        <select id="g-template-select" class="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none truncate font-medium text-slate-700">
                            ${getTemplateOptionsHtml()}
                        </select>
                        <button id="btn-add-template-inspector" type="button" class="px-2.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1 border border-blue-200" title="Add Custom Template">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>
                </div>

                <div class="pt-2 border-t border-slate-100">
                    <h3 class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Google Drive Destination</h3>
                    <label class="block text-[11px] font-semibold text-slate-600 mb-1">Target Folder ID (Optional)</label>
                    <input type="text" id="g-folderId" value="${globalSettings.folderId || ''}" placeholder="e.g. 1wbKRkTXB6M6szi-yeCYiU1kyKJgTfIdK" class="w-full text-xs font-mono p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <p class="text-[10px] text-slate-400 mt-1 leading-normal">Folder ID from Google Drive URL. Leave blank for root.</p>
                </div>
            </div>
        `;

        // Event listeners for global settings
        document.getElementById('g-name').addEventListener('input', (e) => {
            globalSettings.deckName = e.target.value;
            const el = document.getElementById('timeline-filename');
            if (el) el.textContent = e.target.value;
            saveState();
        });
        document.getElementById('g-author').addEventListener('input', (e) => {
            globalSettings.preparedBy = e.target.value;
            saveState();
        });
        document.getElementById('g-phonics').addEventListener('change', (e) => {
            globalSettings.phonicsLevel = e.target.value;
            saveState();
        });
        document.getElementById('g-yearLevel').addEventListener('input', (e) => {
            globalSettings.yearLevel = e.target.value;
            saveState();
        });
        document.getElementById('g-term').addEventListener('input', (e) => {
            globalSettings.term = parseInt(e.target.value) || 1;
            saveState();
        });
        document.getElementById('g-week').addEventListener('input', (e) => {
            globalSettings.week = parseInt(e.target.value) || 1;
            saveState();
        });
        document.getElementById('g-folderId').addEventListener('input', (e) => {
            globalSettings.folderId = e.target.value.trim();
            saveState();
        });

        document.querySelectorAll('.g-day-chk').forEach(chk => {
            chk.addEventListener('change', (e) => {
                const day = e.target.dataset.day;
                globalSettings.activeDays[day] = e.target.checked;
                saveState();
                renderTimeline();
            });
        });

        document.getElementById('g-template-select')?.addEventListener('change', (e) => {
            handleTemplateSelection(e.target.value);
        });

        document.getElementById('btn-add-template-inspector')?.addEventListener('click', () => {
            openCustomTemplateModal();
        });

    } else if (selectedLibraryKey && !selectedItemId) {
        // Library item selected
        const isStarter = !!STARTER_DEFS[selectedLibraryKey];
        if (isStarter) {
            const starter = STARTER_DEFS[selectedLibraryKey];
            header.className = 'bg-amber-50 border-b border-amber-100 px-4 py-3 font-bold text-amber-900 shrink-0 transition-colors flex items-center justify-start';
            title.className = 'flex items-center gap-2 truncate text-left w-full';
            title.innerHTML = `<i class="fa-solid fa-folder text-amber-500 shrink-0"></i><span class="truncate font-bold">${starter.title}</span>`;
            
            const sectionItemsHtml = starter.sections.map((secKey) => {
                const secDef = SECTION_DEFS[secKey];
                if (!secDef) return '';
                return `
                    <div class="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                        <span class="w-6 h-6 rounded-md ${secDef.bg} ${secDef.color} flex items-center justify-center text-xs shrink-0">
                            <i class="fa-solid ${secDef.icon}"></i>
                        </span>
                        <div class="flex-1 truncate font-medium text-slate-700">${secDef.title}</div>
                    </div>
                `;
            }).join('');

            content.innerHTML = `
                <div class="space-y-4">
                    <div class="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900">
                        <p class="font-semibold mb-1">${starter.title} Deck Starter</p>
                        <p class="text-amber-700 leading-relaxed">${starter.description}</p>
                    </div>

                    <div>
                        <button id="btn-load-starter-inspector" type="button" class="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer">
                            <i class="fa-solid fa-folder-open"></i> Load Deck Starter
                        </button>
                    </div>

                    <div>
                        <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Included Sections (${starter.sections.length})
                        </h4>
                        <div class="space-y-1.5">
                            ${sectionItemsHtml}
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('btn-load-starter-inspector')?.addEventListener('click', () => {
                if (window.loadDeckStarter) {
                    window.loadDeckStarter(selectedLibraryKey);
                }
            });

        } else {
            // Section definition selected
            const def = SECTION_DEFS[selectedLibraryKey];
            if (!def) return;
            header.className = 'bg-blue-50 border-b border-blue-100 px-4 py-3 font-bold text-blue-800 shrink-0 transition-colors flex items-center justify-start';
            title.className = 'flex items-center gap-2 truncate text-left w-full';
            title.innerHTML = `<i class="fa-solid ${def.icon} text-blue-500 shrink-0"></i><span class="truncate font-bold">${def.title}</span>`;

            const isDailyOrMixed = def.type === 'daily' || def.type === 'mixed';
            const previewHtml = generateSlidePreviewHtml(selectedLibraryKey, true, globalSettings);

            content.innerHTML = `
                <div class="space-y-4">
                    <!-- Slide Preview Frame -->
                    <div class="bg-slate-50/70 rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-2.5">
                        <div class="flex items-center gap-1.5 px-0.5">
                            <i class="fa-solid fa-image text-blue-500 text-sm"></i>
                            <span class="text-xs font-bold uppercase tracking-wider text-slate-600">SLIDE PREVIEW</span>
                        </div>
                        <div class="w-full aspect-[16/9] rounded-2xl border border-blue-200/90 bg-white relative overflow-hidden flex flex-col items-center justify-center p-3 shadow-2xs" id="slide-preview-frame">
                            ${previewHtml}
                        </div>
                        <div id="slide-preview-speaker-notes" class="w-full bg-white border border-slate-200 rounded-lg p-2 text-left shadow-2xs ${(selectedLibraryKey === 'sectA' || selectedLibraryKey === 'generic') ? '' : 'hidden'}">
                            <div class="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 flex items-center gap-1">
                                <i class="fa-solid fa-note-sticky text-amber-500 text-[9px]"></i>
                                <span>Speaker Notes</span>
                            </div>
                            <div id="speaker-notes-text" class="text-[11px] text-slate-700 font-sans truncate leading-tight">
                                ${getSpeakerNotesText(selectedLibraryKey)}
                            </div>
                        </div>
                        <div id="slide-preview-sub-dots" class="flex items-center justify-center gap-2 pt-0.5 hidden"></div>
                        <div class="text-center text-[11px] text-slate-400 font-normal">Preview may not match template.</div>
                    </div>

                    <div class="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900">
                        <p class="font-semibold mb-1">${def.title}</p>
                        <p class="text-blue-700 leading-relaxed">${def.description || def.shortDesc}</p>
                    </div>

                    ${(def.type === 'static' || (!def.fields?.length && !def.weeklyFields?.length && !def.dailyFields?.length && !def.hasTitleSlideOptions && selectedLibraryKey !== 'customisable' && selectedLibraryKey !== 'sectDigraphs')) ? `
                        <div class="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-start gap-3 text-emerald-900 shadow-2xs">
                            <div class="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                                <i class="fa-solid fa-check text-xs"></i>
                            </div>
                            <div class="text-xs leading-relaxed">
                                <p class="font-bold text-emerald-950 mb-0.5">This slide is automatically generated.</p>
                                <p class="text-emerald-800">There is nothing more to do. Too easy.</p>
                            </div>
                        </div>
                    ` : ''}

                    <div class="pt-2 border-t border-slate-100">
                        <button id="btn-add-section-inspector" type="button" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer">
                            <i class="fa-solid fa-plus"></i> Add to Deck Sequencer
                        </button>
                    </div>
                </div>
            `;

            document.getElementById('btn-add-section-inspector')?.addEventListener('click', () => {
                addTimelineItem(selectedLibraryKey);
            });

            updatePreviewSubDots(selectedLibraryKey);
        }

    } else if (selectedItemId) {
        // Timeline Item Selected
        const item = timelineItems.find(i => i.id === selectedItemId);
        if (!item) {
            setSelectedItemId(null);
            renderInspector();
            return;
        }

        const def = SECTION_DEFS[item.defKey];
        if (!def) return;

        const isEditable = item.defKey !== 'mainIntro' && item.defKey !== 'dayDivider' && item.defKey !== 'dayDividerPlain' && item.defKey !== 'finished';
        const displayTitle = item.customTitle || def.title;

        header.className = 'bg-blue-600 border-b border-blue-700 px-4 py-3 font-bold text-white shrink-0 transition-colors flex items-center justify-between';
        title.className = 'flex items-center gap-2 truncate text-left flex-1 min-w-0';
        
        let titleHtml = '';
        if (isEditable) {
            titleHtml = `
                <div class="flex items-center gap-2 flex-1 min-w-0 mr-2 text-left">
                    <i class="fa-solid ${def.icon} text-blue-200 shrink-0"></i>
                    <div id="inspector-section-display" class="truncate cursor-pointer hover:underline flex items-center gap-1.5 flex-1" title="Click to rename">
                        <span id="section-title-text" class="truncate font-bold">${displayTitle}</span>
                        <i class="fa-solid fa-pencil text-[10px] text-blue-200 shrink-0"></i>
                    </div>
                    <input id="inspector-section-input" type="text" class="hidden text-xs text-slate-800 bg-white px-2 py-1 rounded border border-blue-300 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 font-normal" value="${displayTitle}">
                </div>
            `;
        } else {
            titleHtml = `<i class="fa-solid ${def.icon} text-blue-200 shrink-0"></i><span class="truncate font-bold">${displayTitle}</span>`;
        }

        title.innerHTML = titleHtml;

        const isDailyOrMixed = def.type === 'daily' || def.type === 'mixed';
        const hasTitleSlideOption = def.hasTitleSlideOptions && item.data?.titleSettings?.include;
        const previewHtml = generateSlidePreviewHtml(item, false, globalSettings, item.data, item.includedDays);

        let contentHtml = `<div class="space-y-4">`;

        // Slide Preview Section
        contentHtml += `
            <div class="bg-slate-50/70 rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-2.5">
                <div class="flex items-center gap-1.5 px-0.5">
                    <i class="fa-solid fa-image text-blue-500 text-sm"></i>
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-600">SLIDE PREVIEW</span>
                </div>
                <div class="w-full aspect-[16/9] rounded-2xl border border-blue-200/90 bg-white relative overflow-hidden flex flex-col items-center justify-center p-3 shadow-2xs" id="slide-preview-frame">
                    ${previewHtml}
                </div>
                <div id="slide-preview-speaker-notes" class="w-full bg-white border border-slate-200 rounded-lg p-2 text-left shadow-2xs ${(item.defKey === 'sectA' || item.defKey === 'generic') ? '' : 'hidden'}">
                    <div class="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 flex items-center gap-1">
                        <i class="fa-solid fa-note-sticky text-amber-500 text-[9px]"></i>
                        <span>Speaker Notes</span>
                    </div>
                    <div id="speaker-notes-text" class="text-[11px] text-slate-700 font-sans truncate leading-tight">
                        ${getSpeakerNotesText(item, item.data)}
                    </div>
                </div>
                <div id="slide-preview-sub-dots" class="flex items-center justify-center gap-2 pt-0.5 hidden"></div>
                <div class="text-center text-[11px] text-slate-400 font-normal">Preview may not match template.</div>
            </div>
        `;

        // Section description
        if (def.description) {
            contentHtml += `
                <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
                    ${def.description}
                </div>
            `;
        }

        // Check if there are no editable options
        const hasConfigurableOptions = isEditable || def.hasTitleSlideOptions || (def.fields && def.fields.length > 0) || (def.weeklyFields && def.weeklyFields.length > 0) || (def.dailyFields && def.dailyFields.length > 0) || item.defKey === 'customisable' || item.defKey === 'sectDigraphs' || item.defKey === 'sectSimpleCompound' || item.defKey === 'sectSentenceTypes' || item.defKey === 'sectB';

        if (!hasConfigurableOptions) {
            contentHtml += `
                <div class="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-start gap-3 text-emerald-900 shadow-2xs">
                    <div class="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                        <i class="fa-solid fa-check text-xs"></i>
                    </div>
                    <div class="text-xs leading-relaxed">
                        <p class="font-bold text-emerald-950 mb-0.5">This slide is automatically generated.</p>
                        <p class="text-emerald-800">There is nothing more to do. Too easy.</p>
                    </div>
                </div>
            `;
        }

        // Section Title Slide Options
        if (def.hasTitleSlideOptions) {
            if (!item.data.titleSettings) {
                let defaultTitle = def.title.includes(': ') ? def.title.split(': ')[1] : def.title;
                if (item.defKey === 'sectH') defaultTitle = 'Vocabulary';
                if (item.defKey === 'sectJ') defaultTitle = 'Finish the sentence';
                const defaultInclude = item.defKey !== 'sectSimpleCompound' && item.defKey !== 'sectSentenceTypes';
                item.data.titleSettings = {
                    include: defaultInclude,
                    title: item.customTitle || defaultTitle,
                    instructions: ''
                };
            }
            const ts = item.data.titleSettings;
            contentHtml += `
                <div class="border-t border-slate-200 pt-3">
                    <div class="flex items-center justify-between mb-2">
                        <label class="text-xs font-bold text-slate-600 flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="chk-ts-include" class="rounded text-blue-600" ${ts.include ? 'checked' : ''}>
                            <span>Include Title Slide</span>
                        </label>
                    </div>
                    <div id="ts-fields" class="space-y-2 ${ts.include ? '' : 'opacity-40 pointer-events-none grayscale'} transition-all">
                        <div>
                            <label class="block text-[11px] font-semibold text-slate-500 mb-1">Title</label>
                            <input type="text" id="txt-ts-title" value="${ts.title || ''}" class="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg">
                        </div>
                        <div>
                            <label class="block text-[11px] font-semibold text-slate-500 mb-1">Instructions / Note</label>
                            <input type="text" id="txt-ts-inst" value="${ts.instructions || ''}" class="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg">
                        </div>
                    </div>
                </div>
            `;
        }

        // Weekly fields
        if (def.fields && def.type === 'weekly') {
            contentHtml += `<div class="space-y-3 border-t border-slate-200 pt-3">`;
            def.fields.forEach(f => {
                const val = item.data[f.id] !== undefined ? item.data[f.id] : (f.default !== undefined ? f.default : '');
                if (f.type === 'select') {
                    contentHtml += `
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 mb-1">${f.label}</label>
                            <select data-path='["weekly","${f.id}"]' class="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg">
                                ${f.options.map(opt => `<option value="${opt}" ${val === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                            </select>
                        </div>
                    `;
                } else if (f.type === 'checkbox') {
                    contentHtml += `
                        <label class="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                            <input type="checkbox" data-path='["weekly","${f.id}"]' ${val ? 'checked' : ''} class="rounded text-blue-600">
                            <span>${f.label}</span>
                        </label>
                    `;
                } else if (f.type === 'number') {
                    contentHtml += `
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 mb-1">${f.label}</label>
                            <input type="number" data-path='["weekly","${f.id}"]' value="${val}" min="${f.min || 1}" class="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg">
                        </div>
                    `;
                }
            });
            contentHtml += `</div>`;
        }

        // Mixed weekly fields
        if (def.weeklyFields && def.type === 'mixed') {
            contentHtml += `<div class="space-y-3 border-t border-slate-200 pt-3">`;
            def.weeklyFields.forEach(f => {
                const val = item.data[f.id] !== undefined ? item.data[f.id] : (f.default !== undefined ? f.default : '');
                if (f.type === 'checkbox') {
                    contentHtml += `
                        <label class="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                            <input type="checkbox" data-path='["weekly","${f.id}"]' ${val ? 'checked' : ''} class="rounded text-blue-600">
                            <span>${f.label}</span>
                        </label>
                    `;
                } else if (f.type === 'textarea') {
                    contentHtml += `
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 mb-1">${f.label}</label>
                            <textarea data-path='["weekly","${f.id}"]' class="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg h-20">${val}</textarea>
                        </div>
                    `;
                } else if (f.type === 'select') {
                    contentHtml += `
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 mb-1">${f.label}</label>
                            <select id="st-type-select" data-path='["weekly","${f.id}"]' class="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg">
                                ${f.options.map(opt => `<option value="${opt}" ${val === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                            </select>
                        </div>
                    `;
                }
            });
            contentHtml += `</div>`;
        }

        // Daily fields
        if (def.type === 'daily' || def.type === 'mixed') {
            const activeDays = DAYS.filter(d => globalSettings.activeDays[d] && (!item.includedDays || item.includedDays[d] !== false));
            if (activeDays.length > 0) {
                contentHtml += `<div class="space-y-3 border-t border-slate-200 pt-3"><h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Daily Content</h4>`;
                
                activeDays.forEach(day => {
                    const dayData = (item.data && item.data[day]) || {};
                    contentHtml += `
                        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <div class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <span class="w-2 h-2 rounded-full bg-blue-500"></span> ${day}
                            </div>
                    `;

                    if (item.defKey === 'sectSimpleCompound') {
                        const rawSentences = dayData.sentences;
                        let sentences = Array.isArray(rawSentences) && rawSentences.length > 0 ? rawSentences : null;
                        if (!sentences) {
                            if (dayData.sent !== undefined) {
                                sentences = [{ sent: dayData.sent || '', answer: dayData.answer || 'simple' }];
                            } else {
                                sentences = [{ sent: '', answer: 'simple' }];
                            }
                        }

                        contentHtml += `
                            <div class="space-y-3 pt-1">
                                <div class="space-y-2.5">
                                    ${sentences.map((s, idx) => `
                                        <div class="p-3 bg-white border border-slate-200/90 rounded-xl space-y-2 relative shadow-2xs">
                                            ${sentences.length > 1 ? `
                                                <button type="button" class="btn-sc-remove-sent absolute top-2.5 right-2.5 text-slate-400 hover:text-rose-500 p-1 text-xs transition cursor-pointer" data-day="${day}" data-index="${idx}" title="Remove sentence">
                                                    <i class="fa-solid fa-trash-can"></i>
                                                </button>
                                            ` : ''}
                                            <div>
                                                <label class="block text-[11px] font-semibold text-slate-600 mb-1">Sentence</label>
                                                <input type="text" data-day="${day}" data-index="${idx}" data-field="sent" value="${s.sent !== undefined ? s.sent : ''}" class="sc-sent-field w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-none transition">
                                            </div>
                                            <div>
                                                <label class="block text-[11px] font-semibold text-slate-600 mb-1">Type</label>
                                                <select data-day="${day}" data-index="${idx}" data-field="answer" class="sc-sent-field w-full text-xs p-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-none transition cursor-pointer">
                                                    <option value="simple" ${(s.answer || 'simple').toLowerCase() === 'simple' ? 'selected' : ''}>Simple</option>
                                                    <option value="compound" ${(s.answer || 'simple').toLowerCase() === 'compound' ? 'selected' : ''}>Compound</option>
                                                </select>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                                <button type="button" class="btn-sc-add-sentence w-full py-2 bg-blue-50/70 hover:bg-blue-100/70 text-blue-600 border border-blue-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer" data-day="${day}">
                                    <i class="fa-solid fa-plus text-[10px]"></i> Add Sentence
                                </button>
                            </div>
                        `;
                    } else if (item.defKey === 'sectSentenceTypes') {
                        const stType = item.data?.sentenceType || item.data?.weekly?.sentenceType || 'Imperative';
                        contentHtml += `
                            <div class="space-y-2 pt-0.5">
                                <div class="text-[11px] text-slate-500 italic">
                                    Provide one ${stType.toLowerCase()} sentence and one non-${stType.toLowerCase()} sentence.
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-base select-none shrink-0" title="Sentence 1">☝️</span>
                                    <input type="text" class="st-daily-sent flex-1 text-xs p-2 bg-white border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-none transition" data-day="${day}" data-field="sent1" value="${dayData.sent1 !== undefined ? dayData.sent1 : ''}">
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-base select-none shrink-0" title="Sentence 2">✌️</span>
                                    <input type="text" class="st-daily-sent flex-1 text-xs p-2 bg-white border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-none transition" data-day="${day}" data-field="sent2" value="${dayData.sent2 !== undefined ? dayData.sent2 : ''}">
                                </div>
                            </div>
                        `;
                    } else if (item.defKey === 'sectG') {
                        contentHtml += `
                            <div class="flex items-center justify-start gap-3 py-0.5">
                                <label class="text-[11px] font-semibold text-slate-600">Target letter</label>
                                <input type="text" maxlength="2" data-path='["daily","${day}","letter"]' value="${dayData.letter !== undefined ? dayData.letter : ''}" placeholder="m" class="w-10 h-8 text-center text-xs font-bold p-1 bg-white border border-slate-200 rounded-lg">
                            </div>
                        `;
                    } else if (item.defKey === 'sectReadWordWriteWord') {
                        const isDiff = item.data?.differentiate === true || item.data?.weekly?.differentiate === true;
                        if (isDiff) {
                            contentHtml += `
                                <div>
                                    <label class="block text-[11px] font-semibold text-slate-500 mb-1">Mild word(s)</label>
                                    <input type="text" data-path='["daily","${day}","mildWords"]' value="${dayData.mildWords !== undefined ? dayData.mildWords : ''}" placeholder="cat 3, drive 4" class="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg">
                                </div>
                                <div>
                                    <label class="block text-[11px] font-semibold text-slate-500 mb-1">Spicy word(s)</label>
                                    <input type="text" data-path='["daily","${day}","spicyWords"]' value="${dayData.spicyWords !== undefined ? dayData.spicyWords : ''}" placeholder="phone 3, sprite 5" class="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg">
                                </div>
                            `;
                        } else {
                            contentHtml += `
                                <div>
                                    <label class="block text-[11px] font-semibold text-slate-500 mb-1">Word(s)</label>
                                    <input type="text" data-path='["daily","${day}","words"]' value="${dayData.words !== undefined ? dayData.words : ''}" placeholder="bread 4, cat 3" class="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg">
                                    <p class="text-[10px] text-slate-400 mt-1">Type word(s) and number of phonemes. Separate by comma if two or more words.</p>
                                </div>
                            `;
                        }
                    } else if (item.defKey === 'sectSimpleSentences') {
                        contentHtml += `
                            <div class="space-y-2 pt-0.5">
                                <div class="text-[11px] text-slate-500 italic">
                                    Write a simple sentence with subject, verb and object.
                                </div>
                                <div>
                                    <input type="text" data-path='["daily","${day}","sent"]' value="${dayData.sent !== undefined ? dayData.sent : ''}" placeholder="Sam kicked the ball." class="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-none transition">
                                </div>
                            </div>
                        `;
                    } else if (item.defKey === 'sectCompoundSentences') {
                        contentHtml += `
                            <div class="space-y-2 pt-0.5">
                                <div class="text-[11px] text-slate-500 italic">
                                    Write a <span class="font-semibold italic">compound</span> sentence.
                                </div>
                                <div>
                                    <input type="text" data-path='["daily","${day}","sent"]' value="${dayData.sent !== undefined ? dayData.sent : ''}" placeholder="Sam kicked the ball and I caught it." class="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-none transition">
                                </div>
                            </div>
                        `;
                    } else {
                        const fieldsToRender = def.dailyFields || def.fields || [];
                        fieldsToRender.forEach(f => {
                            const val = dayData[f.id] !== undefined ? dayData[f.id] : (f.default !== undefined ? f.default : '');
                            if (f.type === 'text') {
                                contentHtml += `
                                    <div>
                                        <label class="block text-[11px] font-semibold text-slate-500 mb-1">${f.label}</label>
                                        <input type="text" data-path='["daily","${day}","${f.id}"]' value="${val}" placeholder="${f.placeholder || ''}" class="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg">
                                    </div>
                                `;
                            } else if (f.type === 'textarea') {
                                contentHtml += `
                                    <div>
                                        <label class="block text-[11px] font-semibold text-slate-500 mb-1">${f.label}</label>
                                        <textarea data-path='["daily","${day}","${f.id}"]' class="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg h-16">${val}</textarea>
                                    </div>
                                `;
                            } else if (f.type === 'select') {
                                contentHtml += `
                                    <div>
                                        <label class="block text-[11px] font-semibold text-slate-500 mb-1">${f.label}</label>
                                        <select data-path='["daily","${day}","${f.id}"]' class="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg">
                                            ${f.options.map(opt => `<option value="${opt}" ${val === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                                        </select>
                                    </div>
                                `;
                            } else if (f.type === 'checkbox') {
                                contentHtml += `
                                    <label class="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                                        <input type="checkbox" data-path='["daily","${day}","${f.id}"]' ${val ? 'checked' : ''} class="rounded text-blue-600">
                                        <span>${f.label}</span>
                                    </label>
                                `;
                            }
                        });
                    }

                    contentHtml += `</div>`;
                });

                contentHtml += `</div>`;
            }
        }

        // Customisable section UI
        if (item.defKey === 'customisable') {
            const tagVal = item.data.templateTag || '';
            const contents = Array.isArray(item.data.contents) ? item.data.contents : [];
            contentHtml += `
                <div class="border-t border-slate-200 pt-3 space-y-3">
                    <div>
                        <label class="block text-xs font-semibold text-slate-600 mb-1">Slide Template Tag</label>
                        <input type="text" id="cust-template-tag" value="${tagVal}" placeholder="e.g. [my_custom_slide]" class="w-full text-xs font-mono p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    </div>

                    <div>
                        <div class="flex items-center justify-between mb-1.5">
                            <label class="text-xs font-semibold text-slate-600">Content Replacements</label>
                            <button id="btn-cust-add-content" type="button" class="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">+ Add Tag</button>
                        </div>
                        <div id="cust-contents-list" class="space-y-2">
                            ${contents.map((c, idx) => `
                                <div class="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                                    <input type="text" data-index="${idx}" data-field="tag" value="${c.tag || ''}" placeholder="{{tag}}" class="cust-content-field text-xs font-mono p-1.5 bg-white border border-slate-200 rounded w-24">
                                    <input type="text" data-index="${idx}" data-field="value" value="${c.value || ''}" placeholder="Replacement value" class="cust-content-field text-xs p-1.5 bg-white border border-slate-200 rounded flex-1">
                                    <button type="button" data-index="${idx}" class="btn-remove-cust-content text-slate-400 hover:text-rose-500 p-1"><i class="fa-solid fa-xmark"></i></button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        // Digraphs section UI
        if (item.defKey === 'sectDigraphs') {
            const { fullPool } = getPhonicsPoolInfo(globalSettings.phonicsLevel);
            const defaultSelected = COMMON_DIGRAPHS.filter(d => fullPool.includes(d.id)).map(d => d.id);
            const selected = Array.isArray(item.data.selectedDigraphs) 
                ? item.data.selectedDigraphs 
                : defaultSelected;
            const further = item.data.furtherDigraphs || '';
            const shuffle = item.data.shuffle || false;

            contentHtml += `
                <div class="border-t border-slate-200 pt-3 space-y-3">
                    <div>
                        <label class="block text-xs font-semibold text-slate-600 mb-2">Common Digraphs</label>
                        <div class="grid grid-cols-3 gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
                            ${COMMON_DIGRAPHS.map(d => `
                                <label class="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer hover:bg-white p-1 rounded">
                                    <input type="checkbox" value="${d.id}" class="dg-checkbox rounded text-violet-600" ${selected.includes(d.id) ? 'checked' : ''}>
                                    <span class="font-mono">${d.label}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-slate-600 mb-1">Further Digraphs / Trigraphs</label>
                        <input type="text" id="txt-further-digraphs" value="${further}" placeholder="e.g. igh, dge, tion" class="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    </div>

                    <label class="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                        <input type="checkbox" id="chk-dg-shuffle" ${shuffle ? 'checked' : ''} class="rounded text-violet-600">
                        <span>Shuffle order each day</span>
                    </label>
                </div>
            `;
        }

        // Say the Sound (sectB) slider UI
        if (item.defKey === 'sectB') {
            const { fullPool } = getPhonicsPoolInfo(globalSettings.phonicsLevel);
            const poolSize = fullPool.length > 0 ? fullPool.length : 1;
            const maxSlides = Math.max(poolSize + 2, Math.round(poolSize / 0.75));
            const rawLimit = item.data?.limit !== undefined ? item.data.limit : (item.data?.weekly?.limit !== undefined ? item.data.weekly.limit : 'all');
            const isAll = rawLimit === 'all' || rawLimit === '' || rawLimit === undefined || parseInt(rawLimit) === poolSize;
            const currentVal = isAll ? poolSize : Math.min(maxSlides, Math.max(1, parseInt(rawLimit) || poolSize));

            let statusMessage = "One slide for each sound";
            if (!isAll && currentVal < poolSize) {
                statusMessage = "Fewer slides - some sounds excluded";
            } else if (!isAll && currentVal > poolSize) {
                statusMessage = "More slides - some sounds repeated";
            }

            contentHtml += `
                <div class="border-t border-slate-200 pt-3">
                    <div class="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-bold text-slate-700">Slide count:</span>
                                <span id="sectb-count-badge" class="bg-amber-100/90 text-amber-900 border border-amber-200/80 px-2.5 py-0.5 rounded-lg font-bold text-xs shadow-2xs">
                                    ${isAll ? 'All' : currentVal}
                                </span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-bold text-slate-700">Learnt phonemes:</span>
                                <span class="bg-amber-100/90 text-amber-900 border border-amber-200/80 px-2.5 py-0.5 rounded-lg font-bold text-xs shadow-2xs">
                                    ${poolSize}
                                </span>
                            </div>
                        </div>

                        <div class="space-y-2 pt-1">
                            <input 
                                type="range" 
                                id="sectb-slider" 
                                min="1" 
                                max="${maxSlides}" 
                                value="${currentVal}" 
                                step="1" 
                                class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            >
                            <div id="sectb-status-desc" class="text-center text-[11.5px] font-medium text-slate-500 pt-0.5">
                                ${statusMessage}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Section active days selector (moved to bottom of inspector)
        if (isEditable) {
            const incDays = getItemIncludedDays(item);
            contentHtml += `
                <div class="border-t border-slate-200 pt-3">
                    <h3 class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Appear on Days</h3>
                    <div class="flex justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                        ${DAYS.map(day => `
                            <label class="flex flex-col items-center gap-1 cursor-pointer">
                                <span class="text-[10px] font-bold text-slate-500 uppercase">${DAY_ABBR[day]}</span>
                                <input type="checkbox" class="sec-insert-day-chk rounded text-blue-600 focus:ring-blue-500" data-day="${day}" ${incDays[day] !== false ? 'checked' : ''}>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        contentHtml += `</div>`;
        content.innerHTML = contentHtml;

        // Dynamic event binding
        if (isEditable) {
            const displayEl = document.getElementById('inspector-section-display');
            const inputEl = document.getElementById('inspector-section-input');

            if (displayEl && inputEl) {
                const startEditing = () => {
                    displayEl.classList.add('hidden');
                    inputEl.classList.remove('hidden');
                    inputEl.focus();
                    inputEl.select();
                };

                const finishEditing = () => {
                    const val = inputEl.value.trim();
                    const newTitle = val || def.title;
                    inputEl.value = newTitle;
                    item.customTitle = (newTitle === def.title) ? undefined : newTitle;

                    if (def.hasTitleSlideOptions && item.data && item.data.titleSettings) {
                        item.data.titleSettings.title = newTitle;
                        const txtTitle = document.getElementById('txt-ts-title');
                        if (txtTitle) txtTitle.value = newTitle;
                    }

                    const txtDisplay = document.getElementById('section-title-text');
                    if (txtDisplay) txtDisplay.textContent = newTitle;

                    inputEl.classList.add('hidden');
                    displayEl.classList.remove('hidden');

                    renderTimeline();
                    saveState();
                };

                displayEl.addEventListener('click', startEditing);

                inputEl.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        finishEditing();
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        inputEl.value = item.customTitle || def.title;
                        inputEl.classList.add('hidden');
                        displayEl.classList.remove('hidden');
                    }
                });

                inputEl.addEventListener('blur', finishEditing);

                inputEl.addEventListener('input', (e) => {
                    const val = e.target.value.trim() || def.title;
                    item.customTitle = (val === def.title) ? undefined : val;

                    if (def.hasTitleSlideOptions && item.data && item.data.titleSettings) {
                        item.data.titleSettings.title = val;
                        const txtTitle = document.getElementById('txt-ts-title');
                        if (txtTitle) txtTitle.value = val;
                    }

                    const txtDisplay = document.getElementById('section-title-text');
                    if (txtDisplay) txtDisplay.textContent = val;

                    renderTimeline();
                    saveState();
                });
            }
        }

        if (def.hasTitleSlideOptions) {
            const chk = document.getElementById('chk-ts-include');
            const fieldsDiv = document.getElementById('ts-fields');
            const txtTitle = document.getElementById('txt-ts-title');
            const txtInst = document.getElementById('txt-ts-inst');

            chk?.addEventListener('change', (e) => {
                item.data.titleSettings.include = e.target.checked;
                if (e.target.checked) {
                    fieldsDiv?.classList.remove('opacity-40', 'pointer-events-none', 'grayscale');
                } else {
                    fieldsDiv?.classList.add('opacity-40', 'pointer-events-none', 'grayscale');
                }
                saveState();
                refreshInspectorSlidePreview();
            });

            txtTitle?.addEventListener('input', (e) => { 
                item.data.titleSettings.title = e.target.value; 
                saveState(); 
                refreshInspectorSlidePreview();
            });
            txtInst?.addEventListener('input', (e) => { 
                item.data.titleSettings.instructions = e.target.value; 
                saveState(); 
                refreshInspectorSlidePreview();
            });
        }

        // Sentence types inspector listeners
        if (item.defKey === 'sectSentenceTypes') {
            const typeSelect = content.querySelector('#st-type-select');
            const defInput = content.querySelector('[data-path=\'["weekly","definition"]\']');

            typeSelect?.addEventListener('change', (e) => {
                const newType = e.target.value;
                item.data.sentenceType = newType;
                if (!item.data.weekly) item.data.weekly = {};
                item.data.weekly.sentenceType = newType;

                const autoDef = SENTENCE_TYPE_DEFINITIONS[newType] || '';
                item.data.definition = autoDef;
                item.data.weekly.definition = autoDef;
                if (defInput) defInput.value = autoDef;

                saveState();
                renderInspector();
                refreshInspectorSlidePreview();
            });
        }

        // Generic field bindings with data-path
        content.querySelectorAll('[data-path]').forEach(el => {
            const handleUpdate = (e) => {
                const path = JSON.parse(e.target.dataset.path);
                const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                
                if (path[0] === 'weekly') {
                    item.data[path[1]] = val;
                    if (!item.data.weekly) item.data.weekly = {};
                    item.data.weekly[path[1]] = val;
                    if (path[1] === 'differentiate' || path[1] === 'useIntro' || path[1] === 'includeRRA' || path[1] === 'includeLISC') {
                        saveState();
                        renderInspector();
                        return;
                    }
                }
                if (path[0] === 'daily') {
                    if (!item.data[path[1]]) item.data[path[1]] = {};
                    item.data[path[1]][path[2]] = val;
                }
                saveState();
                refreshInspectorSlidePreview();
            };

            el.addEventListener('input', handleUpdate);
            el.addEventListener('change', handleUpdate);
        });

        // Included days checkbox
        content.querySelectorAll('.sec-insert-day-chk').forEach(chk => {
            chk.addEventListener('change', (e) => {
                const day = e.target.dataset.day;
                if (!item.includedDays) {
                    item.includedDays = { 'Monday': true, 'Tuesday': true, 'Wednesday': true, 'Thursday': true, 'Friday': true };
                }
                item.includedDays[day] = e.target.checked;
                saveState();
                renderTimeline();
                renderInspector();
            });
        });

        // Digraphs listeners
        if (item.defKey === 'sectDigraphs') {
            const COMMON_ORDER = [
                'sh', 'ch', 'th', 'ck', 'wh', 'ng', 'qu', 'ai', 'ay', 'ee', 
                'ea', 'ea-e', 'oa', 'ow', 'oo', 'u_e', 'ue', 'ew', 'er', 'ir', 'ur', 'or-er'
            ];
            const checkboxes = content.querySelectorAll('.dg-checkbox');
            const txtFurther = content.querySelector('#txt-further-digraphs');
            const chkShuffle = content.querySelector('#chk-dg-shuffle');

            checkboxes.forEach(chk => {
                chk.addEventListener('change', () => {
                    const val = chk.value;
                    if (!Array.isArray(item.data.selectedDigraphs)) item.data.selectedDigraphs = [];
                    if (chk.checked) {
                        if (!item.data.selectedDigraphs.includes(val)) {
                            item.data.selectedDigraphs.push(val);
                        }
                    } else {
                        item.data.selectedDigraphs = item.data.selectedDigraphs.filter(d => d !== val);
                    }
                    const orderMap = {};
                    COMMON_ORDER.forEach((d, idx) => { orderMap[d] = idx; });
                    item.data.selectedDigraphs.sort((a, b) => (orderMap[a] ?? 999) - (orderMap[b] ?? 999));
                    saveState();
                    refreshInspectorSlidePreview();
                });
            });

            txtFurther?.addEventListener('input', (e) => {
                item.data.furtherDigraphs = e.target.value;
                saveState();
                refreshInspectorSlidePreview();
            });

            chkShuffle?.addEventListener('change', (e) => {
                item.data.shuffle = e.target.checked;
                saveState();
                refreshInspectorSlidePreview();
            });
        }

        // Say the Sound (sectB) slider listener
        if (item.defKey === 'sectB') {
            const { fullPool } = getPhonicsPoolInfo(globalSettings.phonicsLevel);
            const poolSize = fullPool.length > 0 ? fullPool.length : 1;
            const slider = content.querySelector('#sectb-slider');
            const badge = content.querySelector('#sectb-count-badge');
            const desc = content.querySelector('#sectb-status-desc');
            if (slider && badge) {
                slider.addEventListener('input', (e) => {
                    const val = parseInt(e.target.value);
                    if (val === poolSize) {
                        badge.textContent = 'All';
                        item.data.limit = 'all';
                        if (desc) desc.textContent = 'One slide for each sound';
                    } else if (val < poolSize) {
                        badge.textContent = val.toString();
                        item.data.limit = val;
                        if (desc) desc.textContent = 'Fewer slides - some sounds excluded';
                    } else {
                        badge.textContent = val.toString();
                        item.data.limit = val;
                        if (desc) desc.textContent = 'More slides - some sounds repeated';
                    }
                    saveState();
                });
            }
        }

        // Customisable listeners
        if (item.defKey === 'customisable') {
            const tagInput = document.getElementById('cust-template-tag');
            tagInput?.addEventListener('input', (e) => {
                item.data.templateTag = e.target.value;
                saveState();
                refreshInspectorSlidePreview();
            });

            const btnAdd = document.getElementById('btn-cust-add-content');
            btnAdd?.addEventListener('click', () => {
                if (!Array.isArray(item.data.contents)) item.data.contents = [];
                item.data.contents.push({ tag: '', value: '' });
                saveState();
                renderInspector();
            });

            const contentsList = document.getElementById('cust-contents-list');
            contentsList?.addEventListener('click', (e) => {
                const btnRemove = e.target.closest('.btn-remove-cust-content');
                if (btnRemove) {
                    const idx = parseInt(btnRemove.dataset.index);
                    if (!isNaN(idx) && Array.isArray(item.data.contents)) {
                        item.data.contents.splice(idx, 1);
                        saveState();
                        renderInspector();
                    }
                }
            });

            contentsList?.addEventListener('input', (e) => {
                const input = e.target.closest('.cust-content-field');
                if (input) {
                    const idx = parseInt(input.dataset.index);
                    const field = input.dataset.field;
                    if (!isNaN(idx) && field && item.data.contents[idx]) {
                        item.data.contents[idx][field] = input.value;
                        saveState();
                        refreshInspectorSlidePreview();
                    }
                }
            });
        }

        // Sentence types input listeners
        if (item.defKey === 'sectSentenceTypes') {
            content.querySelectorAll('.st-daily-sent').forEach(input => {
                input.addEventListener('input', (e) => {
                    const d = e.target.dataset.day;
                    const fld = e.target.dataset.field;
                    if (!item.data[d]) item.data[d] = {};
                    item.data[d][fld] = e.target.value;
                    saveState();
                    refreshInspectorSlidePreview();
                });
            });
        }

        // Simple Compound fields listeners
        if (item.defKey === 'sectSimpleCompound') {
            const handleFieldUpdate = (e) => {
                const d = e.target.dataset.day;
                const idx = parseInt(e.target.dataset.index) || 0;
                const fld = e.target.dataset.field;
                if (!item.data[d]) item.data[d] = {};
                if (!Array.isArray(item.data[d].sentences)) {
                    item.data[d].sentences = [{ sent: item.data[d].sent || '', answer: item.data[d].answer || 'simple' }];
                }
                if (!item.data[d].sentences[idx]) {
                    item.data[d].sentences[idx] = { sent: '', answer: 'simple' };
                }
                item.data[d].sentences[idx][fld] = e.target.value;
                saveState();
                refreshInspectorSlidePreview();
            };

            content.querySelectorAll('.sc-sent-field').forEach(input => {
                input.addEventListener('input', handleFieldUpdate);
                input.addEventListener('change', handleFieldUpdate);
            });

            content.querySelectorAll('.btn-sc-add-sentence').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const d = btn.dataset.day;
                    if (!item.data[d]) item.data[d] = {};
                    if (!Array.isArray(item.data[d].sentences)) {
                        item.data[d].sentences = [{ sent: item.data[d].sent || '', answer: item.data[d].answer || 'simple' }];
                    }
                    item.data[d].sentences.push({ sent: '', answer: 'simple' });
                    saveState();
                    renderInspector();
                    refreshInspectorSlidePreview();
                });
            });

            content.querySelectorAll('.btn-sc-remove-sent').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const d = btn.dataset.day;
                    const idx = parseInt(btn.dataset.index);
                    if (item.data[d] && Array.isArray(item.data[d].sentences)) {
                        item.data[d].sentences.splice(idx, 1);
                        if (item.data[d].sentences.length === 0) {
                            item.data[d].sentences.push({ sent: '', answer: 'simple' });
                        }
                        saveState();
                        renderInspector();
                        refreshInspectorSlidePreview();
                    }
                });
            });
        }

        updatePreviewSubDots(item, item.data);
    }
}
