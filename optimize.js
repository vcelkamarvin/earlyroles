// EarlyRoles — /api/optimize  (Vercel Serverless Function, CommonJS)
// Takes the user's own pasted CV / LinkedIn text and returns a structured,
// recruiter-ready profile. Uses Claude (Anthropic) if ANTHROPIC_API_KEY is set,
// else OpenAI if OPENAI_API_KEY is set, else a deterministic heuristic.

const HITS = {};
function limited(ip) {
  const now = Date.now();
  const w = HITS[ip] || (HITS[ip] = []);
  while (w.length && now - w[0] > 60000) w.shift();
  if (w.length >= 10) return true;        // 10 / minute / IP
  w.push(now);
  return false;
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'anon';
  if (limited(ip)) { res.status(429).json({ error: 'Slow down a moment and try again.' }); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  if (!body || typeof body !== 'object') body = {};
  const text = String(body.text || '').slice(0, 8000).trim();
  if (text.length < 30) { res.status(400).json({ error: 'Paste a bit more of your CV or LinkedIn.' }); return; }

  const prompt =
    'You are an expert resume writer and recruiter. From the candidate text below, produce a polished, ' +
    'recruiter-ready profile. Rewrite vague lines into specific, metric-forward achievements (action -> result). ' +
    'Keep it truthful — do not invent companies, numbers or facts that are not implied by the text. ' +
    'Reply with ONLY minified JSON, no markdown, in this exact shape: ' +
    '{"headline":"<one strong value-statement headline>","summary":"<2-3 punchy sentences>",' +
    '"skills":["<8-12 concrete skills>"],"experience":["<3-6 rewritten achievement bullets>"],' +
    '"strengths":["<3 short standout strengths>"],"tips":["<2 quick tips to improve further>"]}. ' +
    'Candidate text:\n"""' + text + '"""';

  // 1) Claude (Anthropic) — preferred
  const aKey = process.env.ANTHROPIC_API_KEY;
  if (aKey) {
    try {
      const model = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': aKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: model, max_tokens: 1100, temperature: 0.5,
          system: 'You return only valid, minified JSON. No markdown fences.',
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const j = await resp.json();
      let content = (j.content && j.content[0] && j.content[0].text) || '';
      content = content.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(content);
      if (parsed && (parsed.summary || parsed.headline)) { parsed.engine = 'ai'; res.status(200).json(parsed); return; }
    } catch (e) { /* fall through */ }
  }

  // 2) OpenAI — optional fallback
  const key = process.env.OPENAI_API_KEY;
  if (key) {
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body: JSON.stringify({
          model: 'gpt-4o-mini', temperature: 0.5, max_tokens: 1000,
          messages: [
            { role: 'system', content: 'You return only valid, minified JSON. No markdown fences.' },
            { role: 'user', content: prompt }
          ]
        })
      });
      const j = await resp.json();
      let content = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
      content = content.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(content);
      if (parsed && (parsed.summary || parsed.headline)) { parsed.engine = 'ai'; res.status(200).json(parsed); return; }
    } catch (e) { /* fall through */ }
  }

  // 3) deterministic heuristic
  res.status(200).json(Object.assign(heuristic(text), { engine: 'heuristic' }));
};

function heuristic(raw) {
  const lines = raw.split(/\n+/).map(s => s.trim()).filter(Boolean);
  const headline = (lines[0] || 'Experienced professional').slice(0, 90);
  const summary = raw.replace(/\s+/g, ' ').trim().slice(0, 280);
  const skillBank = ['JavaScript','TypeScript','React','Node.js','Python','SQL','AWS','product strategy','leadership','data analysis','SEO','sales','marketing','growth','project management','design','figma','communication','negotiation','customer success'];
  const t = raw.toLowerCase();
  let skills = skillBank.filter(s => t.includes(s.toLowerCase())).slice(0, 12);
  if (!skills.length) skills = ['communication','problem solving','collaboration','ownership'];
  const experience = lines.filter(l => /\b(led|built|grew|launched|managed|increased|reduced|shipped|drove|created|delivered)\b/i.test(l)).slice(0, 5);
  return {
    headline: headline,
    summary: summary,
    skills: skills,
    experience: experience.length ? experience : ['Add 3-5 bullets that each start with a verb and end with a measurable result.'],
    strengths: ['Clear communicator', 'Outcome-focused', 'Fast learner'],
    tips: ['Add a hard number to every bullet (%, $, users).', 'Make your headline a value statement, not a job title.']
  };
}
