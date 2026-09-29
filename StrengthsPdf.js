/**
 * StrengthsPdf.gs — builds the Strengths Compass PDF report.
 * Reuses h_(), list_(), head_() and bar_() from ReportPdf.gs (same Apps
 * Script project = shared global scope, so they don't need to be redefined).
 */

function makeStrengthsPdf_(report) {
  const html = buildStrengthsHtml_(report);
  const safe = String(report.name).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'Participant';
  return Utilities.newBlob(html, 'text/html', 'strengths.html')
    .getAs('application/pdf')
    .setName('Strengths-Compass-' + safe + '.pdf');
}

function strengthsCard_(theme, rank, accent) {
  return '<table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:14px;border:1px solid #E2E7ED;">' +
    '<tr><td style="background:' + accent + ';height:6px;font-size:2px;">&nbsp;</td></tr>' +
    '<tr><td style="padding:12px 14px;">' +
    '<b style="font-family:Arial,sans-serif;font-size:15px;">' + rank + '. ' + h_(theme.name) + '</b> ' +
    '<span style="font-family:Arial,sans-serif;font-size:10px;color:#8a94a3;">' + h_(STRENGTHS_DOMAINS[theme.domain].name) + '</span><br>' +
    '<p style="font-size:11px;color:#586477;margin:6px 0 8px 0;">' + h_(theme.desc) + '</p>' +
    '<p style="font-size:11px;margin:0 0 4px 0;"><b>Use it:</b> ' + h_(theme.tip) + '</p>' +
    '<p style="font-size:11px;margin:0;color:#8a94a3;"><b>Watch for:</b> ' + h_(theme.watch) + '</p>' +
    '</td></tr></table>';
}

function buildStrengthsHtml_(r) {
  const accent = '#4A6B5D';
  const first = String(r.name).split(' ')[0];

  const top5Cards = r.top5.map(function (t, i) {
    return strengthsCard_(t, i + 1, STRENGTHS_DOMAINS[t.domain].color);
  }).join('');

  const domainBars = Object.keys(r.domains).map(function (key) {
    const d = r.domains[key];
    return bar_(d.name, r.domainPercents[key] || 0, d.color);
  }).join('');

  const fullList = r.ranked.map(function (t, i) {
    return '<tr>' +
      '<td width="6%" style="font-family:Arial,sans-serif;font-size:11px;padding:3px 0;">' + (i + 1) + '</td>' +
      '<td width="34%" style="font-family:Arial,sans-serif;font-size:11px;font-weight:bold;padding:3px 0;">' + h_(t.name) + '</td>' +
      '<td width="30%" style="font-family:Arial,sans-serif;font-size:10px;color:#8a94a3;padding:3px 0;">' + h_(STRENGTHS_DOMAINS[t.domain].name) + '</td>' +
      '<td width="30%" style="font-family:Arial,sans-serif;font-size:10px;color:#8a94a3;padding:3px 0;">' + t.score + ' / 10</td>' +
      '</tr>';
  }).join('');

  return '<html><body style="font-family:Georgia,serif;font-size:12px;line-height:1.5;color:#142033;margin:0;">' +
    '<table width="100%" cellspacing="0" cellpadding="0"><tr><td style="background:' + accent + ';height:8px;font-size:4px;">&nbsp;</td></tr></table>' +
    '<table width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0 4px 0;"><tr>' +
    '<td>' +
      '<span style="font-family:Georgia,\'Times New Roman\',serif;font-size:22px;font-weight:bold;letter-spacing:1.5px;color:#2C3E35;">L&#39;chaim</span><br>' +
      '<span style="font-family:Arial,sans-serif;font-size:8px;font-weight:bold;letter-spacing:2px;color:#C87D55;">NOURISHING LIFE &amp; SPIRIT</span>' +
    '</td>' +
    '<td align="right" style="font-family:Arial,sans-serif;font-size:10px;color:#586477;">Strengths Compass</td>' +
    '</tr></table>' +

    '<h1 style="font-family:Arial,sans-serif;font-size:26px;margin:18px 0 4px 0;">' + h_(first) + '&#39;s Signature Strengths</h1>' +
    '<p style="font-family:Arial,sans-serif;font-size:10px;color:#586477;margin:0 0 14px 0;">' +
      h_(r.name) + ' | Result ID ' + h_(r.id) + ' | ' + h_(r.date) + '</p>' +

    head_('Your top 5', accent) + top5Cards +

    head_('Domain balance', accent) +
    '<p style="font-size:11px;color:#586477;">Scores run from 0 to 100. A higher percentage means more of your energy tends to sit in that domain.</p>' +
    '<table width="100%" cellspacing="0" cellpadding="0">' + domainBars + '</table>' +

    head_('All 24 themes, ranked', accent) +
    '<table width="100%" cellspacing="0" cellpadding="0">' + fullList + '</table>' +

    '<p style="font-family:Arial,sans-serif;font-size:9px;color:#586477;margin-top:24px;">' + h_(STRENGTHS_DISCLAIMER) + '</p>' +
    '</body></html>';
}

