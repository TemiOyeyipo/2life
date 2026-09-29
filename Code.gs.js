/**
 * DISC Leadership Profile — Code.gs (API backend)
 *
 * This script is now a JSON API only. The frontend (index.html, admin.html,
 * johari.html, johari-peer.html, strengths.html) lives outside Apps Script —
 * on GitHub Pages or any static host — and talks to this script over
 * fetch(). DISC content lives in Content.gs, its PDF builder in
 * ReportPdf.gs. Johari Window content lives in JohariContent.gs, its PDF
 * builder in JohariPdf.gs. Strengths Compass content lives in
 * StrengthsContent.gs, its PDF builder in StrengthsPdf.gs.
 *
 * Setup:
 *  1. Bind this script to a Google Sheet (Extensions > Apps Script).
 *  2. Run setup() once from the editor.
 *  3. Deploy > New deployment > Web app.
 *     - Execute as: Me
 *     - Who has access: Anyone
 *  4. Copy the /exec URL into your frontend's config.js as API_URL.
 *  5. Whenever you edit this script, redeploy (Manage deployments > edit
 *     the existing deployment > New version), or the live /exec URL keeps
 *     serving the old code.
 */

const CFG = {
  SITE_NAME: 'DISC Leadership Profile',
  QUESTIONS_SHEET: 'Questions',
  RESPONSES_SHEET: 'Responses',
  EMAIL_RESULTS: true,          // email the participant their result ID
  PORTAL_URL: '',                // your GitHub Pages URL, e.g. https://you.github.io/disc-portal/

  // Johari Window settings
  JOHARI_SESSIONS_SHEET: 'Johari_Sessions',
  JOHARI_PEERS_SHEET: 'Johari_Peers',
  JOHARI_MIN_PEERS: 3,   // results stay locked until at least this many colleagues respond
  JOHARI_ADJ_MIN: 4,     // fewest words a person may choose
  JOHARI_ADJ_MAX: 8,     // most words a person may choose

  // Strengths Compass settings
  STRENGTHS_SHEET: 'Strengths_Responses'
};

const STYLE_KEYS = ['D', 'I', 'S', 'C'];

/* ---------- Web API entry points ----------
 * Protocol: every request carries { fn: '<action>', ...params }.
 * GET is only used for the one action with no sensitive data (getQuestions);
 * everything else goes over POST so IDs, emails and the admin key never sit
 * in a URL, browser history or server log.
 * POST bodies must be sent WITHOUT a custom Content-Type header (plain
 * fetch(url, {method:'POST', body: JSON.stringify(...)}) is correct) —
 * Apps Script web apps cannot answer a CORS preflight (OPTIONS) request,
 * so the request must stay a "simple request" to avoid triggering one.
 */

function doGet(e) {
  return route_((e && e.parameter) || {});
}

function doPost(e) {
  var body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { /* fall through with {} */ }
  return route_(body);
}

function route_(req) {
  var result;
  try {
    switch (req.fn) {
      case 'getQuestions':
        result = { ok: true, data: getQuestions() };
        break;
      case 'saveResult':
        result = { ok: true, data: saveResult(req.payload || {}) };
        break;
      case 'getResult':
        result = { ok: true, data: getResult(req.id, req.email) };
        break;
      case 'getPdf':
        result = { ok: true, data: getPdf(req.id, req.email) };
        break;
      case 'adminSummary':
        result = { ok: true, data: adminSummary(req.key) };
        break;
      case 'johariGetAdjectives':
        result = { ok: true, data: { adjectives: JOHARI_ADJECTIVES, min: CFG.JOHARI_ADJ_MIN, max: CFG.JOHARI_ADJ_MAX } };
        break;
      case 'johariCreateSession':
        result = { ok: true, data: johariCreateSession(req.payload || {}) };
        break;
      case 'johariSessionInfo':
        result = { ok: true, data: johariSessionInfo(req.sessionId) };
        break;
      case 'johariSubmitPeer':
        result = { ok: true, data: johariSubmitPeer(req.payload || {}) };
        break;
      case 'johariGetSession':
        result = { ok: true, data: johariGetSession(req.sessionId, req.email) };
        break;
      case 'johariGetPdf':
        result = { ok: true, data: johariGetPdf(req.sessionId, req.email) };
        break;
      case 'strengthsGetStatements':
        result = { ok: true, data: strengthsGetStatements() };
        break;
      case 'strengthsSaveResult':
        result = { ok: true, data: strengthsSaveResult(req.payload || {}) };
        break;
      case 'strengthsGetResult':
        result = { ok: true, data: strengthsGetResult(req.id, req.email) };
        break;
      case 'strengthsGetPdf':
        result = { ok: true, data: strengthsGetPdf(req.id, req.email) };
        break;
      default:
        throw new Error('Unknown request.');
    }
  } catch (err) {
    result = { ok: false, error: (err && err.message) || String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------- One-time setup ---------- */

function setup() {
  const ss = getSS_();

  let q = ss.getSheetByName(CFG.QUESTIONS_SHEET);
  if (!q) q = ss.insertSheet(CFG.QUESTIONS_SHEET);
  q.clear();
  q.appendRow(['SetID', 'D word', 'I word', 'S word', 'C word']);
  SEED_QUESTIONS.forEach(function (row, i) { q.appendRow([i + 1].concat(row)); });
  q.setFrozenRows(1);
  q.autoResizeColumns(1, 5);

  let r = ss.getSheetByName(CFG.RESPONSES_SHEET);
  if (!r) r = ss.insertSheet(CFG.RESPONSES_SHEET);
  // Header row is rewritten each run, so re-running setup() upgrades an older sheet.
  r.getRange(1, 1, 1, 13).setValues([['ResultID', 'Timestamp', 'Name', 'Email', 'Role',
                 'D', 'I', 'S', 'C', 'Primary', 'Secondary', 'RawAnswers', 'Team']]);
  r.setFrozenRows(1);
  // Plain text on Name/Email/Role/Team so a value like "=1+1" can never run as a formula.
  r.getRange('C:E').setNumberFormat('@');
  r.getRange('M:M').setNumberFormat('@');

  let js = ss.getSheetByName(CFG.JOHARI_SESSIONS_SHEET);
  if (!js) js = ss.insertSheet(CFG.JOHARI_SESSIONS_SHEET);
  js.getRange(1, 1, 1, 7).setValues([['SessionID', 'Timestamp', 'Name', 'Email', 'Role', 'Team', 'SelfAdjectives']]);
  js.setFrozenRows(1);
  js.getRange('C:E').setNumberFormat('@');

  let jp = ss.getSheetByName(CFG.JOHARI_PEERS_SHEET);
  if (!jp) jp = ss.insertSheet(CFG.JOHARI_PEERS_SHEET);
  jp.getRange(1, 1, 1, 5).setValues([['ResponseID', 'SessionID', 'Timestamp', 'Relationship', 'PeerAdjectives']]);
  jp.setFrozenRows(1);

  let st = ss.getSheetByName(CFG.STRENGTHS_SHEET);
  if (!st) st = ss.insertSheet(CFG.STRENGTHS_SHEET);
  st.getRange(1, 1, 1, 8).setValues([['ResultID', 'Timestamp', 'Name', 'Email', 'Role', 'Team', 'RankedJSON', 'RawAnswers']]);
  st.setFrozenRows(1);
  st.getRange('C:E').setNumberFormat('@');

  SpreadsheetApp.flush();
}

/* ---------- Actions (called only via route_ above) ---------- */

/** Returns question sets WITHOUT style codes, so the scoring key never reaches the browser. */
function getQuestions() {
  const rows = questionRows_();
  return rows.map(function (r) {
    return { id: r[0], words: shuffle_([r[1], r[2], r[3], r[4]]) };
  });
}

/** Scores the answers, stores them in the sheet, returns the full report. */
function saveResult(payload) {
  const name = String(payload.name || '').trim().slice(0, 80);
  const email = String(payload.email || '').trim().toLowerCase().slice(0, 120);
  const role = String(payload.role || '').trim().slice(0, 60);
  const team = String(payload.team || '').trim().slice(0, 60);

  if (!name) throw new Error('Please enter your name.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Please enter a valid email address.');

  const s = scoreAnswers_(payload.answers || []);
  const id = newId_();
  const ts = new Date();

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    responsesSheet_().appendRow([
      id, ts, name, email, role,
      s.pct.D, s.pct.I, s.pct.S, s.pct.C,
      s.primary, s.secondary || '', JSON.stringify(payload.answers), team
    ]);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  const report = buildReport_({ id: id, ts: ts, name: name, pct: s.pct, primary: s.primary, secondary: s.secondary });
  if (CFG.EMAIL_RESULTS) sendEmail_(email, report);
  return report;
}

/** Pulls a stored result back from the sheet. Needs BOTH the ID and the email. */
function getResult(id, email) {
  id = String(id || '').trim().toUpperCase();
  email = String(email || '').trim().toLowerCase();
  if (!id || !email) throw new Error('Enter your result ID and the email you used.');

  const sh = responsesSheet_();
  const last = sh.getLastRow();
  if (last >= 2) {
    const rows = sh.getRange(2, 1, last - 1, 11).getValues();
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (String(r[0]).toUpperCase() === id && String(r[3]).toLowerCase() === email) {
        return buildReport_({
          id: r[0], ts: r[1], name: r[2],
          pct: { D: Number(r[5]), I: Number(r[6]), S: Number(r[7]), C: Number(r[8]) },
          primary: r[9], secondary: r[10] || null
        });
      }
    }
  }
  throw new Error("We couldn't find a result with that ID and email. Check both and try again.");
}

/** Returns the participant's PDF report as base64. Needs the same ID + email as getResult. */
function getPdf(id, email) {
  const report = getResult(id, email);
  const blob = makePdf_(report);
  return { filename: blob.getName(), base64: Utilities.base64Encode(blob.getBytes()) };
}

/**
 * Admin / team data. Protected by a key you set in
 * Project Settings > Script properties > ADMIN_KEY.
 */
function adminSummary(key) {
  const real = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  if (!real) throw new Error('Set an ADMIN_KEY script property first (Project Settings > Script properties).');
  if (String(key || '') !== real) {
    Utilities.sleep(1500); // slows down guessing
    throw new Error('That key is not correct.');
  }
  const sh = responsesSheet_();
  const last = sh.getLastRow();
  const rows = last < 2 ? [] : sh.getRange(2, 1, last - 1, 13).getValues();
  const tz = Session.getScriptTimeZone();
  const people = rows.map(function (r) {
    return {
      id: r[0], date: Utilities.formatDate(new Date(r[1]), tz, 'yyyy-MM-dd'),
      name: r[2], email: r[3], role: r[4], team: r[12] || '',
      D: Number(r[5]), I: Number(r[6]), S: Number(r[7]), C: Number(r[8]),
      primary: r[9], secondary: r[10] || ''
    };
  });
  return {
    people: people,
    insights: TEAM_INSIGHTS,
    labels: { D: CONTENT.D.name, I: CONTENT.I.name, S: CONTENT.S.name, C: CONTENT.C.name }
  };
}

/* ---------- Johari Window actions ---------- */

/** Starts a session: stores the person's self-selected words, emails them the peer link. */
function johariCreateSession(payload) {
  const name = String(payload.name || '').trim().slice(0, 80);
  const email = String(payload.email || '').trim().toLowerCase().slice(0, 120);
  const role = String(payload.role || '').trim().slice(0, 60);
  const team = String(payload.team || '').trim().slice(0, 60);
  const adjectives = johariNormalizeAdjectives_(payload.adjectives);

  if (!name) throw new Error('Please enter your name.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Please enter a valid email address.');
  if (adjectives.length < CFG.JOHARI_ADJ_MIN || adjectives.length > CFG.JOHARI_ADJ_MAX) {
    throw new Error('Please choose between ' + CFG.JOHARI_ADJ_MIN + ' and ' + CFG.JOHARI_ADJ_MAX + ' words.');
  }

  const sessionId = newLongId_();
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    johariSessionsSheet_().appendRow([sessionId, new Date(), name, email, role, team, JSON.stringify(adjectives)]);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  const base = CFG.PORTAL_URL ? CFG.PORTAL_URL.replace(/\/$/, '') + '/' : '';
  const peerLink = base ? base + 'johari-peer.html?s=' + sessionId : '';
  const selfLink = base ? base + 'johari.html?s=' + sessionId : '';

  try {
    MailApp.sendEmail(email, 'Your Johari Window session is ready',
      'Hi ' + name + ',\n\n' +
      'Thanks for starting your Johari Window reflection.\n\n' +
      'Step 1: share this link with colleagues so they can describe you too:\n' +
      (peerLink || '(ask whoever set up this tool for your peer link)') + '\n\n' +
      'Step 2: once at least ' + CFG.JOHARI_MIN_PEERS + ' people respond, view your results here:\n' +
      (selfLink || '(ask whoever set up this tool for your results link)') + '\n\n' +
      'Your session ID, if you need to enter it manually: ' + sessionId + '\n');
  } catch (err) {
    console.error('Johari email failed: ' + err);
  }

  return { sessionId: sessionId, peerLink: peerLink, selfLink: selfLink, minPeers: CFG.JOHARI_MIN_PEERS };
}

/** Lightweight, no-auth lookup so the peer page can say who they're helping. */
function johariSessionInfo(sessionId) {
  const row = johariFindSession_(sessionId);
  if (!row) throw new Error('This link is not valid. Ask for a new one.');
  return { name: row.name, firstName: String(row.name).split(' ')[0] };
}

/** A colleague's word choices about the subject. No login required — honour system, like most peer feedback tools. */
function johariSubmitPeer(payload) {
  const sessionId = String(payload.sessionId || '').trim();
  const relationship = String(payload.relationship || 'Other').trim().slice(0, 40);
  const adjectives = johariNormalizeAdjectives_(payload.adjectives);

  const row = johariFindSession_(sessionId);
  if (!row) throw new Error('This link is not valid. Ask for a new one.');
  if (adjectives.length < CFG.JOHARI_ADJ_MIN || adjectives.length > CFG.JOHARI_ADJ_MAX) {
    throw new Error('Please choose between ' + CFG.JOHARI_ADJ_MIN + ' and ' + CFG.JOHARI_ADJ_MAX + ' words.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    johariPeersSheet_().appendRow([newId_(), sessionId, new Date(), relationship, JSON.stringify(adjectives)]);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  return { ok: true, subjectFirstName: String(row.name).split(' ')[0] };
}

/**
 * Pulls the subject's results. Needs BOTH the session ID and the email used to start it.
 * Stays locked (no word-level detail returned) until JOHARI_MIN_PEERS have responded,
 * so no single colleague's answer can be identified.
 */
function johariGetSession(sessionId, email) {
  const row = johariFindSession_(sessionId);
  email = String(email || '').trim().toLowerCase();
  if (!row) throw new Error("We couldn't find that session.");
  if (String(row.email).toLowerCase() !== email) throw new Error('Enter the email you used to start this session.');

  const peers = johariPeerRows_(sessionId);
  const totalPeers = peers.length;
  const out = {
    name: row.name,
    sessionId: sessionId,
    totalPeers: totalPeers,
    minPeers: CFG.JOHARI_MIN_PEERS,
    relationships: johariTally_(peers.map(function (p) { return p.relationship; }))
  };

  if (totalPeers < CFG.JOHARI_MIN_PEERS) {
    out.ready = false;
    return out;
  }

  const selfAdj = JSON.parse(row.selfAdjectives || '[]');
  const peerLists = peers.map(function (p) { return JSON.parse(p.peerAdjectives || '[]'); });
  const q = johariCompute_(selfAdj, peerLists, JOHARI_ADJECTIVES);

  out.ready = true;
  out.selfAdjectives = selfAdj;
  out.arena = q.arena;
  out.blind = q.blind;
  out.facade = q.facade;
  out.unknownCount = q.unknownCount;
  out.info = JOHARI_INFO;
  out.intro = JOHARI_INTRO;
  out.disclaimer = JOHARI_DISCLAIMER;
  out.totalWords = JOHARI_ADJECTIVES.length;
  return out;
}

/** Returns the results PDF as base64. Same auth as johariGetSession; also enforces the same lock. */
function johariGetPdf(sessionId, email) {
  const data = johariGetSession(sessionId, email);
  if (!data.ready) {
    throw new Error('Your results unlock once at least ' + data.minPeers + ' colleagues respond. So far: ' + data.totalPeers + '.');
  }
  const blob = makeJohariPdf_(data);
  return { filename: blob.getName(), base64: Utilities.base64Encode(blob.getBytes()) };
}

/* ---------- Johari helpers ---------- */

function johariNormalizeAdjectives_(arr) {
  if (!Array.isArray(arr)) return [];
  const seen = {};
  const out = [];
  arr.forEach(function (a) {
    a = String(a || '').trim();
    if (a && JOHARI_ADJECTIVES.indexOf(a) !== -1 && !seen[a]) { seen[a] = true; out.push(a); }
  });
  return out;
}

function johariTally_(arr) {
  const t = {};
  arr.forEach(function (x) { x = x || 'Other'; t[x] = (t[x] || 0) + 1; });
  return t;
}

/**
 * Compares one person's self-picked words against every peer's picks.
 * Arena = both; Blind spot = peers only; Hidden = self only; the rest is Unknown.
 */
function johariCompute_(selfAdj, peerAdjLists, allWords) {
  const selfSet = {};
  selfAdj.forEach(function (a) { selfSet[a] = true; });
  const peerCount = {};
  allWords.forEach(function (a) { peerCount[a] = 0; });
  peerAdjLists.forEach(function (list) {
    list.forEach(function (a) { if (peerCount.hasOwnProperty(a)) peerCount[a]++; });
  });

  const arena = [], blind = [], facade = [];
  let unknownCount = 0;
  allWords.forEach(function (a) {
    const self = !!selfSet[a], peers = peerCount[a] > 0;
    if (self && peers) arena.push({ word: a, count: peerCount[a] });
    else if (!self && peers) blind.push({ word: a, count: peerCount[a] });
    else if (self && !peers) facade.push(a);
    else unknownCount++;
  });
  arena.sort(function (x, y) { return y.count - x.count; });
  blind.sort(function (x, y) { return y.count - x.count; });

  return { arena: arena, blind: blind, facade: facade, unknownCount: unknownCount };
}

function johariSessionsSheet_() {
  const sh = getSS_().getSheetByName(CFG.JOHARI_SESSIONS_SHEET);
  if (!sh) throw new Error('Johari sheet missing. Run setup() once from the Apps Script editor.');
  return sh;
}

function johariPeersSheet_() {
  const sh = getSS_().getSheetByName(CFG.JOHARI_PEERS_SHEET);
  if (!sh) throw new Error('Johari peers sheet missing. Run setup() once from the Apps Script editor.');
  return sh;
}

function johariFindSession_(sessionId) {
  sessionId = String(sessionId || '').trim();
  if (!sessionId) return null;
  const sh = johariSessionsSheet_();
  const last = sh.getLastRow();
  if (last < 2) return null;
  const rows = sh.getRange(2, 1, last - 1, 7).getValues();
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[0]) === sessionId) {
      return { sessionId: r[0], ts: r[1], name: r[2], email: r[3], role: r[4], team: r[5], selfAdjectives: r[6] };
    }
  }
  return null;
}

function johariPeerRows_(sessionId) {
  const sh = johariPeersSheet_();
  const last = sh.getLastRow();
  if (last < 2) return [];
  const rows = sh.getRange(2, 1, last - 1, 5).getValues();
  return rows
    .filter(function (r) { return String(r[1]) === sessionId; })
    .map(function (r) { return { responseId: r[0], sessionId: r[1], ts: r[2], relationship: r[3], peerAdjectives: r[4] }; });
}

function newLongId_() {
  // 16 hex chars, longer than newId_(), since this ID is a public, shareable peer link.
  return Utilities.getUuid().replace(/-/g, '').slice(0, 16).toUpperCase();
}

/* ---------- Strengths Compass actions ---------- */

/** Flattens the 24 themes into individual statements for the quiz. Each id is "<themeKey>-1" or "-2". */
function strengthsAllStatements_() {
  const out = [];
  STRENGTHS_THEMES.forEach(function (t) {
    t.statements.forEach(function (s, i) {
      out.push({ id: t.key + '-' + (i + 1), text: s, themeKey: t.key });
    });
  });
  return out;
}

/** Returns the statements WITHOUT the theme key, so the client only sees id + text. */
function strengthsGetStatements() {
  return strengthsAllStatements_().map(function (s) { return { id: s.id, text: s.text }; });
}

/** Scores answers (array of {id, value 1-5}), ranks all 24 themes, and computes domain percentages. */
function strengthsScore_(answers) {
  const all = strengthsAllStatements_();
  const byId = {};
  all.forEach(function (s) { byId[s.id] = s.themeKey; });

  const given = {};
  answers.forEach(function (a) {
    const v = Number(a.value);
    if (byId[a.id] && v >= 1 && v <= 5) given[a.id] = v;
  });
  if (Object.keys(given).length < all.length) {
    throw new Error('Please answer every statement before submitting.');
  }

  const themeScore = {};   // key -> sum (2-10)
  const domainSum = {};    // domain -> sum of all statement values
  const domainCount = {};  // domain -> number of statements in that domain

  STRENGTHS_THEMES.forEach(function (t) {
    let sum = 0;
    t.statements.forEach(function (s, i) { sum += given[t.key + '-' + (i + 1)]; });
    themeScore[t.key] = sum;
    domainSum[t.domain] = (domainSum[t.domain] || 0) + sum;
    domainCount[t.domain] = (domainCount[t.domain] || 0) + t.statements.length;
  });

  const ranked = STRENGTHS_THEMES
    .map(function (t) { return { key: t.key, score: themeScore[t.key] }; })
    .sort(function (a, b) { return b.score - a.score; });

  const domainPercents = {};
  Object.keys(domainSum).forEach(function (d) {
    domainPercents[d] = Math.round((domainSum[d] / (domainCount[d] * 5)) * 100);
  });

  return { ranked: ranked, domainPercents: domainPercents };
}

/** Scores, stores, and emails a Strengths Compass result. */
function strengthsSaveResult(payload) {
  const name = String(payload.name || '').trim().slice(0, 80);
  const email = String(payload.email || '').trim().toLowerCase().slice(0, 120);
  const role = String(payload.role || '').trim().slice(0, 60);
  const team = String(payload.team || '').trim().slice(0, 60);

  if (!name) throw new Error('Please enter your name.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Please enter a valid email address.');

  const scored = strengthsScore_(payload.answers || []);
  const id = newId_();
  const ts = new Date();

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    strengthsSheet_().appendRow([
      id, ts, name, email, role, team,
      JSON.stringify(scored.ranked), JSON.stringify(payload.answers)
    ]);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  const report = strengthsBuildReport_({ id: id, ts: ts, name: name, ranked: scored.ranked, domainPercents: scored.domainPercents });

  try {
    const link = CFG.PORTAL_URL || '';
    const top5names = report.top5.map(function (t) { return t.name; }).join(', ');
    const body =
      'Hi ' + name + ',\n\n' +
      'Thanks for completing Strengths Compass.\n\n' +
      'Your top 5 Signature Strengths: ' + top5names + '\n' +
      'Your result ID: ' + id + '\n\n' +
      (link
        ? 'To reopen your full report, visit ' + link.replace(/\/$/, '') + '/strengths.html and choose "Reopen my result". Enter this ID and this email address.\n'
        : 'Keep this ID and the email you used — you can reopen your full report with them.\n');
    const options = {};
    try { options.attachments = [makeStrengthsPdf_(report)]; } catch (pdfErr) { console.error('Strengths PDF failed: ' + pdfErr); }
    MailApp.sendEmail(email, 'Your Strengths Compass report', body, options);
  } catch (err) {
    console.error('Strengths email failed: ' + err);
  }

  return report;
}

/** Pulls a stored result back from the sheet. Needs BOTH the ID and the email. */
function strengthsGetResult(id, email) {
  id = String(id || '').trim().toUpperCase();
  email = String(email || '').trim().toLowerCase();
  if (!id || !email) throw new Error('Enter your result ID and the email you used.');

  const sh = strengthsSheet_();
  const last = sh.getLastRow();
  if (last >= 2) {
    const rows = sh.getRange(2, 1, last - 1, 8).getValues();
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (String(r[0]).toUpperCase() === id && String(r[3]).toLowerCase() === email) {
        const ranked = JSON.parse(r[6] || '[]');
        const domainPercents = strengthsDomainPercentsFromRanked_(ranked);
        return strengthsBuildReport_({ id: r[0], ts: r[1], name: r[2], ranked: ranked, domainPercents: domainPercents });
      }
    }
  }
  throw new Error("We couldn't find a result with that ID and email. Check both and try again.");
}

/** Returns the participant's PDF report as base64. Needs the same ID + email as strengthsGetResult. */
function strengthsGetPdf(id, email) {
  const report = strengthsGetResult(id, email);
  const blob = makeStrengthsPdf_(report);
  return { filename: blob.getName(), base64: Utilities.base64Encode(blob.getBytes()) };
}

/* ---------- Strengths Compass helpers ---------- */

/** Recomputes domain percentages from a stored ranked list (used when reopening an old result). */
function strengthsDomainPercentsFromRanked_(ranked) {
  const scoreByKey = {};
  ranked.forEach(function (r) { scoreByKey[r.key] = r.score; });
  const domainSum = {}, domainCount = {};
  STRENGTHS_THEMES.forEach(function (t) {
    domainSum[t.domain] = (domainSum[t.domain] || 0) + (scoreByKey[t.key] || 0);
    domainCount[t.domain] = (domainCount[t.domain] || 0) + t.statements.length;
  });
  const out = {};
  Object.keys(domainSum).forEach(function (d) {
    out[d] = Math.round((domainSum[d] / (domainCount[d] * 5)) * 100);
  });
  return out;
}

/** Assembles the full report the client (and the PDF) render from. */
function strengthsBuildReport_(r) {
  const themeByKey = {};
  STRENGTHS_THEMES.forEach(function (t) { themeByKey[t.key] = t; });

  const ranked = r.ranked.map(function (item) {
    const t = themeByKey[item.key];
    return {
      key: item.key, score: item.score, name: t.name, domain: t.domain,
      desc: t.desc, tip: t.tip, watch: t.watch
    };
  });

  return {
    id: r.id,
    name: r.name,
    date: Utilities.formatDate(new Date(r.ts), Session.getScriptTimeZone(), 'd MMM yyyy'),
    ranked: ranked,
    top5: ranked.slice(0, 5),
    domainPercents: r.domainPercents,
    domains: STRENGTHS_DOMAINS,
    disclaimer: STRENGTHS_DISCLAIMER
  };
}

function strengthsSheet_() {
  const sh = getSS_().getSheetByName(CFG.STRENGTHS_SHEET);
  if (!sh) throw new Error('Strengths sheet missing. Run setup() once from the Apps Script editor.');
  return sh;
}

/* ---------- Scoring ---------- */

/**
 * Forced choice: in every set the person picks one word MOST like them and one LEAST like them.
 * Net score per style = (times chosen Most) - (times chosen Least), then scaled to 0-100 (50 = balanced).
 */
function scoreAnswers_(answers) {
  const rows = questionRows_();
  const key = {};
  rows.forEach(function (r) {
    const m = {};
    m[r[1]] = 'D'; m[r[2]] = 'I'; m[r[3]] = 'S'; m[r[4]] = 'C';
    key[r[0]] = m;
  });

  const most = { D: 0, I: 0, S: 0, C: 0 };
  const least = { D: 0, I: 0, S: 0, C: 0 };
  let n = 0;

  answers.forEach(function (a) {
    const m = key[a.id];
    if (!m) return;
    const ms = m[a.most], ls = m[a.least];
    if (!ms || !ls || ms === ls) return;
    most[ms]++; least[ls]++; n++;
  });

  if (n < rows.length) throw new Error('Please answer every set before submitting.');

  const net = {}, pct = {};
  STYLE_KEYS.forEach(function (k) {
    net[k] = most[k] - least[k];
    pct[k] = Math.round(((net[k] + n) / (2 * n)) * 100);
  });

  const ranked = STYLE_KEYS.slice().sort(function (a, b) {
    return (net[b] - net[a]) || (most[b] - most[a]);
  });
  const primary = ranked[0];
  const secondary = pct[ranked[1]] >= 50 ? ranked[1] : null;

  return { pct: pct, primary: primary, secondary: secondary };
}

/* ---------- Report assembly ---------- */

function buildReport_(r) {
  const sec = r.secondary ? CONTENT[r.secondary] : null;
  return {
    id: r.id,
    name: r.name,
    date: Utilities.formatDate(new Date(r.ts), Session.getScriptTimeZone(), 'd MMM yyyy'),
    pct: r.pct,
    primary: r.primary,
    secondary: r.secondary || null,
    content: CONTENT[r.primary],
    secondaryContent: sec ? { name: sec.name, asSecondary: sec.asSecondary } : null,
    reading: READING,
    labels: { D: CONTENT.D.name, I: CONTENT.I.name, S: CONTENT.S.name, C: CONTENT.C.name }
  };
}

function sendEmail_(to, report) {
  try {
    const link = CFG.PORTAL_URL || '';
    const body =
      'Hi ' + report.name + ',\n\n' +
      'Thanks for completing the ' + CFG.SITE_NAME + '.\n\n' +
      'Primary style: ' + report.content.name + ' (' + report.content.nickname + ')\n' +
      'Your result ID: ' + report.id + '\n\n' +
      (link
        ? 'To reopen your full profile, visit ' + link + ' and choose "Reopen my result". Enter this ID and this email address.\n'
        : 'Keep this ID and the email you used — you can reopen your full profile with them.\n');
    const options = {};
    try { options.attachments = [makePdf_(report)]; } catch (pdfErr) { console.error('PDF failed: ' + pdfErr); }
    MailApp.sendEmail(to, 'Your DISC profile: ' + report.content.name, body, options);
  } catch (err) {
    console.error('Email failed: ' + err);
  }
}

/* ---------- Helpers ---------- */

function getSS_() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('Bind this script to a Google Sheet, or set a SHEET_ID script property.');
  return SpreadsheetApp.openById(id);
}

function questionRows_() {
  const sh = getSS_().getSheetByName(CFG.QUESTIONS_SHEET);
  if (!sh) throw new Error('Questions sheet missing. Run setup() once from the Apps Script editor.');
  return sh.getDataRange().getValues().slice(1).filter(function (r) { return r[0] !== ''; });
}

function responsesSheet_() {
  const sh = getSS_().getSheetByName(CFG.RESPONSES_SHEET);
  if (!sh) throw new Error('Responses sheet missing. Run setup() once from the Apps Script editor.');
  return sh;
}

function newId_() {
  return Utilities.getUuid().replace(/-/g, '').slice(0, 8).toUpperCase();
}

function shuffle_(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

/* ---------- Seed questions: [D word, I word, S word, C word] ---------- */

const SEED_QUESTIONS = [
  ['Forceful', 'Lively', 'Patient', 'Precise'],
  ['Decisive', 'Enthusiastic', 'Loyal', 'Careful'],
  ['Competitive', 'Persuasive', 'Calm', 'Systematic'],
  ['Bold', 'Sociable', 'Supportive', 'Analytical'],
  ['Direct', 'Optimistic', 'Steady', 'Accurate'],
  ['Determined', 'Charming', 'Gentle', 'Cautious'],
  ['Driven', 'Expressive', 'Agreeable', 'Logical'],
  ['Assertive', 'Friendly', 'Dependable', 'Thorough'],
  ['Daring', 'Inspiring', 'Accommodating', 'Disciplined'],
  ['Demanding', 'Talkative', 'Good listener', 'Perfectionist'],
  ['Results-focused', 'Outgoing', 'Consistent', 'Quality-focused'],
  ['Independent', 'Playful', 'Team-oriented', 'Private'],
  ['Take-charge', 'Animated', 'Understanding', 'Methodical'],
  ['Strong-willed', 'Warm', 'Relaxed', 'Factual'],
  ['Pioneering', 'Motivating', 'Reliable', 'Objective'],
  ['Resolute', 'Spontaneous', 'Peaceful', 'Deliberate'],
  ['Challenging', 'Encouraging', 'Even-tempered', 'Exacting'],
  ['Firm', 'Fun-loving', 'Considerate', 'Structured'],
  ['Ambitious', 'Magnetic', 'Harmonious', 'Principled'],
  ['Fast-paced', 'Trusting', 'Stable', 'Questioning'],
  ['Authoritative', 'Upbeat', 'Accepting', 'Detail-oriented'],
  ['Self-reliant', 'Charismatic', 'Cooperative', 'Orderly'],
  ['Tenacious', 'Cheerful', 'Devoted', 'Rigorous'],
  ['Risk-taking', 'Vivacious', 'Steadfast', 'Prudent']
];

