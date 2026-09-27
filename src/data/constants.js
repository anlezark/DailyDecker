// Global constant values and configuration
export { SOUNDS_WRITE_LEVELS, phonicsData, getPhonicsPoolInfo } from './phonics.js';

export const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbycp2mKab6-aeq5ls5ykVegwpsxYpPnDiszlU1S30pJ9V-RkHLCCV_CNX6SB5QsVWHl/exec";

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const DAY_ABBR = {
    'Monday': 'M',
    'Tuesday': 'Tu',
    'Wednesday': 'W',
    'Thursday': 'Th',
    'Friday': 'F'
};

export const DEFAULT_TEMPLATE_ID = "12f9hl__t2nghjPeZSO1Ag1P-dLmJXXDKzCSVejT2QbY";
export const NUMERACY_DEFAULT_TEMPLATE_ID = "1gnBku6pZ9ig25AdZD-iCHc0VKOkvjqjmyqbl3xvhPr8";
export const NUMERACY_DEFAULT_TEMPLATE_LABEL = "Default Numeracy Template";
export const STATE_KEY = 'reviewBuilder_v6_state';
export const NUMERACY_STATE_KEY = 'reviewBuilder_v6_numeracy_state';


export const SENTENCE_TYPE_DEFINITIONS = {
    'Declarative': 'Make a statement or express an idea.\ne.g.: "The cat is big."',
    'Imperative': 'Give a command, instruction, or request.\ne.g.: "Pick up your jumper."',
    'Interrogative': 'Ask a question.\ne.g. "Can I have your juice?"',
    'Exclamative': 'Express strong feeling or emotion.\ne.g. "How funny you look!"'
};

export const COMMON_DIGRAPHS = [
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

export const STANDARD_STARTER_DESCRIPTION = 'This is a Deck Starter. Drag this to the Deck Sequencer to load the following set of activities to your deck. This will overwrite any activities currently in your deck sequence.';
