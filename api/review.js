// EarlyRoles — /api/review  (Vercel Serverless Function, CommonJS)
// Compliant LinkedIn/CV review: the USER supplies their own profile text or CV.
// We never scrape LinkedIn. If OPENAI_API_KEY is set, we use AI; otherwise a
// deterministic heuristic so the endpoint always works.

// --- tiny best-effort rate limit (per warm instance) ---
const HITS = {};
function limited(ip) {
  const now = Date.now();
  const w = HITS[ip] || (HITS[ip] = []);
  while (w.length && now - w[0] > 60000) w.shift();
  if (w.length >= 12) return true;        // 12 reviews / minute / IP
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
  if (text.length < 20) { res.status(400).json({ error: 'Paste a bit more of your profile or CV.' }); return; }

  const key = process.env.OPENAI_API_KEY;
  if (key) {
    try {
      const prompt =
        'You are a blunt but genuinely helpful career coach. Review the LinkedIn profile / CV text below. ' +
        'Score it 0-100 on a "Cringe-o-meter" where HIGHER = MORE problems (weak headline, no metrics, buzzwords, vague bullets). ' +
        'Reply with ONLY minified JSON, no markdown, in this exact shape: ' +
        '{"score":<int 0-100>,"verdict":"<short, funny one-liner>","roasts":["<3 honest, specific problems>"],"fixes":["<3 concrete, actionable rewrites>"]}. ' +
        'Profile:\n"""' + text + '"""';
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.8,
          max_tokens: 600,
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
      if (typeof parsed.score === 'number' && Array.isArray(parsed.fixes)) {
        parsed.engine = 'ai';
        res.status(200).json(parsed);
        return;
      }
    } catch (e) { /* fall through to heuristic */ }
  }

  res.status(200).json(Object.assign(heuristic(text), { engine: 'heuristic' }));
};

function heuristic(raw) {
  const t = raw.toLowerCase();
  const words = raw.trim().split(/\s+/).filter(Boolean);
  const buzz = ['synergy','ninja','guru','rockstar','passionate','results-driven','results driven','team player','detail-oriented','go-getter','thought leader','hustle','disrupt','10x','visionary','dynamic','game-changer','growth hacker','self-starter','world-class','best-in-class'];
  const found = buzz.filter(b => t.includes(b));
  const hasNumbers = /\d/.test(raw);
  const passive = /responsible for|in charge of|tasked with|worked on|helped with/i.test(raw);
  const roasts = []; let score = 18;
  if (found.length) { score += Math.min(42, found.length * 9); roasts.push('You used ' + found.length + ' buzzword' + (found.length>1?'s':'') + ' (e.g. "' + found[0] + '"). Recruiters skim right past them.'); }
  if (!hasNumbers) { score += 18; roasts.push('Not a single metric. "Drove growth" means nothing without a number — give percentages, dollars, users.'); }
  if (passive) { score += 14; roasts.push('"Responsible for…" hides your impact. Rewrite as "did X → which caused Y".'); }
  if (words.length < 40) { score += 16; roasts.push('Too thin. There is concise, and then there is witness protection — give them something to grab onto.'); }
  if (!roasts.length) { roasts.push('Solid base — clean and readable. The gap is proof: add concrete numbers and outcomes.'); score = 30; }
  score = Math.max(12, Math.min(98, score));
  const fixes = [
    hasNumbers ? 'Lead your headline and first About line with your single biggest number.' : 'Add 2-3 hard metrics (%, $, users, hours saved) to your About and top bullets.',
    found.length ? 'Cut "' + found[0] + '" and the other buzzwords; replace each with the concrete thing you did.' : 'Make your headline a value statement: "[Role] helping [who] achieve [result]".',
    passive ? 'Convert every "responsible for X" into "did X → got Y".' : 'End with a clear ask: the exact role you want next.'
  ];
  let verdict;
  if (score >= 80) verdict = '🔥🔥🔥 Needs a real glow-up — but every fix below is quick.';
  else if (score >= 64) verdict = '🔥 Toasty. A few changes and recruiters start replying.';
  else if (score >= 52) verdict = '😅 Decent. A couple of tweaks from strong.';
  else verdict = '😎 Solid. Polish these and you are dangerous.';
  return { score: score, verdict: verdict, roasts: roasts, fixes: fixes };
}
