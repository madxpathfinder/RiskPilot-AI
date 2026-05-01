import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const SYSTEM_PROMPT = `You are an enterprise risk assessment assistant. Your role is to help companies identify, explain, prioritize, and mitigate business, operational, compliance, vendor, privacy, and governance risks. Use only the provided assessment answers, uploaded document summaries, and existing risk register data. Do not invent evidence. Do not change risk scores manually. If information is missing, say exactly what is missing. Write recommendations that are practical, prioritized, and suitable for management reporting.`;

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';

function buildPrompt(action, payload = {}, language = 'en') {
  const actionMap = {
    summary: 'Explain the current overall risk posture for management.',
    findings: 'Generate risk findings from the provided data. Separate confirmed findings from assumptions.',
    plan: 'Create a practical 30/60/90 day risk improvement plan prioritized by risk level.',
  };
  const langInstruction = language === 'az' ? 'Respond in Azerbaijani.' : 'Respond in English.';
  return `${SYSTEM_PROMPT}\n\n${langInstruction}\nAction: ${actionMap[action] || actionMap.summary}\nInput JSON:\n${JSON.stringify(payload, null, 2)}`;
}

function mockFallback(action, payload, language) {
  const az = language === 'az';
  const msg = az ? 'Təsdiqlənmiş faktlara əsasən analiz təqdim olunur.' : 'Analysis is based on confirmed inputs only.';
  const mock = {
    summary: `${msg}\nOverall posture: ${payload?.overallLevel || 'High'}. Confirmed gaps: governance, continuity testing, access reviews. Missing evidence: policy approvals, BCP test logs, vendor due diligence records.`,
    plan: az ? '30 gün: kritik risk sahiblərini təyin edin. 60 gün: əsas nəzarətləri tətbiq edin. 90 gün: effektivliyi test edin və rəhbərliyə hesabat verin.' : '30 days: assign owners for critical risks. 60 days: implement baseline controls. 90 days: test effectiveness and report to management.',
    findings: az ? 'Təsdiqlənmiş tapıntılar sorğu cavabları və sənəd xülasələrinə əsaslanır. Fərziyyələr ayrıca qeyd olunur.' : 'Confirmed findings are derived from questionnaire answers and document summaries. Assumptions are explicitly marked.',
  };
  return mock[action] || mock.summary;
}

app.post('/api/ai', async (req, res) => {
  const { action = 'summary', payload = {}, language = 'en' } = req.body || {};

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: buildPrompt(action, payload, language),
        stream: false,
        options: { temperature: 0.2 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status}`);
    }

    const data = await response.json();
    const result = data?.response?.trim();

    if (!result) {
      throw new Error('Empty response from Ollama');
    }

    res.json({ provider: 'ollama', model: OLLAMA_MODEL, result });
  } catch (error) {
    res.json({
      provider: 'mock-fallback',
      model: null,
      warning: `Ollama unavailable (${error.message}). Returned deterministic mock output.`,
      result: mockFallback(action, payload, language),
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', provider: 'ollama', model: OLLAMA_MODEL, ollamaUrl: OLLAMA_URL });
});

app.listen(4000, () => console.log('API on 4000'));
