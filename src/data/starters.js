// Starter Decks registry
import { STANDARD_STARTER_DESCRIPTION } from './constants.js';

export const STARTER_DEFS = {
    'starter_kindergarten': {
        title: 'Kindergarten',
        shortDesc: 'Preset deck starter for Kindergarten',
        icon: 'fa-layer-group',
        color: 'text-amber-600',
        bg: 'bg-amber-100',
        hoverBorder: 'border-amber-400',
        badge: 'Preset',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        description: STANDARD_STARTER_DESCRIPTION,
        sections: [
            'mainIntro',
            'dayDivider',
            'expectations',
            'sectA',
            'sectB',
            'sectDigraphs',
            'sectShortVowelBB',
            'sectC',
            'sectD',
            'sectE',
            'sectF',
            'sectG',
            'sectH',
            'sectI',
            'sectJ',
            'sectK',
            'finished'
        ]
    },
    'starter_k_year1': {
        title: 'Kinder and Year 1',
        shortDesc: 'Preset deck for K/1',
        icon: 'fa-layer-group',
        color: 'text-teal-600',
        bg: 'bg-teal-100',
        hoverBorder: 'border-teal-400',
        badge: 'Preset',
        badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
        description: STANDARD_STARTER_DESCRIPTION,
        sections: [
            'mainIntro',
            'dayDivider',
            'expectations',
            'sectA',
            'sectB',
            'sectDigraphs',
            'sectShortVowelBB',
            'sectBlendingBoard',
            'sectG',
            'sectD',
            'sectHFW',
            'sectReadWordWriteWord',
            'sectE',
            'sectSimpleCompound',
            'finished'
        ]
    },
    'starter_stage1': {
        title: 'Stage 1',
        shortDesc: 'Preset deck for Stage 1',
        icon: 'fa-layer-group',
        color: 'text-indigo-600',
        bg: 'bg-indigo-100',
        hoverBorder: 'border-indigo-400',
        badge: 'Preset',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        description: STANDARD_STARTER_DESCRIPTION,
        sections: [
            'mainIntro',
            'dayDivider',
            'expectations',
            'sectB',
            'sectDigraphs',
            'sectBlendingBoard',
            'sectReadWordWriteWord',
            'sectHFW',
            'generic',
            'sectSimpleCompound',
            'sectA',
            'finished'
        ]
    },
    'starter_stage2': {
        title: 'Stage 2',
        shortDesc: 'Preset starter for Stage 2',
        icon: 'fa-layer-group',
        color: 'text-purple-600',
        bg: 'bg-purple-100',
        hoverBorder: 'border-purple-400',
        badge: 'Preset',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        description: STANDARD_STARTER_DESCRIPTION,
        sections: [
            'mainIntro',
            'dayDividerPlain',
            'reciteRecallApplyLisc',
            'sectDigraphs',
            'sectReadWordWriteWord',
            'sectHFW',
            'sectSentenceTypes',
            'sectSimpleSentences',
            'sectCompoundSentences',
            'sectA',
            'sectWriteSimpleCompoundSentence',
            'finished'
        ]
    }
};
