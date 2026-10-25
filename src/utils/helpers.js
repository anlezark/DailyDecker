// Utility helper functions
import { DAYS, DAY_ABBR } from '../data/constants.js';

export function showToast(message, iconClass = 'fa-circle-info text-amber-400') {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.className = 'fixed bottom-5 right-5 bg-slate-800 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl z-50 transition-all transform translate-y-10 opacity-0 pointer-events-none flex items-center gap-2 border border-slate-700';
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> ${message}`;
    toast.classList.remove('translate-y-10', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
    }, 3200);
}

export function extractPresentationId(input) {
    if (!input) return '';
    const match = input.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
        return match[1];
    }
    return input.trim();
}

export function checkGoogleSlidesAccess(templateId) {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            resolve(false);
        }, 4000);

        const img = new Image();
        img.onload = () => {
            clearTimeout(timeout);
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                resolve(true);
            } else {
                resolve(false);
            }
        };
        img.onerror = () => {
            clearTimeout(timeout);
            resolve(false);
        };
        img.src = `https://drive.google.com/thumbnail?id=${encodeURIComponent(templateId)}&sz=w320&t=${Date.now()}`;
    });
}

export function shuffleArray(array) {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export function randomizeCasing(str) {
    if (!str || typeof str !== 'string') return str;
    const trimmed = str.trim();
    if (trimmed.length === 1) {
        return Math.random() < 0.3 ? trimmed.toUpperCase() : trimmed.toLowerCase();
    }
    return trimmed.toLowerCase();
}

export function parseWordWithPhonemes(str) {
    if (!str) return { word: '', count: 0 };
    const parts = str.trim().split(/\s+/);
    if (parts.length > 1 && !isNaN(parts[parts.length - 1])) {
        const countStr = parts.pop();
        const count = parseInt(countStr, 10);
        return { word: parts.join(' '), count: isNaN(count) ? 0 : count };
    }
    return { word: str.trim(), count: 0 };
}

export function hasUnexpectedPhonemeSymbol(rawInput) {
    if (rawInput === undefined || rawInput === null) return false;
    const str = String(rawInput).trim();
    if (!str) return false;
    if (/^\d+$/.test(str)) return false; // valid number
    const cleaned = str.replace(/[\s,]+/g, '');
    for (const ch of cleaned) {
        if (
            ch === '.' || ch === '*' || ch === '•' ||
            ch === '-' || ch === '_' || ch === '–' || ch === '—' || ch === '−' || ch === '‑' || ch === '‒' || ch === '―' ||
            ch === '~' || ch === '〰' ||
            ch === '^' || ch === '∧' ||
            ch === '/' || ch === '(' || ch === ')' || ch === '‿'
        ) {
            continue;
        }
        return true;
    }
    return false;
}

export function formatPhonemeSymbols(rawInput) {
    if (rawInput === undefined || rawInput === null) return '';
    if (typeof rawInput === 'number' || (/^\d+$/.test(String(rawInput).trim()))) {
        const n = parseInt(rawInput, 10);
        if (n > 0) {
            return Array(n).fill('—').join(' ');
        }
        return '';
    }
    const str = String(rawInput);
    const cleaned = str.replace(/[\s,]+/g, '');
    if (!cleaned) return '';

    const symbols = [];
    for (const ch of cleaned) {
        if (ch === '.' || ch === '*' || ch === '•') {
            symbols.push('•');
        } else if (ch === '-' || ch === '_' || ch === '–' || ch === '—' || ch === '−' || ch === '‑' || ch === '‒' || ch === '―') {
            symbols.push('—');
        } else if (ch === '~' || ch === '〰') {
            symbols.push('〰');
        } else if (ch === '^' || ch === '∧') {
            symbols.push('∧');
        } else if (ch === '/' || ch === '(' || ch === ')' || ch === '‿') {
            symbols.push('‿');
        } else {
            symbols.push(ch);
        }
    }
    return symbols.join(' ');
}

export function getItemIncludedDays(item) {
    if (!item) return { 'Monday': true, 'Tuesday': true, 'Wednesday': true, 'Thursday': true, 'Friday': true };
    if (!item.includedDays) {
        item.includedDays = { 'Monday': true, 'Tuesday': true, 'Wednesday': true, 'Thursday': true, 'Friday': true };
    }
    DAYS.forEach(day => {
        if (item.includedDays[day] === undefined) {
            item.includedDays[day] = true;
        }
    });
    return item.includedDays;
}

export function getLimitedDaysBadge(item) {
    if (!item || item.defKey === 'mainIntro' || item.defKey === 'dayDivider' || item.defKey === 'dayDividerPlain' || item.defKey === 'finished') {
        return null;
    }
    const daysObj = getItemIncludedDays(item);
    const activeAbbrs = DAYS.filter(d => daysObj[d] !== false).map(d => DAY_ABBR[d]);
    if (activeAbbrs.length === 5) {
        return null;
    }
    if (activeAbbrs.length === 0) {
        return '[None]';
    }
    return `[${activeAbbrs.join(' ')}]`;
}

export function getHundredsChartInstruction(multiplesOf) {
    if (!multiplesOf || multiplesOf === 'Blank') {
        return 'Hundreds Chart';
    }
    if (multiplesOf === '2 (even)') {
        return 'Skip count by 2s (even numbers).';
    }
    if (multiplesOf === '2 (odd)') {
        return 'Skip count by 2s (odd numbers).';
    }
    return `Skip count by ${multiplesOf}s.`;
}

export function getHundredsChartMax(chartSize = '1–100') {
    return String(chartSize).includes('120') ? 120 : 100;
}

export function getHundredsChartMultiplesList(multiplesOf, chartSize = '1–100') {
    const chartMax = getHundredsChartMax(chartSize);
    const list = [];

    if (!multiplesOf || multiplesOf === 'Blank') {
        return list;
    }

    if (multiplesOf === '2 (even)') {
        for (let n = 2; n <= chartMax; n += 2) {
            list.push(n);
        }
    } else if (multiplesOf === '2 (odd)') {
        for (let n = 1; n <= chartMax; n += 2) {
            list.push(n);
        }
    } else {
        const mult = parseInt(multiplesOf, 10);
        if (!isNaN(mult) && mult > 0) {
            for (let n = mult; n <= chartMax; n += mult) {
                list.push(n);
            }
        }
    }
    return list;
}

export function getHundredsChartDefaultRange(multiplesOf, chartSize = '1–100') {
    const list = getHundredsChartMultiplesList(multiplesOf, chartSize);
    if (list.length === 0) {
        return { min: 1, max: getHundredsChartMax(chartSize) };
    }
    return { min: list[0], max: list[list.length - 1] };
}

export function getHundredsChartHighlightedNumbers(multiplesOf, rangeMin, rangeMax, chartSize = '1–100') {
    const list = getHundredsChartMultiplesList(multiplesOf, chartSize);
    const highlighted = new Set();

    if (list.length === 0) {
        return highlighted;
    }

    const defaultMin = list[0];
    const defaultMax = list[list.length - 1];
    const parsedMin = parseInt(rangeMin, 10);
    const parsedMax = parseInt(rangeMax, 10);

    const min = !isNaN(parsedMin) && list.includes(parsedMin) ? parsedMin : defaultMin;
    const max = !isNaN(parsedMax) && list.includes(parsedMax) ? parsedMax : defaultMax;

    for (const n of list) {
        if (n >= min && n <= max) {
            highlighted.add(n);
        }
    }
    return highlighted;
}

export function generateSingleMabNumber(digits = 2, easyMode = false) {
    const dCount = Math.min(4, Math.max(1, parseInt(digits, 10) || 1));
    let result = 0;

    for (let pos = 0; pos < dCount; pos++) {
        const isLeading = (pos === dCount - 1);
        let min = (easyMode || isLeading) ? 1 : 0;
        let max = 9;

        if (pos === 0) {
            // Ones
            max = easyMode ? 6 : 9;
        } else if (pos === 1) {
            // Tens
            max = easyMode ? 4 : 9;
        } else if (pos === 2) {
            // Hundreds (overall <= 4, easyMode <= 2)
            max = easyMode ? 2 : 4;
        } else if (pos === 3) {
            // Thousands (overall <= 4, easyMode <= 2)
            max = easyMode ? 2 : 4;
        }

        const digit = Math.floor(Math.random() * (max - min + 1)) + min;
        result += digit * Math.pow(10, pos);
    }

    return Math.max(1, result);
}

export function generateMabSmartFillNumbers(maxPlaceValue = 2, slidesPerDay = 6, easyMode = false) {
    const pv = Math.min(4, Math.max(1, parseInt(maxPlaceValue, 10) || 2));
    const count = Math.min(30, Math.max(1, parseInt(slidesPerDay, 10) || 6));
    const lowerPv = pv > 1 ? pv - 1 : 1;

    const numbers = [];
    const used = new Set();

    for (let i = 0; i < count; i++) {
        const targetDigits = (i < 2) ? lowerPv : pv;
        let candidate = generateSingleMabNumber(targetDigits, easyMode);
        let attempts = 0;
        while (used.has(candidate) && attempts < 35) {
            candidate = generateSingleMabNumber(targetDigits, easyMode);
            attempts++;
        }
        used.add(candidate);
        numbers.push(candidate);
    }

    return numbers.join(', ');
}

export function parseMabNumbersList(rawStr) {
    if (rawStr === undefined || rawStr === null) return [];
    const str = String(rawStr).trim();
    if (!str) return [];

    return str
        .split(',')
        .map(part => {
            const cleaned = part.replace(/[^0-9]/g, '');
            if (!cleaned) return null;
            const val = parseInt(cleaned, 10);
            if (isNaN(val) || val <= 0) return null;
            return Math.min(9999, val);
        })
        .filter(val => val !== null);
}

export function decomposeMabNumber(num) {
    const n = Math.min(9999, Math.max(0, parseInt(num, 10) || 0));
    return {
        value: n,
        thousands: Math.floor(n / 1000),
        hundreds: Math.floor((n % 1000) / 100),
        tens: Math.floor((n % 100) / 10),
        ones: n % 10
    };
}

/**
 * Standardized Ten Frame Utilities
 * Reusable across any Ten Frame activity (Write/Say the number, Friends of 10, Addition, Subitising, etc.)
 */
export function getTenFrameNumberRange(minFrames = 1, maxFrames = 2) {
    let minF = Math.min(10, Math.max(1, parseInt(minFrames, 10) || 1));
    let maxF = Math.min(10, Math.max(1, parseInt(maxFrames, 10) || 2));
    if (minF > maxF) {
        const tmp = minF;
        minF = maxF;
        maxF = tmp;
    }
    const minNum = (minF - 1) * 10 + 1;
    const maxNum = maxF * 10;
    return {
        minFrames: minF,
        maxFrames: maxF,
        minNum,
        maxNum
    };
}

export function generateTenFrameSmartFillNumbers(minFrames = 1, maxFrames = 2, slidesPerDay = 6) {
    const { minNum, maxNum } = getTenFrameNumberRange(minFrames, maxFrames);
    const count = Math.min(30, Math.max(1, parseInt(slidesPerDay, 10) || 6));
    const poolSize = Math.max(1, maxNum - minNum + 1);

    const numbers = [];
    const used = new Set();

    for (let i = 0; i < count; i++) {
        if (used.size >= poolSize) {
            used.clear();
        }
        let candidate = Math.floor(Math.random() * poolSize) + minNum;
        let attempts = 0;
        while (used.has(candidate) && attempts < 40) {
            candidate = Math.floor(Math.random() * poolSize) + minNum;
            attempts++;
        }
        used.add(candidate);
        numbers.push(candidate);
    }

    return numbers.join(', ');
}

export function parseTenFrameNumbersList(rawStr) {
    if (rawStr === undefined || rawStr === null) return [];
    const str = String(rawStr).trim();
    if (!str) return [];

    return str
        .split(',')
        .map(part => {
            const cleaned = part.replace(/[^0-9]/g, '');
            if (!cleaned) return null;
            const val = parseInt(cleaned, 10);
            if (isNaN(val) || val <= 0) return null;
            return Math.min(100, val);
        })
        .filter(val => val !== null);
}

export function buildDailyTenFrameOrientations(count = 6, orientationPref = 'horizontal') {
    const total = Math.max(1, parseInt(count, 10) || 1);
    const pref = String(orientationPref || 'horizontal').toLowerCase();

    if (pref === 'vertical') {
        return Array(total).fill('vertical');
    }
    if (pref === 'horizontal') {
        return Array(total).fill('horizontal');
    }

    // Balanced random: ~half horizontal and ~half vertical across the daily set
    const half = Math.floor(total / 2);
    const list = [];
    for (let i = 0; i < half; i++) {
        list.push('horizontal');
        list.push('vertical');
    }
    if (total % 2 === 1) {
        list.push(Math.random() < 0.5 ? 'horizontal' : 'vertical');
    }
    return shuffleArray(list);
}

export function getTenFrameCellCoordinates(dotIndex, orientation = 'horizontal', fillMode = 'standard') {
    const idx = Math.min(9, Math.max(0, parseInt(dotIndex, 10) || 0));
    const isVertical = String(orientation).toLowerCase() === 'vertical';
    const mode = String(fillMode || 'standard').toLowerCase();

    if (mode === 'pairwise') {
        if (isVertical) {
            return { row: Math.floor(idx / 2), col: idx % 2 };
        }
        return { row: idx % 2, col: Math.floor(idx / 2) };
    }

    // Standard fill:
    // Horizontal (5 cols x 2 rows): 1..5 top row left-to-right, 6..10 bottom row left-to-right
    // Vertical (2 cols x 5 rows): 1..5 left col top-to-bottom, 6..10 right col top-to-bottom
    if (isVertical) {
        return {
            row: idx % 5,
            col: Math.floor(idx / 5)
        };
    }
    return {
        row: Math.floor(idx / 5),
        col: idx % 5
    };
}

export function buildStandardTenFramesForNumber(num, options = {}) {
    const n = Math.min(100, Math.max(1, parseInt(num, 10) || 1));
    const frameCount = Math.max(1, Math.ceil(n / 10));
    const color = options.color || '#ef4444';
    const frames = [];
    let remaining = n;

    for (let f = 0; f < frameCount; f++) {
        const dots = Math.min(10, Math.max(0, remaining));
        frames.push({
            count: dots,
            color
        });
        remaining -= dots;
    }

    return frames;
}

export const TEN_FRAME_BLUE = '#3b82f6';
export const TEN_FRAME_ORANGE = '#f97316';

export function buildFriendsOf10TenFrames(firstNum, secondNum) {
    const a = Math.min(10, Math.max(0, parseInt(firstNum, 10) || 0));
    const b = Math.min(10, Math.max(0, parseInt(secondNum, 10) || 0));

    const combinedCells = [];
    for (let i = 0; i < a && combinedCells.length < 10; i++) {
        combinedCells.push(TEN_FRAME_BLUE);
    }
    for (let j = 0; j < b && combinedCells.length < 10; j++) {
        combinedCells.push(TEN_FRAME_ORANGE);
    }

    return {
        a,
        b,
        sum: a + b,
        equation: `${a} + ${b} = ${a + b}`,
        zone01Frame: { count: a, color: TEN_FRAME_BLUE },
        zone02Frame: { count: b, color: TEN_FRAME_ORANGE },
        zone03Frame: { cells: combinedCells, color: TEN_FRAME_BLUE }
    };
}

export function parseNumeralList(str) {
    if (!str) return [];
    return String(str)
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

export function generateSayNumeralNumbers(count = 6, min = 1, max = 29) {
    let minVal = parseInt(min, 10);
    let maxVal = parseInt(max, 10);
    if (isNaN(minVal)) minVal = 1;
    if (isNaN(maxVal)) maxVal = 29;
    if (minVal > maxVal) {
        const tmp = minVal;
        minVal = maxVal;
        maxVal = tmp;
    }
    const numItems = Math.max(1, parseInt(count, 10) || 6);

    const pool = [];
    for (let i = minVal; i <= maxVal; i++) {
        pool.push(i);
    }

    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    if (pool.length >= numItems) {
        return pool.slice(0, numItems);
    }

    // If pool is smaller than required count, repeat uniquely
    const result = [...pool];
    while (result.length < numItems) {
        const rand = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
        result.push(rand);
    }
    return result;
}

export const TEN_FRAME_RED = '#ef4444';

export function buildFriendsOf20Frames(firstNum, secondNum) {
    const a = Math.min(20, Math.max(0, parseInt(firstNum, 10) || 0));
    const b = 20 - a;

    // 2 ten frames, total 20 cells
    // First 'a' cells are blue, remaining 'b' cells are red (using standard fill order)
    const frame1Cells = [];
    for (let i = 0; i < 10; i++) {
        frame1Cells.push(i < a ? TEN_FRAME_BLUE : TEN_FRAME_RED);
    }

    const frame2Cells = [];
    for (let i = 0; i < 10; i++) {
        frame2Cells.push((10 + i) < a ? TEN_FRAME_BLUE : TEN_FRAME_RED);
    }

    return [
        { cells: frame1Cells, fillMode: 'standard', color: TEN_FRAME_BLUE },
        { cells: frame2Cells, fillMode: 'standard', color: TEN_FRAME_BLUE }
    ];
}

export function generateFriendsOf20Pairs(count = 21, order = 'inOrder') {
    let numCount = count === 'all' || count === undefined || count === null ? 21 : parseInt(count, 10);
    if (isNaN(numCount)) numCount = 21;
    numCount = Math.min(21, Math.max(1, numCount));

    const isRandomOrder = String(order || 'inOrder').toLowerCase() === 'random';

    let pairs = [];

    if (numCount >= 21) {
        // All 21 pairs: (0,20) to (20,0)
        for (let i = 0; i <= 20; i++) {
            pairs.push({ a: i, b: 20 - i });
        }
    } else if (numCount <= 11) {
        // Pick numCount distinct unordered pairs from the 11 sum pairs {0,20}..{10,10}
        const baseIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const shuffled = shuffleArray(baseIndices);
        const selected = shuffled.slice(0, numCount);

        selected.forEach(x => {
            if (x === 10) {
                pairs.push({ a: 10, b: 10 });
            } else {
                const flip = Math.random() < 0.5;
                pairs.push(flip ? { a: x, b: 20 - x } : { a: 20 - x, b: x });
            }
        });
    } else {
        // numCount > 11: Must include all 11 distinct unordered pairs first, then add (numCount - 11) inverse pairs
        const inversePool = [];
        for (let x = 0; x < 10; x++) {
            const flip = Math.random() < 0.5;
            if (flip) {
                pairs.push({ a: x, b: 20 - x });
                inversePool.push({ a: 20 - x, b: x });
            } else {
                pairs.push({ a: 20 - x, b: x });
                inversePool.push({ a: x, b: 20 - x });
            }
        }
        pairs.push({ a: 10, b: 10 }); // 11th pair

        const neededInverses = numCount - 11;
        const shuffledInverses = shuffleArray(inversePool);
        for (let i = 0; i < neededInverses; i++) {
            pairs.push(shuffledInverses[i]);
        }
    }

    if (isRandomOrder) {
        return shuffleArray(pairs);
    }

    // In order: sort by 'a' ascending
    return pairs.sort((p1, p2) => p1.a - p2.a);
}

