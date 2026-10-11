import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { generateFallbackProblem } from './src/utils/mathFallback.js';
import { buildWordProblemPrompt } from './src/data/prompts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(express.json());

// API endpoint for AI-generated math word problems
app.post('/api/generate-word-problem', async (req, res) => {
  try {
    const { stage, contentArea, equation, includeExtension } = req.body || {};
    const stageClean = stage || 'Stage 1';
    const areaClean = contentArea || 'Addition';
    const hasEq = equation && String(equation).trim().length > 0;
    const eqClean = hasEq ? String(equation).trim() : '';

    const prompt = buildWordProblemPrompt({
      stage: stageClean,
      contentArea: areaClean,
      equation: eqClean,
      includeExtension: Boolean(includeExtension)
    });

    const apiKey = process.env.GEMINI_API_KEY;
    console.log(`[API] Received word problem request. Stage: ${stageClean}, Area: ${areaClean}, Eq: ${eqClean}. API Key present: ${Boolean(apiKey)}`);
    
    if (apiKey) {
      const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
      const ai = new GoogleGenAI({ apiKey });

      for (const modelName of candidateModels) {
        try {
          console.log(`[API] Attempting generation with model: ${modelName}`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
          });

          const generatedText = response.text?.trim();
          if (generatedText) {
            console.log(`[API] Successfully generated text using ${modelName} (${generatedText.length} chars)`);
            return res.json({ success: true, text: generatedText, source: 'ai', model: modelName });
          }
        } catch (aiErr) {
          console.warn(`[API] Model ${modelName} call failed:`, aiErr.message || aiErr);
          // Continue to next model in cascade
        }
      }
    } else {
      console.warn('[API] GEMINI_API_KEY is not defined in process.env');
    }

    // High quality pedagogical fallback generator
    console.log('[API] Falling back to JavaScript pedagogical generator');
    const fallbackText = generateFallbackProblem(stageClean, areaClean, eqClean, Boolean(includeExtension));
    return res.json({ success: true, text: fallbackText, source: 'js' });
  } catch (err) {
    console.error('Error generating word problem:', err);
    res.status(500).json({ error: 'Failed to generate word problem: ' + err.message });
  }
});

// Serve static files from root directory with no-cache in dev to prevent stale script caching
app.use(express.static(__dirname, {
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
}));

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
