// HardHat — /api/cv  (Vercel Serverless Function, CommonJS)
// Builds an offshore/trades CV from the user's own pasted background.
// Uses Claude (ANTHROPIC_API_KEY) if set, else OpenAI (OPENAI_API_KEY),
// else a deterministic template so the endpoint always works.

const HITS = {};
function limited(ip) {
  const now = Date.now();
  const w = HITS[ip] || (HITS[ip] = []);
  while (w.length && now - w[0] > 60000) w.shift();
  if (w.length >= 10) return true;
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
  const text = String(body.text || '').slice(0, 6000).trim();
  const sector = String(body.sector || 'offshore work').slice(0, 80);
  const level = String(body.level || 'entry').slice(0, 20);
  if (text.length < 20) { res.status(400).json({ error: 'Paste a bit more of your background.' }); return; }

  const prompt =
    'You are an offshore/trades recruitment specialist. Turn the candidate background below into a CV formatted the way ' +
    'crewing agencies and rig/vessel/site recruiters expect for "' + sector + '" (' + level + ' level). ' +
    'CRITICAL ORDER: (1) Name/contact placeholder, (2) a 2-line PROFILE stressing reliability, fitness, willingness to work rotations away from home and safety attitude, ' +
    '(3) TICKETS & MEDICALS section (list what they have; if none, write "Working towards: <the tickets this sector needs>"), ' +
    '(4) RELEVANT EXPERIENCE as punchy bullets emphasising physical/manual/safety-relevant work with any numbers, ' +
    '(5) OTHER SKILLS (licences, tools, machinery), (6) AVAILABILITY (start date, rotations, relocation). ' +
    'Keep it tight, factual, no buzzwords, no invented certs. Return PLAIN TEXT CV only, no commentary, no markdown fences. Background:\n"""' + text + '"""';

  const aKey = process.env.ANTHROPIC_API_KEY;
  if (aKey) {
    try {
      const model = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': aKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model, max_tokens: 900, temperature: 0.5,
          system: 'You output a clean plain-text CV. No markdown, no preamble.',
          messages: [{ role: 'user', content: prompt }] })
      });
      const j = await resp.json();
      const content = (j.content && j.content[0] && j.content[0].text) || '';
      if (content.trim().length > 40) { res.status(200).json({ cv: content.trim(), engine: 'ai' }); return; }
    } catch (e) { /* fall through */ }
  }

  const key = process.env.OPENAI_API_KEY;
  if (key) {
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0.5, max_tokens: 800,
          messages: [ { role: 'system', content: 'You output a clean plain-text CV. No markdown, no preamble.' }, { role: 'user', content: prompt } ] })
      });
      const j = await resp.json();
      const content = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
      if (content.trim().length > 40) { res.status(200).json({ cv: content.trim(), engine: 'ai' }); return; }
    } catch (e) { /* fall through */ }
  }

  res.status(200).json({ cv: template(text, sector, level), engine: 'heuristic' });
};

function template(text, sector, level) {
  const lines = text.split(/[\n.;]+/).map(s => s.trim()).filter(s => s.length > 3).slice(0, 8);
  const bullets = lines.map(l => '  • ' + l.charAt(0).toUpperCase() + l.slice(1)).join('\n');
  return [
    '[YOUR NAME]',
    '[Phone]  •  [Email]  •  [Location]  •  Right to work: [Yes/Visa]',
    '',
    'PROFILE',
    'Reliable, physically fit worker seeking a ' + (level === 'entry' ? 'entry-level ' : '') + sector + ' role. Comfortable with',
    'rotational work away from home, shift patterns and a safety-first environment.',
    '',
    'TICKETS & MEDICALS',
    '  • Working towards the required certifications for ' + sector + ' (see HardHat roadmap).',
    '  • Fit for heavy manual work; happy to complete pre-employment medical & D&A screen.',
    '',
    'RELEVANT EXPERIENCE',
    bullets || '  • [Add your work history]',
    '',
    'OTHER SKILLS',
    '  • [Licences, machinery, tools, first aid, driving]',
    '',
    'AVAILABILITY',
    '  • Start: [ASAP]  •  Rotations: willing  •  Relocation: willing'
  ].join('\n');
}
