/**
 * ReportPdf.gs — builds a printable PDF of a participant's result.
 * Apps Script's HTML-to-PDF converter only handles simple HTML/CSS,
 * so this uses tables and inline styles (no grid, flexbox, SVG or web fonts).
 */

const PDF_COLORS = { D: '#D93A3A', I: '#E59A00', S: '#2E9E6B', C: '#2F6FE0' };

function makePdf_(report) {
  const html = buildReportHtml_(report);
  const safe = String(report.name).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'Participant';
  return Utilities.newBlob(html, 'text/html', 'report.html')
    .getAs('application/pdf')
    .setName('DISC-Profile-' + safe + '.pdf');
}

function h_(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function list_(items) {
  return '<ul style="margin:0 0 10px 0;padding-left:18px;">' +
    items.map(function (i) { return '<li style="margin-bottom:4px;">' + h_(i) + '</li>'; }).join('') + '</ul>';
}

function head_(text, color) {
  return '<h2 style="font-family:Arial,sans-serif;font-size:16px;margin:22px 0 6px 0;padding-bottom:4px;border-bottom:2px solid ' +
    color + ';color:#142033;">' + h_(text) + '</h2>';
}

function bar_(label, value, color) {
  return '<tr>' +
    '<td width="30%" style="padding:4px 0;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;">' + h_(label) + '</td>' +
    '<td width="60%" style="padding:4px 0;"><table width="100%" cellspacing="0" cellpadding="0" style="background:#E2E7ED;"><tr>' +
    '<td width="' + Math.max(1, value) + '%" style="background:' + color + ';font-size:10px;line-height:10px;">&nbsp;</td>' +
    '<td width="' + Math.max(0, 100 - value) + '%" style="font-size:10px;">&nbsp;</td></tr></table></td>' +
    '<td width="10%" align="right" style="font-family:Arial,sans-serif;font-size:12px;font-weight:bold;">' + value + '</td>' +
    '</tr>';
}

function buildReportHtml_(r) {
  const c = r.content;
  const accent = PDF_COLORS[r.primary];
  const first = String(r.name).split(' ')[0];

  const bars = ['D', 'I', 'S', 'C'].map(function (k) {
    return bar_(k + '  ' + r.labels[k], r.pct[k], PDF_COLORS[k]);
  }).join('');

  const others = ['D', 'I', 'S', 'C'].map(function (k) {
    const o = r.reading[k];
    return '<table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:10px;"><tr>' +
      '<td width="6" style="background:' + PDF_COLORS[k] + ';">&nbsp;</td>' +
      '<td style="padding:2px 0 2px 10px;">' +
      '<b style="font-family:Arial,sans-serif;">When you meet ' + h_(r.labels[k]) + '</b><br>' +
      '<b>You will notice:</b> ' + h_(o.cues) + '<br>' +
      '<b>They need:</b> ' + h_(o.needs) + '<br>' +
      '<b>Do:</b> ' + o.doThis.map(h_).join(' ') + '<br>' +
      '<b>Avoid:</b> ' + o.avoid.map(h_).join(' ') +
      '</td></tr></table>';
  }).join('');

  const blend = r.secondaryContent
    ? '<p>Your secondary style, <b>' + h_(r.secondaryContent.name) + '</b>, ' + h_(r.secondaryContent.asSecondary) + '</p>'
    : '';

  return '<html><body style="font-family:Georgia,serif;font-size:12px;line-height:1.5;color:#142033;margin:0;">' +
    '<table width="100%" cellspacing="0" cellpadding="0"><tr><td style="background:' + accent + ';height:8px;font-size:4px;">&nbsp;</td></tr></table>' +
    '<table width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0 4px 0;"><tr>' +
    '<td>' +
      '<span style="font-family:Georgia,\'Times New Roman\',serif;font-size:22px;font-weight:bold;letter-spacing:1.5px;color:#2C3E35;">L&#39;chaim</span><br>' +
      '<span style="font-family:Arial,sans-serif;font-size:8px;font-weight:bold;letter-spacing:2px;color:#C87D55;">NOURISHING LIFE &amp; SPIRIT</span>' +
    '</td>' +
    '<td align="right" style="font-family:Arial,sans-serif;font-size:10px;color:#586477;">DISC Leadership Profile</td>' +
    '</tr></table>' +
    '<h1 style="font-family:Arial,sans-serif;font-size:26px;margin:18px 0 4px 0;">' + h_(first) + ', you lead with ' + h_(c.name) + '.</h1>' +
    '<p style="font-family:Arial,sans-serif;font-size:14px;font-weight:bold;margin:0 0 4px 0;">' + h_(c.nickname) +
      (r.secondaryContent ? ' with ' + h_(r.secondaryContent.name) + ' influence' : '') + '</p>' +
    '<p style="font-size:14px;margin:0 0 4px 0;">' + h_(c.tagline) + '</p>' +
    '<p style="font-family:Arial,sans-serif;font-size:10px;color:#586477;margin:0 0 14px 0;">' +
      h_(r.name) + ' | Result ID ' + h_(r.id) + ' | ' + h_(r.date) + '</p>' +

    '<table width="100%" cellspacing="0" cellpadding="0">' + bars + '</table>' +
    '<p style="font-family:Arial,sans-serif;font-size:9px;color:#586477;">Scores run from 0 to 100, and 50 means balanced. They compare your four styles with each other. Everyone uses all four, and higher does not mean better.</p>' +

    head_('Who you are at work', accent) + '<p>' + h_(c.summary) + '</p>' + blend +
    '<table width="100%" cellspacing="0" cellpadding="0"><tr>' +
      '<td width="48%" valign="top"><b style="font-family:Arial,sans-serif;">Strengths to use</b>' + list_(c.strengths) + '</td>' +
      '<td width="4%">&nbsp;</td>' +
      '<td width="48%" valign="top"><b style="font-family:Arial,sans-serif;">Blind spots to watch</b>' + list_(c.blindSpots) + '</td>' +
    '</tr></table>' +

    head_('How you lead', accent) +
    '<p><b>At your best:</b> ' + h_(c.leadAtBest) + '</p>' +
    '<p><b>The risk to manage:</b> ' + h_(c.leadRisk) + '</p>' +
    '<b style="font-family:Arial,sans-serif;">Four moves that make you stronger</b>' + list_(c.leadMoves) +

    head_('How you communicate', accent) +
    '<p>' + h_(c.commStyle) + '</p>' + list_(c.commTips) +

    head_('Reading and working with other styles', accent) + others +

    head_('Under pressure', accent) +
    '<p>' + h_(c.stress) + '</p>' + list_(c.reset) +

    head_('Your 30-day plan', accent) + list_(c.plan) +

    '<p style="font-family:Arial,sans-serif;font-size:9px;color:#586477;margin-top:24px;">DISC describes behavioural preferences from your own answers. It is a tool for reflection and development. It is not a clinical test and should not be used to make hiring or promotion decisions.</p>' +
    '</body></html>';
}

