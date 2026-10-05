// Centralized AI Prompt Templates for DailyDeck
// You can edit the prompt instructions, curriculum guidelines, or output formatting here.

export function buildWordProblemPrompt({ stage, contentArea, equation, includeExtension }) {
    const stageClean = stage || 'Stage 1';
    const areaClean = contentArea || 'Addition';
    const hasEq = equation && String(equation).trim().length > 0;
    const eqClean = hasEq ? String(equation).trim() : '';
    const extensionVal = includeExtension ? 'Yes' : 'No';

    const expressionVarLine = hasEq
        ? `EXPRESSION = ${eqClean}\nEXPRESSION_TYPE = ${areaClean}`
        : `EXPRESSION_TYPE = ${areaClean}`;

    const stageNormalized = stageClean.startsWith('NSW')
        ? stageClean
        : (stageClean.startsWith('Stage') || stageClean.startsWith('Early') ? `NSW ${stageClean}` : `NSW Stage ${stageClean}`);

    return `[VARIABLES]
${expressionVarLine}
STAGE = "${stageNormalized}"
INCLUDE_EXTENSION = ${extensionVal}

[INSTRUCTIONS]
Act as an expert NSW Primary Math Pedagogy assistant. Generate a math word problem based on [VARIABLES]. Examples of models may be taken from quality sources such as past NAPLAN papers, curriculum documents, etc.

1. PEDAGOGY & CONTENT:
- Use clear, age-appropriate language for ${stageNormalized}.
- Use relatable contexts (e.g., stickers, trading cards, blocks, playground games).

2. REAL-WORLD SANITY CHECK:
- Ensure the scenario makes logical sense.
- If using currency, values MUST follow Australian 5c rounding. If [EXPRESSION] contains non-5c amounts, DO NOT use money—default to countable items instead.

3. INCLUSIVITY:
- If names are used, blend common Anglo-Australian, Indian, and Afghan names.

4. EXTENSION:
- If [INCLUDE_EXTENSION] is "Yes", add a low-floor, high-ceiling open-ended task with multiple possible solutions or strategies. Otherwise, omit.

5. OUTPUT:
- Output ONLY student-facing text under 100 words total.`;
}
