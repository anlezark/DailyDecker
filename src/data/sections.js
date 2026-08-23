// Section definitions metadata
export const SECTION_DEFS = {
    'mainIntro': { 
        title: 'Intro Slide', shortDesc: 'Introduction slide', icon: 'fa-door-open', color: 'text-purple-500', bg: 'bg-purple-100', type: 'static', runOnce: true,
        description: 'This slide appears once in the weekly deck, before the daily sets. It includes key information such as Term, Week, Class.' 
    },
    'expectations': { 
        title: 'General Instructions', shortDesc: 'Expectations and instructions', icon: 'fa-list-check', color: 'text-indigo-500', bg: 'bg-indigo-100', type: 'weekly',
        description: 'The reminder of Daily Review expectations. Options for use of whiteboards and transition music.',
        fields: [{ id: 'style', label: 'Style', type: 'select', options: ['Basic', 'Whiteboards', 'Whiteboards and Music'] }]
    },
    'reciteRecallApplyLisc': {
        title: 'Recite, Recall, Apply and LISC',
        shortDesc: 'Preamble slides',
        icon: 'fa-brain',
        color: 'text-teal-600',
        bg: 'bg-teal-100',
        type: 'weekly',
        description: 'Insert Recite, Recall, Apply slide and LISC slide.',
        fields: [
            { id: 'includeRRA', label: 'Recite, Recall, Apply', type: 'checkbox', default: true },
            { id: 'includeLISC', label: 'LISC', type: 'checkbox', default: true }
        ]
    },
    'dayDivider': { 
        title: 'Day of the Week', shortDesc: 'Day of the week - acts as a visual separator of each day\'s slide set.', icon: 'fa-calendar-day', color: 'text-pink-500', bg: 'bg-pink-100', type: 'static',
        description: 'A day of the week slide. Note this is also a visual divider to help you locate each day\'s slide set.'
    },
    'dayDividerPlain': { 
        title: 'Day of the Week - simple', 
        shortDesc: 'Day of the week - plain layout', 
        icon: 'fa-calendar-days', 
        color: 'text-amber-600', 
        bg: 'bg-amber-100', 
        type: 'static',
        description: 'A day of the week slide. This acts as a visual divider in the slide deck. The simple layout may be more suitable for later stages.'
    },
    'sectA': { 
        title: 'Talk About the Picture', shortDesc: 'Students talk about picture prompt.', icon: 'fa-image', color: 'text-blue-500', bg: 'bg-blue-100', type: 'daily', hasTitleSlideOptions: true,
        description: 'This section includes a picture placeholder for students to practise oral language. Pictures will be inserted in PowerPoint or Google Slides. Write prompts below, which will be inserted in the speakers notes section for reference.',
        fields: [{ id: 'prompt', label: 'Teacher Prompt', type: 'textarea' }]
    },
    'sectB': { 
        title: 'Say the Sound', shortDesc: 'Grapheme recognition', icon: 'fa-bolt', color: 'text-amber-500', bg: 'bg-amber-100', type: 'weekly', hasTitleSlideOptions: true,
        description: 'This section includes a single grapheme on each slide. Students can recite the phoneme. The pool of graphemes used will depend on the level set in Global Settings. There will be one slide per grapheme from the pool, unless you choose to restrict or expand the number of slides below. The most recent phoneme set will always be included.',
        fields: []
    },
    'sectC': { 
        title: 'Read the lines', shortDesc: 'Reading lines of graphemes', icon: 'fa-align-left', color: 'text-emerald-500', bg: 'bg-emerald-100', type: 'weekly', hasTitleSlideOptions: true,
        description: 'Two lines of graphemes based on your current phonics level. They will be randomised for each day of the week.',
        fields: []
    },
    'sectDigraphs': {
        title: 'Digraphs', shortDesc: 'consonant and vowel digraphs', icon: 'fa-spell-check', color: 'text-violet-500', bg: 'bg-violet-100', type: 'weekly', hasTitleSlideOptions: true,
        description: 'This section flashes a digraph slide for students to recite learnt digraphs (or trigraphs, tetragraphs, etc!). Select common digraphs below and/or add further digraphs.',
        fields: []
    },
    'sectShortVowelBB': {
        title: 'Short Vowel Blending Board', shortDesc: 'Blending non-words with short vowels', icon: 'fa-border-all', color: 'text-amber-600', bg: 'bg-amber-100', type: 'weekly', hasTitleSlideOptions: true,
        description: 'Students practice blending different non-words from learnt graphemes across a grid, using the short vowels. Consonants will be automatically generated from your phonics pool.',
        fields: [
            { id: 'useIntro', label: 'Use short vowel intro slide', type: 'checkbox', default: true },
            { id: 'slidesPerDay', label: 'Slides per day', type: 'number', min: 1, default: 1 }
        ]
    },
    'sectBlendingBoard': {
        title: 'Blending Board', shortDesc: 'Blend non-words across a grid.', icon: 'fa-table-cells', color: 'text-indigo-600', bg: 'bg-indigo-100', type: 'mixed', hasTitleSlideOptions: true,
        description: 'Students practice blending different non-words from learnt graphemes across a grid, using the same vowel. Consonants will be automatically generated from your phonics pool. Select vowels to focus on each day. There will be one slide per vowel for each day.',
        weeklyFields: [
            { id: 'allowBlends', label: 'Allow consonant blends', type: 'checkbox', default: false },
            { id: 'allowSuffixes', label: 'Allow suffixes: ly, ed, ing', type: 'checkbox', default: false }
        ],
        dailyFields: [
            { id: 'vowels', label: 'Vowel focus (comma separated)', type: 'text', default: '', placeholder: 'e.g. oa, ow, o_e', helpText: 'use underscore for split digraphs: o_e' }
        ]
    },
    'sectD': {
        title: 'Heart Words', shortDesc: 'Read high-frequency words on a heart.', icon: 'fa-heart', color: 'text-red-500', bg: 'bg-red-100', type: 'mixed', hasTitleSlideOptions: true,
        description: 'This section includes slides with a single high frequency word in a heart on each slide. Include your set of heart words in the text box below, separated by commas. Optionally, the final heart word(s) can be on the "write it" slide for students to write on their whiteboards.\n\nNote: The "High Frequency Words" section is identical, without the fun heart.',
        weeklyFields: [
            { id: 'words', label: 'Heart Words (comma separated)', type: 'textarea', default: 'a, the, is, are, I, am, and, to, we, me, my, she, he, has, have, you, they, was, that, this, for' }
        ],
        dailyFields: [
            { id: 'writeIt', label: 'Include "Write It" slide', type: 'checkbox' },
            { id: 'writeItWords', label: 'Word(s) for Write It slide(s)', type: 'text' }
        ]
    },
    'sectHFW': {
        title: 'High Frequency Words', shortDesc: 'Read high frequency words.', icon: 'fa-font', color: 'text-purple-500', bg: 'bg-purple-100', type: 'mixed', hasTitleSlideOptions: true,
        description: 'This section includes slides with a single high frequency word on each slide. Include your set of words in the text box below, separated by commas. Optionally, the final word(s) can be on the "write it" slide for students to write on their whiteboards.\n\nNote: The "Heart Words" section is identical, except it features a fun heart.',
        weeklyFields: [
            { id: 'words', label: 'Word list (comma separated)', type: 'textarea', default: 'a, the, is, are, I, am, and, to, we, me, my, she, he, has, have, you, they, was, that, this, for' }
        ],
        dailyFields: [
            { id: 'writeIt', label: 'Include "Write It" slide', type: 'checkbox' },
            { id: 'writeItWords', label: 'Word(s) for Write It slide(s)', type: 'text' }
        ]
    },
    'sectE': {
        title: 'Read the Word', shortDesc: 'Say the sounds and read the word.', icon: 'fa-comment-dots', color: 'text-cyan-500', bg: 'bg-cyan-100', type: 'daily', hasTitleSlideOptions: true,
        description: 'This section shows a single word for students to decode. Write a few words below, comma separated. If the word is a "non-word" add an asterisk to use the alien word slide, e.g. hat, dog, fen*.',
        fields: [{ id: 'words', label: 'Words (comma separated)', type: 'text' }]
    },
    'sectReadWordWriteWord': {
        title: 'Read a Word, Write a Word.', shortDesc: 'Show a word than hide the word.', icon: 'fa-spell-check', color: 'text-sky-600', bg: 'bg-sky-100', type: 'mixed', hasTitleSlideOptions: true,
        description: 'This section shows a word on a slide, then replaces the word with lines (underscores) - one per phoneme - for students to write the word on their whiteboards. Specify the words below. Use the differentiate checkbox to allow two words on the slide for a mild/spicy choice.',
        weeklyFields: [
            { id: 'differentiate', label: 'Differentiation: Use two words per slide (mild and spicy)', type: 'checkbox', default: false }
        ],
        dailyFields: [
            { id: 'words', label: 'Word(s)', type: 'text', default: '', placeholder: 'cat 3, drive 4', helpText: 'Type word(s) and number of phonemes. Separate by comma if two or more words.' },
            { id: 'mildWords', label: 'Mild word(s)', type: 'text', default: '', placeholder: 'cat 3, drive 4' },
            { id: 'spicyWords', label: 'Spicy word(s)', type: 'text', default: '', placeholder: 'Use the same number of mild and spicy words.' }
        ]
    },
    'sectF': {
        title: 'Discriminate the Similar Sounds', shortDesc: 'Build auditory discrimination, e.g. pen/pan', icon: 'fa-ear-listen', color: 'text-teal-500', bg: 'bg-teal-100', type: 'daily', hasTitleSlideOptions: true,
        description: 'This section shows minimal pairs (e.g. pen/pan) for students to practise hearing and saying commonly confused sounds.',
        fields: [{ id: 'pair', label: 'Word Pair', type: 'select', options: ['Pen/Pan', 'Pat/Pet', 'Marry/Merry', 'Axe/Ex', 'Al/L'] }]
    },
    'sectG': {
        title: 'Write a letter', shortDesc: 'Handwriting practice', icon: 'fa-pen', color: 'text-orange-500', bg: 'bg-orange-100', type: 'daily', hasTitleSlideOptions: true,
        description: 'This section shows a letter formation slide for students to practice handwriting.',
        fields: [{ id: 'letter', label: 'Target Letter', type: 'text' }]
    },
    'sectH': {
        title: 'Long content', shortDesc: 'Vocabulary or building the field.', icon: 'fa-book', color: 'text-rose-500', bg: 'bg-rose-100', type: 'daily', hasTitleSlideOptions: true,
        description: 'A multi-purpose slide with title, body text and image placeholder to be used to teach or review a concept. Use for reviewing vocab or building the field.',
        fields: [
            { id: 'title', label: 'Title', type: 'text', default: 'Wombats', placeholder: 'Wombats' },
            { id: 'body', label: 'Body Text', type: 'textarea', default: 'A wombat is a furry Australian animal that looks like a little bear. It has short legs and strong claws for digging big tunnels. Mother wombats have a backward pouch to keep dirt off their babies!', placeholder: 'A wombat is a furry Australian animal...' }
        ]
    },
    'sectI': {
        title: 'Read the sentence', shortDesc: 'Read a simple sentence', icon: 'fa-glasses', color: 'text-violet-500', bg: 'bg-violet-100', type: 'daily', hasTitleSlideOptions: true,
        description: 'This section shows a simple sentence for students to read. The "Pyramid" type breaks down the sentence into a triangle, adding a word each line. The "Picture" type features a picture placeholder for visual prompt above the sentence.',
        fields: [
            { id: 'style', label: 'Style', type: 'select', default: 'Pyramid', options: ['Pyramid', 'Picture'] },
            { id: 'sent', label: 'Sentence', type: 'text', default: 'The cat sat on Sam', placeholder: 'The cat sat on Sam' }
        ]
    },
    'sectJ': {
        title: 'Sentences', shortDesc: 'Multipurpose sentence slide', icon: 'fa-pen-to-square', color: 'text-fuchsia-500', bg: 'bg-fuchsia-100', type: 'daily', hasTitleSlideOptions: true,
        description: 'This multipurpose section features a simple sentence slide. Use underscores as a "fill the blank" option, e.g. "The ___ sat on ___."',
        fields: [{ id: 'sent', label: 'Sentence', type: 'text' }]
    },
    'sectK': {
        title: 'Label and write a sentence', shortDesc: 'Add labels to picture then write a sentence.', icon: 'fa-tags', color: 'text-sky-500', bg: 'bg-sky-100', type: 'daily', hasTitleSlideOptions: true,
        description: 'This section features a picture placeholder, space to add labels and space to write a sentence. Picture will need to be added in PowerPoint/Google Slides. Prompts below will be inserted in the speaker notes section.',
        fields: [{ id: 'prompt', label: 'Teacher Prompt', type: 'textarea' }]
    },
    'sectSimpleCompound': {
        title: 'Simple or Compound Sentences', shortDesc: 'Practise identifying sentences', icon: 'fa-code-branch', color: 'text-amber-600', bg: 'bg-amber-100', type: 'mixed', hasTitleSlideOptions: true,
        description: 'In this section, students read a sentence and identify whether it is simple or compound.',
        weeklyFields: [
            { id: 'includeInstructions', label: 'Include review slides', type: 'checkbox', default: true }
        ]
    },
    'sectSentenceTypes': {
        title: 'Sentence Types', shortDesc: 'Recall sentence types', icon: 'fa-align-left', color: 'text-indigo-600', bg: 'bg-indigo-100', type: 'mixed', hasTitleSlideOptions: true,
        description: 'A info slide and a binary question to identify sentence types.',
        weeklyFields: [
            { id: 'sentenceType', label: 'Sentence Type', type: 'select', options: ['Declarative', 'Imperative', 'Interrogative', 'Exclamative'], default: 'Imperative' },
            { id: 'definition', label: 'Definition', type: 'textarea', default: 'Give a command, instruction, or request.\ne.g.: "Pick up your jumper."' }
        ],
        dailyFields: [
            { id: 'sent1', label: 'Sentence 1', type: 'text', default: '' },
            { id: 'sent2', label: 'Sentence 2', type: 'text', default: '' }
        ]
    },
    'sectSimpleSentences': {
        title: 'Simple Sentences', shortDesc: 'Revise simple sentences', icon: 'fa-pencil', color: 'text-teal-600', bg: 'bg-teal-100', type: 'daily', hasTitleSlideOptions: true,
        description: 'Students revise the definition of a simple sentence and identify its parts.',
        fields: [
            { id: 'sent', label: 'Sentence', type: 'text', placeholder: 'Sam kicked the ball.' }
        ]
    },
    'sectCompoundSentences': {
        title: 'Compound Sentences', shortDesc: 'Revise compound sentences', icon: 'fa-link', color: 'text-sky-600', bg: 'bg-sky-100', type: 'daily', hasTitleSlideOptions: true,
        description: 'Students revise the definition of a compound sentence and identify its parts.',
        fields: [
            { id: 'sent', label: 'Sentence', type: 'text', placeholder: 'Sam kicked the ball and I caught it.' }
        ]
    },
    'sectWriteSimpleCompoundSentence': {
        title: 'Write a Simple and Compound Sentence', shortDesc: 'Write a simple and a compound sentence', icon: 'fa-pen-to-square', color: 'text-indigo-600', bg: 'bg-indigo-100', type: 'static', hasTitleSlideOptions: true,
        description: 'Students shown a picture prompt to write a simple sentence and a compound sentence.',
        fields: []
    },
    'generic': {
        title: 'Generic Section', shortDesc: 'Multipurpose placeholder', icon: 'fa-cube', color: 'text-slate-500', bg: 'bg-slate-200', type: 'daily', hasTitleSlideOptions: true,
        description: 'This section can be used as a placeholder or general purpose slide for sections not included in this builder. Add short text below, include prompt to be inserted in the speakers notes.',
        fields: [{ id: 'word', label: 'Content', type: 'text' }, { id: 'notes', label: 'Speaker\'s notes', type: 'textarea' }]
    },
    'customisable': {
        title: 'Customisable Section', shortDesc: 'specify your own slide', icon: 'fa-sliders', color: 'text-indigo-500', bg: 'bg-indigo-100', type: 'weekly', hasTitleSlideOptions: true,
        description: 'Use this section to specify and customise any new slide in your template. The template tag and content tags (if used) must match your template.',
        fields: []
    },
    'finished': { 
        title: 'Finished', shortDesc: 'A finished slide.', icon: 'fa-flag-checkered', color: 'text-stone-500', bg: 'bg-stone-200', type: 'static',
        description: 'A simple slide to indicate the day\'s set of slides is done.' 
    }
};
