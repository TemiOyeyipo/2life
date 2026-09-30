
/**
 * JohariPdf.gs — builds the Johari Window PDF report.
 * Reuses h_(), list_() and head_() from ReportPdf.gs (same Apps Script
 * project = shared global scope, so they don't need to be redefined here).
 */

function makeJohariPdf_(data) {
  const html = buildJohariHtml_(data);
  const safe = String(data.name).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'Participant';
  return Utilities.newBlob(html, 'text/html', 'johari.html')
    .getAs('application/pdf')
    .setName('Johari-Window-' + safe + '.pdf');
}

function johariWordRow_(items, showCount) {
  if (!items.length) {
    return '<p style="font-size:11px;color:#8a94a3;font-style:italic;">No words landed here this time.</p>';
  }
  return '<p style="font-size:12px;line-height:1.9;">' + items.map(function (it) {
    const word = showCount ? it.word : it;
    const suffix = showCount && it.count ? ' <span style="color:#8a94a3;font-size:10px;">(' + it.count + ')</span>' : '';
    return '<span style="background:#EEF1F5;border-radius:4px;padding:3px 8px;margin:0 6px 6px 0;display:inline-block;font-weight:bold;">' +
      h_(word) + suffix + '</span>';
  }).join(' ') + '</p>';
}

function johariQuadrant_(key, items, color, showCount) {
  const info = JOHARI_INFO[key];
  return '<table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:18px;border:1px solid #E2E7ED;">' +
    '<tr><td style="background:' + color + ';height:6px;font-size:2px;">&nbsp;</td></tr>' +
    '<tr><td style="padding:12px 14px;">' +
    '<b style="font-family:Arial,sans-serif;font-size:14px;">' + h_(info.title) + '</b> ' +
    '<span style="font-family:Arial,sans-serif;font-size:10px;color:#8a94a3;">' + h_(info.subtitle) + '</span><br>' +
    '<p style="font-size:11px;color:#586477;margin:6px 0 10px 0;">' + h_(info.desc) + '</p>' +
    johariWordRow_(items, showCount) +
    '<p style="font-size:11px;margin:8px 0 0 0;"><b>Try this:</b> ' + h_(info.tip) + '</p>' +
    '</td></tr></table>';
}

function buildJohariHtml_(r) {
  const accent = '#4A6B5D';
  const first = String(r.name).split(' ')[0];
  const relList = Object.keys(r.relationships || {}).map(function (k) {
    return r.relationships[k] + ' ' + k;
  }).join(', ');

  return '<html><body style="font-family:Georgia,serif;font-size:12px;line-height:1.5;color:#142033;margin:0;">' +
    '<table width="100%" cellspacing="0" cellpadding="0"><tr><td style="background:' + accent + ';height:8px;font-size:4px;">&nbsp;</td></tr></table>' +
    '<table width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0 4px 0;"><tr>' +
    '<td>' +
      '<span style="font-family:Georgia,\'Times New Roman\',serif;font-size:22px;font-weight:bold;letter-spacing:1.5px;color:#2C3E35;">L&#39;chaim</span><br>' +
      '<span style="font-family:Arial,sans-serif;font-size:8px;font-weight:bold;letter-spacing:2px;color:#C87D55;">NOURISHING LIFE &amp; SPIRIT</span>' +
    '</td>' +
    '<td align="right" style="font-family:Arial,sans-serif;font-size:10px;color:#586477;">Johari Window</td>' +
    '</tr></table>' +

    '<h1 style="font-family:Arial,sans-serif;font-size:26px;margin:18px 0 4px 0;">' + h_(first) + '&#39;s Johari Window</h1>' +
    '<p style="font-family:Arial,sans-serif;font-size:10px;color:#586477;margin:0 0 14px 0;">' +
      h_(r.name) + ' | Feedback from ' + r.totalPeers + (r.totalPeers === 1 ? ' colleague' : ' colleagues') +
      (relList ? ' (' + h_(relList) + ')' : '') + '</p>' +

    '<p style="font-size:12px;margin:0 0 18px 0;">' + h_(JOHARI_INTRO) + '</p>' +

    johariQuadrant_('arena', r.arena, '#2E9E6B', true) +
    johariQuadrant_('blind', r.blind, '#D93A3A', true) +
    johariQuadrant_('facade', r.facade, '#E59A00', false) +

    '<table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:18px;border:1px solid #E2E7ED;">' +
    '<tr><td style="background:#8a94a3;height:6px;font-size:2px;">&nbsp;</td></tr>' +
    '<tr><td style="padding:12px 14px;">' +
    '<b style="font-family:Arial,sans-serif;font-size:14px;">' + h_(JOHARI_INFO.unknown.title) + '</b> ' +
    '<span style="font-family:Arial,sans-serif;font-size:10px;color:#8a94a3;">' + h_(JOHARI_INFO.unknown.subtitle) + '</span><br>' +
    '<p style="font-size:11px;color:#586477;margin:6px 0 10px 0;">' + h_(JOHARI_INFO.unknown.desc) + '</p>' +
    '<p style="font-size:12px;"><b>' + r.unknownCount + '</b> of ' + JOHARI_ADJECTIVES.length + ' words on the list were not picked by you or by anyone who responded.</p>' +
    '<p style="font-size:11px;margin:8px 0 0 0;"><b>Try this:</b> ' + h_(JOHARI_INFO.unknown.tip) + '</p>' +
    '</td></tr></table>' +

    '<p style="font-family:Arial,sans-serif;font-size:9px;color:#586477;margin-top:24px;">' + h_(JOHARI_DISCLAIMER) + '</p>' +
    '</body></html>';
}
