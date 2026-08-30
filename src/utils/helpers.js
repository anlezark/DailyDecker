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
    return Math.random() < 0.3 ? str.toUpperCase() : str.toLowerCase();
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
