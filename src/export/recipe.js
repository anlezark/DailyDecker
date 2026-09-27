// Google Slides / PowerPoint Recipe Assembly Builder
import { SECTION_DEFS } from '../data/sections.js';
import { DAYS, SENTENCE_TYPE_DEFINITIONS, SOUNDS_WRITE_LEVELS } from '../data/constants.js';
import { getPhonicsPoolInfo } from '../data/phonics.js';
import { shuffleArray, randomizeCasing, parseWordWithPhonemes, formatPhonemeSymbols, getItemIncludedDays, getHundredsChartInstruction, getHundredsChartHighlightedNumbers, getHundredsChartDefaultRange } from '../utils/helpers.js';

export function buildPyramid(sentence) {
    const words = (sentence || '').trim().split(/\s+/).filter(w => w);
    let pyramid = [];
    let currentLine = [];
    for (let i = 0; i < words.length; i++) {
        currentLine.push(words[i]);
        pyramid.push(currentLine.join(' '));
    }
    return pyramid.join('\n');
}

export function buildPresentationRecipe(globalSettings, timelineItems, exportPptx = false) {
    const recipe = {
        deckName: globalSettings.deckName,
        author: globalSettings.preparedBy || "",
        templateId: globalSettings.templateId,
        folderId: globalSettings.folderId || null,
        globalTerm: globalSettings.term,
        globalWeek: globalSettings.week,
        globalPhonicsLevel: globalSettings.phonicsLevel,
        exportPptx: exportPptx,
        slides: []
    };

    const introBlock = timelineItems.find(i => i.defKey === 'mainIntro');
    if (introBlock) {
        const now = new Date();
        const createdOnStr = now.toLocaleDateString('en-AU', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) + ' at ' + now.toLocaleTimeString('en-AU', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const metadataNotes = `Deck Name: ${globalSettings.deckName || ''}\nAuthor: ${globalSettings.preparedBy || ''}\nCreated on: ${createdOnStr}`;

        recipe.slides.push({
            noteId: "[mainTitle]",
            replacements: {
                "{{yearLevel}}": globalSettings.yearLevel,
                "{{termNumber}}": globalSettings.term.toString(),
                "{{weekNumber}}": globalSettings.week.toString()
            },
            injectNotes: metadataNotes
        });
    }

    const { fullPool, currentLevelGraphemes, previousLevelGraphemes } = getPhonicsPoolInfo(globalSettings.phonicsLevel);

    DAYS.forEach(day => {
        if (!globalSettings.activeDays[day]) return;

        timelineItems.forEach(item => {
            const def = SECTION_DEFS[item.defKey];
            const data = item.data;

            if (item.defKey === 'mainIntro') return; 

            const itemDays = getItemIncludedDays(item);
            if (itemDays[day] === false) return;

            if (def && def.hasTitleSlideOptions && data.titleSettings?.include) {
                recipe.slides.push({
                    noteId: "[sectionTitle]",
                    replacements: {
                        "{{sectionTitle}}": data.titleSettings.title || "",
                        "{{instructions}}": data.titleSettings.instructions || ""
                    }
                });
            }

            if (item.defKey === 'expectations') {
                const style = data.weekly?.style || data.style || 'Basic';
                let noteId = "[expectations]";
                if (style === 'Whiteboards') noteId = "[expectations_wb]";
                if (style === 'Whiteboards and Music') noteId = "[expectations_wb_music]";
                recipe.slides.push({ noteId: noteId });
            }

            else if (item.defKey === 'reciteRecallApplyLisc') {
                const incRRA = (data.includeRRA !== undefined ? data.includeRRA : (data.weekly?.includeRRA !== undefined ? data.weekly.includeRRA : true)) !== false;
                const incLISC = (data.includeLISC !== undefined ? data.includeLISC : (data.weekly?.includeLISC !== undefined ? data.weekly.includeLISC : true)) !== false;

                if (incRRA) {
                    recipe.slides.push({ noteId: "[reciteRecallApply]" });
                }
                if (incLISC) {
                    recipe.slides.push({ noteId: "[LISC]" });
                }
            }
            
            else if (item.defKey === 'dayDivider') {
                recipe.slides.push({ noteId: `[Days_${day.toLowerCase()}]` });
            }

            else if (item.defKey === 'dayDividerPlain') {
                recipe.slides.push({
                    noteId: "[plainDay]",
                    replacements: { "{{day}}": day }
                });
            }

            else if (item.defKey === 'sectA') {
                recipe.slides.push({
                    noteId: "[pictureTalk_stimulus]",
                    injectNotes: data[day]?.prompt || ""
                });
            }

            else if (item.defKey === 'sectB') {
                let limitVal = data.limit !== undefined ? data.limit : (data.weekly?.limit !== undefined ? data.weekly.limit : 'all');
                let selectedGraphemes = [];
                
                if (limitVal && limitVal !== 'all' && parseInt(limitVal) > 0 && parseInt(limitVal) !== fullPool.length) {
                    let limit = parseInt(limitVal);
                    if (currentLevelGraphemes.length >= limit) {
                        selectedGraphemes = shuffleArray([...currentLevelGraphemes]).slice(0, limit);
                    } else {
                        selectedGraphemes = [...currentLevelGraphemes];
                        let remainder = limit - selectedGraphemes.length;
                        let shuffledPrev = shuffleArray([...previousLevelGraphemes]);
                        
                        for (let i = 0; i < remainder; i++) {
                            if (shuffledPrev.length > 0) {
                                selectedGraphemes.push(shuffledPrev[i % shuffledPrev.length]);
                            } else {
                                selectedGraphemes.push(currentLevelGraphemes[i % (currentLevelGraphemes.length || 1)] || "a");
                            }
                        }
                    }
                } else {
                    selectedGraphemes = [...fullPool];
                }
                
                selectedGraphemes = shuffleArray(selectedGraphemes);
                
                selectedGraphemes.forEach(gr => {
                    recipe.slides.push({
                        noteId: "[graphemeRead_stimulus]",
                        replacements: { "{{gr}}": gr }
                    });
                });
            }

            else if (item.defKey === 'sectC') {
                const standardVowels = ['a', 'e', 'i', 'o', 'u'];
                let poolVowels = fullPool.filter(g => standardVowels.includes(g));
                let poolConsonants = fullPool.filter(g => !standardVowels.includes(g));
                
                if (poolVowels.length === 0) poolVowels = standardVowels;
                if (poolConsonants.length === 0) poolConsonants = ['b','c','d','f','g','m','s','t']; 
                
                const generateLine = () => {
                    let line = [];
                    for (let i = 0; i < 3; i++) line.push(poolVowels[Math.floor(Math.random() * poolVowels.length)]);
                    for (let i = 0; i < 4; i++) line.push(poolConsonants[Math.floor(Math.random() * poolConsonants.length)]);
                    
                    line = shuffleArray(line);
                    return line.map(randomizeCasing).join(" ");
                };

                recipe.slides.push({
                    noteId: "[readLines_stimulus]",
                    replacements: {
                        "{{readLines_1}}": generateLine(),
                        "{{readLines_2}}": generateLine()
                    }
                });
            }

            else if (item.defKey === 'sectDigraphs') {
                const COMMON_DIGRAPHS = [
                    { id: 'sh', label: 'sh', tag: 'digraph_sh' },
                    { id: 'ch', label: 'ch', tag: 'digraph_ch' },
                    { id: 'th', label: 'th', tag: 'digraph_th' },
                    { id: 'ck', label: 'ck', tag: 'digraph_ck' },
                    { id: 'wh', label: 'wh', tag: 'digraph_wh' },
                    { id: 'ng', label: 'ng', tag: 'digraph_ng' },
                    { id: 'qu', label: 'qu', tag: 'digraph_qu' },
                    { id: 'ai', label: 'ai', tag: 'digraph_ai' },
                    { id: 'ay', label: 'ay', tag: 'digraph_ay' },
                    { id: 'ee', label: 'ee', tag: 'digraph_ee' },
                    { id: 'ea', label: 'ea (/ee/)', tag: 'digraph_ea-ee' },
                    { id: 'ea-e', label: 'ea (/e/)', tag: 'digraph_ea-e' },
                    { id: 'oa', label: 'oa', tag: 'digraph_oa' },
                    { id: 'ow', label: 'ow', tag: 'digraph_ow' },
                    { id: 'oo', label: 'oo', tag: 'digraph_oo' },
                    { id: 'u_e', label: 'u_e', tag: 'digraph_u_e' },
                    { id: 'ue', label: 'ue', tag: 'digraph_ue' },
                    { id: 'ew', label: 'ew', tag: 'digraph_ew' },
                    { id: 'er', label: 'er', tag: 'digraph_er' },
                    { id: 'ir', label: 'ir', tag: 'digraph_ir' },
                    { id: 'ur', label: 'ur', tag: 'digraph_ur' },
                    { id: 'or-er', label: 'or (/er/)', tag: 'digraph_or-er' }
                ];
                const commonIds = COMMON_DIGRAPHS.map(d => d.id);
                
                let selectedRaw = [];
                if (Array.isArray(data.selectedDigraphs)) {
                    selectedRaw = data.selectedDigraphs;
                } else if (Array.isArray(data.weekly?.selectedDigraphs)) {
                    selectedRaw = data.weekly.selectedDigraphs;
                } else if (typeof data.digraphs === 'string' || typeof data.weekly?.digraphs === 'string') {
                    const raw = data.digraphs || data.weekly?.digraphs || '';
                    selectedRaw = raw.split(/,|\band\b/i).map(w => w.trim()).filter(w => w);
                }

                const selectedSet = new Set(selectedRaw.map(s => String(s).toLowerCase().trim()));

                // Preserve strict COMMON_DIGRAPHS grid order
                let digraphList = [];
                COMMON_DIGRAPHS.forEach(dg => {
                    if (selectedSet.has(dg.id.toLowerCase()) || 
                       (dg.id === 'ea-e' && selectedSet.has('ea (/e/)')) || 
                       (dg.id === 'or-er' && selectedSet.has('or (/er/)'))) {
                        digraphList.push(dg.id);
                    }
                });

                // Append further digraphs in their exact entered order
                const furtherRaw = data.furtherDigraphs !== undefined ? data.furtherDigraphs : (data.weekly?.furtherDigraphs !== undefined ? data.weekly.furtherDigraphs : '');
                if (furtherRaw && typeof furtherRaw === 'string') {
                    const furtherTokens = furtherRaw.split(/,|\band\b/i).map(w => w.trim()).filter(w => w);
                    furtherTokens.forEach(t => {
                        if (!digraphList.some(p => p.toLowerCase() === t.toLowerCase())) {
                            digraphList.push(t);
                        }
                    });
                } else if (data.selectedDigraphs === undefined && typeof data.digraphs === 'string') {
                    const raw = data.digraphs || '';
                    const tokens = raw.split(/,|\band\b/i).map(w => w.trim()).filter(w => w);
                    tokens.forEach(t => {
                        if (!commonIds.includes(t.toLowerCase()) && !digraphList.some(p => p.toLowerCase() === t.toLowerCase())) {
                            digraphList.push(t);
                        }
                    });
                }

                const isShuffle = data.shuffle === true || data.shuffle === 'true' || data.weekly?.shuffle === true || data.weekly?.shuffle === 'true';
                if (isShuffle) {
                    digraphList = shuffleArray([...digraphList]);
                }
                digraphList.forEach(dg => {
                    let cleanLabel = dg.toLowerCase().trim();
                    if (cleanLabel) {
                        let tag = `digraph_${cleanLabel}`;
                        const matched = COMMON_DIGRAPHS.find(c => c.id === cleanLabel || c.tag === `digraph_${cleanLabel}` || (c.id === 'ea-e' && cleanLabel === 'ea (/e/)') || (c.id === 'or-er' && cleanLabel === 'or (/er/)'));
                        if (matched) {
                            tag = matched.tag;
                        } else if (cleanLabel === 'ea') {
                            tag = 'digraph_ea-ee';
                        } else if (cleanLabel === 'ea (/e/)' || cleanLabel === 'ea-e') {
                            tag = 'digraph_ea-e';
                        } else if (cleanLabel === 'or (/er/)' || cleanLabel === 'or-er') {
                            tag = 'digraph_or-er';
                        } else if (cleanLabel === 'u_e') {
                            tag = 'digraph_u_e';
                        }
                        recipe.slides.push({
                            noteId: `[${tag}]`
                        });
                    }
                });
            }

            else if (item.defKey === 'sectBlendingBoard') {
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

                const isOffensiveWord = (initGrapheme, vowelStr, finalGrapheme) => {
                    const cleanInit = initGrapheme.replace(/\s+/g, '').toLowerCase();
                    const cleanVowel = vowelStr.replace(/_/g, '').toLowerCase();
                    const cleanFinal = finalGrapheme.toLowerCase();
                    const fullWord = cleanInit + cleanVowel + cleanFinal;
                    return OFFENSIVE_WORDS.some(bad => fullWord.includes(bad) || (bad.includes(fullWord) && fullWord.length >= 3));
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

                let availInitial = initialPool.length >= 3 ? shuffleArray([...initialPool]) : shuffleArray([...defaultInitial]);

                const vowelsStr = data[day]?.vowels || "";
                let dayVowelList = vowelsStr.split(",").map(v => v.trim()).filter(v => v);
                if (dayVowelList.length === 0) dayVowelList = ['a'];

                const hasVowelDigraphs = dayVowelList.some(v => v.length > 1 || v.includes('_'));

                let dayFinalPool = baseFinalPool;
                if (hasVowelDigraphs) {
                    dayFinalPool = baseFinalPool.filter(c => c.length === 1);
                }

                let availFinal = dayFinalPool.length >= 3 ? shuffleArray([...dayFinalPool]) : shuffleArray([...defaultFinal]);

                let selectedInitials = [availInitial[0] || 'p', availInitial[1] || 't', availInitial[2] || 'm'];
                let selectedFinals = [availFinal[0] || 'm', availFinal[1] || 'v', availFinal[2] || 'l'];

                let initIdx = 3;
                let finIdx = 3;
                for (let vIdx = 0; vIdx < dayVowelList.length; vIdx++) {
                    const v = dayVowelList[vIdx];
                    for (let i = 0; i < 3; i++) {
                        for (let j = 0; j < 3; j++) {
                            if (isOffensiveWord(selectedInitials[i], v, selectedFinals[j])) {
                                if (initIdx < availInitial.length) {
                                    selectedInitials[i] = availInitial[initIdx++];
                                } else if (finIdx < availFinal.length) {
                                    selectedFinals[j] = availFinal[finIdx++];
                                } else {
                                    selectedInitials[i] = 'p';
                                }
                            }
                        }
                    }
                }

                const c1 = formatInitialGrapheme(selectedInitials[0]);
                const c2 = formatInitialGrapheme(selectedInitials[1]);
                const c3 = formatInitialGrapheme(selectedInitials[2]);

                const c5 = selectedFinals[0];
                const c6 = selectedFinals[1];
                const c7 = selectedFinals[2];

                let daySuffix = "";
                if (allowSuffixes && !hasVowelDigraphs) {
                    const suffixes = ['ly', 'ed', 'ing'];
                    daySuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
                }

                dayVowelList.forEach(vowelRaw => {
                    const vowel = vowelRaw.toLowerCase();
                    const isSplit = vowel.includes('_');

                    if (isSplit) {
                        const parts = vowel.split('_');
                        const v1 = parts[0] || vowel;
                        const v2 = parts[1] || 'e';
                        recipe.slides.push({
                            noteId: "[blendingBoard_split]",
                            replacements: {
                                "{{1}}": c1,
                                "{{2}}": c2,
                                "{{3}}": c3,
                                "{{4}}": v1,
                                "{{5}}": c5,
                                "{{6}}": c6,
                                "{{7}}": c7,
                                "{{8}}": v2
                            }
                        });
                    } else {
                        recipe.slides.push({
                            noteId: "[blendingBoard]",
                            replacements: {
                                "{{1}}": c1,
                                "{{2}}": c2,
                                "{{3}}": c3,
                                "{{4}}": vowel,
                                "{{5}}": c5,
                                "{{6}}": c6,
                                "{{7}}": c7,
                                "{{8}}": daySuffix
                            }
                        });
                    }
                });
            }

            else if (item.defKey === 'sectShortVowelBB') {
                const useIntro = data.useIntro !== false && data.weekly?.useIntro !== false;
                const slidesPerDay = parseInt(data.slidesPerDay !== undefined ? data.slidesPerDay : (data.weekly?.slidesPerDay !== undefined ? data.weekly.slidesPerDay : 1)) || 1;

                if (useIntro) {
                    recipe.slides.push({ noteId: "[shortVowel_all]" });
                }

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

                const currentPhonicsIdx = SOUNDS_WRITE_LEVELS.indexOf(globalSettings.phonicsLevel);
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

                let availInitial = initialPool.length >= 1 ? shuffleArray([...initialPool]) : shuffleArray([...defaultInitial]);
                let availFinal = finalPool.length >= 1 ? shuffleArray([...finalPool]) : shuffleArray([...defaultFinal]);

                for (let s = 0; s < slidesPerDay; s++) {
                    let initGrapheme = availInitial[s % availInitial.length] || 'p';
                    let finalGrapheme = availFinal[s % availFinal.length] || 't';

                    let tryCount = 0;
                    while (isShortVowelOffensive(initGrapheme, finalGrapheme) && tryCount < 20) {
                        tryCount++;
                        initGrapheme = availInitial[(s + tryCount) % availInitial.length] || 'p';
                    }

                    recipe.slides.push({
                        noteId: "[shortVowelBlendingBoard]",
                        replacements: {
                            "{{1}}": formatGrapheme(initGrapheme),
                            "{{2}}": formatGrapheme(finalGrapheme)
                        }
                    });
                }
            }

            else if (item.defKey === 'sectD') {
                const wordsStr = data.words || data.weekly?.words || "";
                let wordsArray = wordsStr.split(",").map(w => w.trim()).filter(w => w);
                wordsArray = shuffleArray(wordsArray);
                
                wordsArray.forEach(w => {
                    recipe.slides.push({
                        noteId: "[heartWords_stimulus]",
                        replacements: { "{{a}}": w }
                    });
                });

                const writeIt = data[day]?.writeIt;
                const writeItWordsStr = data[day]?.writeItWords || "";
                
                if (writeIt && writeItWordsStr) {
                    let writeArray = writeItWordsStr.split(",").map(w => w.trim()).filter(w => w);
                    writeArray.forEach(w => {
                        recipe.slides.push({
                            noteId: "[heartWords_write]",
                            replacements: { "{{a}}": w }
                        });
                        recipe.slides.push({
                            noteId: "[heartWords_write_blank]"
                        });
                    });
                }
            }

            else if (item.defKey === 'sectHFW') {
                const wordsStr = data.words || data.weekly?.words || "";
                let wordsArray = wordsStr.split(",").map(w => w.trim()).filter(w => w);
                wordsArray = shuffleArray(wordsArray);
                
                wordsArray.forEach(w => {
                    recipe.slides.push({
                        noteId: "[HFW_stimulus]",
                        replacements: { "{{a}}": w }
                    });
                });

                const writeIt = data[day]?.writeIt;
                const writeItWordsStr = data[day]?.writeItWords || "";
                
                if (writeIt && writeItWordsStr) {
                    let writeArray = writeItWordsStr.split(",").map(w => w.trim()).filter(w => w);
                    writeArray.forEach(w => {
                        recipe.slides.push({
                            noteId: "[HFW_write]",
                            replacements: { "{{a}}": w }
                        });
                        recipe.slides.push({
                            noteId: "[HFW_blank]"
                        });
                    });
                }
            }

            else if (item.defKey === 'sectE') {
                const wordsStr = data[day]?.words || "";
                let wordsArray = wordsStr.split(",").map(w => w.trim()).filter(w => w);
                
                wordsArray.forEach(w => {
                    let isAlien = w.endsWith("*");
                    let cleanWord = isAlien ? w.slice(0, -1) : w;
                    recipe.slides.push({
                        noteId: isAlien ? "[wordReading_alien_stimulus]" : "[wordReading_stimulus]",
                        replacements: { "{{word}}": cleanWord }
                    });
                });
            }

            else if (item.defKey === 'sectReadWordWriteWord') {
                const isDiff = data.differentiate === true || data.weekly?.differentiate === true;

                if (isDiff) {
                    let diffEntries = Array.isArray(data[day]?.diffEntries) ? data[day].diffEntries : null;
                    if (!diffEntries || diffEntries.length === 0) {
                        const mildStr = data[day]?.mildWords || "";
                        const spicyStr = data[day]?.spicyWords || "";
                        const mildList = mildStr.split(",").map(t => t.trim()).filter(Boolean).map(parseWordWithPhonemes);
                        const spicyList = spicyStr.split(",").map(t => t.trim()).filter(Boolean).map(parseWordWithPhonemes);
                        const maxLen = Math.max(mildList.length, spicyList.length);
                        diffEntries = [];
                        for (let i = 0; i < maxLen; i++) {
                            const mildItem = mildList[i] || null;
                            const spicyItem = spicyList[i] || null;
                            diffEntries.push({
                                mildWord: mildItem ? mildItem.word : "",
                                mildSymbols: mildItem && mildItem.count ? formatPhonemeSymbols(mildItem.count) : "",
                                spicyWord: spicyItem ? spicyItem.word : "",
                                spicySymbols: spicyItem && spicyItem.count ? formatPhonemeSymbols(spicyItem.count) : ""
                            });
                        }
                    }

                    diffEntries.forEach(entry => {
                        const mildWord = entry.mildWord || "";
                        const spicyWord = entry.spicyWord || "";
                        const mildSymbols = formatPhonemeSymbols(entry.mildSymbols) || (mildWord ? formatPhonemeSymbols(mildWord.length) : "");
                        const spicySymbols = formatPhonemeSymbols(entry.spicySymbols) || (spicyWord ? formatPhonemeSymbols(spicyWord.length) : "");

                        if (mildWord || spicyWord) {
                            recipe.slides.push({
                                noteId: "[wordReadWrite_diff]",
                                replacements: {
                                    "{{mild}}": mildWord,
                                    "{{spicy}}": spicyWord
                                }
                            });
                            recipe.slides.push({
                                noteId: "[wordReadWrite_diff]",
                                replacements: {
                                    "{{mild}}": mildSymbols,
                                    "{{spicy}}": spicySymbols
                                }
                            });
                        }
                    });
                } else {
                    let entries = Array.isArray(data[day]?.entries) ? data[day].entries : null;
                    if (!entries || entries.length === 0) {
                        const wordsStr = data[day]?.words || "";
                        const wordsList = wordsStr.split(",").map(t => t.trim()).filter(Boolean).map(parseWordWithPhonemes);
                        entries = wordsList.map(itemObj => ({
                            word: itemObj.word,
                            symbols: itemObj.count ? formatPhonemeSymbols(itemObj.count) : ""
                        }));
                    }

                    entries.forEach(entry => {
                        const word = entry.word || "";
                        const symbols = formatPhonemeSymbols(entry.symbols) || (word ? formatPhonemeSymbols(word.length) : "—");
                        if (word) {
                            recipe.slides.push({
                                noteId: "[wordReadWrite]",
                                replacements: {
                                    "{{word}}": word
                                }
                            });
                            recipe.slides.push({
                                noteId: "[wordReadWrite]",
                                replacements: {
                                    "{{word}}": symbols
                                }
                            });
                        }
                    });
                }
            }

            else if (item.defKey === 'sectF') {
                recipe.slides.push({ noteId: "[audDiscrim_instruction_ae]" });
                
                const pair = data[day]?.pair || "Pen/Pan";
                const map = {
                    "Pen/Pan": "[audDiscrim_penPan]",
                    "Pat/Pet": "[audDiscrim_patPet]",
                    "Marry/Merry": "[audDiscrim_marryMerry]",
                    "Axe/Ex": "[audDiscrim_axeX]",
                    "Al/L": "[audDiscrim_alL]"
                };
                recipe.slides.push({ noteId: map[pair] || "[audDiscrim_penPan]" });
            }

            else if (item.defKey === 'sectG') {
                let letter = data[day]?.letter || "";
                letter = letter.trim().toLowerCase();
                if (letter) {
                    recipe.slides.push({ noteId: `[writeLetter_${letter}]` });
                }
            }

            else if (item.defKey === 'sectH') {
                recipe.slides.push({
                    noteId: "[vocabulary_stimulus]",
                    replacements: {
                        "{{title}}": data[day]?.title || "",
                        "{{body}}": data[day]?.body || ""
                    }
                });
            }

            else if (item.defKey === 'sectI') {
                let sent = data[day]?.sent || "The cat sat on Sam";
                let style = data[day]?.style || "Pyramid";
                
                if (style === "Pyramid") {
                    recipe.slides.push({
                        noteId: "[sentenceRead_pyramid_stimulus]",
                        replacements: { "{{sent}}": buildPyramid(sent) }
                    });
                } else {
                    recipe.slides.push({
                        noteId: "[sentenceRead_pic_stimulus]",
                        replacements: { "{{sent}}": sent }
                    });
                }
            }

            else if (item.defKey === 'sectJ') {
                recipe.slides.push({
                    noteId: "[finishSentence_stimulus]",
                    replacements: { "{{sent}}": data[day]?.sent || "" }
                });
            }

            else if (item.defKey === 'sectK') {
                recipe.slides.push({ noteId: "[labelAndSentence_instructions]" });
                recipe.slides.push({
                    noteId: "[labelAndSentence_stimulus]",
                    injectNotes: data[day]?.prompt || ""
                });
            }

            else if (item.defKey === 'sectSimpleCompound') {
                const isIncludeInst = data.includeInstructions !== false && data.weekly?.includeInstructions !== false;

                if (isIncludeInst) {
                    recipe.slides.push({ noteId: "[simpleOrCompound_inst]" });
                    recipe.slides.push({ noteId: "[simpleOrCompound_cc]" });
                }

                let sentences = data[day]?.sentences;
                if (!Array.isArray(sentences) || sentences.length === 0) {
                    if (data[day]?.sent) {
                        sentences = [{ sent: data[day].sent, answer: data[day].answer || 'simple' }];
                    } else {
                        sentences = [];
                    }
                }

                sentences.forEach(sObj => {
                    const sentText = (sObj.sent || '').trim();
                    const ansText = (sObj.answer || 'simple').toLowerCase().trim();
                    if (sentText) {
                        recipe.slides.push({
                            noteId: "[simpleOrCompound_stim]",
                            replacements: {
                                "{{sent}}": sentText,
                                "{{answer}}": ansText
                            }
                        });
                    }
                });
            }

            else if (item.defKey === 'sectSentenceTypes') {
                const sentenceType = data.sentenceType || data.weekly?.sentenceType || 'Imperative';
                const definition = data.definition !== undefined ? data.definition : (data.weekly?.definition !== undefined ? data.weekly.definition : (SENTENCE_TYPE_DEFINITIONS[sentenceType] || ''));
                const sent1 = data[day]?.sent1 !== undefined ? data[day].sent1 : '';
                const sent2 = data[day]?.sent2 !== undefined ? data[day].sent2 : '';

                recipe.slides.push({
                    noteId: "[sentenceType_def]",
                    replacements: {
                        "{{type}}": sentenceType,
                        "{{def}}": definition
                    }
                });

                recipe.slides.push({
                    noteId: "[sentenceType_stimulus]",
                    replacements: {
                        "{{type}}": sentenceType,
                        "{{sent1}}": sent1,
                        "{{sent2}}": sent2
                    }
                });
            }

            else if (item.defKey === 'sectSimpleSentences') {
                const sentText = (data[day]?.sent !== undefined && data[day]?.sent !== '') 
                    ? data[day].sent 
                    : 'Sam kicked the ball.';

                recipe.slides.push({
                    noteId: "[simpleSentence_def]"
                });

                recipe.slides.push({
                    noteId: "[simpleSentence_stim]",
                    replacements: {
                        "{{sent}}": sentText
                    }
                });
            }

            else if (item.defKey === 'sectCompoundSentences') {
                const sentText = (data[day]?.sent !== undefined && data[day]?.sent !== '') 
                    ? data[day].sent 
                    : 'Sam kicked the ball and I caught it.';

                recipe.slides.push({
                    noteId: "[compoundSentence_def]"
                });

                recipe.slides.push({
                    noteId: "[compoundSentence_stim]",
                    replacements: {
                        "{{sent}}": sentText
                    }
                });
            }

            else if (item.defKey === 'sectWriteSimpleCompoundSentence') {
                recipe.slides.push({
                    noteId: "[WriteSimpleCompoundSentence]"
                });
            }

            else if (item.defKey === 'generic' || item.defKey === 'placeholder' || item.defKey === 'numeracyPlaceholder') {
                recipe.slides.push({
                    noteId: "[generic_stimulus]",
                    replacements: { "{{content}}": data[day]?.word || "" },
                    injectNotes: data[day]?.notes || ""
                });
            }

            else if (item.defKey === 'sectHundredsChart') {
                const rawChartSize = data.chartSize || data.weekly?.chartSize || '1–100';
                const chartSize = String(rawChartSize).includes('120') ? '1–120' : '1–100';
                const noteId = chartSize === '1–120' ? '[hundredsChart120]' : '[hundredsChart]';
                const multiplesOf = data.multiplesOf !== undefined ? data.multiplesOf : (data.weekly?.multiplesOf !== undefined ? data.weekly.multiplesOf : '6');
                const defRange = getHundredsChartDefaultRange(multiplesOf, chartSize);

                const rangeMin = data.rangeMin !== undefined ? data.rangeMin : (data.weekly?.rangeMin !== undefined ? data.weekly.rangeMin : defRange.min);
                const rangeMax = data.rangeMax !== undefined ? data.rangeMax : (data.weekly?.rangeMax !== undefined ? data.weekly.rangeMax : defRange.max);
                const progression = data.progression || data.weekly?.progression || 'single';
                const instructions = data.instructions !== undefined ? data.instructions : (data.weekly?.instructions !== undefined ? data.weekly.instructions : getHundredsChartInstruction(multiplesOf));

                const highlightedSet = getHundredsChartHighlightedNumbers(multiplesOf, rangeMin, rangeMax, chartSize);
                const highlightNumbers = Array.from(highlightedSet).sort((a, b) => a - b);

                if (progression === 'animate' && highlightNumbers.length > 0) {
                    for (let i = 0; i < highlightNumbers.length; i++) {
                        const stepNumbers = highlightNumbers.slice(0, i + 1);
                        recipe.slides.push({
                            noteId: noteId,
                            replacements: {
                                "{{content}}": instructions
                            },
                            actions: [
                                {
                                    target: "tableCell",
                                    matchText: stepNumbers.map(n => n.toString()),
                                    fill: "#eeff41"
                                }
                            ],
                            highlightNumbers: stepNumbers,
                            highlightColor: "#eeff41"
                        });
                    }
                } else {
                    recipe.slides.push({
                        noteId: noteId,
                        replacements: {
                            "{{content}}": instructions
                        },
                        actions: highlightNumbers.length > 0 ? [
                            {
                                target: "tableCell",
                                matchText: highlightNumbers.map(n => n.toString()),
                                fill: "#eeff41"
                            }
                        ] : [],
                        highlightNumbers: highlightNumbers,
                        highlightColor: "#eeff41"
                    });
                }
            }

            else if (item.defKey === 'customisable') {
                const templateTag = (data.templateTag || '').trim();
                if (templateTag) {
                    let replacements = {};
                    if (Array.isArray(data.contents)) {
                        data.contents.forEach(c => {
                            let tag = (c.tag || '').trim();
                            if (tag) {
                                replacements[tag] = c.value || '';
                            }
                        });
                    }
                    let slideObj = { noteId: templateTag };
                    if (Object.keys(replacements).length > 0) {
                        slideObj.replacements = replacements;
                    }
                    recipe.slides.push(slideObj);
                }
            }

            else if (item.defKey === 'finished') {
                recipe.slides.push({ noteId: "[finished]" });
            }
        });
    });

    return recipe;
}
