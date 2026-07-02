// HardHat — /api/ticket-check  (Vercel Serverless Function, CommonJS)
// Analyzes a worker's situation and returns their ticket/medical gaps + a
// readiness score and next actions. Claude -> OpenAI -> deterministic heuristic.

const HITS = {};
function limited(ip) {
  const now = Date.now();
  const w = HITS[ip] || (HITS[ip] = []);
  while (w.length && now - w[0] > 60000) w.shift();
  if (w.length >= 12) return true;
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
  const sector = String(body.sector || '').slice(0, 60);
  const held = Array.isArray(body.held) ? body.held.slice(0, 30) : [];
  const situation = String(body.situation || '').slice(0, 2000);

  const prompt =
    'You advise people entering high-paying no-degree offshore/trades work. Sector: "' + sector + '". ' +
    'Tickets they already hold: ' + (held.join(', ') || 'none') + '. Extra context: "' + situation + '". ' +
    'Return ONLY minified JSON: {"score":<0-100 how job-ready>,"summary":"<one honest sentence>","gaps":["<up to 4 missing tickets/medicals/steps, most important first>"],"actions":["<up to 3 concrete next actions>"]}.';

  const aKey = process.env.ANTHROPIC_API_KEY;
  if (aKey) {
    try {
      const model = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': aKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model, max_tokens: 500, temperature: 0.4,
          system: 'You return only valid, minified JSON. No markdown fences.',
          messages: [{ role: 'user', content: prompt }] })
      });
      const j = await resp.json();
      let content = (j.content && j.content[0] && j.content[0].text) || '';
      content = content.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(content);
      if (typeof parsed.score === 'number' && Array.isArray(parsed.gaps)) { parsed.engine = 'ai'; res.status(200).json(parsed); return; }
    } catch (e) { /* fall through */ }
  }

  const key = process.env.OPENAI_API_KEY;
  if (key) {
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0.4, max_tokens: 450,
          messages: [ { role: 'system', content: 'You return only valid, minified JSON. No markdown fences.' }, { role: 'user', content: prompt } ] })
      });
      const j = await resp.json();
      let content = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
      content = content.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(content);
      if (typeof parsed.score === 'number' && Array.isArray(parsed.gaps)) { parsed.engine = 'ai'; res.status(200).json(parsed); return; }
    } catch (e) { /* fall through */ }
  }

  // heuristic
  const score = Math.min(90, 25 + held.length * 15);
  res.status(200).json({
    score,
    summary: held.length ? 'Good progress — clear the remaining required tickets and start applying.' : 'You’re at the start line — get the required tickets for your sector first.',
    gaps: held.length ? ['Any remaining required tickets for ' + (sector || 'your sector'), 'Valid work/offshore medical'] : ['Required safety certification for ' + (sector || 'your sector'), 'Valid work/offshore medical', 'Right-to-work / travel documents'],
    actions: ['Open your HardHat roadmap and book the first required ticket', 'Build your offshore CV', 'Shortlist crewing agencies in your sector'],
    engine: 'heuristic'
  });
};
