// Slide Preview Renderer for DailyDeck (v1.75 Minimalist Slide Preview)
import { SECTION_DEFS } from '../data/sections.js';
import { DAYS, SENTENCE_TYPE_DEFINITIONS, SOUNDS_WRITE_LEVELS } from '../data/constants.js';
import { getPhonicsPoolInfo } from '../data/phonics.js';
import { buildPyramid } from '../export/recipe.js';
import { parseWordWithPhonemes, formatPhonemeSymbols, randomizeCasing, getHundredsChartInstruction, getHundredsChartHighlightedNumbers, getHundredsChartMax, getHundredsChartMultiplesList, getHundredsChartDefaultRange, parseMabNumbersList, decomposeMabNumber } from '../utils/helpers.js';
import { currentWorkspace } from '../state/state.js';

let currentPreviewDay = 'Monday';
let currentSlideSubIndex = 0;

export function setPreviewDay(day) {
    if (DAYS.includes(day)) {
        currentPreviewDay = day;
    }
}

export function getPreviewDay() {
    return currentPreviewDay;
}

export function setPreviewSubIndex(idx) {
    currentSlideSubIndex = idx;
}

export function getPreviewSubIndex() {
    return currentSlideSubIndex;
}

/**
 * Returns available preview sub-slides for a section (for pagination dots)
 */
export function getPreviewSlideCount(itemOrDefKey, timelineItemData = null) {
    let defKey = typeof itemOrDefKey === 'string' ? itemOrDefKey : itemOrDefKey.defKey;
    const data = timelineItemData || (typeof itemOrDefKey === 'object' && itemOrDefKey.data ? itemOrDefKey.data : {});
    
    if (defKey === 'reciteRecallApplyLisc') {
        const incRRA = (data.includeRRA !== undefined ? data.includeRRA : (data.weekly?.includeRRA !== undefined ? data.weekly.includeRRA : true)) !== false;
        const incLISC = (data.includeLISC !== undefined ? data.includeLISC : (data.weekly?.includeLISC !== undefined ? data.weekly.includeLISC : true)) !== false;
        const slides = [];
        if (incRRA) slides.push('rra');
        if (incLISC) slides.push('lisc');
        return slides;
    }

    if (defKey === 'sectShortVowelBB') {
        const useIntro = (data.useIntro !== undefined ? data.useIntro : (data.weekly?.useIntro !== undefined ? data.weekly.useIntro : true)) !== false;
        const slides = [];
        if (useIntro) slides.push('intro');
        slides.push('activity');
        return slides;
    }

    if (defKey === 'sectReadWordWriteWord') {
        return ['read', 'write'];
    }

    if (defKey === 'sectSimpleCompound') {
        const incInst = (data.includeInstructions !== undefined ? data.includeInstructions : (data.weekly?.includeInstructions !== undefined ? data.weekly.includeInstructions : true)) !== false;
        if (incInst) {
            return ['review1', 'review2', 'sentence'];
        }
        return ['sentence'];
    }

    if (defKey === 'sectSentenceTypes') {
        return ['st_def', 'st_stim'];
    }

    if (defKey === 'sectSimpleSentences') {
        return ['ss_def', 'ss_stim'];
    }

    if (defKey === 'sectCompoundSentences') {
        return ['cs_def', 'cs_stim'];
    }

    if (defKey === 'sectNumberMAB') {
        const day = currentPreviewDay || 'Monday';
        const dayData = (data && data[day]) || (data && data.Monday) || {};
        const parsed = parseMabNumbersList(dayData.numbers);
        if (parsed.length > 1) {
            return parsed.map(n => `Number: ${n}`);
        }
        return [];
    }

    return [];
}

/**
 * Render the slide preview HTML inside a 16:9 aspect ratio frame
 */
export function generateSlidePreviewHtml(itemOrDefKey, isLibrary = false, globalSettings = {}, timelineItemData = null, activeDays = null, subIndexOverride = null) {
    let defKey = typeof itemOrDefKey === 'string' ? itemOrDefKey : itemOrDefKey.defKey;
    const def = SECTION_DEFS[defKey];
    if (!def) return '';

    const data = timelineItemData || (typeof itemOrDefKey === 'object' && itemOrDefKey.data ? itemOrDefKey.data : {});
    const customTitle = (typeof itemOrDefKey === 'object' && itemOrDefKey.customTitle) ? itemOrDefKey.customTitle : def.title;

    const phonicsPool = getPhonicsPoolInfo(globalSettings.phonicsLevel || 'Set 1 - s, a, t, p');
    const day = currentPreviewDay || 'Monday';
    const dayData = (data && data[day]) || {};
    const subIdx = subIndexOverride !== null ? subIndexOverride : currentSlideSubIndex;

    // Render Section-specific content slide preview
    switch (defKey) {
        case 'mainIntro':
            return renderMainIntroPreview(globalSettings);
        case 'expectations':
            return renderExpectationsPreview(data);
        case 'reciteRecallApplyLisc':
            return renderRraLiscPreview(data, subIdx);
        case 'dayDivider':
            return renderDayDividerPreview(day, false);
        case 'dayDividerPlain':
            return renderDayDividerPreview(day, true);
        case 'sectA':
            return renderSectAPreview(dayData, customTitle);
        case 'sectB':
            return renderSectBPreview(phonicsPool, globalSettings, data);
        case 'sectC':
            return renderSectCPreview(phonicsPool);
        case 'sectDigraphs':
            return renderSectDigraphsPreview(data);
        case 'sectShortVowelBB':
            return renderSectShortVowelBBPreview(phonicsPool, data, globalSettings, subIdx);
        case 'sectBlendingBoard':
            return renderSectBlendingBoardPreview(phonicsPool, data, dayData, day, globalSettings);
        case 'sectD':
            return renderSectDPreview(data, dayData, day);
        case 'sectHFW':
            return renderSectHFWPreview(data, dayData, day);
        case 'sectE':
            return renderSectEPreview(dayData);
        case 'sectReadWordWriteWord':
            return renderSectReadWordWriteWordPreview(data, dayData, day, subIdx);
        case 'sectF':
            return renderSectFPreview(dayData, day);
        case 'sectG':
            return renderSectGPreview(dayData, day);
        case 'sectH':
            return renderSectHPreview(dayData);
        case 'sectI':
            return renderSectIPreview(dayData);
        case 'sectJ':
            return renderSectJPreview(dayData);
        case 'sectK':
            return renderSectKPreview(dayData, customTitle);
        case 'sectSimpleCompound':
            return renderSectSimpleCompoundPreview(dayData, data, day, subIdx);
        case 'sectSentenceTypes':
            return renderSectSentenceTypesPreview(data, dayData, day, subIdx);
        case 'sectSimpleSentences':
            return renderSectSimpleSentencesPreview(data, dayData, day, subIdx);
        case 'sectCompoundSentences':
            return renderSectCompoundSentencesPreview(data, dayData, day, subIdx);
        case 'sectWriteSimpleCompoundSentence':
            return renderSectWriteSimpleCompoundSentencePreview();
        case 'generic':
        case 'placeholder':
        case 'numeracyPlaceholder':
            return renderGenericPreview(dayData, customTitle, data, day);
        case 'sectHundredsChart':
            return renderHundredsChartPreview(data, customTitle);
        case 'sectNumberMAB':
            return renderNumberMABPreview(data, dayData, day, subIdx, customTitle);
        case 'customisable':
            return renderCustomisablePreview(data, customTitle);
        case 'finished':
            return renderFinishedPreview(day);
        default:
            return `
                <div class="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                    <i class="fa-solid ${def.icon} text-3xl mb-1.5 text-slate-300"></i>
                    <div class="text-sm font-bold text-slate-600">${customTitle}</div>
                </div>
            `;
    }
}

// -------------------------------------------------------------
// Individual Slide Preview Builders (Clean v1.75 Slide Canvas)
// -------------------------------------------------------------

function renderMainIntroPreview(globalSettings) {
    const yearLevel = globalSettings.yearLevel || 'Kindergarten';
    const term = globalSettings.term || 1;
    const week = globalSettings.week || 1;
    const isNumeracy = currentWorkspace === 'numeracy';
    const reviewTitle = isNumeracy ? 'Numeracy Daily Review' : 'Literacy Daily Review';

    return `
        <div class="w-full h-full flex items-center justify-between p-3 select-none bg-white relative overflow-hidden">
            <!-- Center Main Content -->
            <div class="flex-1 flex flex-col items-center justify-center text-center pr-2">
                <div class="text-2xl font-bold text-slate-900 edu-font tracking-wide mb-1.5 leading-tight">${yearLevel}</div>
                <div class="text-[11px] font-medium text-slate-700 edu-font leading-snug">${reviewTitle}</div>
                <div class="text-[11px] font-medium text-slate-700 edu-font leading-snug">Term ${term} Week ${week}</div>
            </div>

            <!-- Right Column Badges: Recite, Recall, Apply -->
            <div class="flex flex-col items-center justify-center gap-1.5 shrink-0 pl-1 pr-2">
                <!-- Recite -->
                <div class="flex flex-col items-center">
                    <div class="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-amber-950 shadow-2xs border border-amber-500/20">
                        <i class="fa-solid fa-users text-[9px]"></i>
                    </div>
                    <span class="text-[6px] font-bold text-amber-900 edu-font mt-0.5">Recite</span>
                </div>

                <!-- Recall -->
                <div class="flex flex-col items-center">
                    <div class="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-2xs border border-orange-600/20">
                        <i class="fa-solid fa-lightbulb text-[9px]"></i>
                    </div>
                    <span class="text-[6px] font-bold text-orange-950 edu-font mt-0.5">Recall</span>
                </div>

                <!-- Apply -->
                <div class="flex flex-col items-center">
                    <div class="w-6 h-6 rounded-full bg-blue-400 flex items-center justify-center text-blue-950 shadow-2xs border border-blue-500/20">
                        <i class="fa-solid fa-pen-to-square text-[9px]"></i>
                    </div>
                    <span class="text-[6px] font-bold text-blue-950 edu-font mt-0.5">Apply</span>
                </div>
            </div>
        </div>
    `;
}

function renderExpectationsPreview(data) {
    const style = data.weekly?.style || data.style || 'Whiteboards';
    const hasWb = style.includes('Whiteboard');
    const hasMusic = style.includes('Music');

    return `
        <div class="w-full h-full flex flex-col justify-center items-center p-3 select-none bg-white relative overflow-hidden text-center">
            ${hasMusic ? `
                <div class="absolute top-2 right-2.5 w-4 h-4 rounded-full bg-slate-800 text-white flex items-center justify-center text-[7px] shadow-2xs">
                    <i class="fa-solid fa-play ml-0.5"></i>
                </div>
            ` : ''}

            ${hasWb ? `
                <!-- Top Section: You will need -->
                <div class="w-full flex flex-col items-center mb-2">
                    <div class="text-[13px] font-semibold text-slate-800 edu-font leading-none mb-1.5">You will need:</div>
                    <div class="flex items-center justify-center gap-4">
                        <!-- Whiteboard -->
                        <div class="w-9 h-6 rounded-xs border-2 border-slate-900 bg-white shadow-2xs"></div>
                        <!-- Marker -->
                        <div class="flex items-center -rotate-12">
                            <div class="w-1 h-0.5 bg-slate-900 rounded-l-xs"></div>
                            <div class="w-2 h-2.5 bg-slate-900 rounded-xs"></div>
                            <div class="w-6 h-2.5 bg-white border-y border-r border-slate-400 rounded-r-xs flex items-center justify-center text-[4px] text-slate-400 font-mono">marker</div>
                        </div>
                        <!-- Eraser cloth -->
                        <div class="w-5.5 h-5.5 bg-blue-600 rounded-xs shadow-2xs rotate-6 border border-blue-700 relative overflow-hidden">
                            <div class="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-400 rounded-bl-xs"></div>
                        </div>
                    </div>
                </div>
            ` : ''}

            <!-- Bottom Section: I am looking for -->
            <div class="w-full flex flex-col items-center">
                <div class="text-[13px] font-semibold text-slate-800 edu-font leading-none mb-1.5">I am looking for:</div>
                <div class="flex items-center justify-center gap-2.5">
                    <!-- Eyes (Looking) -->
                    <div class="w-7 h-4 bg-amber-50 border border-amber-300 rounded-full flex items-center justify-center gap-1 shadow-2xs">
                        <div class="w-1.5 h-1.5 bg-emerald-600 rounded-full flex items-center justify-center"><div class="w-0.5 h-0.5 bg-black rounded-full"></div></div>
                        <div class="w-1.5 h-1.5 bg-emerald-600 rounded-full flex items-center justify-center"><div class="w-0.5 h-0.5 bg-black rounded-full"></div></div>
                    </div>
                    <!-- Ear (Listening) -->
                    <div class="w-4.5 h-5 bg-amber-50 border border-amber-300 rounded-t-full rounded-b-md flex items-center justify-center text-amber-800 text-[9px] shadow-2xs">
                        <i class="fa-solid fa-ear-listen"></i>
                    </div>
                    <!-- Mouth (Quiet / Choral) -->
                    <div class="w-6 h-3.5 bg-amber-50 border border-amber-300 rounded-full flex items-center justify-center shadow-2xs">
                        <div class="w-3.5 h-0.5 bg-rose-400 rounded-full"></div>
                    </div>
                    <!-- Hands in Lap / Sitting -->
                    <div class="w-5 h-5 bg-amber-50 border border-amber-300 rounded-md flex items-center justify-center text-blue-800 text-[9px] shadow-2xs">
                        <i class="fa-solid fa-child-reaching"></i>
                    </div>
                    <!-- Group of students -->
                    <div class="flex items-center -space-x-1">
                        <div class="w-3.5 h-4.5 rounded-t-xs bg-blue-100 border border-blue-300 flex items-center justify-center text-[6px] text-blue-800"><i class="fa-solid fa-child"></i></div>
                        <div class="w-3.5 h-4.5 rounded-t-xs bg-amber-100 border border-amber-300 flex items-center justify-center text-[6px] text-amber-800"><i class="fa-solid fa-child"></i></div>
                        <div class="w-3.5 h-4.5 rounded-t-xs bg-blue-100 border border-blue-300 flex items-center justify-center text-[6px] text-blue-800"><i class="fa-solid fa-child"></i></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderRraLiscPreview(data, subIndex = 0) {
    const incRRA = (data.includeRRA !== undefined ? data.includeRRA : (data.weekly?.includeRRA !== undefined ? data.weekly.includeRRA : true)) !== false;
    const incLISC = (data.includeLISC !== undefined ? data.includeLISC : (data.weekly?.includeLISC !== undefined ? data.weekly.includeLISC : true)) !== false;

    const availableSlides = [];
    if (incRRA) availableSlides.push('rra');
    if (incLISC) availableSlides.push('lisc');

    if (availableSlides.length === 0) {
        return `
            <div class="w-full h-full flex flex-col items-center justify-center p-4 text-center select-none bg-slate-50 text-slate-400">
                <i class="fa-solid fa-eye-slash text-xl mb-1.5 opacity-50"></i>
                <div class="text-xs font-semibold">No slides selected</div>
                <div class="text-[10px]">Enable Recite, Recall, Apply or LISC below</div>
            </div>
        `;
    }

    const currentSlide = availableSlides[Math.min(subIndex, availableSlides.length - 1)] || availableSlides[0];

    if (currentSlide === 'rra') {
        return `
            <div class="w-full h-full flex flex-col justify-center px-4 py-3 select-none bg-white relative overflow-hidden">
                <!-- Heading -->
                <div class="text-base font-bold text-slate-900 edu-font mb-2 tracking-wide leading-tight">
                    Recite, recall, apply
                </div>

                <!-- Three items -->
                <div class="space-y-1.5 w-full">
                    <!-- Recite -->
                    <div class="flex items-center gap-2.5">
                        <div class="w-5.5 h-5.5 rounded-full bg-amber-400 flex flex-col items-center justify-center text-amber-950 shadow-2xs border border-amber-500/20 shrink-0">
                            <i class="fa-solid fa-users text-[7.5px] leading-none"></i>
                            <span class="text-[4px] font-extrabold uppercase leading-none mt-0.5">Recite</span>
                        </div>
                        <div class="text-[11px] text-slate-800 edu-font font-medium leading-none">
                            When we recite, we learn.
                        </div>
                    </div>

                    <!-- Recall -->
                    <div class="flex items-center gap-2.5">
                        <div class="w-5.5 h-5.5 rounded-full bg-orange-500 flex flex-col items-center justify-center text-white shadow-2xs border border-orange-600/20 shrink-0">
                            <i class="fa-solid fa-lightbulb text-[7.5px] leading-none"></i>
                            <span class="text-[4px] font-extrabold uppercase leading-none mt-0.5">Recall</span>
                        </div>
                        <div class="text-[11px] text-slate-800 edu-font font-medium leading-none">
                            When we recall, we remember.
                        </div>
                    </div>

                    <!-- Apply -->
                    <div class="flex items-center gap-2.5">
                        <div class="w-5.5 h-5.5 rounded-full bg-blue-400 flex flex-col items-center justify-center text-blue-950 shadow-2xs border border-blue-500/20 shrink-0">
                            <i class="fa-solid fa-pen-to-square text-[7.5px] leading-none"></i>
                            <span class="text-[4px] font-extrabold uppercase leading-none mt-0.5">Apply</span>
                        </div>
                        <div class="text-[11px] text-slate-800 edu-font font-medium leading-tight">
                            When we apply, we use the information that we have learnt.
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // LISC slide
    return `
        <div class="w-full h-full flex flex-col justify-center px-4 py-2.5 select-none bg-white relative overflow-hidden gap-2">
            <!-- Learning Intention Block -->
            <div class="w-full bg-blue-100/70 border border-blue-200/80 rounded-xs px-2.5 py-1.5 text-left">
                <div class="text-[10px] text-slate-800 edu-font font-medium leading-snug">
                    We are learning to move our learning into our long-term memory.
                </div>
            </div>

            <!-- Success Criteria Block -->
            <div class="w-full bg-blue-100/70 border border-blue-200/80 rounded-xs px-2.5 py-1.5 text-left">
                <div class="text-[10px] text-slate-800 edu-font font-medium leading-snug mb-0.5">
                    To be successful we need to have:
                </div>
                <div class="text-[9.5px] text-slate-800 edu-font font-medium leading-tight space-y-0.5 pl-3">
                    <div>- Quick thinking</div>
                    <div>- Snappy board work</div>
                    <div>- One voice</div>
                </div>
            </div>
        </div>
    `;
}

function renderDayDividerPreview(day, isPlain) {
    const daysList = [
        { name: 'Monday', bg: 'bg-amber-300 text-amber-950' },
        { name: 'Tuesday', bg: 'bg-purple-300 text-purple-950' },
        { name: 'Wednesday', bg: 'bg-sky-300 text-sky-950' },
        { name: 'Thursday', bg: 'bg-pink-300 text-pink-950' },
        { name: 'Friday', bg: 'bg-orange-400 text-orange-950' },
        { name: 'Saturday', bg: 'bg-rose-400 text-rose-950' },
        { name: 'Sunday', bg: 'bg-slate-200 text-slate-700' }
    ];

    if (isPlain) {
        return `
            <div class="w-full h-full flex flex-col items-center justify-center select-none bg-white relative overflow-hidden">
                <div class="w-full bg-yellow-100/90 py-3 flex items-center justify-center shadow-2xs">
                    <span class="text-3xl text-slate-900 edu-font font-bold tracking-wide">${day}</span>
                </div>
            </div>
        `;
    }

    return `
        <div class="w-full h-full flex flex-col items-center justify-between p-3 select-none bg-white relative overflow-hidden">
            <!-- Top Days Bar -->
            <div class="w-full max-w-[90%] flex items-center border border-slate-400/80 rounded-xs overflow-visible mt-1 shadow-2xs">
                ${daysList.map(d => {
                    const isSelected = d.name.toLowerCase() === day.toLowerCase();
                    return `
                        <div class="flex-1 h-7 flex items-center justify-center text-[7px] font-medium edu-font ${d.bg} border-r border-slate-400/60 last:border-r-0 relative ${isSelected ? 'z-10 ring-2 ring-black scale-105 shadow-xs font-bold' : 'opacity-85'}">
                            ${d.name}
                        </div>
                    `;
                }).join('')}
            </div>

            <!-- Center Today is Day message -->
            <div class="flex-1 flex items-center justify-center">
                <div class="text-2xl text-slate-900 edu-font font-bold tracking-wide">
                    Today is ${day}.
                </div>
            </div>
        </div>
    `;
}

function renderSectAPreview() {
    return `
        <div class="w-full h-full flex items-center justify-center p-3 select-none bg-white">
            <div class="w-[85%] h-[80%] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-300 bg-slate-50/50 shadow-2xs">
                <i class="fa-solid fa-image text-3xl"></i>
            </div>
        </div>
    `;
}

function renderSectBPreview(phonicsPool, globalSettings, data) {
    const sampleSound = (phonicsPool.currentLevelGraphemes && phonicsPool.currentLevelGraphemes[0]) || (phonicsPool.fullPool && phonicsPool.fullPool[0]) || 'a';
    return `
        <div class="w-full h-full flex items-center justify-center select-none bg-white">
            <span class="text-6xl text-slate-800 edu-font font-medium">${sampleSound}</span>
        </div>
    `;
}

function renderSectCPreview(phonicsPool) {
    const fullPool = (phonicsPool && phonicsPool.fullPool && phonicsPool.fullPool.length > 0) 
        ? phonicsPool.fullPool 
        : ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd'];
    
    const standardVowels = ['a', 'e', 'i', 'o', 'u'];
    let poolVowels = fullPool.filter(g => standardVowels.includes(g));
    let poolConsonants = fullPool.filter(g => !standardVowels.includes(g));
    
    if (poolVowels.length === 0) poolVowels = standardVowels;
    if (poolConsonants.length === 0) poolConsonants = ['b', 'c', 'd', 'f', 'g', 'm', 's', 't'];

    const shuffle = (array) => {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };

    const generateLine = () => {
        let line = [];
        for (let i = 0; i < 3; i++) line.push(poolVowels[Math.floor(Math.random() * poolVowels.length)]);
        for (let i = 0; i < 4; i++) line.push(poolConsonants[Math.floor(Math.random() * poolConsonants.length)]);
        return shuffle(line).map(randomizeCasing).join('  ');
    };

    const line1 = generateLine();
    const line2 = generateLine();

    return `
        <div class="w-full h-full flex flex-col items-center justify-center p-4 select-none bg-white space-y-3 text-center">
            <div class="text-xl font-medium text-slate-800 edu-font tracking-wide">${line1}</div>
            <div class="text-xl font-medium text-slate-800 edu-font tracking-wide">${line2}</div>
        </div>
    `;
}

function renderSectDigraphsPreview() {
    return `
        <div class="w-full h-full relative flex flex-col items-center justify-center select-none bg-white overflow-hidden p-4">
            <!-- Top Right Recite Icon Badge -->
            <div class="absolute top-2 right-2 w-5.5 h-5.5 rounded-full bg-amber-400 flex flex-col items-center justify-center text-amber-950 shadow-2xs border border-amber-500/20">
                <i class="fa-solid fa-users text-[7px] leading-none"></i>
                <span class="text-[3.5px] font-extrabold uppercase leading-none mt-0.5">Recite</span>
            </div>

            <!-- Centered Text -->
            <div class="flex flex-col items-center text-center space-y-1 z-10 -mt-1">
                <span class="text-4xl text-slate-900 edu-font font-medium tracking-tight">sh</span>
                <span class="text-2xl text-slate-800 edu-font font-normal tracking-wide">shiny shell</span>
            </div>

            <!-- Bottom Right Seashell Illustration -->
            <div class="absolute -bottom-1 right-2 opacity-95 pointer-events-none">
                <svg width="68" height="68" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-sm">
                    <!-- Base shell body -->
                    <path d="M50 92 C25 90 10 65 14 44 C18 24 35 12 50 12 C65 12 82 24 86 44 C90 65 75 90 50 92 Z" fill="url(#shellGrad)" stroke="#4A3B4E" stroke-width="2.5" stroke-linejoin="round"/>
                    <!-- Shell ridges / ribs -->
                    <path d="M50 12 C50 35 50 70 50 92" stroke="#6B5373" stroke-width="1.8" stroke-linecap="round" opacity="0.6"/>
                    <path d="M40 15 C42 38 45 68 50 92" stroke="#6B5373" stroke-width="1.8" stroke-linecap="round" opacity="0.6"/>
                    <path d="M60 15 C58 38 55 68 50 92" stroke="#6B5373" stroke-width="1.8" stroke-linecap="round" opacity="0.6"/>
                    <path d="M28 24 C34 44 41 72 50 92" stroke="#6B5373" stroke-width="1.8" stroke-linecap="round" opacity="0.6"/>
                    <path d="M72 24 C66 44 59 72 50 92" stroke="#6B5373" stroke-width="1.8" stroke-linecap="round" opacity="0.6"/>
                    <path d="M18 42 C28 58 40 78 50 92" stroke="#6B5373" stroke-width="1.8" stroke-linecap="round" opacity="0.6"/>
                    <path d="M82 42 C72 58 60 78 50 92" stroke="#6B5373" stroke-width="1.8" stroke-linecap="round" opacity="0.6"/>
                    <!-- Scalloped Top Edge -->
                    <path d="M14 44 Q20 30 28 24 Q38 16 50 12 Q62 16 72 24 Q80 30 86 44" stroke="#4A3B4E" stroke-width="2" fill="none"/>
                    <!-- Shell base hinge -->
                    <path d="M42 90 C42 96 46 98 50 98 C54 98 58 96 58 90 Z" fill="#D3B8E0" stroke="#4A3B4E" stroke-width="2"/>
                    <defs>
                        <linearGradient id="shellGrad" x1="20" y1="20" x2="80" y2="90" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stop-color="#FCEEF3"/>
                            <stop offset="35%" stop-color="#EED5EA"/>
                            <stop offset="70%" stop-color="#D7C3EE"/>
                            <stop offset="100%" stop-color="#A5C8E8"/>
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        </div>
    `;
}

function getShortVowelConsonants(phonicsPool, globalSettings) {
    const fullPool = (phonicsPool && phonicsPool.fullPool && phonicsPool.fullPool.length > 0)
        ? phonicsPool.fullPool
        : ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o', 'c', 'k', 'e', 'u', 'r', 'h', 'b', 'f', 'l'];

    const COMMON_BLENDS = ['st', 'sp', 'sk', 'sm', 'sn', 'sw', 'sl', 'sc', 'bl', 'cl', 'fl', 'gl', 'pl', 'br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr', 'tw', 'dw'];
    const FINAL_BLENDS = ['ct', 'ft', 'nt', 'st', 'xt', 'lk', 'lp', 'nd', 'mp', 'sk', 'sp', 'ts', 'ps', 'cs'];
    const OFFENSIVE_WORDS = ['fuck', 'fuk', 'fuc', 'fag', 'shit', 'crap', 'wank', 'piss', 'cunt', 'cock', 'dick', 'twat', 'bitch', 'prick', 'slut', 'tit', 'arse', 'ass', 'damn', 'hell', 'cum', 'clit', 'dyke', 'nigg', 'spic', 'chink', 'gook', 'kike', 'paki', 'wop'];

    const formatGrapheme = (g) => {
        if (!g) return '';
        const lower = g.toLowerCase();
        if (COMMON_BLENDS.includes(lower) || FINAL_BLENDS.includes(lower)) {
            return lower.split('').join(' ');
        }
        return g;
    };

    const isShortVowelOffensive = (initGrapheme, finalGrapheme) => {
        const cleanInit = initGrapheme.replace(/\s+/g, '').toLowerCase();
        const cleanFinal = finalGrapheme.replace(/\s+/g, '').toLowerCase();
        const shortVowels = ['a', 'e', 'i', 'o', 'u'];
        return shortVowels.some(v => {
            const fullWord = cleanInit + v + cleanFinal;
            return OFFENSIVE_WORDS.some(bad => fullWord.includes(bad) || (bad.includes(fullWord) && fullWord.length >= 3));
        });
    };

    const currentPhonicsIdx = SOUNDS_WRITE_LEVELS.indexOf(globalSettings?.phonicsLevel);
    const blendsLevelIdx = SOUNDS_WRITE_LEVELS.indexOf("IC8-10 - blends");
    const allowBlends = currentPhonicsIdx >= blendsLevelIdx && blendsLevelIdx !== -1;

    const consonantsInPool = fullPool.filter(g => !['a', 'e', 'i', 'o', 'u'].includes(g.toLowerCase()));

    let initialPool = consonantsInPool.filter(c => !['ff', 'll', 'ss', 'zz', 'ng', 'ck', 'tch'].includes(c.toLowerCase()));
    if (allowBlends) {
        COMMON_BLENDS.forEach(blend => {
            if (fullPool.includes(blend[0]) && fullPool.includes(blend[1]) && !initialPool.includes(blend)) {
                initialPool.push(blend);
            }
        });
    }

    let finalPool = consonantsInPool.filter(c => !['s', 'h', 'r', 'y', 'qu'].includes(c.toLowerCase()) && !COMMON_BLENDS.includes(c.toLowerCase()));
    if (allowBlends) {
        FINAL_BLENDS.forEach(blend => {
            if (fullPool.includes(blend[0]) && fullPool.includes(blend[1]) && !finalPool.includes(blend)) {
                finalPool.push(blend);
            }
        });
    }

    const defaultInitial = ['p', 'b', 't', 'd', 'k', 'g', 'f', 'm', 'n', 'l', 'ph', 'wh', 'sh', 'ch', 'th'];
    const defaultFinal = ['m', 'n', 'p', 't', 'k', 'd', 'g', 'b', 'f', 'l', 'v', 'z'];

    let availInitial = initialPool.length >= 1 ? initialPool : defaultInitial;
    let availFinal = finalPool.length >= 1 ? finalPool : defaultFinal;

    let initGrapheme = availInitial[0] || 'p';
    let finalGrapheme = availFinal[0] || 't';

    let tryCount = 0;
    while (isShortVowelOffensive(initGrapheme, finalGrapheme) && tryCount < 20) {
        tryCount++;
        initGrapheme = availInitial[tryCount % availInitial.length] || 'p';
    }

    return {
        c1: formatGrapheme(initGrapheme),
        c2: formatGrapheme(finalGrapheme)
    };
}

function renderSectShortVowelBBPreview(phonicsPool, data, globalSettings, subIdx = 0) {
    const useIntro = (data.useIntro !== undefined ? data.useIntro : (data.weekly?.useIntro !== undefined ? data.weekly.useIntro : true)) !== false;
    const isIntroSlide = useIntro && subIdx === 0;

    if (isIntroSlide) {
        return `
            <div class="w-full h-full relative flex flex-col items-center justify-between select-none bg-white p-4 overflow-hidden">
                <!-- Top Right Recite Icon Badge -->
                <div class="absolute top-2 right-2 w-5.5 h-5.5 rounded-full bg-amber-400 flex flex-col items-center justify-center text-amber-950 shadow-2xs border border-amber-500/20">
                    <i class="fa-solid fa-users text-[7px] leading-none"></i>
                    <span class="text-[3.5px] font-extrabold uppercase leading-none mt-0.5">Recite</span>
                </div>

                <!-- Slide Title -->
                <div class="w-full text-left pl-2 pt-0.5">
                    <h2 class="text-xl md:text-2xl font-bold text-slate-800 edu-font tracking-tight">Short vowel sounds</h2>
                </div>

                <!-- 5 Vowel Illustrations -->
                <div class="w-full flex items-end justify-center gap-3.5 sm:gap-5 pb-1 px-1">
                    <!-- a: apple -->
                    <div class="flex flex-col items-center gap-0.5">
                        <div class="h-9 flex items-end justify-center">
                            <svg width="30" height="36" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17 9 C15 3 22 2 24 6 C24 9 19 9 17 9 Z" fill="#22C55E"/>
                                <path d="M17 12 Q17 8 18 6" stroke="#78350F" stroke-width="2" stroke-linecap="round"/>
                                <path d="M6 24 C6 16 12 12 20 12 C28 12 28 16 28 22 L28 36 C28 38 29 39 31 39 L31 41 C27 41 24 39 24 36 C22 39 18 41 14 41 C9 41 5 37 5 31 C5 25 10 21 24 21 L24 20 C24 16 21 15 18 15 C13 15 10 17 8 20 L6 24 Z M24 25 C14 25 9 27 9 32 C9 36 12 38 16 38 C21 38 24 34 24 29 L24 25 Z" fill="#E11D48"/>
                                <ellipse cx="16" cy="32" rx="4" ry="4" fill="#FFF1F2"/>
                                <circle cx="15" cy="32" r="0.9" fill="#881337"/>
                                <circle cx="17.5" cy="32" r="0.9" fill="#881337"/>
                            </svg>
                        </div>
                        <span class="text-[9.5px] edu-font text-slate-700 font-medium italic">apple</span>
                    </div>

                    <!-- e: egg -->
                    <div class="flex flex-col items-center gap-0.5">
                        <div class="h-9 flex items-end justify-center">
                            <svg width="30" height="36" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 27 C6 18 12 12 22 12 C30 12 33 18 33 25 C33 26 33 27 32 27 L11 27 C11 34 16 38 23 38 C27 38 30 36 32 33 L34 35 C31 39 27 41 22 41 C12 41 6 35 6 27 Z M22 15 C15 15 12 20 11 24 L30 24 C30 19 27 15 22 15 Z" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1.8"/>
                                <circle cx="21" cy="19.5" r="3.5" fill="#FBBF24"/>
                                <circle cx="20" cy="18.5" r="1" fill="#FEF08A"/>
                            </svg>
                        </div>
                        <span class="text-[9.5px] edu-font text-slate-700 font-medium italic">egg</span>
                    </div>

                    <!-- i: insect -->
                    <div class="flex flex-col items-center gap-0.5">
                        <div class="h-9 flex items-end justify-center">
                            <svg width="30" height="36" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14 6 Q11 2 9 3 M18 6 Q21 2 23 3" stroke="#16A34A" stroke-width="1.5" stroke-linecap="round"/>
                                <circle cx="9" cy="3" r="1" fill="#16A34A"/>
                                <circle cx="23" cy="3" r="1" fill="#16A34A"/>
                                <circle cx="16" cy="10" r="4.5" fill="#22C55E"/>
                                <circle cx="14.5" cy="9.5" r="1.2" fill="#FFFFFF"/>
                                <circle cx="17.5" cy="9.5" r="1.2" fill="#FFFFFF"/>
                                <circle cx="14.5" cy="9.5" r="0.6" fill="#000000"/>
                                <circle cx="17.5" cy="9.5" r="0.6" fill="#000000"/>
                                <rect x="13.5" y="17" width="5" height="23" rx="2.5" fill="#16A34A"/>
                                <line x1="13.5" y1="22" x2="18.5" y2="22" stroke="#15803D" stroke-width="1.5"/>
                                <line x1="13.5" y1="27" x2="18.5" y2="27" stroke="#15803D" stroke-width="1.5"/>
                                <line x1="13.5" y1="32" x2="18.5" y2="32" stroke="#15803D" stroke-width="1.5"/>
                                <line x1="13.5" y1="37" x2="18.5" y2="37" stroke="#15803D" stroke-width="1.5"/>
                                <circle cx="12" cy="24" r="1" fill="#15803D"/>
                                <circle cx="20" cy="24" r="1" fill="#15803D"/>
                                <circle cx="12" cy="30" r="1" fill="#15803D"/>
                                <circle cx="20" cy="30" r="1" fill="#15803D"/>
                                <circle cx="12" cy="36" r="1" fill="#15803D"/>
                                <circle cx="20" cy="36" r="1" fill="#15803D"/>
                            </svg>
                        </div>
                        <span class="text-[9.5px] edu-font text-slate-700 font-medium italic">insect</span>
                    </div>

                    <!-- o: orange -->
                    <div class="flex flex-col items-center gap-0.5">
                        <div class="h-9 flex items-end justify-center">
                            <svg width="30" height="36" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17 12 C18 7 24 7 24 10 C24 13 20 13 17 12 Z" fill="#22C55E"/>
                                <path d="M17 14 Q17 11 18 10" stroke="#78350F" stroke-width="1.5" stroke-linecap="round"/>
                                <ellipse cx="17" cy="27" rx="13" ry="13" fill="#F97316"/>
                                <ellipse cx="17" cy="27" rx="9.5" ry="9.5" fill="#FFEDD5"/>
                                <ellipse cx="17" cy="27" rx="4.5" ry="4.5" fill="#FFFFFF"/>
                                <circle cx="17" cy="27" r="8" stroke="#F97316" stroke-width="2" stroke-dasharray="2.5 2.5" fill="none"/>
                            </svg>
                        </div>
                        <span class="text-[9.5px] edu-font text-slate-700 font-medium italic">orange</span>
                    </div>

                    <!-- u: underwear -->
                    <div class="flex flex-col items-center gap-0.5">
                        <div class="h-9 flex items-end justify-center">
                            <svg width="30" height="36" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7 16 L7 28 C7 36 12 40 17 40 C22 40 27 36 27 28 L27 16 L22 16 L22 27 C22 31 19.5 34 17 34 C14.5 34 12 31 12 27 L12 16 Z" fill="#FB923C"/>
                                <path d="M7 16 L12 16 M22 16 L27 16" stroke="#EA580C" stroke-width="2.5"/>
                                <path d="M12 25 C12 32 22 32 22 25" stroke="#EA580C" stroke-width="1.5" fill="#FDBA74" opacity="0.9"/>
                            </svg>
                        </div>
                        <span class="text-[9.5px] edu-font text-slate-700 font-medium italic">underwear</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Activity Slide: dynamically replaced {{1}} and {{2}}
    const { c1, c2 } = getShortVowelConsonants(phonicsPool, globalSettings);

    return `
        <div class="w-full h-full relative flex items-center justify-center select-none bg-white p-4 overflow-hidden">
            <!-- Top Right Recite Icon Badge -->
            <div class="absolute top-2 right-2 w-5.5 h-5.5 rounded-full bg-amber-400 flex flex-col items-center justify-center text-amber-950 shadow-2xs border border-amber-500/20">
                <i class="fa-solid fa-users text-[7px] leading-none"></i>
                <span class="text-[3.5px] font-extrabold uppercase leading-none mt-0.5">Recite</span>
            </div>

            <!-- Left initial consonant {{1}}, Center Rainbow Vowels, Right final consonant {{2}} -->
            <div class="flex items-center justify-center gap-8 sm:gap-12 w-full max-w-sm">
                <div class="text-3xl sm:text-4xl text-slate-900 font-medium edu-font tracking-wide text-right min-w-[3rem]">
                    ${c1}
                </div>

                <div class="flex flex-col items-center justify-center -space-y-1 select-none">
                    <span class="text-2xl sm:text-3xl font-bold text-red-500 edu-font leading-tight">a</span>
                    <span class="text-2xl sm:text-3xl font-bold text-amber-500 edu-font leading-tight">e</span>
                    <span class="text-2xl sm:text-3xl font-bold text-emerald-600 edu-font leading-tight">i</span>
                    <span class="text-2xl sm:text-3xl font-bold text-orange-500 edu-font leading-tight">o</span>
                    <span class="text-2xl sm:text-3xl font-bold text-blue-500 edu-font leading-tight">u</span>
                </div>

                <div class="text-3xl sm:text-4xl text-slate-900 font-medium edu-font tracking-wide text-left min-w-[3rem]">
                    ${c2}
                </div>
            </div>
        </div>
    `;
}

function renderSectBlendingBoardPreview(phonicsPool, data, dayData, day, globalSettings) {
    const fullPool = (phonicsPool && phonicsPool.fullPool && phonicsPool.fullPool.length > 0)
        ? phonicsPool.fullPool
        : ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o', 'c', 'k', 'e', 'u', 'r', 'h', 'b', 'f', 'l'];

    const allowBlends = data.allowBlends === true || data.allowBlends === 'true' || data.weekly?.allowBlends === true || data.weekly?.allowBlends === 'true';
    const allowSuffixes = data.allowSuffixes === true || data.allowSuffixes === 'true' || data.weekly?.allowSuffixes === true || data.weekly?.allowSuffixes === 'true';

    const COMMON_BLENDS = ['st', 'sp', 'sk', 'sm', 'sn', 'sw', 'sl', 'sc', 'bl', 'cl', 'fl', 'gl', 'pl', 'br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr', 'tw', 'dw'];
    const OFFENSIVE_WORDS = ['fuck', 'fuk', 'fuc', 'fag', 'shit', 'crap', 'wank', 'piss', 'cunt', 'cock', 'dick', 'twat', 'bitch', 'prick', 'slut', 'tit', 'arse', 'ass', 'damn', 'hell', 'cum', 'clit', 'dyke', 'nigg', 'spic', 'chink', 'gook', 'kike', 'paki', 'wop'];

    const formatInitialGrapheme = (g) => {
        if (!g) return '';
        const lower = g.toLowerCase();
        if (COMMON_BLENDS.includes(lower)) {
            return lower.split('').join(' ');
        }
        return g;
    };

    const consonantsInPool = fullPool.filter(g => !['a', 'e', 'i', 'o', 'u'].includes(g.toLowerCase()));
    let initialPool = consonantsInPool.filter(c => !['ff', 'll', 'ss', 'zz', 'ng', 'ck', 'tch'].includes(c.toLowerCase()));
    if (allowBlends) {
        COMMON_BLENDS.forEach(blend => {
            if (fullPool.includes(blend[0]) && fullPool.includes(blend[1]) && !initialPool.includes(blend)) {
                initialPool.push(blend);
            }
        });
    }

    const FINAL_EXCLUDED = ['wh', 'h', 'q', 'r', 'w', 's', 'y', 'qu'];
    let baseFinalPool = consonantsInPool.filter(c => {
        const lower = c.toLowerCase();
        return !FINAL_EXCLUDED.includes(lower) && !COMMON_BLENDS.includes(lower);
    });

    const defaultInitial = ['p', 'b', 't', 'd', 'k', 'g', 'f', 'm', 'n', 'l', 'ph', 'wh', 'sh', 'ch', 'th'];
    const defaultFinal = ['m', 'n', 'p', 't', 'k', 'd', 'g', 'b', 'f', 'l', 'v', 'z'];

    let availInitial = initialPool.length >= 3 ? [...initialPool] : [...defaultInitial];
    
    // User configured or default to 'ai'
    const vowelsStr = dayData.vowels || data.weekly?.vowels || 'ai';
    let dayVowelList = vowelsStr.split(',').map(v => v.trim()).filter(v => v);
    if (dayVowelList.length === 0) dayVowelList = ['ai'];

    let targetVowel = dayVowelList[0] || 'ai';
    const isSplit = targetVowel.includes('_');
    let v1 = targetVowel;
    let v2 = '';
    if (isSplit) {
        const parts = targetVowel.split('_');
        v1 = parts[0] || targetVowel;
        v2 = parts[1] || 'e';
    }

    const hasVowelDigraphs = targetVowel.length > 1 || isSplit;
    let dayFinalPool = baseFinalPool;
    if (hasVowelDigraphs) {
        dayFinalPool = baseFinalPool.filter(c => c.length === 1);
    }
    let availFinal = dayFinalPool.length >= 3 ? [...dayFinalPool] : [...defaultFinal];

    // Pick 3 initial consonants and 3 final consonants
    const c1 = formatInitialGrapheme(availInitial[0] || 'p');
    const c2 = formatInitialGrapheme(availInitial[1] || 'b');
    const c3 = formatInitialGrapheme(availInitial[2] || 't');

    const c5 = availFinal[0] || 'n';
    const c6 = availFinal[1] || 't';
    const c7 = availFinal[2] || 'l';

    let c8 = '';
    if (isSplit) {
        c8 = v2;
    } else if (allowSuffixes && !hasVowelDigraphs) {
        c8 = 'ing';
    }

    return `
        <div class="w-full h-full relative flex items-center justify-center select-none bg-white p-4 overflow-hidden">
            <!-- Top Right Recite Icon Badge -->
            <div class="absolute top-2 right-2 w-5.5 h-5.5 rounded-full bg-amber-400 flex flex-col items-center justify-center text-amber-950 shadow-2xs border border-amber-500/20">
                <i class="fa-solid fa-users text-[7px] leading-none"></i>
                <span class="text-[3.5px] font-extrabold uppercase leading-none mt-0.5">Recite</span>
            </div>

            <!-- Blending Board Grid Layout matching template -->
            <!-- 4 Columns: Initials (1,2,3), Vowel (4), Finals (5,6,7), Suffix / Split-E (8) -->
            <div class="grid grid-cols-4 items-center justify-items-center gap-x-6 sm:gap-x-10 w-full max-w-sm px-4">
                <!-- Column 1: Initial Consonants (1, 2, 3) -->
                <div class="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                    <span class="text-2xl sm:text-3xl font-medium text-slate-800 edu-font leading-none">${c1}</span>
                    <span class="text-2xl sm:text-3xl font-medium text-slate-800 edu-font leading-none">${c2}</span>
                    <span class="text-2xl sm:text-3xl font-medium text-slate-800 edu-font leading-none">${c3}</span>
                </div>

                <!-- Column 2: Focus Vowel (4) - Red / Highlighted in row 2 -->
                <div class="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                    <span class="text-2xl sm:text-3xl font-medium opacity-0 leading-none edu-font">&nbsp;</span>
                    <span class="text-2xl sm:text-3xl font-bold text-red-600 edu-font leading-none">${v1}</span>
                    <span class="text-2xl sm:text-3xl font-medium opacity-0 leading-none edu-font">&nbsp;</span>
                </div>

                <!-- Column 3: Final Consonants (5, 6, 7) -->
                <div class="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                    <span class="text-2xl sm:text-3xl font-medium text-slate-800 edu-font leading-none">${c5}</span>
                    <span class="text-2xl sm:text-3xl font-medium text-slate-800 edu-font leading-none">${c6}</span>
                    <span class="text-2xl sm:text-3xl font-medium text-slate-800 edu-font leading-none">${c7}</span>
                </div>

                <!-- Column 4: Suffix / Split 'e' (8) -->
                <div class="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                    <span class="text-2xl sm:text-3xl font-medium opacity-0 leading-none edu-font">&nbsp;</span>
                    <span class="text-2xl sm:text-3xl font-medium ${isSplit ? 'text-red-600 font-bold' : 'text-slate-800'} edu-font leading-none">${c8 || '&nbsp;'}</span>
                    <span class="text-2xl sm:text-3xl font-medium opacity-0 leading-none edu-font">&nbsp;</span>
                </div>
            </div>
        </div>
    `;
}

function renderSectDPreview() {
    return `
        <div class="w-full h-full relative flex flex-col items-center justify-center select-none bg-white overflow-hidden p-4">
            <!-- Top Right Recite Icon Badge -->
            <div class="absolute top-2 right-2 w-5.5 h-5.5 rounded-full bg-amber-400 flex flex-col items-center justify-center text-amber-950 shadow-2xs border border-amber-500/20">
                <i class="fa-solid fa-users text-[7px] leading-none"></i>
                <span class="text-[3.5px] font-extrabold uppercase leading-none mt-0.5">Recite</span>
            </div>

            <!-- Light Pink Heart with Black Text 'the' -->
            <div class="relative flex items-center justify-center">
                <svg width="105" height="95" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-2xs">
                    <path d="M50 84 C48 82 10 54 10 28 C10 14 22 5 35 5 C42 5 47 9 50 14 C53 9 58 5 65 5 C78 5 90 14 90 28 C90 54 52 82 50 84 Z" fill="#FFCCD8" stroke="#F8A5BA" stroke-width="1.5" stroke-linejoin="round"/>
                </svg>
                <span class="absolute inset-0 flex items-center justify-center text-3xl font-medium text-slate-950 edu-font pb-1.5">the</span>
            </div>
        </div>
    `;
}

function renderSectHFWPreview() {
    return `
        <div class="w-full h-full relative flex flex-col items-center justify-center select-none bg-white overflow-hidden p-4">
            <!-- Top Right Recite Icon Badge -->
            <div class="absolute top-2 right-2 w-5.5 h-5.5 rounded-full bg-amber-400 flex flex-col items-center justify-center text-amber-950 shadow-2xs border border-amber-500/20">
                <i class="fa-solid fa-users text-[7px] leading-none"></i>
                <span class="text-[3.5px] font-extrabold uppercase leading-none mt-0.5">Recite</span>
            </div>

            <span class="text-4xl sm:text-5xl text-slate-900 edu-font font-medium tracking-wide">they</span>
        </div>
    `;
}

function renderSectEPreview(dayData) {
    const rawWords = dayData.words || 'hat';
    const sampleWord = rawWords.split(',')[0]?.trim() || 'hat';
    const isAlien = sampleWord.includes('*');
    const cleanWord = sampleWord.replace('*', '');

    return `
        <div class="w-full h-full flex flex-col items-center justify-center select-none bg-white">
            ${isAlien ? `<span class="text-[9px] text-purple-600 font-bold mb-1"><i class="fa-solid fa-spaghetti-monster-flying"></i> Non-word</span>` : ''}
            <span class="text-4xl text-slate-800 edu-font font-medium">${cleanWord}</span>
        </div>
    `;
}

function renderSectReadWordWriteWordPreview(data, dayData, day, subIndex = 0) {
    const isDiff = (data.differentiate !== undefined ? data.differentiate : (data.weekly?.differentiate !== undefined ? data.weekly.differentiate : false)) === true;

    // Apply Badge Component matching template
    const applyBadge = `
        <div class="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[#6ba4e8] flex flex-col items-center justify-center text-slate-950 shadow-2xs border border-blue-400/40">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="4.5" r="2.5" fill="#1E293B"/>
                <rect x="5" y="8" width="14" height="11" rx="1" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.2"/>
                <line x1="8" y1="11" x2="16" y2="11" stroke="#334155" stroke-width="1"/>
                <line x1="8" y1="13.5" x2="16" y2="13.5" stroke="#334155" stroke-width="1"/>
                <line x1="8" y1="16" x2="13" y2="16" stroke="#334155" stroke-width="1"/>
                <circle cx="4.5" cy="13.5" r="1.3" fill="#1E293B"/>
                <circle cx="19.5" cy="13.5" r="1.3" fill="#1E293B"/>
            </svg>
            <span class="text-[3.5px] font-extrabold uppercase leading-none mt-0.5 text-slate-900">Apply</span>
        </div>
    `;

    // Chilli pepper SVG
    const chilliSvg = `
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="inline-block shrink-0">
            <path d="M11 3 C12 2 14 2 15 3 C14.5 4.5 13 5 12 5.5" stroke="#4ADE80" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M12 5 C14.5 6 15 8.5 14 11 C12.5 14.5 9 17 6.5 18 C6 18.2 5.5 17.7 5.8 17.2 C7 14.5 8 11.5 8.5 8.5 C9 6 10 5 12 5 Z" fill="#E11D48"/>
        </svg>
    `;

    if (isDiff) {
        // Differentiation TRUE: mild & spicy
        let mildWord = 'cat';
        let mildSymbols = '— — —';
        let spicyWord = 'phone';
        let spicySymbols = '— — —';

        if (Array.isArray(dayData?.diffEntries) && dayData.diffEntries.length > 0) {
            const first = dayData.diffEntries[0];
            mildWord = (first.mildWord !== undefined && first.mildWord !== '') ? first.mildWord : (first.mildWord === '' ? 'cat' : mildWord);
            mildSymbols = formatPhonemeSymbols(first.mildSymbols) || (first.mildWord ? formatPhonemeSymbols(first.mildWord.length) : '— — —');
            spicyWord = (first.spicyWord !== undefined && first.spicyWord !== '') ? first.spicyWord : (first.spicyWord === '' ? 'phone' : spicyWord);
            spicySymbols = formatPhonemeSymbols(first.spicySymbols) || (first.spicyWord ? formatPhonemeSymbols(first.spicyWord.length) : '— — —');
        } else {
            const mildRaw = (dayData?.mildWords !== undefined && dayData.mildWords !== '' ? dayData.mildWords : (data.mildWords || data.weekly?.mildWords || '')).split(',')[0]?.trim();
            const spicyRaw = (dayData?.spicyWords !== undefined && dayData.spicyWords !== '' ? dayData.spicyWords : (data.spicyWords || data.weekly?.spicyWords || '')).split(',')[0]?.trim();
            const mildParsed = parseWordWithPhonemes(mildRaw || 'cat 3');
            const spicyParsed = parseWordWithPhonemes(spicyRaw || 'phone 3');
            mildWord = mildParsed.word || 'cat';
            mildSymbols = formatPhonemeSymbols(mildParsed.count || 3);
            spicyWord = spicyParsed.word || 'phone';
            spicySymbols = formatPhonemeSymbols(spicyParsed.count || 3);
        }

        const mildDisplay = subIndex === 0 ? mildWord : mildSymbols;
        const spicyDisplay = subIndex === 0 ? spicyWord : spicySymbols;

        return `
            <div class="w-full h-full relative flex flex-col items-center justify-center select-none bg-white p-4 overflow-hidden">
                ${applyBadge}

                <div class="w-full max-w-[260px] flex flex-col items-center justify-center gap-2.5">
                    <!-- Mild Row (1 chilli) -->
                    <div class="w-full flex items-center justify-center gap-3">
                        <div class="w-8 flex justify-end shrink-0">${chilliSvg}</div>
                        <div class="text-3xl sm:text-4xl text-slate-900 edu-font font-medium flex-1 text-left ${subIndex === 1 ? 'tracking-wider font-mono' : 'tracking-wide'}">${mildDisplay}</div>
                    </div>

                    <!-- Subtle Horizontal Divider -->
                    <div class="w-4/5 h-px bg-slate-200"></div>

                    <!-- Spicy Row (2 chillies) -->
                    <div class="w-full flex items-center justify-center gap-3">
                        <div class="w-8 flex justify-end gap-0.5 shrink-0">${chilliSvg}${chilliSvg}</div>
                        <div class="text-3xl sm:text-4xl text-slate-900 edu-font font-medium flex-1 text-left ${subIndex === 1 ? 'tracking-wider font-mono' : 'tracking-wide'}">${spicyDisplay}</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Differentiation FALSE: single word(s)
    let word = 'bread';
    let symbols = '— — — —';

    if (Array.isArray(dayData?.entries) && dayData.entries.length > 0) {
        const first = dayData.entries[0];
        word = (first.word !== undefined && first.word !== '') ? first.word : (first.word === '' ? 'bread' : word);
        symbols = formatPhonemeSymbols(first.symbols) || (first.word ? formatPhonemeSymbols(first.word.length) : '— — — —');
    } else {
        const wordsRaw = (dayData?.words !== undefined && dayData.words !== '' ? dayData.words : (data.words || data.weekly?.words || '')).split(',')[0]?.trim();
        const parsed = parseWordWithPhonemes(wordsRaw || 'bread 4');
        word = parsed.word || 'bread';
        symbols = formatPhonemeSymbols(parsed.count || 4);
    }

    const display = subIndex === 0 ? word : symbols;

    return `
        <div class="w-full h-full relative flex flex-col items-center justify-center select-none bg-white p-4 overflow-hidden">
            ${applyBadge}

            <span class="text-4xl sm:text-5xl text-slate-900 edu-font font-medium ${subIndex === 1 ? 'tracking-wider font-mono' : 'tracking-wide'}">${display}</span>
        </div>
    `;
}

function renderSectFPreview() {
    return `
        <div class="w-full h-full relative flex items-center justify-around select-none bg-white p-4 overflow-hidden">
            <!-- Left: Pen -->
            <div class="flex flex-col items-center justify-center gap-2">
                <div class="h-24 w-24 flex items-center justify-center">
                    <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-sm">
                        <!-- Top Clicker Button -->
                        <path d="M74 15 L78 19 L75 22 L71 18 Z" fill="#1E293B"/>
                        <!-- Pen Clip -->
                        <path d="M72 20 C68 24 64 32 63 38 L60 36 C61 30 65 22 70 18 Z" fill="#0F172A"/>
                        <circle cx="63.5" cy="38" r="1.5" fill="#0F172A"/>
                        <!-- Top Cap & Band -->
                        <path d="M68 20 L73 25 L68 30 L63 25 Z" fill="#334155"/>
                        <path d="M66 23 L69 26 L67 28 L64 25 Z" fill="#94A3B8"/>
                        <!-- Pen Barrel (Grey) -->
                        <path d="M64 27 L69 32 L39 68 L34 63 Z" fill="url(#penBarrelGrad)"/>
                        <!-- Grip Section (Dark with ridges) -->
                        <path d="M37 60 L42 65 L29 78 L24 73 Z" fill="#1E293B"/>
                        <line x1="34" y1="64" x2="38" y2="68" stroke="#475569" stroke-width="1.2"/>
                        <line x1="31" y1="67" x2="35" y2="71" stroke="#475569" stroke-width="1.2"/>
                        <line x1="28" y1="70" x2="32" y2="74" stroke="#475569" stroke-width="1.2"/>
                        <line x1="25" y1="73" x2="29" y2="77" stroke="#475569" stroke-width="1.2"/>
                        <!-- Metal Cone / Tip -->
                        <path d="M26 75 L30 79 L20 86 L18 84 Z" fill="#CBD5E1" stroke="#64748B" stroke-width="0.8"/>
                        <!-- Pen Nib -->
                        <polygon points="19,85 16,88 18,84" fill="#0F172A"/>
                        <defs>
                            <linearGradient id="penBarrelGrad" x1="60" y1="25" x2="40" y2="70" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stop-color="#94A3B8"/>
                                <stop offset="50%" stop-color="#64748B"/>
                                <stop offset="100%" stop-color="#475569"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <span class="text-3xl text-slate-950 font-bold edu-font tracking-wide">pen</span>
            </div>

            <!-- Right: Pan -->
            <div class="flex flex-col items-center justify-center gap-2">
                <div class="h-24 w-28 flex items-center justify-center">
                    <svg width="105" height="75" viewBox="0 0 120 85" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-sm">
                        <!-- Shadow under pan -->
                        <ellipse cx="44" cy="52" rx="34" ry="18" fill="#E2E8F0" opacity="0.8"/>
                        <!-- Pan Body Outer / Depth Rim -->
                        <ellipse cx="42" cy="42" rx="34" ry="24" fill="#94A3B8" stroke="#475569" stroke-width="1.5"/>
                        <!-- Pan Interior Cooking Base -->
                        <ellipse cx="42" cy="43" rx="30" ry="20" fill="url(#panInteriorGrad)" stroke="#64748B" stroke-width="1"/>
                        <ellipse cx="42" cy="44" rx="22" ry="13" fill="url(#panCenterReflect)" opacity="0.6"/>
                        <!-- Handle Base Connector -->
                        <path d="M72 38 L80 34 L82 39 L74 44 Z" fill="#64748B" stroke="#475569" stroke-width="1"/>
                        <!-- Long Pan Handle -->
                        <path d="M78 35 C88 29 104 22 112 18 C116 16 119 18 118 22 C116 26 100 34 81 40 Z" fill="url(#panHandleGrad)" stroke="#475569" stroke-width="1.2" stroke-linejoin="round"/>
                        <!-- Hole at handle end -->
                        <ellipse cx="111" cy="20" rx="3.5" ry="2" transform="rotate(-25 111 20)" fill="#FFFFFF" stroke="#475569" stroke-width="1"/>
                        <defs>
                            <linearGradient id="panInteriorGrad" x1="20" y1="25" x2="65" y2="60" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stop-color="#CBD5E1"/>
                                <stop offset="35%" stop-color="#E2E8F0"/>
                                <stop offset="70%" stop-color="#94A3B8"/>
                                <stop offset="100%" stop-color="#64748B"/>
                            </linearGradient>
                            <linearGradient id="panCenterReflect" x1="30" y1="35" x2="55" y2="52" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.8"/>
                                <stop offset="100%" stop-color="#CBD5E1" stop-opacity="0.1"/>
                            </linearGradient>
                            <linearGradient id="panHandleGrad" x1="78" y1="35" x2="118" y2="20" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stop-color="#94A3B8"/>
                                <stop offset="50%" stop-color="#CBD5E1"/>
                                <stop offset="100%" stop-color="#64748B"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <span class="text-3xl text-slate-950 font-bold edu-font tracking-wide">pan</span>
            </div>
        </div>
    `;
}

function renderSectGPreview(dayData, day) {
    const rawLetter = dayData?.letter !== undefined && dayData.letter !== '' ? dayData.letter : 'm';
    const letter = rawLetter.trim() || 'm';
    const isM = letter.toLowerCase() === 'm';

    if (isM) {
        return `
            <div class="w-full h-full relative flex flex-col items-center justify-center select-none bg-white p-4 overflow-hidden">
                <style>
                    @keyframes drawMStroke {
                        0% {
                            stroke-dashoffset: 320;
                            opacity: 0;
                        }
                        8% {
                            opacity: 1;
                        }
                        70% {
                            stroke-dashoffset: 0;
                            opacity: 1;
                        }
                        88% {
                            stroke-dashoffset: 0;
                            opacity: 0.15;
                        }
                        100% {
                            stroke-dashoffset: 320;
                            opacity: 0;
                        }
                    }
                    @keyframes pulseStartDot {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.25); }
                    }
                    .animate-stroke-order {
                        stroke-dasharray: 320;
                        stroke-dashoffset: 320;
                        animation: drawMStroke 3.5s cubic-bezier(0.45, 0, 0.55, 1) infinite;
                    }
                    .animate-dot-pulse {
                        transform-origin: 94px 44px;
                        animation: pulseStartDot 1.8s ease-in-out infinite;
                    }
                </style>

                <svg viewBox="0 0 240 140" class="w-full h-full max-h-[180px] drop-shadow-xs" xmlns="http://www.w3.org/2000/svg">
                    <!-- Guidelines / Baseline in soft blue -->
                    <line x1="12" y1="92" x2="228" y2="92" stroke="#60A5FA" stroke-width="1.5" stroke-linecap="round" />

                    <!-- Slanted Group for NSW/Edu Style 'm' -->
                    <g transform="translate(14, 0) skewX(-7)">
                        <!-- Outlined hollow tube for 'm' -->
                        <!-- First Stem Hollow -->
                        <path d="M 88,44 C 88,38 98,38 98,44 L 98,87 C 98,92 88,92 88,87 Z" fill="#FFFFFF" stroke="#0F172A" stroke-width="2" stroke-linejoin="round" />

                        <!-- First Arch Hollow -->
                        <path d="M 97,55 C 101,41 118,41 122,55 L 122,87 C 122,92 113,92 113,87 L 113,58 C 113,49 104,49 97,56 Z" fill="#FFFFFF" stroke="#0F172A" stroke-width="2" stroke-linejoin="round" />

                        <!-- Second Arch Hollow -->
                        <path d="M 121,55 C 125,41 142,41 146,55 L 146,87 C 146,92 137,92 137,87 L 137,58 C 137,49 128,49 121,56 Z" fill="#FFFFFF" stroke="#0F172A" stroke-width="2" stroke-linejoin="round" />

                        <!-- Starting point black dot -->
                        <circle cx="93" cy="44" r="3.2" fill="#0F172A" class="animate-dot-pulse" />

                        <!-- Directional stroke order arrows -->
                        <!-- Stem 1: Down arrow -->
                        <path d="M 91,55 L 91,66 M 89.5,63.5 L 91,66.5 L 92.5,63.5" stroke="#0F172A" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                        <!-- Stem 1: Up arrow -->
                        <path d="M 95,78 L 95,67 M 93.5,69.5 L 95,66.5 L 96.5,69.5" stroke="#0F172A" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                        
                        <!-- Arch 1: Curve arrow over hump -->
                        <path d="M 103,45.5 C 107,43.5 111,44.5 114,48 M 111.5,47.5 L 114.5,48.5 L 114,45.5" stroke="#0F172A" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                        
                        <!-- Stem 2: Down arrow -->
                        <path d="M 119.5,57 L 119.5,68 M 118,65.5 L 119.5,68.5 L 121,65.5" stroke="#0F172A" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                        <!-- Stem 2: Up arrow -->
                        <path d="M 115.5,79 L 115.5,68 M 114,70.5 L 115.5,67.5 L 117,70.5" stroke="#0F172A" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none" />

                        <!-- Arch 2: Curve arrow over hump -->
                        <path d="M 127,45.5 C 131,43.5 135,44.5 138,48 M 135.5,47.5 L 138.5,48.5 L 138,45.5" stroke="#0F172A" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none" />

                        <!-- Stem 3: Down arrow -->
                        <path d="M 141.5,60 L 141.5,75 M 140,72.5 L 141.5,75.5 L 143,72.5" stroke="#0F172A" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none" />

                        <!-- Animated dynamic handwriting tracing stroke -->
                        <path d="M 93,44 L 93,87 L 93,56 C 93,44 118,44 118,56 L 118,87 L 118,56 C 118,44 142,44 142,56 L 142,87" 
                              fill="none" 
                              stroke="#2563EB" 
                              stroke-width="3" 
                              stroke-linecap="round" 
                              stroke-linejoin="round" 
                              class="animate-stroke-order opacity-80" />
                    </g>
                </svg>
            </div>
        `;
    }

    // Generic fallback for any other custom single letter
    return `
        <div class="w-full h-full relative flex flex-col items-center justify-center select-none bg-white p-4 overflow-hidden">
            <svg viewBox="0 0 240 140" class="w-full h-full max-h-[180px]" xmlns="http://www.w3.org/2000/svg">
                <!-- Baseline -->
                <line x1="12" y1="92" x2="228" y2="92" stroke="#60A5FA" stroke-width="1.5" stroke-linecap="round" />
                <text x="120" y="88" text-anchor="middle" font-size="64" font-weight="bold" font-family="'Edu NSW ACT Foundation', cursive, sans-serif" fill="#0F172A" stroke="#0F172A" stroke-width="1">${letter}</text>
            </svg>
        </div>
    `;
}

function renderSectHPreview(dayData) {
    const title = (dayData?.title !== undefined && dayData.title !== '') ? dayData.title : 'Wombats';
    const body = (dayData?.body !== undefined && dayData.body !== '') ? dayData.body : 'A wombat is a furry Australian animal that looks like a little bear. It has short legs and strong claws for digging big tunnels. Mother wombats have a backward pouch to keep dirt off their babies!';

    // Recall Badge Component matching template
    const recallBadge = `
        <div class="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[#f97316] flex flex-col items-center justify-center text-slate-950 shadow-2xs border border-orange-600/30">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Thought cloud -->
                <path d="M12 3 C10.5 3 9.5 4 9.5 5 C8.5 5 7.5 6 7.5 7 C6.5 7.5 6 8.5 6.5 9.5 C7 10.5 8 11 9 11 L16 11 C17.5 11 18.5 10 18.5 8.5 C18.5 7 17.5 6 16.5 6 C16 4.5 14.5 3 12 3 Z" fill="#0F172A"/>
                <!-- Small thought circles -->
                <circle cx="8.5" cy="12.5" r="0.8" fill="#0F172A"/>
                <circle cx="9.5" cy="14" r="0.6" fill="#0F172A"/>
                <!-- Person head and torso -->
                <circle cx="11.5" cy="16.5" r="2" fill="#0F172A"/>
                <path d="M7.5 22 C7.5 19.5 9 18.5 11.5 18.5 C14 18.5 15.5 19.5 15.5 22 Z" fill="#0F172A"/>
            </svg>
            <span class="text-[3.5px] font-extrabold uppercase leading-none mt-0.5 text-slate-950">Recall</span>
        </div>
    `;

    return `
        <div class="w-full h-full relative flex flex-col items-start justify-start p-5 select-none bg-white overflow-hidden text-left">
            ${recallBadge}

            <!-- Title -->
            <h3 class="text-xl sm:text-2xl font-bold text-slate-900 edu-font mb-2.5 tracking-wide leading-tight">${title}</h3>

            <!-- Body -->
            <p class="text-[11px] sm:text-xs text-slate-800 edu-font font-medium max-w-[82%] leading-relaxed">${body}</p>
        </div>
    `;
}

function renderSectIPreview(dayData) {
    const sent = (dayData?.sent !== undefined && dayData.sent !== '') ? dayData.sent : 'The cat sat on Sam';
    const style = dayData?.style || 'Pyramid';

    if (style === 'Picture') {
        return `
            <div class="w-full h-full flex flex-col items-center justify-between select-none bg-white p-3 overflow-hidden">
                <!-- Upper 2/3: Image Placeholder -->
                <div class="flex-1 w-full flex items-center justify-center pt-1 pb-1">
                    <div class="w-32 h-22 sm:w-40 sm:h-28 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 bg-slate-50/70 shadow-2xs">
                        <svg class="w-8 h-8 text-slate-300 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                            <circle cx="9" cy="9" r="2"/>
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                        </svg>
                        <span class="text-[9px] font-semibold text-slate-400">Picture Placeholder</span>
                    </div>
                </div>

                <!-- Lower 1/3: Sentence in lower third -->
                <div class="w-full h-1/3 flex items-center justify-center text-center px-4 pb-2">
                    <p class="text-sm sm:text-base font-medium text-slate-900 edu-font leading-snug max-w-[95%]">${sent}</p>
                </div>
            </div>
        `;
    }

    // Default Pyramid
    const pyramidLines = buildPyramid(sent).split('\n');
    return `
        <div class="w-full h-full flex flex-col items-center justify-center p-3 text-center select-none bg-white space-y-1">
            ${pyramidLines.map(line => `
                <div class="text-xs sm:text-sm font-medium text-slate-800 edu-font leading-tight">${line}</div>
            `).join('')}
        </div>
    `;
}

function renderSectJPreview(dayData) {
    const sent = dayData.sent || 'The ___ sat on the ___.';

    return `
        <div class="w-full h-full flex items-center justify-center p-3 text-center select-none bg-white">
            <p class="text-sm font-medium text-slate-800 edu-font max-w-[90%]">${sent}</p>
        </div>
    `;
}

function renderSectKPreview(dayData, customTitle) {
    return `
        <div class="w-full h-full flex flex-col items-center justify-center p-3 text-center select-none bg-white">
            <div class="w-16 h-12 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-slate-300 mb-1.5">
                <i class="fa-solid fa-image text-lg"></i>
            </div>
            <div class="text-[9px] font-mono text-slate-400">_ _ _ _ _ _ _ _ _ _</div>
        </div>
    `;
}

function renderSectSimpleCompoundPreview(dayData, data, day, subIdx) {
    const incInst = (data?.includeInstructions !== undefined ? data.includeInstructions : (data?.weekly?.includeInstructions !== undefined ? data.weekly.includeInstructions : true)) !== false;

    let slideType = 'sentence';
    if (incInst) {
        if (subIdx === 0) slideType = 'review1';
        else if (subIdx === 1) slideType = 'review2';
        else slideType = 'sentence';
    }

    if (slideType === 'review1') {
        return `
            <div class="w-full h-full flex flex-col justify-between p-3 select-none bg-white relative overflow-hidden">
                <!-- Top Header Row -->
                <div class="flex items-center justify-between w-full">
                    <h3 class="text-sm sm:text-base font-bold text-slate-900 edu-font">Simple and compound sentences</h3>
                    <div class="w-6 h-6 rounded-full bg-amber-400 border border-amber-500/30 flex items-center justify-center text-amber-950 shadow-2xs shrink-0">
                        <i class="fa-solid fa-book-open-reader text-[10px]"></i>
                    </div>
                </div>

                <!-- Center Body -->
                <div class="flex-1 flex flex-col justify-center max-w-[90%] mx-auto space-y-3 sm:space-y-4 text-left">
                    <p class="text-xs sm:text-sm text-slate-800 edu-font leading-relaxed">
                        A <strong class="font-bold">simple sentence</strong> is <span class="underline underline-offset-3">one idea</span>. It has <span class="underline underline-offset-3">a person, place or thing</span> and <span class="underline underline-offset-3">an action</span>.
                    </p>
                    <p class="text-xs sm:text-sm text-slate-800 edu-font leading-relaxed">
                        A <strong class="font-bold">compound sentence</strong> uses a <span class="underline underline-offset-3">coordinating conjunction</span> to join two simple sentences.
                    </p>
                </div>
            </div>
        `;
    }

    if (slideType === 'review2') {
        return `
            <div class="w-full h-full flex flex-col justify-between p-3 select-none bg-white relative overflow-hidden">
                <!-- Top Header Row -->
                <div class="flex items-center justify-between w-full">
                    <h3 class="text-sm sm:text-base font-bold text-slate-900 edu-font">Coordinating conjunctions</h3>
                    <div class="w-6 h-6 rounded-full bg-amber-400 border border-amber-500/30 flex items-center justify-center text-amber-950 shadow-2xs shrink-0">
                        <i class="fa-solid fa-book-open-reader text-[10px]"></i>
                    </div>
                </div>

                <!-- Center: FANBOYS Chart -->
                <div class="flex-1 flex items-center justify-center py-0.5">
                    <div class="w-52 sm:w-56 border border-slate-300 rounded overflow-hidden text-[9px] sm:text-[10px] leading-tight edu-font shadow-2xs">
                        <div class="flex border-b border-pink-200 bg-pink-100/90 text-pink-950">
                            <div class="w-8 py-0.5 font-extrabold text-center border-r border-pink-200 shrink-0 text-[11px]">F</div>
                            <div class="w-12 py-0.5 px-1 font-semibold border-r border-pink-200 shrink-0">for</div>
                            <div class="flex-1 py-0.5 px-1 text-[8px] sm:text-[9px] flex items-center">shows reason</div>
                        </div>
                        <div class="flex border-b border-orange-200 bg-orange-100/90 text-orange-950">
                            <div class="w-8 py-0.5 font-extrabold text-center border-r border-orange-200 shrink-0 text-[11px]">A</div>
                            <div class="w-12 py-0.5 px-1 font-semibold border-r border-orange-200 shrink-0">and</div>
                            <div class="flex-1 py-0.5 px-1 text-[8px] sm:text-[9px] flex items-center">adds one idea to another</div>
                        </div>
                        <div class="flex border-b border-yellow-200 bg-yellow-100/90 text-yellow-950">
                            <div class="w-8 py-0.5 font-extrabold text-center border-r border-yellow-200 shrink-0 text-[11px]">N</div>
                            <div class="w-12 py-0.5 px-1 font-semibold border-r border-yellow-200 shrink-0">nor</div>
                            <div class="flex-1 py-0.5 px-1 text-[8px] sm:text-[9px] flex items-center">adds a negative idea</div>
                        </div>
                        <div class="flex border-b border-emerald-200 bg-emerald-100/90 text-emerald-950">
                            <div class="w-8 py-0.5 font-extrabold text-center border-r border-emerald-200 shrink-0 text-[11px]">B</div>
                            <div class="w-12 py-0.5 px-1 font-semibold border-r border-emerald-200 shrink-0">but</div>
                            <div class="flex-1 py-0.5 px-1 text-[8px] sm:text-[9px] flex items-center">shows contrast</div>
                        </div>
                        <div class="flex border-b border-sky-200 bg-sky-100/90 text-sky-950">
                            <div class="w-8 py-0.5 font-extrabold text-center border-r border-sky-200 shrink-0 text-[11px]">O</div>
                            <div class="w-12 py-0.5 px-1 font-semibold border-r border-sky-200 shrink-0">or</div>
                            <div class="flex-1 py-0.5 px-1 text-[8px] sm:text-[9px] flex items-center">shows choice</div>
                        </div>
                        <div class="flex border-b border-indigo-200 bg-indigo-100/90 text-indigo-950">
                            <div class="w-8 py-0.5 font-extrabold text-center border-r border-indigo-200 shrink-0 text-[11px]">Y</div>
                            <div class="w-12 py-0.5 px-1 font-semibold border-r border-indigo-200 shrink-0">yet</div>
                            <div class="flex-1 py-0.5 px-1 text-[8px] sm:text-[9px] flex items-center">unexpected contrast</div>
                        </div>
                        <div class="flex bg-purple-100/90 text-purple-950">
                            <div class="w-8 py-0.5 font-extrabold text-center border-r border-purple-200 shrink-0 text-[11px]">S</div>
                            <div class="w-12 py-0.5 px-1 font-semibold border-r border-purple-200 shrink-0">so</div>
                            <div class="flex-1 py-0.5 px-1 text-[8px] sm:text-[9px] flex items-center">shows cause and effect</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Slide 3: Sentence Slide
    let sentences = Array.isArray(dayData?.sentences) && dayData.sentences.length > 0 ? dayData.sentences : null;
    if (!sentences && dayData?.sent !== undefined) {
        sentences = [{ sent: dayData.sent, answer: dayData.answer || 'simple' }];
    }
    const firstSent = (sentences && sentences[0]?.sent !== undefined && sentences[0]?.sent !== '') 
        ? sentences[0].sent 
        : (data?.Monday?.sentences?.[0]?.sent || data?.Monday?.sent || '');
    const answer = (sentences && sentences[0]?.answer) ? sentences[0].answer : 'simple';
    const answerLabel = answer.charAt(0).toUpperCase() + answer.slice(1);

    return `
        <div class="w-full h-full flex flex-col justify-between p-3 select-none bg-white relative overflow-hidden text-center">
            <!-- Top Header Row -->
            <div class="flex items-center justify-between w-full">
                <h3 class="text-sm sm:text-base font-bold text-slate-900 edu-font text-left">Simple or compound sentence?</h3>
                <div class="flex flex-col items-center shrink-0">
                    <div class="w-6 h-6 rounded-full bg-blue-400 border border-blue-500/30 flex items-center justify-center text-blue-950 shadow-2xs">
                        <i class="fa-solid fa-person-chalkboard text-[10px]"></i>
                    </div>
                    <span class="text-[6px] font-bold text-blue-950 edu-font leading-none mt-0.5">Apply</span>
                </div>
            </div>

            <!-- Middle: Sentence text -->
            <div class="flex-1 flex items-center justify-center px-4">
                <p class="text-sm sm:text-base font-medium text-slate-900 edu-font leading-relaxed max-w-[95%]">${firstSent || '<span class="text-slate-300 italic">Sentence will appear here...</span>'}</p>
            </div>

            <!-- Bottom: Yellow answer highlight -->
            <div class="w-full flex items-center justify-center pb-2">
                <span class="bg-yellow-300 text-slate-950 px-4 py-1 text-sm sm:text-base font-bold edu-font rounded-xs shadow-2xs tracking-wide">${answerLabel}</span>
            </div>
        </div>
    `;
}

function renderSectSentenceTypesPreview(data, dayData, day, subIdx) {
    const type = data.weekly?.sentenceType || data.sentenceType || 'Exclamative';
    const rawDef = data.definition !== undefined && data.definition !== '' 
        ? data.definition 
        : (data.weekly?.definition !== undefined && data.weekly.definition !== '' 
            ? data.weekly.definition 
            : (SENTENCE_TYPE_DEFINITIONS[type] || ''));

    const sent1 = (dayData?.sent1 !== undefined && dayData.sent1 !== '') 
        ? dayData.sent1 
        : (data?.Monday?.sent1 ? data.Monday.sent1 : 'The boy had a ball.');
    const sent2 = (dayData?.sent2 !== undefined && dayData.sent2 !== '') 
        ? dayData.sent2 
        : (data?.Monday?.sent2 ? data.Monday.sent2 : 'Pick up your ball.');

    if (subIdx === 0 || subIdx === 'st_def') {
        return `
            <div class="w-full h-full flex flex-col justify-between p-3.5 select-none bg-white relative overflow-hidden">
                <!-- Top Header Row -->
                <div class="flex items-center justify-between w-full">
                    <h3 class="text-sm sm:text-base font-bold text-slate-900 edu-font flex-1 pl-6 text-center">${type} Sentences</h3>
                    <div class="w-6 h-6 rounded-full bg-amber-400 border border-amber-500/30 flex items-center justify-center text-amber-950 shadow-2xs shrink-0">
                        <i class="fa-solid fa-book-open-reader text-[10px]"></i>
                    </div>
                </div>

                <!-- Center Body: Definition -->
                <div class="flex-1 flex flex-col items-center justify-center max-w-[85%] mx-auto text-center px-2">
                    <p class="text-xs sm:text-sm text-slate-800 edu-font leading-relaxed whitespace-pre-line">${rawDef}</p>
                </div>
            </div>
        `;
    }

    // Slide 2: Stimulus / Sentences Slide
    return `
        <div class="w-full h-full flex flex-col justify-between p-3.5 select-none bg-white relative overflow-hidden">
            <!-- Top Header Row -->
            <div class="flex items-center justify-between w-full">
                <h3 class="text-sm sm:text-base font-bold text-slate-900 edu-font flex-1 pl-6 text-center">${type} Sentences</h3>
                <div class="w-6 h-6 rounded-full bg-blue-400 border border-blue-500/30 flex items-center justify-center text-blue-950 shadow-2xs shrink-0">
                    <i class="fa-solid fa-person-chalkboard text-[10px]"></i>
                </div>
            </div>

            <!-- Center Body -->
            <div class="flex-1 flex flex-col justify-center max-w-[85%] mx-auto text-left w-full space-y-2.5 px-2">
                <div class="text-xs sm:text-sm text-slate-800 edu-font font-medium">Find the ${type} Sentence.</div>
                <div class="space-y-2 pl-2">
                    <div class="flex items-center gap-2.5">
                        <span class="text-sm sm:text-base select-none leading-none shrink-0">☝️</span>
                        <span class="text-xs sm:text-sm text-slate-900 edu-font leading-relaxed">${sent1}</span>
                    </div>
                    <div class="flex items-center gap-2.5">
                        <span class="text-sm sm:text-base select-none leading-none shrink-0">✌️</span>
                        <span class="text-xs sm:text-sm text-slate-900 edu-font leading-relaxed">${sent2}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderSectSimpleSentencesPreview(data, dayData, day, subIdx) {
    const sent = (dayData?.sent !== undefined && dayData.sent !== '')
        ? dayData.sent
        : (data?.Monday?.sent ? data.Monday.sent : 'Sam kicked the ball.');

    const clauseDiagram = `
        <div class="bg-[#8ec749] rounded-xl px-4 py-2 text-center shadow-2xs inline-block">
            <div class="text-[10px] sm:text-[11px] italic font-semibold text-slate-900 edu-font mb-1.5 leading-none">Independent clause</div>
            <div class="flex items-center justify-center gap-1.5 flex-wrap">
                <div class="bg-[#e52424] text-white text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md font-medium shadow-2xs">subject</div>
                <div class="bg-[#00b0f0] text-white text-[9px] sm:text-[10px] px-2.5 py-0.5 rounded-md font-medium shadow-2xs">verb</div>
                <div class="bg-[#cc5de8] text-white text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md font-medium shadow-2xs">object</div>
                <div class="bg-[#ffeb3b] text-slate-900 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md font-bold shadow-2xs">. ! ?</div>
            </div>
        </div>
    `;

    if (subIdx === 0 || subIdx === 'ss_def') {
        return `
            <div class="w-full h-full flex flex-col justify-between p-3.5 select-none bg-white relative overflow-hidden">
                <!-- Top Header Row -->
                <div class="flex items-center justify-between w-full">
                    <h3 class="text-sm sm:text-base font-bold text-slate-900 edu-font flex-1 pl-6 text-center">Simple Sentences</h3>
                    <div class="w-6 h-6 rounded-full bg-amber-400 border border-amber-500/30 flex items-center justify-center text-amber-950 shadow-2xs shrink-0">
                        <i class="fa-solid fa-book-open-reader text-[10px]"></i>
                    </div>
                </div>

                <!-- Center Body: Explanation Text -->
                <div class="flex-1 flex items-center justify-center max-w-[92%] mx-auto text-left px-2">
                    <p class="text-xs sm:text-[13px] text-slate-900 edu-font leading-relaxed">
                        A simple sentence is sometimes called an <strong class="font-bold text-slate-950">independent clause</strong>. It contains a <strong class="font-bold text-slate-950">subject</strong> and a <strong class="font-bold text-slate-950">verb</strong> and expresses a complete thought. It may also contain an object.
                    </p>
                </div>

                <!-- Bottom: Diagram -->
                <div class="w-full flex justify-center pb-1">
                    ${clauseDiagram}
                </div>
            </div>
        `;
    }

    // Slide 2: Stimulus / Activity Slide
    return `
        <div class="w-full h-full flex flex-col justify-between p-3.5 select-none bg-white relative overflow-hidden">
            <!-- Top Header Row -->
            <div class="flex items-center justify-between w-full">
                <div class="text-xs sm:text-sm font-semibold text-slate-800 edu-font italic">Identify the subject (S), verb (V) and object (O).</div>
                <div class="w-6 h-6 rounded-full bg-blue-400 border border-blue-500/30 flex items-center justify-center text-blue-950 shadow-2xs shrink-0">
                    <i class="fa-solid fa-person-chalkboard text-[10px]"></i>
                </div>
            </div>

            <!-- Middle: Diagram -->
            <div class="flex-1 flex items-center justify-center">
                ${clauseDiagram}
            </div>

            <!-- Bottom: Target Sentence -->
            <div class="w-full flex items-center justify-center pb-3 text-center px-4">
                <p class="text-sm sm:text-base font-bold text-slate-900 edu-font leading-relaxed">${sent}</p>
            </div>
        </div>
    `;
}

function renderSectCompoundSentencesPreview(data, dayData, day, subIdx) {
    const sent = (dayData?.sent !== undefined && dayData.sent !== '')
        ? dayData.sent
        : (data?.Monday?.sent ? data.Monday.sent : 'Sam kicked and I slept.');

    const compoundDiagram = `
        <div class="flex items-center justify-center gap-1.5 flex-wrap">
            <div class="bg-[#8ec749] text-slate-900 rounded-xl px-3 py-2 text-center shadow-2xs">
                <div class="text-[9px] sm:text-[10px] italic font-semibold edu-font leading-tight">Independent<br>clause</div>
            </div>
            <div class="bg-[#00b0f0] text-slate-950 rounded-xl px-2.5 py-1.5 text-center shadow-2xs">
                <div class="text-[8px] sm:text-[9px] font-semibold edu-font leading-tight">Coordinating<br>Conjunction<br><span class="text-[7.5px] sm:text-[8.5px] font-bold opacity-90">(FANBOYS)</span></div>
            </div>
            <div class="bg-[#8ec749] text-slate-900 rounded-xl px-3 py-2 text-center shadow-2xs">
                <div class="text-[9px] sm:text-[10px] italic font-semibold edu-font leading-tight">Independent<br>clause</div>
            </div>
            <div class="bg-[#ffeb3b] text-slate-900 text-[10px] sm:text-[11px] px-2 py-2 rounded-xl font-bold shadow-2xs self-center">
                . ! ?
            </div>
        </div>
    `;

    if (subIdx === 0 || subIdx === 'cs_def') {
        return `
            <div class="w-full h-full flex flex-col justify-between p-3.5 select-none bg-white relative overflow-hidden">
                <!-- Top Header Row -->
                <div class="flex items-center justify-between w-full">
                    <h3 class="text-sm sm:text-base font-bold text-slate-900 edu-font flex-1 pl-6 text-center">Compound Sentences</h3>
                    <div class="w-6 h-6 rounded-full bg-amber-400 border border-amber-500/30 flex items-center justify-center text-amber-950 shadow-2xs shrink-0">
                        <i class="fa-solid fa-book-open-reader text-[10px]"></i>
                    </div>
                </div>

                <!-- Center Body: Explanation Text -->
                <div class="flex-1 flex items-center justify-center max-w-[92%] mx-auto text-left px-2">
                    <p class="text-xs sm:text-[13px] text-slate-900 edu-font leading-relaxed">
                        A compound sentence contains <strong class="font-bold text-slate-950">two independent clauses</strong> joined by a <strong class="font-bold text-slate-950">coordinating conjunction</strong>.
                    </p>
                </div>

                <!-- Bottom: Diagram -->
                <div class="w-full flex justify-center pb-1">
                    ${compoundDiagram}
                </div>
            </div>
        `;
    }

    // Slide 2: Stimulus / Activity Slide
    return `
        <div class="w-full h-full flex flex-col justify-between p-3.5 select-none bg-white relative overflow-hidden">
            <!-- Top Header Row -->
            <div class="flex items-center justify-between w-full">
                <div class="text-xs sm:text-sm font-semibold text-slate-800 edu-font italic">Identify the independent clauses and the coordinating conjunction.</div>
                <div class="w-6 h-6 rounded-full bg-blue-400 border border-blue-500/30 flex items-center justify-center text-blue-950 shadow-2xs shrink-0">
                    <i class="fa-solid fa-person-chalkboard text-[10px]"></i>
                </div>
            </div>

            <!-- Middle: Diagram -->
            <div class="flex-1 flex items-center justify-center">
                ${compoundDiagram}
            </div>

            <!-- Bottom: Target Sentence -->
            <div class="w-full flex items-center justify-center pb-3 text-center px-4">
                <p class="text-sm sm:text-base font-bold text-slate-900 edu-font leading-relaxed">${sent}</p>
            </div>
        </div>
    `;
}

function renderSectWriteSimpleCompoundSentencePreview() {
    return `
        <div class="w-full h-full flex flex-col justify-between p-3.5 select-none bg-white relative overflow-hidden">
            <!-- Top Header Row -->
            <div class="flex items-center justify-between w-full">
                <h3 class="text-xs sm:text-[13px] font-bold text-slate-900 edu-font leading-snug max-w-[85%] text-left">
                    Write a simple sentence and a compound sentence to describe this picture.
                </h3>
                <div class="w-6 h-6 rounded-full bg-blue-400 border border-blue-500/30 flex items-center justify-center text-blue-950 shadow-2xs shrink-0 self-start">
                    <i class="fa-solid fa-person-chalkboard text-[10px]"></i>
                </div>
            </div>

            <!-- Main Content Area: Picture Placeholder on Left, Diagrams on Right -->
            <div class="flex-1 grid grid-cols-2 gap-3 items-center my-auto w-full pt-1">
                <!-- Left: Picture placeholder -->
                <div class="w-full aspect-[4/3] max-h-[110px] bg-slate-100/90 border border-dashed border-slate-300 rounded-lg flex items-center justify-center shadow-2xs mx-auto">
                    <div class="w-8 h-8 rounded-full bg-white shadow-xs border border-slate-200/80 flex items-center justify-center text-slate-400">
                        <i class="fa-regular fa-image text-xs"></i>
                    </div>
                </div>

                <!-- Right: Two clause diagrams stacked -->
                <div class="flex flex-col items-center justify-center gap-2">
                    <!-- Top diagram: Simple Sentence Independent Clause -->
                    <div class="bg-[#8ec749] rounded-xl px-2.5 py-1 text-center shadow-2xs w-full max-w-[190px]">
                        <div class="text-[8px] sm:text-[8.5px] italic font-semibold text-slate-900 edu-font mb-0.5 leading-none">Independent clause</div>
                        <div class="flex items-center justify-center gap-1 flex-wrap">
                            <div class="bg-[#e52424] text-white text-[7px] sm:text-[8px] px-1.5 py-0.2 rounded font-medium shadow-2xs">subject</div>
                            <div class="bg-[#00b0f0] text-white text-[7px] sm:text-[8px] px-1.5 py-0.2 rounded font-medium shadow-2xs">verb</div>
                            <div class="bg-[#cc5de8] text-white text-[7px] sm:text-[8px] px-1.5 py-0.2 rounded font-medium shadow-2xs">object</div>
                            <div class="bg-[#ffeb3b] text-slate-900 text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded font-bold shadow-2xs">. ! ?</div>
                        </div>
                    </div>

                    <!-- Bottom diagram: Compound Sentence Structure -->
                    <div class="flex items-center justify-center gap-1 flex-wrap w-full max-w-[190px]">
                        <div class="bg-[#8ec749] text-slate-900 rounded-lg px-1.5 py-1 text-center shadow-2xs flex-1">
                            <div class="text-[7px] sm:text-[7.5px] italic font-semibold edu-font leading-tight">Independent<br>clause</div>
                        </div>
                        <div class="bg-[#00b0f0] text-slate-950 rounded-lg px-1.5 py-1 text-center shadow-2xs flex-1">
                            <div class="text-[6.5px] sm:text-[7px] font-semibold edu-font leading-tight">Coordinating<br>Conjunction<br><span class="text-[6px] opacity-90">(FANBOYS)</span></div>
                        </div>
                        <div class="bg-[#8ec749] text-slate-900 rounded-lg px-1.5 py-1 text-center shadow-2xs flex-1">
                            <div class="text-[7px] sm:text-[7.5px] italic font-semibold edu-font leading-tight">Independent<br>clause</div>
                        </div>
                        <div class="bg-[#ffeb3b] text-slate-900 text-[8px] sm:text-[9px] px-1 py-1 rounded-lg font-bold shadow-2xs self-center">
                            . ! ?
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderGenericPreview(dayData, customTitle, data = {}, day = 'Monday') {
    const content = (dayData?.word !== undefined && dayData.word !== '') 
        ? dayData.word 
        : (data?.Monday?.word ? data.Monday.word : (customTitle || 'Placeholder'));

    return `
        <div class="w-full h-full flex items-center justify-center p-4 text-center select-none bg-white">
            <span class="text-base sm:text-lg font-bold text-slate-800 edu-font leading-relaxed max-w-[90%]">${content}</span>
        </div>
    `;
}

function renderCustomisablePreview(data, customTitle) {
    const tag = data.templateTag || '[custom_slide]';

    return `
        <div class="w-full h-full flex flex-col items-center justify-center p-3 text-center select-none bg-white">
            <span class="text-sm font-bold text-slate-800 mb-1">${customTitle || 'Custom Slide'}</span>
            <span class="text-[9px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">${tag}</span>
        </div>
    `;
}

function renderFinishedPreview(day) {
    return `
        <div class="w-full h-full flex flex-col items-center justify-center select-none bg-white text-center">
            <h2 class="text-2xl font-extrabold text-slate-900 mb-0.5">Finished!</h2>
            <div class="text-[10px] text-slate-400">Daily Review Complete</div>
        </div>
    `;
}

function renderHundredsChartPreview(data = {}, customTitle = 'Hundreds Chart') {
    const rawChartSize = data.chartSize || data.weekly?.chartSize || '1–100';
    const chartSize = String(rawChartSize).includes('120') ? '1–120' : '1–100';
    const chartMax = getHundredsChartMax(chartSize);
    const multiplesOf = data.multiplesOf !== undefined ? data.multiplesOf : (data.weekly?.multiplesOf !== undefined ? data.weekly.multiplesOf : '6');
    const multiplesList = getHundredsChartMultiplesList(multiplesOf, chartSize);
    const defRange = getHundredsChartDefaultRange(multiplesOf, chartSize);

    const rawMin = data.rangeMin !== undefined ? Number(data.rangeMin) : (data.weekly?.rangeMin !== undefined ? Number(data.weekly.rangeMin) : defRange.min);
    const rawMax = data.rangeMax !== undefined ? Number(data.rangeMax) : (data.weekly?.rangeMax !== undefined ? Number(data.weekly.rangeMax) : defRange.max);

    const rangeMin = multiplesList.includes(rawMin) ? rawMin : defRange.min;
    const rangeMax = (multiplesList.includes(rawMax) && rawMax >= rangeMin) ? rawMax : defRange.max;
    const progression = data.progression || data.weekly?.progression || 'single';
    const instructions = data.instructions !== undefined ? data.instructions : (data.weekly?.instructions !== undefined ? data.weekly.instructions : getHundredsChartInstruction(multiplesOf));

    const highlighted = getHundredsChartHighlightedNumbers(multiplesOf, rangeMin, rangeMax, chartSize);
    const is120 = chartMax === 120;

    let cellsHtml = '';
    for (let num = 1; num <= chartMax; num++) {
        const isHighlighted = highlighted.has(num);
        const cellStyle = isHighlighted
            ? 'background-color: #eeff41; color: #020617; font-weight: 700;'
            : 'background-color: #ffffff; color: #334155; font-weight: 500;';
        const fontSizeClass = is120 ? 'text-[5.5px] sm:text-[6.5px]' : 'text-[6.5px] sm:text-[7.5px]';
        cellsHtml += `
            <div class="flex items-center justify-center border border-slate-300 ${fontSizeClass} select-none transition-colors leading-none" style="aspect-ratio: 1 / 1; ${cellStyle}">
                ${num}
            </div>
        `;
    }

    const gridStyle = is120
        ? 'width: min(100%, 116px); aspect-ratio: 10 / 12;'
        : 'width: min(100%, 140px); aspect-ratio: 1 / 1;';

    const isBlank = multiplesOf === 'Blank' || multiplesList.length === 0;
    const rangeLabel = isBlank ? 'None' : `${rangeMin} – ${rangeMax}`;
    const progLabel = (!isBlank && progression === 'animate') ? `Animate (${highlighted.size} slides)` : 'Single slide';

    return `
        <div class="w-full h-full flex flex-col items-center justify-between p-2 sm:p-2.5 select-none bg-white relative overflow-hidden">
            <!-- Header Bar / Instruction (tag: {{content}}) -->
            <div class="w-full flex items-center justify-between border-b border-slate-100 pb-1 px-1">
                <span class="text-[8px] sm:text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 uppercase tracking-wider">${customTitle || 'Hundreds Chart'} (${chartSize})</span>
                <h3 class="text-xs sm:text-[13px] font-bold text-slate-800 edu-font truncate flex-1 px-2 text-center">${instructions}</h3>
                <div class="w-5 h-5 rounded-full bg-amber-400 border border-amber-500/30 flex items-center justify-center text-amber-950 shadow-2xs shrink-0">
                    <i class="fa-solid fa-table-cells text-[9px]"></i>
                </div>
            </div>

            <!-- 10x10 or 10x12 Grid -->
            <div class="flex-1 flex items-center justify-center my-auto w-full py-0.5">
                <div class="grid grid-cols-10 border-2 border-slate-400 rounded-xs bg-white shadow-xs" style="${gridStyle}">
                    ${cellsHtml}
                </div>
            </div>

            <!-- Subtle footer showing active multiples, range, and progression -->
            <div class="w-full flex items-center justify-between text-[7.5px] sm:text-[8px] text-slate-400 px-1 pt-0.5 border-t border-slate-100">
                <span>Multiples: <strong class="text-slate-600 font-semibold">${multiplesOf}</strong></span>
                <span>Range: <strong class="text-slate-600 font-semibold">${rangeLabel}</strong></span>
                <span>Mode: <strong class="text-slate-600 font-semibold">${progLabel}</strong></span>
            </div>
        </div>
    `;
}

function renderMabSvgBlock(type, scale = 1) {
    if (type === 1000) {
        const w = Math.max(18, Math.round(78 * scale));
        const h = Math.max(20, Math.round(86 * scale));
        let gridLines = '';
        for (let i = 1; i < 10; i++) {
            const f = i / 10;
            // Left face horizontal-ish & vertical lines
            const ly1 = 22 + f * 44;
            const ly2 = 44 + f * 44;
            gridLines += `<line x1="4" y1="${ly1.toFixed(1)}" x2="40" y2="${ly2.toFixed(1)}" stroke="#1e293b" stroke-width="0.55" opacity="0.65"/>`;
            const lx = 4 + f * 36;
            const lTopY = 22 + f * 22;
            const lBotY = 66 + f * 22;
            gridLines += `<line x1="${lx.toFixed(1)}" y1="${lTopY.toFixed(1)}" x2="${lx.toFixed(1)}" y2="${lBotY.toFixed(1)}" stroke="#1e293b" stroke-width="0.55" opacity="0.65"/>`;

            // Right face horizontal-ish & vertical lines
            const ry1 = 44 + f * 44;
            const ry2 = 22 + f * 44;
            gridLines += `<line x1="40" y1="${ry1.toFixed(1)}" x2="76" y2="${ry2.toFixed(1)}" stroke="#1e293b" stroke-width="0.55" opacity="0.65"/>`;
            const rx = 40 + f * 36;
            const rTopY = 44 - f * 22;
            const rBotY = 88 - f * 22;
            gridLines += `<line x1="${rx.toFixed(1)}" y1="${rTopY.toFixed(1)}" x2="${rx.toFixed(1)}" y2="${rBotY.toFixed(1)}" stroke="#1e293b" stroke-width="0.55" opacity="0.65"/>`;

            // Top face grid lines
            const tx1 = 4 + f * 36;
            const ty1 = 22 - f * 20;
            const tx2 = 40 + f * 36;
            const ty2 = 44 - f * 20;
            gridLines += `<line x1="${tx1.toFixed(1)}" y1="${ty1.toFixed(1)}" x2="${tx2.toFixed(1)}" y2="${ty2.toFixed(1)}" stroke="#1e293b" stroke-width="0.55" opacity="0.65"/>`;

            const ux1 = 4 + f * 36;
            const uy1 = 22 + f * 22;
            const ux2 = 40 + f * 36;
            const uy2 = 2 + f * 22;
            gridLines += `<line x1="${ux1.toFixed(1)}" y1="${uy1.toFixed(1)}" x2="${ux2.toFixed(1)}" y2="${uy2.toFixed(1)}" stroke="#1e293b" stroke-width="0.55" opacity="0.65"/>`;
        }
        return `
            <svg width="${w}" height="${h}" viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg" class="shrink-0">
                <!-- Top face -->
                <polygon points="40,2 76,22 40,44 4,22" fill="#ff3b3b" stroke="#0f172a" stroke-width="1.2" stroke-linejoin="round"/>
                <!-- Left face -->
                <polygon points="4,22 40,44 40,88 4,66" fill="#c81e1e" stroke="#0f172a" stroke-width="1.2" stroke-linejoin="round"/>
                <!-- Right face -->
                <polygon points="40,44 76,22 76,66 40,88" fill="#ef2323" stroke="#0f172a" stroke-width="1.2" stroke-linejoin="round"/>
                ${gridLines}
            </svg>
        `;
    }

    if (type === 100) {
        const w = Math.max(14, Math.round(52 * scale));
        const h = Math.max(20, Math.round(84 * scale));
        let gridLines = '';
        for (let i = 1; i < 10; i++) {
            const f = i / 10;
            // Front-right 10x10 face lines
            const hy1 = 30 + f * 52;
            const hy2 = 6 + f * 52;
            gridLines += `<line x1="12" y1="${hy1.toFixed(1)}" x2="50" y2="${hy2.toFixed(1)}" stroke="#0f172a" stroke-width="0.6" opacity="0.7"/>`;
            const vx = 12 + f * 38;
            const vTop = 30 - f * 24;
            const vBot = 82 - f * 24;
            gridLines += `<line x1="${vx.toFixed(1)}" y1="${vTop.toFixed(1)}" x2="${vx.toFixed(1)}" y2="${vBot.toFixed(1)}" stroke="#0f172a" stroke-width="0.6" opacity="0.7"/>`;
            // Left thickness ticks
            gridLines += `<line x1="6" y1="${(26 + f * 52).toFixed(1)}" x2="12" y2="${hy1.toFixed(1)}" stroke="#0f172a" stroke-width="0.6" opacity="0.7"/>`;
            // Top thickness ticks
            gridLines += `<line x1="${(6 + f * 38).toFixed(1)}" y1="${(26 - f * 24).toFixed(1)}" x2="${vx.toFixed(1)}" y2="${vTop.toFixed(1)}" stroke="#0f172a" stroke-width="0.6" opacity="0.7"/>`;
        }
        return `
            <svg width="${w}" height="${h}" viewBox="0 0 54 86" fill="none" xmlns="http://www.w3.org/2000/svg" class="shrink-0">
                <!-- Top thin edge -->
                <polygon points="6,26 44,2 50,6 12,30" fill="#29b6f6" stroke="#0f172a" stroke-width="1.2" stroke-linejoin="round"/>
                <!-- Left thin edge -->
                <polygon points="6,26 12,30 12,82 6,78" fill="#0277bd" stroke="#0f172a" stroke-width="1.2" stroke-linejoin="round"/>
                <!-- Front-right 10x10 face -->
                <polygon points="12,30 50,6 50,58 12,82" fill="#039be5" stroke="#0f172a" stroke-width="1.2" stroke-linejoin="round"/>
                ${gridLines}
            </svg>
        `;
    }

    if (type === 10) {
        const w = Math.max(6, Math.round(13 * scale));
        const h = Math.max(18, Math.round(70 * scale));
        let segLines = '';
        for (let i = 1; i < 10; i++) {
            const y = 8 + i * 6.8;
            segLines += `<polyline points="2,${y.toFixed(1)} 10,${(y + 4).toFixed(1)} 18,${y.toFixed(1)}" stroke="#0f172a" stroke-width="0.85" fill="none"/>`;
        }
        return `
            <svg width="${w}" height="${h}" viewBox="0 0 20 82" fill="none" xmlns="http://www.w3.org/2000/svg" class="shrink-0">
                <!-- Top diamond -->
                <polygon points="10,4 18,8 10,12 2,8" fill="#22c55e" stroke="#0f172a" stroke-width="1.2" stroke-linejoin="round"/>
                <!-- Left face -->
                <polygon points="2,8 10,12 10,80 2,76" fill="#15803d" stroke="#0f172a" stroke-width="1.2" stroke-linejoin="round"/>
                <!-- Right face -->
                <polygon points="10,12 18,8 18,76 10,80" fill="#16a34a" stroke="#0f172a" stroke-width="1.2" stroke-linejoin="round"/>
                ${segLines}
            </svg>
        `;
    }

    // Ones cube (type === 1)
    const w = Math.max(6, Math.round(12 * scale));
    const h = Math.max(7, Math.round(13 * scale));
    return `
        <svg width="${w}" height="${h}" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg" class="shrink-0">
            <!-- Top diamond -->
            <polygon points="10,2 18,6.5 10,11 2,6.5" fill="#fef08a" stroke="#0f172a" stroke-width="1.4" stroke-linejoin="round"/>
            <!-- Left face -->
            <polygon points="2,6.5 10,11 10,20 2,15.5" fill="#eab308" stroke="#0f172a" stroke-width="1.4" stroke-linejoin="round"/>
            <!-- Right face -->
            <polygon points="10,11 18,6.5 18,15.5 10,20" fill="#facc15" stroke="#0f172a" stroke-width="1.4" stroke-linejoin="round"/>
        </svg>
    `;
}

function renderNumberMABPreview(data = {}, dayData = {}, day = 'Monday', subIdx = 0, customTitle = 'Number - MAB blocks') {
    const rawPv = data.maxPlaceValue !== undefined ? data.maxPlaceValue : (data.weekly?.maxPlaceValue !== undefined ? data.weekly.maxPlaceValue : 2);
    const maxPv = Math.min(4, Math.max(1, parseInt(rawPv, 10) || 2));
    const instructions = data.instructions !== undefined ? data.instructions : (data.weekly?.instructions !== undefined ? data.weekly.instructions : 'What is the number?');

    let dayNumbers = parseMabNumbersList(dayData?.numbers);
    if (dayNumbers.length === 0 && data?.Monday?.numbers) {
        dayNumbers = parseMabNumbersList(data.Monday.numbers);
    }

    // Default sample number if daily boxes are currently empty
    const defaultByPv = { 1: 4, 2: 24, 3: 124, 4: 1111 };
    const isSample = dayNumbers.length === 0;
    const activeNumber = isSample
        ? (defaultByPv[maxPv] || 24)
        : dayNumbers[Math.min(subIdx, dayNumbers.length - 1)] || dayNumbers[0];

    const parts = decomposeMabNumber(activeNumber);

    // Estimate horizontal footprint to scale cleanly inside preview frame
    const rawUnits =
        (parts.thousands > 0 ? parts.thousands * 78 + 10 : 0) +
        (parts.hundreds > 0 ? parts.hundreds * 52 + 10 : 0) +
        (parts.tens > 0 ? parts.tens * 15 + 8 : 0) +
        (parts.ones > 0 ? Math.ceil(parts.ones / 5) * 14 + 6 : 0);

    const scale = rawUnits > 220 ? Math.max(0.42, 220 / rawUnits) : 1;

    const groupsHtml = [];

    if (parts.thousands > 0) {
        let items = '';
        for (let i = 0; i < parts.thousands; i++) {
            items += renderMabSvgBlock(1000, scale);
        }
        groupsHtml.push(`<div class="flex items-end gap-1">${items}</div>`);
    }

    if (parts.hundreds > 0) {
        let items = '';
        for (let i = 0; i < parts.hundreds; i++) {
            items += renderMabSvgBlock(100, scale);
        }
        groupsHtml.push(`<div class="flex items-end gap-1">${items}</div>`);
    }

    if (parts.tens > 0) {
        let items = '';
        for (let i = 0; i < parts.tens; i++) {
            const extraMargin = (i === 5) ? 'ml-1' : '';
            items += `<div class="${extraMargin} flex items-end">${renderMabSvgBlock(10, scale)}</div>`;
        }
        groupsHtml.push(`<div class="flex items-end gap-0.5">${items}</div>`);
    }

    if (parts.ones > 0) {
        const cols = Math.ceil(parts.ones / 5);
        let colsHtml = '';
        for (let c = 0; c < cols; c++) {
            const countInCol = Math.min(5, parts.ones - c * 5);
            let stackHtml = '';
            for (let r = 0; r < countInCol; r++) {
                stackHtml += renderMabSvgBlock(1, scale);
            }
            colsHtml += `<div class="flex flex-col-reverse items-center gap-0.5">${stackHtml}</div>`;
        }
        groupsHtml.push(`<div class="flex items-end gap-1">${colsHtml}</div>`);
    }

    return `
        <div class="w-full h-full flex flex-col items-center justify-between p-2.5 select-none bg-white relative overflow-hidden">
            <!-- Top-left subtle number indicator + Top-right Recite Badge -->
            <div class="w-full flex items-start justify-between z-10">
                <span class="text-[8.5px] font-semibold text-slate-400">
                    ${isSample ? `Sample: ${activeNumber}` : `${day} · #${Math.min(subIdx + 1, dayNumbers.length)} (${activeNumber})`}
                </span>
                <div class="w-6 h-6 rounded-full bg-amber-300 flex flex-col items-center justify-center text-slate-900 shadow-2xs border border-amber-400/60 shrink-0">
                    <i class="fa-solid fa-users text-[7px] leading-none"></i>
                    <span class="text-[4px] font-bold edu-font leading-none mt-0.5">Recite</span>
                </div>
            </div>

            <!-- Center MAB Blocks Cluster (Left-to-right: 1000s -> 100s -> 10s -> 1s) -->
            <div class="flex-1 flex items-end justify-center gap-2.5 sm:gap-3.5 my-auto pb-1 max-w-full overflow-hidden">
                ${groupsHtml.join('')}
            </div>

            <!-- Bottom {{content}} Instruction -->
            <div class="w-full text-center pt-1">
                <div class="text-sm sm:text-[15px] font-bold text-slate-900 edu-font leading-tight truncate px-2">
                    ${instructions || 'What is the number?'}
                </div>
            </div>
        </div>
    `;
}
