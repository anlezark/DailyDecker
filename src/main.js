// Main Application Entry Point
import { SECTION_DEFS } from './data/sections.js';
import { STARTER_DEFS } from './data/starters.js';
import { APPS_SCRIPT_URL, DEFAULT_TEMPLATE_ID } from './data/constants.js';
import { 
    globalSettings, 
    timelineItems, 
    setTimelineItems, 
    selectedItemId, 
    setSelectedItemId, 
    saveState, 
    loadState 
} from './state/state.js';
import { 
    showToast, 
    extractPresentationId, 
    checkGoogleSlidesAccess 
} from './utils/helpers.js';
import { 
    renderTimeline, 
    selectItem, 
    addTimelineItem 
} from './ui/timeline.js';
import { 
    renderInspector, 
    syncTemplateSelects, 
    handleTemplateSelection,
    openCustomTemplateModal,
    closeCustomTemplateModal 
} from './ui/inspector.js';
import { buildPresentationRecipe } from './export/recipe.js';

let pendingStarterKey = null;
let currentRecipe = null;

let createdDeckUrl = null;
let createdCopyUrl = null;
let createdPptxUrl = null;

const ASSEMBLE_PROGRESS_STEPS = [
    { title: "Duplicating deck", desc: "Cloning slide templates in your Google Drive..." },
    { title: "Making Monday", desc: "Building Monday's phonics & activity cards..." },
    { title: "Tackling Tuesday", desc: "Generating Tuesday's review sequence..." },
    { title: "Working on Wednesday", desc: "Setting up Wednesday's interactive tasks..." },
    { title: "Thrashing out Thursday", desc: "Configuring Thursday's exercises & routines..." },
    { title: "Finalising Friday", desc: "Formatting Friday's review and summary slides..." },
    { title: "Putting on finishing touches", desc: "Finalizing slide notes and generating links..." }
];

let assembleProgressTimer = null;
let assembleCurrentStep = 0;

function startAssembleLoading() {
    stopAssembleLoading();
    assembleCurrentStep = 0;
    const loadingContainer = document.getElementById('assemble-loading-container');
    const footerControls = document.getElementById('modal-footer-controls');
    const jsonToggleBtn = document.getElementById('btn-toggle-json');
    
    if (loadingContainer) loadingContainer.classList.remove('hidden');
    if (footerControls) footerControls.classList.add('hidden');
    if (jsonToggleBtn) jsonToggleBtn.classList.add('pointer-events-none', 'opacity-50');

    updateAssembleProgressUI(assembleCurrentStep);

    assembleProgressTimer = setInterval(() => {
        assembleCurrentStep++;
        if (assembleCurrentStep < ASSEMBLE_PROGRESS_STEPS.length) {
            updateAssembleProgressUI(assembleCurrentStep);
        } else {
            updateAssembleProgressUI(ASSEMBLE_PROGRESS_STEPS.length - 1);
        }
    }, 3000);
}

function updateAssembleProgressUI(stepIndex) {
    const step = ASSEMBLE_PROGRESS_STEPS[stepIndex] || ASSEMBLE_PROGRESS_STEPS[0];
    const titleEl = document.getElementById('assemble-loading-title');
    const descEl = document.getElementById('assemble-loading-desc');
    const dots = document.querySelectorAll('.loading-dot');

    if (titleEl) {
        titleEl.style.opacity = '0';
        setTimeout(() => {
            titleEl.textContent = step.title;
            titleEl.style.opacity = '1';
        }, 120);
    }

    if (descEl) {
        descEl.style.opacity = '0';
        setTimeout(() => {
            descEl.textContent = step.desc;
            descEl.style.opacity = '1';
        }, 120);
    }

    dots.forEach((dot, idx) => {
        if (idx < stepIndex) {
            dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 transition-all duration-300 loading-dot';
        } else if (idx === stepIndex) {
            dot.className = 'w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-100 transition-all duration-300 loading-dot';
        } else {
            dot.className = 'w-2.5 h-2.5 rounded-full bg-slate-200 transition-all duration-300 loading-dot';
        }
    });
}

function stopAssembleLoading() {
    if (assembleProgressTimer) {
        clearInterval(assembleProgressTimer);
        assembleProgressTimer = null;
    }
    const loadingContainer = document.getElementById('assemble-loading-container');
    const footerControls = document.getElementById('modal-footer-controls');
    const jsonToggleBtn = document.getElementById('btn-toggle-json');
    
    if (loadingContainer) loadingContainer.classList.add('hidden');
    if (footerControls) footerControls.classList.remove('hidden');
    if (jsonToggleBtn) jsonToggleBtn.classList.remove('pointer-events-none', 'opacity-50');
}

function resetModalState() {
    stopAssembleLoading();
    createdDeckUrl = null;
    createdCopyUrl = null;
    createdPptxUrl = null;
    const btn = document.getElementById('btn-send-api');
    const successActions = document.getElementById('deck-success-actions');
    const status = document.getElementById('api-status');
    const deckNameEl = document.getElementById('modal-deck-name');
    const subtitleEl = document.getElementById('modal-deck-subtitle');
    const pptxContainer = document.getElementById('pptx-download-container');
    const pptxCheckboxContainer = document.getElementById('pptx-checkbox-container');
    const jsonContainer = document.getElementById('json-container');
    const toggleLabel = document.getElementById('json-toggle-label');
    const toggleIcon = document.getElementById('json-toggle-icon');

    if (deckNameEl) {
        deckNameEl.textContent = globalSettings.deckName || "Daily Review";
    }

    if (subtitleEl) {
        subtitleEl.innerHTML = `Your deck <strong class="font-bold text-slate-900">${globalSettings.deckName || "Daily Review"}</strong> is ready for assembly. <i class="fa-solid fa-circle-check text-emerald-500 ml-0.5"></i>`;
    }

    if (status) {
        status.textContent = "";
        status.className = "text-sm font-semibold text-slate-500 hidden";
    }

    if (successActions) {
        successActions.classList.add('hidden');
    }

    if (pptxContainer) {
        pptxContainer.classList.add('hidden');
    }

    if (pptxCheckboxContainer) {
        pptxCheckboxContainer.classList.remove('hidden');
    }

    if (jsonContainer) {
        jsonContainer.classList.add('hidden');
    }

    if (toggleLabel) {
        toggleLabel.textContent = "Show JSON recipe";
    }

    if (toggleIcon) {
        toggleIcon.className = "fa-solid fa-chevron-right text-[10px] text-slate-400 ml-0.5 transition-transform";
    }

    const modalTemplateContainer = document.getElementById('modal-template-container');
    const modalTemplateSelect = document.getElementById('modal-template-select');

    if (modalTemplateContainer) {
        modalTemplateContainer.classList.remove('hidden');
    }

    syncTemplateSelects();

    if (btn) {
        btn.classList.remove('hidden');
        btn.disabled = false;
        btn.className = "bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg text-sm shrink-0 cursor-pointer";
        btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Send to Google Slides`;
    }
}

function generateAndShowAssemblyModal() {
    resetModalState();
    const chkPptx = document.getElementById('chk-export-pptx');
    const includePptx = chkPptx ? chkPptx.checked : false;
    currentRecipe = buildPresentationRecipe(globalSettings, timelineItems, includePptx);
    window.currentRecipe = currentRecipe;

    const modal = document.getElementById('json-modal');
    const content = document.getElementById('json-modal-content');
    const output = document.getElementById('json-output');
    
    if (output) {
        output.textContent = JSON.stringify(currentRecipe, null, 4);
    }
    
    if (modal && content) {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95', 'opacity-0');
        }, 10);
    }
}

function closeJsonModal() {
    stopAssembleLoading();
    const modal = document.getElementById('json-modal');
    const content = document.getElementById('json-modal-content');
    if (!modal || !content) return;
    
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

export function loadDeckStarter(starterKey) {
    const starter = STARTER_DEFS[starterKey];
    if (!starter) return;

    if (starter.isDummy) {
        showToast(`The "${starter.title}" Deck Starter is coming soon!`, 'fa-clock text-amber-400');
        return;
    }

    if (timelineItems.length > 0) {
        pendingStarterKey = starterKey;
        const modal = document.getElementById('starter-modal');
        const content = document.getElementById('starter-modal-content');
        const titleEl = document.getElementById('starter-modal-title');
        const bodyEl = document.getElementById('starter-modal-body');
        if (titleEl) titleEl.textContent = `Load "${starter.title}" Deck Starter?`;
        if (bodyEl) bodyEl.textContent = `Loading the "${starter.title}" Deck Starter will replace all sections currently in your deck sequence. Do you want to proceed?`;
        
        if (modal && content) {
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                content.classList.remove('scale-95');
            }, 10);
        }
    } else {
        executeLoadDeckStarter(starterKey);
    }
}
window.loadDeckStarter = loadDeckStarter;

export function closeStarterModal() {
    const modal = document.getElementById('starter-modal');
    const content = document.getElementById('starter-modal-content');
    if (!modal || !content) return;
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
        pendingStarterKey = null;
    }, 200);
}

export function executeLoadDeckStarter(starterKey) {
    const starter = STARTER_DEFS[starterKey];
    if (!starter || starter.isDummy) return;

    setTimelineItems([]);
    starter.sections.forEach(k => {
        if (SECTION_DEFS[k]) {
            addTimelineItem(k, -1, true);
        }
    });

    selectItem(null);
    renderTimeline();
    saveState();
    showToast(`Loaded "${starter.title}" Deck Starter!`, 'fa-circle-check text-emerald-400');
}

export function openAboutModal() {
    const modal = document.getElementById('about-modal');
    const content = document.getElementById('about-modal-content');
    if (!modal || !content) return;
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95', 'opacity-0');
    }, 10);
}

export function closeAboutModal() {
    const modal = document.getElementById('about-modal');
    const content = document.getElementById('about-modal-content');
    if (!modal || !content) return;
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

export function openPrivacyModal() {
    const modal = document.getElementById('privacy-modal');
    const content = document.getElementById('privacy-modal-content');
    if (!modal || !content) return;
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95', 'opacity-0');
    }, 10);
}

export function closePrivacyModal() {
    const modal = document.getElementById('privacy-modal');
    const content = document.getElementById('privacy-modal-content');
    if (!modal || !content) return;
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

export function openDriveFolder(e) {
    if (globalSettings.folderId) {
        window.open(`https://drive.google.com/drive/folders/${globalSettings.folderId}`, '_blank');
    } else {
        const btn = e.currentTarget;
        if (!btn) return;
        const originalHtml = btn.innerHTML;
        const originalClasses = btn.className;
        btn.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Missing Folder ID`;
        btn.classList.add('text-rose-600', 'bg-rose-50', 'border-rose-200');
        btn.classList.remove('text-blue-700', 'text-blue-600');
        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.className = originalClasses;
        }, 3000);
    }
}

export function init() {
    // Setup Accordion for Library Parts
    document.querySelectorAll('.library-part-header').forEach(header => {
        header.addEventListener('click', () => {
            const part = header.closest('.library-part');
            if (!part) return;
            const content = part.querySelector('.library-part-content');
            const chevron = header.querySelector('.part-chevron');
            const isOpen = content && !content.classList.contains('hidden');

            // Close all parts
            document.querySelectorAll('.library-part-content').forEach(c => c.classList.add('hidden'));
            document.querySelectorAll('.part-chevron').forEach(ch => ch.classList.remove('rotate-180'));

            // Toggle clicked part if it was closed
            if (!isOpen && content) {
                content.classList.remove('hidden');
                if (chevron) chevron.classList.add('rotate-180');
            }
        });
    });

    // Populate Library - Part 1: Deck Starters
    const startersList = document.getElementById('part-starters-content');
    if (startersList) {
        startersList.innerHTML = '';
        Object.keys(STARTER_DEFS).forEach(key => {
            const starter = STARTER_DEFS[key];
            const el = document.createElement('div');
            el.className = `p-3 bg-white border border-slate-200 rounded-xl cursor-grab hover:${starter.hoverBorder} hover:shadow-2xs transition-all flex items-center gap-3 group`;
            el.dataset.key = key;
            el.onclick = () => selectItem(key, true);
            el.innerHTML = `
                <div class="w-8 h-8 rounded-lg ${starter.bg} ${starter.color} flex items-center justify-center shrink-0 font-bold text-sm">
                    <i class="fa-solid ${starter.icon}"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="font-semibold text-slate-700 text-sm group-hover:${starter.color} transition-colors truncate">${starter.title}</div>
                    <div class="text-[10px] text-slate-400 truncate">${starter.shortDesc}</div>
                </div>
                <span class="text-[9px] font-bold uppercase tracking-wider ${starter.badgeClass} px-1.5 py-0.5 rounded border shrink-0">${starter.badge}</span>
                <i class="fa-solid fa-grip-vertical ml-auto text-slate-300 shrink-0 pl-1"></i>
            `;
            startersList.appendChild(el);
        });

        const startersCountEl = document.getElementById('starters-count');
        if (startersCountEl) startersCountEl.textContent = Object.keys(STARTER_DEFS).length;

        if (window.Sortable) {
            new window.Sortable(startersList, {
                group: { name: 'shared', pull: 'clone', put: false },
                animation: 150,
                sort: false,
                ghostClass: 'drag-ghost'
            });
        }
    }

    // Populate Library - Part 2: All Sections
    const allSectionsList = document.getElementById('all-sections-list');
    const sectionKeys = Object.keys(SECTION_DEFS);
    const countEl = document.getElementById('all-sections-count');
    if (countEl) countEl.textContent = sectionKeys.length;

    if (allSectionsList) {
        allSectionsList.innerHTML = '';
        sectionKeys.forEach(key => {
            const def = SECTION_DEFS[key];
            const el = document.createElement('div');
            el.className = 'p-3 bg-white border border-slate-200 rounded-xl cursor-grab hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-3 group';
            el.dataset.key = key;
            el.onclick = () => selectItem(key, true);
            el.innerHTML = `
                <div class="w-8 h-8 rounded-lg ${def.bg} ${def.color} flex items-center justify-center shrink-0">
                    <i class="fa-solid ${def.icon}"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="font-semibold text-slate-700 text-sm group-hover:text-blue-600 transition-colors truncate">${def.title}</div>
                    <div class="text-[10px] text-slate-400 truncate">${def.shortDesc}</div>
                </div>
                <i class="fa-solid fa-grip-vertical ml-auto text-slate-300 shrink-0 pl-2"></i>
            `;
            allSectionsList.appendChild(el);
        });

        if (window.Sortable) {
            new window.Sortable(allSectionsList, {
                group: { name: 'shared', pull: 'clone', put: false },
                animation: 150,
                sort: false,
                ghostClass: 'drag-ghost'
            });
        }
    }

    // Preload Timeline OR Load State
    if (!loadState()) {
        setTimelineItems([]);
    }
    const deckNameEl = document.getElementById('timeline-filename');
    if (deckNameEl) deckNameEl.textContent = globalSettings.deckName;
    renderTimeline();
    
    // Default to having nothing selected so Global Settings are shown on first load
    selectItem(null);

    const timelineListEl = document.getElementById('timeline-list');
    if (timelineListEl && window.Sortable) {
        new window.Sortable(timelineListEl, {
            group: 'shared',
            animation: 150,
            draggable: '.timeline-item',
            ghostClass: 'drag-ghost',
            chosenClass: 'drag-chosen',
            onAdd: function (evt) {
                const key = evt.item.dataset.key;
                evt.item.remove(); // Remove the DOM element clone
                if (key && STARTER_DEFS[key]) {
                    loadDeckStarter(key);
                } else if (key && SECTION_DEFS[key]) {
                    addTimelineItem(key, evt.newIndex);
                }
            },
            onUpdate: function (evt) {
                const item = timelineItems.splice(evt.oldIndex, 1)[0];
                timelineItems.splice(evt.newIndex, 0, item);
                saveState();
            }
        });
    }

    document.getElementById('timeline-container')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('timeline-container') || e.target === document.getElementById('timeline-list')) {
            selectItem(null);
        }
    });

    document.getElementById('timeline-header')?.addEventListener('click', () => {
        selectItem(null);
    });

    document.getElementById('btn-reset')?.addEventListener('click', (e) => {
        e.stopPropagation(); 
        setTimelineItems([]);
        selectItem(null);
        saveState();
    });

    // Assemble and Privacy Buttons
    document.getElementById('btn-assemble')?.addEventListener('click', openPrivacyModal);
    document.getElementById('btn-privacy-back')?.addEventListener('click', closePrivacyModal);
    document.getElementById('btn-privacy-agree')?.addEventListener('click', () => {
        closePrivacyModal();
        setTimeout(() => {
            generateAndShowAssemblyModal();
        }, 200);
    });

    document.getElementById('btn-open-folder-header')?.addEventListener('click', openDriveFolder);

    // Starters modal buttons
    document.getElementById('btn-starter-cancel')?.addEventListener('click', closeStarterModal);
    document.getElementById('btn-starter-confirm')?.addEventListener('click', () => {
        if (pendingStarterKey) {
            const keyToLoad = pendingStarterKey;
            closeStarterModal();
            executeLoadDeckStarter(keyToLoad);
        }
    });

    // Custom Template modal buttons
    document.getElementById('btn-close-custom-template')?.addEventListener('click', closeCustomTemplateModal);
    document.getElementById('btn-cancel-custom-template')?.addEventListener('click', closeCustomTemplateModal);
    document.getElementById('btn-save-custom-template')?.addEventListener('click', async () => {
        const linkInput = document.getElementById('txt-custom-template-link');
        const nameInput = document.getElementById('txt-custom-template-name');
        const btnSave = document.getElementById('btn-save-custom-template');
        const feedbackEl = document.getElementById('custom-template-feedback');
        const rawLink = linkInput ? linkInput.value.trim() : '';
        const templateId = extractPresentationId(rawLink);

        if (!templateId) {
            showToast('Please enter a valid Google Slides link or ID', 'fa-triangle-exclamation text-amber-400');
            if (linkInput) linkInput.focus();
            return;
        }

        if (feedbackEl) {
            feedbackEl.classList.add('hidden');
            feedbackEl.innerHTML = '';
        }

        const originalBtnHtml = btnSave ? btnSave.innerHTML : '<i class="fa-solid fa-check"></i> Add Template';
        if (btnSave) {
            btnSave.disabled = true;
            btnSave.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Checking access...';
        }

        const templateName = (nameInput && nameInput.value.trim()) || `Custom (${templateId.substring(0, 6)}...)`;
        const isAccessible = await checkGoogleSlidesAccess(templateId);

        if (btnSave) {
            btnSave.disabled = false;
            btnSave.innerHTML = originalBtnHtml;
        }

        if (isAccessible) {
            if (!Array.isArray(globalSettings.customTemplates)) {
                globalSettings.customTemplates = [];
            }
            const existing = globalSettings.customTemplates.find(t => t.id === templateId);
            if (existing) {
                existing.name = templateName;
            } else {
                globalSettings.customTemplates.push({ id: templateId, name: templateName });
            }
            globalSettings.templateId = templateId;
            globalSettings.templateName = templateName;
            globalSettings.templateOptionKey = templateId;
            saveState();
            closeCustomTemplateModal();
            renderInspector();
            showToast(`Template "${templateName}" added successfully`, 'fa-circle-check text-emerald-400');
        } else {
            if (feedbackEl) {
                feedbackEl.className = 'p-3.5 bg-pink-50 border border-pink-200 text-pink-900 rounded-xl text-xs flex items-start gap-2.5 shadow-2xs';
                feedbackEl.innerHTML = `
                    <i class="fa-solid fa-circle-exclamation text-pink-500 text-sm mt-0.5 shrink-0"></i>
                    <div>
                        <p class="font-bold text-pink-900 mb-0.5">Daily Deck could not access your template</p>
                        <p class="text-pink-700 leading-relaxed">Make sure the link is copied from Google Slides and permissions are set to <strong>Anyone with the link</strong> and <strong>Viewer</strong>.</p>
                    </div>
                `;
                feedbackEl.classList.remove('hidden');
            }
            showToast('Daily Deck could not access your template - make sure the link is copied from Google Slides and permissions are set to Anyone with the link and Viewer.', 'fa-circle-exclamation text-pink-400');
        }
    });

    // About modal buttons
    document.getElementById('btn-about')?.addEventListener('click', openAboutModal);
    document.getElementById('btn-close-about')?.addEventListener('click', closeAboutModal);
    document.getElementById('btn-close-about-x')?.addEventListener('click', closeAboutModal);
    document.getElementById('about-modal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('about-modal')) closeAboutModal();
    });

    // Assembly / JSON modal handlers
    document.getElementById('btn-close-modal')?.addEventListener('click', closeJsonModal);

    document.getElementById('modal-template-select')?.addEventListener('change', (e) => {
        handleTemplateSelection(e.target.value);
    });

    document.getElementById('btn-toggle-json')?.addEventListener('click', () => {
        const jsonContainer = document.getElementById('json-container');
        const toggleLabel = document.getElementById('json-toggle-label');
        const toggleIcon = document.getElementById('json-toggle-icon');
        if (!jsonContainer) return;

        const isHidden = jsonContainer.classList.contains('hidden');
        if (isHidden) {
            jsonContainer.classList.remove('hidden');
            if (toggleLabel) toggleLabel.textContent = "Hide JSON recipe";
            if (toggleIcon) toggleIcon.className = "fa-solid fa-chevron-down text-[10px] text-slate-400 ml-0.5 transition-transform";
        } else {
            jsonContainer.classList.add('hidden');
            if (toggleLabel) toggleLabel.textContent = "Show JSON recipe";
            if (toggleIcon) toggleIcon.className = "fa-solid fa-chevron-right text-[10px] text-slate-400 ml-0.5 transition-transform";
        }
    });

    document.getElementById('chk-export-pptx')?.addEventListener('change', (e) => {
        if (currentRecipe) {
            currentRecipe.exportPptx = e.target.checked;
            const output = document.getElementById('json-output');
            if (output) {
                output.textContent = JSON.stringify(currentRecipe, null, 4);
            }
        }
    });

    document.getElementById('btn-download-pptx')?.addEventListener('click', () => {
        if (createdPptxUrl) {
            window.open(createdPptxUrl, '_blank');
        }
    });

    // Send API Trigger
    document.getElementById('btn-send-api')?.addEventListener('click', async () => {
        if (!currentRecipe) return;

        const btn = document.getElementById('btn-send-api');
        const successActions = document.getElementById('deck-success-actions');
        const status = document.getElementById('api-status');
        
        btn.disabled = true;
        status.classList.add('hidden');
        
        startAssembleLoading();

        try {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8",
                },
                body: JSON.stringify(currentRecipe),
            });

            const result = await response.json();

            stopAssembleLoading();

            if (result.status === "success") {
                createdDeckUrl = result.url;
                createdCopyUrl = result.copyUrl || (result.id ? `https://docs.google.com/presentation/d/${result.id}/copy` : (result.url ? result.url.replace(/\/edit.*$/, '/copy') : null));
                
                status.innerHTML = `<span class="inline-flex items-center gap-1.5 text-emerald-600 font-bold"><i class="fa-solid fa-circle-check text-emerald-500"></i> Deck assembled successfully!</span>`;
                status.className = "text-sm font-bold text-emerald-600 leading-tight";
                status.classList.remove('hidden');

                const subtitleEl = document.getElementById('modal-deck-subtitle');
                if (subtitleEl) {
                    subtitleEl.innerHTML = `Your deck <strong class="font-bold text-slate-900">${globalSettings.deckName || "Daily Review"}</strong> is assembled and ready in your Google Drive! <i class="fa-solid fa-circle-check text-emerald-500 ml-0.5"></i>`;
                }
                
                btn.classList.add('hidden');
                const modalTemplateContainer = document.getElementById('modal-template-container');
                if (modalTemplateContainer) {
                    modalTemplateContainer.classList.add('hidden');
                }
                const pptxCheckboxContainer = document.getElementById('pptx-checkbox-container');
                if (pptxCheckboxContainer) {
                    pptxCheckboxContainer.classList.add('hidden');
                }

                if (successActions) {
                    successActions.classList.remove('hidden');
                }

                if (result.pptxUrl || result.pptxId) {
                    createdPptxUrl = result.pptxId 
                        ? `https://drive.google.com/uc?export=download&id=${result.pptxId}` 
                        : result.pptxUrl;
                    const pptxContainer = document.getElementById('pptx-download-container');
                    if (pptxContainer) {
                        pptxContainer.classList.remove('hidden');
                    }
                }
            } else {
                throw new Error(result.message || "Unknown error occurred.");
            }
        } catch (error) {
            stopAssembleLoading();
            console.error("API Error:", error);
            status.textContent = "Error: " + (error.message || "Assembly failed. Check permissions.");
            status.className = "text-sm font-bold text-rose-500";
            status.classList.remove('hidden');
            btn.disabled = false;
            btn.classList.remove('hidden');
            btn.className = "bg-blue-600 hover:bg-blue-700 text-white px-7 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg text-sm shrink-0 cursor-pointer";
            btn.innerHTML = `<i class="fa-solid fa-rotate-right"></i> Try Again`;
        }
    });

    document.getElementById('btn-copy-drive')?.addEventListener('click', () => {
        if (createdCopyUrl) {
            window.open(createdCopyUrl, '_blank');
        } else if (createdDeckUrl) {
            window.open(createdDeckUrl.replace(/\/edit.*$/, '/copy'), '_blank');
        }
    });

    document.getElementById('btn-open-shared-deck')?.addEventListener('click', () => {
        if (createdDeckUrl) {
            window.open(createdDeckUrl, '_blank');
        }
    });
}

// Auto initialize on DOMContentLoaded or immediate if already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
