/**
 * INTEGRATION LAYER — doPost router + PDF sections for EQ + Johari
 * Extends SelfAwarenessSuite.gs. Assumes your existing Code.gs already
 * has a doPost(e) entry point that dispatches on an "action" parameter.
 */

// ============================================================
// doPost ROUTER ADDITIONS
// ============================================================

function routeSelfAwarenessSuite(e) {
  const action = e.parameter.action;
  const participantId = e.parameter.participantId;
  const participantName = e.parameter.participantName;

  if (action === 'submitEQ') {
    const responses = {};
    EQ_ITEMS.forEach(item => {
      responses[item.id] = e.parameter[item.id];
    });
    recordEQResponse(participantId, participantName, responses);
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok', module: 'EQ' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'submitJohariSelf') {
    const words = String(e.parameter.words || '').split(',').map(w => w.trim()).filter(Boolean);
    recordJohariResponse(participantId, participantName, 'self', participantName, words);
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok', module: 'Johari-self' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'submitJohariPeer') {
    const raterName = e.parameter.raterName || 'Anonymous';
    const words = String(e.parameter.words || '').split(',').map(w => w.trim()).filter(Boolean);
    recordJohariResponse(participantId, participantName, 'peer', raterName, words);
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok', module: 'Johari-peer' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return null; // let the existing router handle DISC / other actions
}

// ============================================================
// PDF TEMPLATE SECTIONS
// ============================================================

function renderEQSection(eqResults) {
  const barColor = '#4A6FA5';
  const rows = EQ_DOMAINS.map(domain => {
    const d = eqResults.domainScores[domain];
    return `
      <tr>
        <td style="padding:6px 10px; font-family:Arial, sans-serif; font-size:12px; width:140px;">${domain}</td>
        <td style="padding:6px 0; width:300px;">
          <div style="background:#eee; border-radius:4px; overflow:hidden; height:14px; width:100%;">
            <div style="background:${barColor}; height:14px; width:${d.pct}%;"></div>
          </div>
        </td>
        <td style="padding:6px 10px; font-family:Arial, sans-serif; font-size:12px; width:50px;">${d.pct}%</td>
      </tr>`;
  }).join('');

  return `
    <div style="margin-top:24px;">
      <h2 style="font-family:Arial, sans-serif; font-size:16px; color:#222;">Emotional Intelligence</h2>
      <p style="font-family:Arial, sans-serif; font-size:12px; color:#555;">
        Overall score: ${eqResults.overall.pct}%
      </p>
      <table style="border-collapse:collapse; width:100%;">${rows}</table>
    </div>`;
}

function renderJohariSection(johariResults) {
  const cellStyle = 'border:1px solid #ccc; padding:12px; vertical-align:top; width:50%; font-family:Arial, sans-serif; font-size:12px;';
  const listOrDash = arr => arr.length ? arr.join(', ') : '<em style="color:#999;">(none)</em>';

  const blindWithCounts = johariResults.blind
    .map(w => `${w} (${johariResults.peerFrequency[w]})`)
    .join(', ');

  return `
    <div style="margin-top:24px;">
      <h2 style="font-family:Arial, sans-serif; font-size:16px; color:#222;">Johari Window</h2>
      <table style="border-collapse:collapse; width:100%;">
        <tr>
          <td style="${cellStyle} background:#f5f8fc;">
            <strong>Open</strong> (known to you and others)<br>${listOrDash(johariResults.open)}
          </td>
          <td style="${cellStyle} background:#fdf3e7;">
            <strong>Blind Spot</strong> (others see, you don't)<br>${blindWithCounts || '<em style="color:#999;">(none)</em>'}
          </td>
        </tr>
        <tr>
          <td style="${cellStyle} background:#eef7ee;">
            <strong>Hidden</strong> (you know, others don't)<br>${listOrDash(johariResults.hidden)}
          </td>
          <td style="${cellStyle} background:#f2f2f2;">
            <strong>Unknown</strong> (neither sees)<br>${listOrDash(johariResults.unknown)}
          </td>
        </tr>
      </table>
      <p style="font-family:Arial, sans-serif; font-size:11px; color:#555; margin-top:10px;">
        Numbers next to Blind Spot words show how many peer raters independently chose that word —
        the higher the number, the stronger the signal worth discussing in a coaching session.
      </p>
    </div>`;
}

function buildSelfAwarenessSuitePdfSections(participantId, eqResponses) {
  const eqResults = scoreEQ(eqResponses);
  const johariResults = getJohariResultsForParticipant(participantId);

  let html = renderEQSection(eqResults);
  if (johariResults) {
    html += renderJohariSection(johariResults);
  } else {
    html += `<p style="font-family:Arial, sans-serif; font-size:12px; color:#999;">
      Johari Window results pending — waiting on peer responses.</p>`;
  }
  return html;
}

