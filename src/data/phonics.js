// Phonics pool and grapheme data for Sounds-Write levels
export const SOUNDS_WRITE_LEVELS = [
    "IC1 (a, i, m, s, t)",
    "IC2 (n, o, p)",
    "IC3 (b, c, g, h)",
    "IC4 (d, e, f, v)",
    "IC5 (k, l, r, u)",
    "IC6 (j, w, z)",
    "IC7 (x, y, ff, ll, ss, zz)",
    "IC8-10 - blends",
    "IC11 - sh",
    "IC11 - ch",
    "IC11 - tch",
    "IC11 - th",
    "IC11 - ck",
    "IC11 - wh",
    "IC11 - ng",
    "IC11 - qu"
];

export const phonicsData = {
    "IC1 (a, i, m, s, t)": ["a", "i", "m", "s", "t"],
    "IC2 (n, o, p)": ["n", "o", "p"],
    "IC3 (b, c, g, h)": ["b", "c", "g", "h"],
    "IC4 (d, e, f, v)": ["d", "e", "f", "v"],
    "IC5 (k, l, r, u)": ["k", "l", "r", "u"],
    "IC6 (j, w, z)": ["j", "w", "z"],
    "IC7 (x, y, ff, ll, ss, zz)": ["x", "y", "ff", "ll", "ss", "zz"],
    "IC8-10 - blends": [],
    "IC11 - sh": ["sh"],
    "IC11 - ch": ["ch"],
    "IC11 - tch": ["tch"],
    "IC11 - th": ["th"],
    "IC11 - ck": ["ck"],
    "IC11 - wh": ["wh"],
    "IC11 - ng": ["ng"],
    "IC11 - qu": ["qu"]
};

export function getPhonicsPoolInfo(phonicsLevel, globalLevel) {
    let selectedPhonicsLevel = phonicsLevel || globalLevel || "IC11 - qu";
    if (selectedPhonicsLevel === "IC11 (sh, ch, tch, th, ck, wh, ng, qu)" || !SOUNDS_WRITE_LEVELS.includes(selectedPhonicsLevel)) {
        selectedPhonicsLevel = "IC11 - qu";
    }
    let currentLevelIdx = SOUNDS_WRITE_LEVELS.indexOf(selectedPhonicsLevel);
    if (currentLevelIdx === -1) {
        currentLevelIdx = SOUNDS_WRITE_LEVELS.length - 1;
    }
    let fullPool = [];
    let currentLevelGraphemes = [];
    
    for (let i = 0; i <= currentLevelIdx; i++) {
        let levelName = SOUNDS_WRITE_LEVELS[i];
        let graphemes = phonicsData[levelName] || [];
        fullPool = fullPool.concat(graphemes);
        if (i === currentLevelIdx) {
            currentLevelGraphemes = graphemes;
        }
    }
    const previousLevelGraphemes = fullPool.filter(g => !currentLevelGraphemes.includes(g));
    return { fullPool, currentLevelGraphemes, previousLevelGraphemes };
}
