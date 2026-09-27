// State management and local storage persistence
import { DEFAULT_TEMPLATE_ID, NUMERACY_DEFAULT_TEMPLATE_ID, NUMERACY_DEFAULT_TEMPLATE_LABEL, STATE_KEY, NUMERACY_STATE_KEY, SOUNDS_WRITE_LEVELS } from '../data/constants.js';

export let currentWorkspace = 'literacy'; // 'literacy' | 'numeracy'

export const defaultLiteracySettings = {
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

export const defaultNumeracySettings = {
    deckName: "Term 1, Week 1 Numeracy Review",
    preparedBy: "",
    phonicsLevel: "",
    yearLevel: "Kindergarten",
    term: 1,
    week: 1,
    activeDays: { 'Monday': true, 'Tuesday': true, 'Wednesday': true, 'Thursday': true, 'Friday': true },
    templateId: NUMERACY_DEFAULT_TEMPLATE_ID,
    templateName: NUMERACY_DEFAULT_TEMPLATE_LABEL,
    templateOptionKey: "__numeracy_default__",
    customTemplates: [],
    folderId: "1wbKRkTXB6M6szi-yeCYiU1kyKJgTfIdK"
};

export let globalSettings = { ...defaultLiteracySettings };

export let timelineItems = [];
export let selectedItemId = null;
export let selectedLibraryKey = null;

export function setCurrentWorkspace(ws) {
    currentWorkspace = ws;
    localStorage.setItem('reviewBuilder_activeWorkspace', ws);
}

export function setSelectedItemId(id) {
    selectedItemId = id;
}

export function setSelectedLibraryKey(key) {
    selectedLibraryKey = key;
}

export function setTimelineItems(items) {
    timelineItems = items;
}

export function getSharedCustomTemplates() {
    try {
        const saved = localStorage.getItem('reviewBuilder_shared_custom_templates');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) {
        console.warn("Could not load shared templates:", e);
    }
    return [];
}

export function saveSharedCustomTemplates(templates) {
    try {
        localStorage.setItem('reviewBuilder_shared_custom_templates', JSON.stringify(templates || []));
    } catch (e) {
        console.warn("Could not save shared templates:", e);
    }
}

export function saveState() {
    // Keep customTemplates shared across workspaces
    if (Array.isArray(globalSettings.customTemplates)) {
        saveSharedCustomTemplates(globalSettings.customTemplates);
    }
    const state = {
        settings: globalSettings,
        timeline: timelineItems
    };
    const key = currentWorkspace === 'numeracy' ? NUMERACY_STATE_KEY : STATE_KEY;
    localStorage.setItem(key, JSON.stringify(state));
    localStorage.setItem('reviewBuilder_activeWorkspace', currentWorkspace);
}

export function loadState() {
    try {
        const savedWs = localStorage.getItem('reviewBuilder_activeWorkspace');
        if (savedWs === 'numeracy') {
            currentWorkspace = 'numeracy';
        } else {
            currentWorkspace = 'literacy';
        }

        const key = currentWorkspace === 'numeracy' ? NUMERACY_STATE_KEY : STATE_KEY;
        const defaultSettings = currentWorkspace === 'numeracy' ? defaultNumeracySettings : defaultLiteracySettings;
        
        // Load shared templates
        const sharedTemplates = getSharedCustomTemplates();

        const saved = localStorage.getItem(key);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.settings) {
                globalSettings = { ...defaultSettings, ...parsed.settings };
                if (currentWorkspace === 'literacy') {
                    if (!globalSettings.templateId) globalSettings.templateId = DEFAULT_TEMPLATE_ID;
                    if (!globalSettings.templateOptionKey) globalSettings.templateOptionKey = globalSettings.templateId;
                    if (globalSettings.phonicsLevel === "IC11 (sh, ch, tch, th, ck, wh, ng, qu)" || (SOUNDS_WRITE_LEVELS && !SOUNDS_WRITE_LEVELS.includes(globalSettings.phonicsLevel))) {
                        globalSettings.phonicsLevel = "IC11 - qu";
                    }
                } else {
                    if (!globalSettings.templateId || globalSettings.templateId === "" || globalSettings.templateOptionKey === "__numeracy_default__") {
                        globalSettings.templateId = NUMERACY_DEFAULT_TEMPLATE_ID;
                    }
                    if (!globalSettings.templateOptionKey) globalSettings.templateOptionKey = "__numeracy_default__";
                    if (!globalSettings.templateName) globalSettings.templateName = NUMERACY_DEFAULT_TEMPLATE_LABEL;
                }
                
                // Merge custom templates: use shared custom templates list or fallback to saved
                if (sharedTemplates.length > 0) {
                    globalSettings.customTemplates = sharedTemplates;
                } else if (Array.isArray(globalSettings.customTemplates) && globalSettings.customTemplates.length > 0) {
                    saveSharedCustomTemplates(globalSettings.customTemplates);
                } else {
                    globalSettings.customTemplates = [];
                }
            } else {
                globalSettings = { ...defaultSettings, customTemplates: sharedTemplates };
            }
            if (parsed.timeline) {
                timelineItems = parsed.timeline.map(item => {
                    if (currentWorkspace === 'numeracy' && item.defKey === 'generic') {
                        item.defKey = 'numeracyPlaceholder';
                    }
                    if (item.customTitle === 'Generic Section') {
                        item.customTitle = 'Placeholder';
                    }
                    if (item.data?.titleSettings?.title === 'Generic Section') {
                        item.data.titleSettings.title = 'Placeholder';
                    }
                    return item;
                });
            } else {
                timelineItems = [];
            }
            return true;
        } else {
            globalSettings = { ...defaultSettings, customTemplates: sharedTemplates };
            timelineItems = [];
            return true;
        }
    } catch (e) {
        console.warn("Could not load state:", e);
    }
    return false;
}

