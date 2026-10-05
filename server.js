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
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        const generatedText = response.text?.trim();
        if (generatedText) {
          return res.json({ success: true, text: generatedText, source: 'ai' });
        }
      } catch (aiErr) {
        console.warn('Gemini API call failed, falling back to local curriculum generator:', aiErr.message || aiErr);
      }
    }

    // High quality pedagogical fallback generator
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
