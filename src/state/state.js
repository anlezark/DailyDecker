// State management and local storage persistence
import { DEFAULT_TEMPLATE_ID, STATE_KEY, SOUNDS_WRITE_LEVELS } from '../data/constants.js';

export let globalSettings = {
    deckName: "Term 1, Week 1 Review",
    preparedBy: "",
    phonicsLevel: "IC11 - qu",
    yearLevel: "Kindergarten",
    term: 1,
    week: 1,
    activeDays: { 'Monday': true, 'Tuesday': true, 'Wednesday': true, 'Thursday': true, 'Friday': true },
    templateId: DEFAULT_TEMPLATE_ID,
    templateName: "Default Template",
    templateOptionKey: DEFAULT_TEMPLATE_ID,
    customTemplates: [],
    folderId: "1wbKRkTXB6M6szi-yeCYiU1kyKJgTfIdK"
};

export let timelineItems = [];
export let selectedItemId = null;
export let selectedLibraryKey = null;

export function setSelectedItemId(id) {
    selectedItemId = id;
}

export function setSelectedLibraryKey(key) {
    selectedLibraryKey = key;
}

export function setTimelineItems(items) {
    timelineItems = items;
}

export function saveState() {
    const state = {
        settings: globalSettings,
        timeline: timelineItems
    };
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

export function loadState() {
    try {
        const saved = localStorage.getItem(STATE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.settings) {
                globalSettings = { ...globalSettings, ...parsed.settings };
                if (!globalSettings.templateId) globalSettings.templateId = DEFAULT_TEMPLATE_ID;
                if (!globalSettings.templateOptionKey) globalSettings.templateOptionKey = globalSettings.templateId;
                if (!Array.isArray(globalSettings.customTemplates)) globalSettings.customTemplates = [];
                if (globalSettings.phonicsLevel === "IC11 (sh, ch, tch, th, ck, wh, ng, qu)" || (SOUNDS_WRITE_LEVELS && !SOUNDS_WRITE_LEVELS.includes(globalSettings.phonicsLevel))) {
                    globalSettings.phonicsLevel = "IC11 - qu";
                }
            }
            if (parsed.timeline) timelineItems = parsed.timeline;
            return true;
        }
    } catch (e) {
        console.warn("Could not load state:", e);
    }
    return false;
}
