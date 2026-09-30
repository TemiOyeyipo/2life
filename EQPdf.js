/**
 * EQPdf.gs — builds the Emotional Intelligence PDF report.
 * Reuses h_(), head_() and bar_() from ReportPdf.gs (same Apps Script
 * project = shared global scope, so they don't need to be redefined) —
 * same pattern as StrengthsPdf.gs.
 */

function makeEqPdf_(report) {
  const html = buildEqHtml_(report);
  const safe = String(report.name).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'Participant';
  return Utilities.newBlob(html, 'text/html', 'eq.html')
    .getAs('application/pdf')
    .setName('EQ-Report-' + safe + '.pdf');
}

function buildEqHtml_(r) {
  const accent = '#2F6FE0';
  const first = String(r.name).split(' ')[0];

  const domainBars = Object.keys(r.domains).map(function (key) {
    const d = r.domains[key];
    return bar_(d.name, r.domainScores[key].pct, d.color);
  }).join('');

  const domainDescriptions = Object.keys(r.domains).map(function (key) {
    const d = r.domains[key];
    return '<p style="font-size:11px;margin:0 0 8px 0;"><b style="color:' + d.color + ';">' + h_(d.name) +
      ' (' + r.domainScores[key].pct + '%):</b> ' + h_(d.desc) + '</p>';
  }).join('');

  return '<html><body style="font-family:Georgia,serif;font-size:12px;line-height:1.5;color:#142033;margin:0;">' +
    '<table width="100%" cellspacing="0" cellpadding="0"><tr><td style="background:' + accent + ';height:8px;font-size:4px;">&nbsp;</td></tr></table>' +
    '<table width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0 4px 0;"><tr>' +
    '<td>' +
      '<span style="font-family:Georgia,\'Times New Roman\',serif;font-size:22px;font-weight:bold;letter-spacing:1.5px;color:#2C3E35;">L&#39;chaim</span><br>' +
      '<span style="font-family:Arial,sans-serif;font-size:8px;font-weight:bold;letter-spacing:2px;color:#C87D55;">NOURISHING LIFE &amp; SPIRIT</span>' +
    '</td>' +
    '<td align="right" style="font-family:Arial,sans-serif;font-size:10px;color:#586477;">Emotional Intelligence</td>' +
    '</tr></table>' +

    '<h1 style="font-family:Arial,sans-serif;font-size:26px;margin:18px 0 4px 0;">' + h_(first) + '&#39;s EQ Profile</h1>' +
    '<p style="font-family:Arial,sans-serif;font-size:10px;color:#586477;margin:0 0 14px 0;">' +
      h_(r.name) + ' | Result ID ' + h_(r.id) + ' | ' + h_(r.date) + ' | Overall: ' + r.overallPct + '%</p>' +

    head_('Domain scores', accent) +
    '<p style="font-size:11px;color:#586477;">Scores run from 0 to 100. Higher isn\u2019t universally better \u2014 it shows where your self-reported tendencies currently sit.</p>' +
    '<table width="100%" cellspacing="0" cellpadding="0">' + domainBars + '</table>' +

    head_('What each domain means', accent) +
    domainDescriptions +

    '<p style="font-family:Arial,sans-serif;font-size:9px;color:#586477;margin-top:24px;">' + h_(EQ_DISCLAIMER) + '</p>' +
    '</body></html>';
}

