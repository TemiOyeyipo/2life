/**
 * BLACKOUT INDEX - Apps Script backend
 * - API: receives ratings from the GitHub-hosted front end (doPost)
 * - Summary: auto-averages scores per leader
 * - PDF reports: one per leader, saved to Google Drive (Sheet menu > Blackout Index)
 *
 * Deploy > New deployment > Web app (Execute as: Me, Access: Anyone).
 * After any code change: Deploy > Manage deployments > Edit > New version.
 * The first time you run a report, Google will ask you to authorise Drive access.
 */

const SHEET_RESPONSES = 'Responses';
const SHEET_SUMMARY = 'Summary';
const REPORT_FOLDER_NAME = 'Blackout Index Reports';
const MIN_TEAM_RATERS = 3; // below this, reports carry an "indicative only" note

const QUESTIONS = [
  // Part 1: WAIT or MOVE
  'When the leader is unavailable, the team still makes good decisions.',
  'People know which decisions they can make without approval.',
  'Urgent client issues get resolved without waiting for the leader.',
  'The team uses agreed principles when there is no clear answer.',
  'Work does not stall when the leader is away.',
  // Part 2: ESCALATE or SOLVE
  'When two people disagree, they resolve it themselves first.',
  'People challenge each other\'s ideas openly and respectfully.',
  'Escalation is a last resort, not a habit.',
  'Managers coach their own people rather than sending problems upward.',
  'Disagreements end in a clear decision, not a postponement.',
  // Part 3: PROTECT or RESPOND
  'When a decision goes wrong, the team asks "what did we learn?" before "whose fault?"',
  'People admit mistakes early.',
  'Nobody avoids decisions out of fear of blame.',
  'The team adapts quickly after a setback.',
  'People take ownership of results, good or bad.'
];
const QUESTION_COUNT = QUESTIONS.length;

// Question index ranges [start, end) for each part
const PARTS = [[0, 5], [5, 10], [10, 15]];
const PART_NAMES = ['Wait or Move', 'Escalate or Solve', 'Protect or Respond'];

const ACTIONS = [
  [
    'Publish a one-page decision-rights list: what the team can decide, what needs consultation, and what must be escalated.',
    'Pick one recurring decision this month and hand it over completely, including the outcome.'
  ],
  [
    'Set a rule: people in conflict meet first and bring a recommendation, not just a problem.',
    'Answer "What would you do?" before giving your own view.'
  ],
  [
    'Run a no-blame review after the next setback: what happened, what we learned, what we change.',
    'Publicly thank someone for admitting a mistake early.'
  ]
];

/* ---------------------------------------------------------------- MENU */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Blackout Index')
    .addItem('Rebuild summary', 'buildSummary')
    .addSeparator()
    .addItem('PDF report for one leader...', 'menuReportOne')
    .addItem('PDF reports for all leaders', 'menuReportAll')
    .addToUi();
}

function menuReportOne() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt('PDF report', 'Enter the leader\'s name exactly as it appears in the Responses sheet:', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  try {
    const file = createReport_(res.getResponseText());
    ui.alert('Report created', file.getName() + '\n\n' + file.getUrl(), ui.ButtonSet.OK);
  } catch (err) {
    ui.alert('Could not create report', String(err.message || err), ui.ButtonSet.OK);
  }
}

function menuReportAll() {
  const ui = SpreadsheetApp.getUi();
  const names = leaderNames_();
  const made = [];
  const skipped = [];
  names.forEach(function (n) {
    try { made.push(createReport_(n).getName()); }
    catch (err) { skipped.push(n + ' (' + err.message + ')'); }
  });
  ui.alert('Reports finished',
    'Created: ' + (made.length ? '\n' + made.join('\n') : 'none') +
    (skipped.length ? '\n\nSkipped:\n' + skipped.join('\n') : '') +
    '\n\nFolder in Drive: ' + REPORT_FOLDER_NAME,
    ui.ButtonSet.OK);
}

/* ----------------------------------------------------------------- API */

/** Health check: open the web app URL in a browser. */
function doGet() {
  return json_({ status: 'ok', service: 'Blackout Index API' });
}

/** Receives a JSON submission from the GitHub-hosted front end. */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const data = JSON.parse(e.postData.contents);
    saveResponse_(data);
    buildSummary();
    return json_({ status: 'ok' });
  } catch (err) {
    return json_({ status: 'error', message: String(err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function saveResponse_(data) {
  if (!data || !data.leader || !String(data.leader).trim()) {
    throw new Error('Leader name is required');
  }
  if (!Array.isArray(data.answers) || data.answers.length !== QUESTION_COUNT) {
    throw new Error('Expected ' + QUESTION_COUNT + ' answers');
  }
  const answers = data.answers.map(function (n) {
    const v = Number(n);
    if (!(v >= 1 && v <= 5)) throw new Error('Ratings must be between 1 and 5');
    return v;
  });

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_RESPONSES);
  if (!sh) {
    sh = ss.insertSheet(SHEET_RESPONSES);
    const header = ['Timestamp', 'Leader', 'Rater type', 'Rater name']
      .concat(answers.map(function (_, i) { return 'Q' + (i + 1); }))
      .concat(['Comment']);
    sh.appendRow(header);
    sh.getRange(1, 1, 1, header.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }

  const type = data.type === 'Self' ? 'Self' : 'Team';
  sh.appendRow(
    [new Date(), String(data.leader).trim().slice(0, 100), type,
     String(data.name || '').slice(0, 100)]
      .concat(answers)
      .concat([String(data.comment || '').slice(0, 1000)])
  );
}

/* ------------------------------------------------------------- SUMMARY */

function partScores_(list) {
  if (!list.length) return null;
  return PARTS.map(function (p) {
    let total = 0;
    list.forEach(function (scores) {
      for (let i = p[0]; i < p[1]; i++) total += scores[i];
    });
    return round1_(total / list.length);
  });
}

function band_(total) {
  if (total >= 60) return 'Leadership embedded';
  if (total >= 39) return 'Partly dependent on leader';
  return 'Built around the leader';
}

function round1_(n) { return Math.round(n * 10) / 10; }

function buildSummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_RESPONSES);
  if (!sh) return;
  const rows = sh.getDataRange().getValues().slice(1);
  const leaders = {};

  rows.forEach(function (r) {
    const key = String(r[1]).trim().toLowerCase();
    if (!key) return;
    if (!leaders[key]) leaders[key] = { name: String(r[1]).trim(), team: [], self: [] };
    const scores = r.slice(4, 4 + QUESTION_COUNT).map(Number);
    if (r[2] === 'Self') leaders[key].self.push(scores);
    else leaders[key].team.push(scores);
  });

  const out = [[
    'Leader', 'Team raters',
    'Move (team /25)', 'Solve (team /25)', 'Respond (team /25)',
    'Move (self /25)', 'Solve (self /25)', 'Respond (self /25)',
    'Move gap', 'Solve gap', 'Respond gap',
    'Team total /75', 'Band'
  ]];

  Object.keys(leaders).forEach(function (k) {
    const L = leaders[k];
    const t = partScores_(L.team);
    const s = partScores_(L.self);
    const blank = ['', '', ''];
    const gaps = (t && s)
      ? [s[0] - t[0], s[1] - t[1], s[2] - t[2]].map(round1_)
      : blank;
    const total = t ? round1_(t[0] + t[1] + t[2]) : '';
    out.push([L.name, L.team.length]
      .concat(t || blank)
      .concat(s || blank)
      .concat(gaps)
      .concat([total, total === '' ? '' : band_(total)]));
  });

  let sum = ss.getSheetByName(SHEET_SUMMARY);
  if (!sum) sum = ss.insertSheet(SHEET_SUMMARY);
  sum.clear();
  sum.getRange(1, 1, out.length, out[0].length).setValues(out);
  sum.getRange(1, 1, 1, out[0].length).setFontWeight('bold');
  sum.setFrozenRows(1);
}

/* --------------------------------------------------------- PDF REPORTS */

function leaderNames_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RESPONSES);
  if (!sh) return [];
  const seen = {};
  const names = [];
  sh.getDataRange().getValues().slice(1).forEach(function (r) {
    const n = String(r[1]).trim();
    const k = n.toLowerCase();
    if (n && !seen[k]) { seen[k] = true; names.push(n); }
  });
  return names;
}

function collectLeader_(leaderName) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RESPONSES);
  if (!sh) throw new Error('No responses yet');
  const key = String(leaderName).trim().toLowerCase();
  const data = { name: '', team: [], self: [], comments: [] };

  sh.getDataRange().getValues().slice(1).forEach(function (r) {
    if (String(r[1]).trim().toLowerCase() !== key) return;
    data.name = String(r[1]).trim();
    const scores = r.slice(4, 4 + QUESTION_COUNT).map(Number);
    if (r[2] === 'Self') {
      data.self.push(scores);
    } else {
      data.team.push(scores);
      const c = String(r[4 + QUESTION_COUNT] || '').trim();
      if (c) data.comments.push(c); // rater names are never included
    }
  });

  if (!data.name) throw new Error('Leader not found');
  if (!data.team.length) throw new Error('No team ratings yet');
  return data;
}

function questionAverages_(list) {
  if (!list.length) return null;
  const out = [];
  for (let i = 0; i < QUESTION_COUNT; i++) {
    let t = 0;
    list.forEach(function (s) { t += s[i]; });
    out.push(round1_(t / list.length));
  }
  return out;
}

function esc_(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function bar_(value, max, color) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return '<table width="100%" cellspacing="0" cellpadding="0"><tr>' +
    '<td width="' + pct + '%" style="background:' + color + ';height:10px;font-size:1px;">&nbsp;</td>' +
    '<td style="background:#e5e5e5;height:10px;font-size:1px;">&nbsp;</td></tr></table>';
}

function reportHtml_(d) {
  const t = partScores_(d.team);
  const s = partScores_(d.self);
  const tq = questionAverages_(d.team);
  const sq = questionAverages_(d.self);
  const total = round1_(t[0] + t[1] + t[2]);
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'd MMMM yyyy');

  // Strengths = highest team-rated questions; development = lowest
  const idx = tq.map(function (v, i) { return i; });
  const byHigh = idx.slice().sort(function (a, b) { return tq[b] - tq[a]; }).slice(0, 3);
  const byLow = idx.slice().sort(function (a, b) { return tq[a] - tq[b]; }).slice(0, 3);

  // Blind spots = biggest positive self-minus-team gaps
  let blind = [];
  if (sq) {
    blind = idx.filter(function (i) { return sq[i] - tq[i] > 0; })
      .sort(function (a, b) { return (sq[b] - tq[b]) - (sq[a] - tq[a]); })
      .slice(0, 3);
  }

  // Weakest part drives the 90-day actions
  let weak = 0;
  for (let p = 1; p < 3; p++) if (t[p] < t[weak]) weak = p;

  let h = '<html><body style="font-family:Arial,sans-serif;color:#222;font-size:12px;">';
  h += '<h1 style="color:#1a5fb4;margin-bottom:2px;">Blackout Index Report</h1>';
  h += '<div style="color:#666;">Leader: <b>' + esc_(d.name) + '</b> &nbsp;|&nbsp; ' + today +
       ' &nbsp;|&nbsp; Team raters: ' + d.team.length + (sq ? ' &nbsp;|&nbsp; Self-rating included' : '') + '</div>';

  if (d.team.length < MIN_TEAM_RATERS) {
    h += '<p style="background:#fff4d6;padding:8px;border:1px solid #e0c36a;">Only ' + d.team.length +
         ' team rating(s) so far. Treat these results as indicative; aim for at least ' + MIN_TEAM_RATERS + '.</p>';
  }

  h += '<h2 style="margin-top:18px;">Overall: ' + total + ' / 75 &mdash; ' + esc_(band_(total)) + '</h2>';
  h += '<p style="color:#555;">This measures how well the organisation functions when the leader is not in the room.</p>';

  h += '<table width="100%" cellspacing="0" cellpadding="6" style="border-collapse:collapse;">';
  h += '<tr style="background:#f0f4fa;"><th align="left">Dimension</th><th align="left" width="30%">Team view</th><th>Team</th><th>Self</th><th>Gap</th></tr>';
  for (let p = 0; p < 3; p++) {
    const gap = s ? round1_(s[p] - t[p]) : '';
    h += '<tr style="border-bottom:1px solid #ddd;"><td>' + esc_(PART_NAMES[p]) + '</td><td>' + bar_(t[p], 25, '#1a5fb4') +
         '</td><td align="center">' + t[p] + '/25</td><td align="center">' + (s ? s[p] + '/25' : '-') +
         '</td><td align="center">' + (gap === '' ? '-' : (gap > 0 ? '+' + gap : gap)) + '</td></tr>';
  }
  h += '</table>';
  if (s) h += '<p style="color:#777;font-size:11px;">Gap = self minus team. A positive gap means you rate yourself higher than your team does.</p>';

  h += '<h3 style="color:#1a5fb4;">Strongest areas (team view)</h3><ul>';
  byHigh.forEach(function (i) { h += '<li>' + esc_(QUESTIONS[i]) + ' <b>(' + tq[i] + '/5)</b></li>'; });
  h += '</ul>';

  h += '<h3 style="color:#1a5fb4;">Development priorities (team view)</h3><ul>';
  byLow.forEach(function (i) { h += '<li>' + esc_(QUESTIONS[i]) + ' <b>(' + tq[i] + '/5)</b></li>'; });
  h += '</ul>';

  if (blind.length) {
    h += '<h3 style="color:#1a5fb4;">Possible blind spots (you rated higher than your team)</h3><ul>';
    blind.forEach(function (i) {
      h += '<li>' + esc_(QUESTIONS[i]) + ' <b>(you ' + sq[i] + ' vs team ' + tq[i] + ')</b></li>';
    });
    h += '</ul>';
  }

  h += '<h3 style="color:#1a5fb4;">90-day focus: ' + esc_(PART_NAMES[weak]) + '</h3><ul>';
  ACTIONS[weak].forEach(function (a) { h += '<li>' + esc_(a) + '</li>'; });
  h += '<li>Re-run the Blackout Index in 90 days and compare scores.</li></ul>';

  if (d.comments.length) {
    h += '<h3 style="color:#1a5fb4;">Anonymous team comments: decisions the team hesitates to make</h3><ul>';
    d.comments.forEach(function (c) { h += '<li>' + esc_(c) + '</li>'; });
    h += '</ul>';
  }

  h += '<p style="margin-top:24px;color:#888;font-size:10px;">Capability equation: Emotional Intelligence &rarr; Communication &rarr; Trust &rarr; Decision-Making &rarr; Ownership &rarr; Capability.</p>';
  h += '</body></html>';
  return h;
}

function reportFolder_() {
  const it = DriveApp.getFoldersByName(REPORT_FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(REPORT_FOLDER_NAME);
}

/** Builds the PDF for one leader and saves it to Drive. Returns the Drive file. */
function createReport_(leaderName) {
  const d = collectLeader_(leaderName);
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const blob = HtmlService.createHtmlOutput(reportHtml_(d))
    .getBlob()
    .getAs('application/pdf')
    .setName('Blackout Index - ' + d.name + ' - ' + stamp + '.pdf');
  return reportFolder_().createFile(blob);
}

/* --------------------------------------------------------------- UTIL */

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

