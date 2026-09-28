// Deck Sequencer and Timeline management
import { SECTION_DEFS } from '../data/sections.js';
import { STARTER_DEFS } from '../data/starters.js';
import { DAYS, COMMON_DIGRAPHS } from '../data/constants.js';
import { getPhonicsPoolInfo } from '../data/phonics.js';
import { 
    globalSettings,
    timelineItems, 
    setTimelineItems, 
    selectedItemId, 
    setSelectedItemId, 
    selectedLibraryKey, 
    setSelectedLibraryKey, 
    currentWorkspace,
    saveState 
} from '../state/state.js';
import { getLimitedDaysBadge } from '../utils/helpers.js';
import { renderInspector, updateLibrarySelection } from './inspector.js';

export function selectItem(id, isLibrary = false) {
    if (isLibrary) {
        setSelectedLibraryKey(id);
        setSelectedItemId(null);
    } else {
        setSelectedItemId(id);
        setSelectedLibraryKey(null);
    }
    renderTimeline();
    updateLibrarySelection();
    renderInspector();
}

export function deleteTimelineItem(id) {
    setTimelineItems(timelineItems.filter(i => i.id !== id));
    if (selectedItemId === id) {
        selectItem(null);
    } else {
        renderTimeline();
    }
    saveState();
}

export function addTimelineItem(defKey, index = -1, skipSelectAndRender = false) {
    const def = SECTION_DEFS[defKey];
    if (!def) return null;

    const newItem = {
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
        defKey: defKey,
        data: {},
        includedDays: { 'Monday': true, 'Tuesday': true, 'Wednesday': true, 'Thursday': true, 'Friday': true }
    };

    if (defKey === 'customisable') {
        newItem.data.templateTag = '';
        newItem.data.contents = [];
    }

    if (defKey === 'sectDigraphs') {
        const { fullPool } = getPhonicsPoolInfo(globalSettings.phonicsLevel);
        const defaultSelected = COMMON_DIGRAPHS
            .filter(d => fullPool.includes(d.id))
            .map(d => d.id);
        newItem.data.selectedDigraphs = defaultSelected;
        newItem.data.furtherDigraphs = '';
        newItem.data.shuffle = false;
    }

    if (defKey === 'reciteRecallApplyLisc') {
        newItem.data.includeRRA = true;
        newItem.data.includeLISC = true;
    }

    if (defKey === 'sectHundredsChart') {
        newItem.data.chartSize = '1–100';
        newItem.data.multiplesOf = '6';
        newItem.data.rangeMin = 6;
        newItem.data.rangeMax = 96;
        newItem.data.progression = 'single';
        newItem.data.instructions = 'Skip count by 6s.';
    }

    if (defKey === 'sectNumberMAB') {
        newItem.data.maxPlaceValue = 2;
        newItem.data.slidesPerDay = 6;
        newItem.data.easyMode = false;
        newItem.data.instructions = 'What is the number?';
    }

    if (def.hasTitleSlideOptions) {
        let defaultTitle = def.title.includes(': ') ? def.title.split(': ')[1] : def.title;
        let defaultInstructions = '';
        if (defKey === 'sectH') defaultTitle = 'Vocabulary'; 
        if (defKey === 'sectJ') defaultTitle = 'Finish the sentence';
        if (defKey === 'sectHundredsChart') {
            defaultTitle = 'Multiples';
            defaultInstructions = 'We are learning to skip count';
        }
        const defaultInclude = defKey !== 'sectSimpleCompound' && defKey !== 'sectSentenceTypes';
        
        newItem.data.titleSettings = {
            include: defaultInclude,
            title: defaultTitle,
            instructions: defaultInstructions
        };
    }

    const getDefaultValue = (f) => {
        if (f.default !== undefined) return f.default;
        if (f.type === 'select' && f.options && f.options.length > 0) return f.options[0];
        if (f.type === 'checkbox') return false;
        return ''; 
    };

    if (def.type === 'weekly') {
        if (def.fields) {
            def.fields.forEach(f => { newItem.data[f.id] = getDefaultValue(f); });
        }
    } else if (def.type === 'daily') {
        DAYS.forEach(day => {
            if (!newItem.data[day]) newItem.data[day] = {};
            if (def.fields) {
                def.fields.forEach(f => { newItem.data[day][f.id] = getDefaultValue(f); });
            }
        });
    } else if (def.type === 'mixed') {
        if (def.weeklyFields) {
            def.weeklyFields.forEach(f => { newItem.data[f.id] = getDefaultValue(f); });
        }
        if (def.dailyFields) {
            DAYS.forEach(day => {
                if (!newItem.data[day]) newItem.data[day] = {};
                def.dailyFields.forEach(f => { newItem.data[day][f.id] = getDefaultValue(f); });
            });
        }
    }

    if (def.type === 'daily' || def.type === 'mixed') {
        DAYS.forEach(day => { 
            if (!newItem.data[day]) newItem.data[day] = {}; 
            
            if (defKey === 'sectF') {
                const dayDefaults = {
                    'Monday': 'Pen/Pan',
                    'Tuesday': 'Pat/Pet',
                    'Wednesday': 'Marry/Merry',
                    'Thursday': 'Axe/Ex',
                    'Friday': 'Al/L'
                };
                newItem.data[day]['pair'] = dayDefaults[day] || 'Pen/Pan';
            }

            if (defKey === 'sectSimpleCompound') {
                newItem.data[day]['sentences'] = [
                    { sent: day === 'Monday' ? 'The dog played in the mud.' : '', answer: 'simple' }
                ];
            }

            if (defKey === 'sectSentenceTypes') {
                const defaultExamples = {
                    'Monday': { sent1: 'Put your pencil on your desk.', sent2: 'The pencil is on the desk.' },
                    'Tuesday': { sent1: 'Listen carefully to the instructions.', sent2: 'We listened to the instructions.' },
                    'Wednesday': { sent1: 'Open your book to page ten.', sent2: 'She opened her book.' },
                    'Thursday': { sent1: 'Line up quietly at the door.', sent2: 'The students lined up quietly.' },
                    'Friday': { sent1: 'Raise your hand before speaking.', sent2: 'He raised his hand.' }
                };
                newItem.data[day]['sent1'] = defaultExamples[day]?.sent1 || 'Put your pencil on your desk.';
                newItem.data[day]['sent2'] = defaultExamples[day]?.sent2 || 'The pencil is on the desk.';
            }
        });
    }

    if (index === -1) {
        timelineItems.push(newItem);
    } else {
        timelineItems.splice(index, 0, newItem);
    }

    if (!skipSelectAndRender) {
        renderTimeline();
        selectItem(newItem.id);
        saveState();
    }
    return newItem;
}

export function renderTimeline() {
    const list = document.getElementById('timeline-list');
    if (!list) return;
    list.innerHTML = '';

    if (timelineItems.length === 0) {
        const isNumeracy = currentWorkspace === 'numeracy';
        const emptyEl = document.createElement('div');
        emptyEl.className = 'empty-state-placeholder pointer-events-none select-none flex flex-col items-center justify-center text-center p-8 my-auto min-h-[360px] border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/70 shadow-2xs transition-all';
        emptyEl.innerHTML = `
            <div class="w-14 h-14 rounded-2xl ${isNumeracy ? 'bg-amber-50 border border-amber-100 text-amber-600' : 'bg-blue-50 border border-blue-100 text-blue-600'} flex items-center justify-center text-2xl mb-4 shadow-2xs">
                <i class="fa-solid ${isNumeracy ? 'fa-calculator' : 'fa-layer-group'}"></i>
            </div>
            <h3 class="text-base sm:text-lg font-bold text-slate-800 mb-3">${isNumeracy ? 'Your Numeracy Deck is empty.' : "Your Deck is empty. Let's built it."}</h3>
            <div class="text-xs sm:text-sm text-slate-600 space-y-2.5 max-w-md leading-relaxed">
                ${isNumeracy ? `
                <div class="flex items-center justify-start text-left gap-2.5 bg-amber-50/90 border border-amber-200/80 px-4 py-2.5 rounded-xl text-amber-900 shadow-2xs">
                    <i class="fa-solid fa-arrow-left text-amber-500 shrink-0 text-sm"></i>
                    <span>Add activities from the <strong>Library</strong> on the left.</span>
                </div>
                ` : `
                <div class="flex items-center justify-start text-left gap-2.5 bg-amber-50/90 border border-amber-200/80 px-4 py-2.5 rounded-xl text-amber-900 shadow-2xs">
                    <i class="fa-solid fa-arrow-left text-amber-500 shrink-0 text-sm"></i>
                    <span>Add a <strong>Deck Starter</strong> from the menu on the left, or add individual activities.</span>
                </div>
                `}
                <div class="flex items-center justify-start text-left gap-2.5 bg-blue-50/90 border border-blue-200/80 px-4 py-2.5 rounded-xl text-blue-900 shadow-2xs">
                    <i class="fa-solid fa-arrow-right text-blue-500 shrink-0 text-sm"></i>
                    <span>Edit your <strong>Global settings</strong> on the right.</span>
                </div>
            </div>
        `;
        list.appendChild(emptyEl);
        return;
    }

    const isNumeracy = currentWorkspace === 'numeracy';
    const selectedRing = isNumeracy ? 'border-amber-500 shadow-md ring-2 ring-amber-100' : 'border-blue-500 shadow-md ring-2 ring-blue-100';
    const hoverBorder = isNumeracy ? 'hover:border-amber-300' : 'hover:border-blue-300';

    timelineItems.forEach(item => {
        const def = SECTION_DEFS[item.defKey];
        if (!def) return;
        const el = document.createElement('div');
        const isSelected = item.id === selectedItemId;
        const dayBadge = getLimitedDaysBadge(item);
        const badgeHtml = dayBadge ? `<span class="text-[10px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300/80 px-1.5 py-0.5 rounded leading-none shadow-2xs font-mono tracking-tight" title="Active on: ${dayBadge}">${dayBadge}</span>` : '';
        
        el.className = `timeline-item p-3 bg-white border ${isSelected ? selectedRing : 'border-slate-200'} rounded-xl cursor-pointer ${hoverBorder} transition-all flex items-center gap-3`;
        el.onclick = (e) => { e.stopPropagation(); selectItem(item.id); };

        el.innerHTML = `
            <div class="cursor-grab text-slate-300 hover:text-slate-500 py-2"><i class="fa-solid fa-grip-vertical"></i></div>
            <div class="w-10 h-10 rounded-lg ${def.bg} ${def.color} flex items-center justify-center shrink-0">
                <i class="fa-solid ${def.icon} text-lg"></i>
            </div>
            <div class="flex-1 min-w-0">
                <div class="font-bold text-slate-700 truncate">${item.customTitle || def.title}</div>
                <div class="text-xs text-slate-400 truncate">${def.shortDesc}</div>
            </div>
            <div class="flex flex-col items-end ${dayBadge ? 'justify-between' : 'justify-center'} shrink-0 self-stretch py-0.5">
                ${badgeHtml}
                <button class="text-slate-300 hover:text-red-500 p-1.5 transition-colors btn-delete-timeline-item" data-id="${item.id}" title="Delete section">
                    <i class="fa-solid fa-trash text-sm"></i>
                </button>
            </div>
        `;

        const delBtn = el.querySelector('.btn-delete-timeline-item');
        if (delBtn) {
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTimelineItem(item.id);
            });
        }

        list.appendChild(el);
    });
}
