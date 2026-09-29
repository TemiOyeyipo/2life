/**
 * SELF-AWARENESS SUITE — EQ + Johari Window modules
 * Designed to plug into the existing DISC portal architecture:
 *   - Same Google Sheet-backed storage pattern as Code.gs
 *   - Same admin/team summary + per-participant PDF report pipeline
 */

// ============================================================
// MODULE 1: EMOTIONAL INTELLIGENCE (EQ) SELF-REPORT
// Based on Goleman's 5-domain model. 40 items, 8 per domain,
// 5-point Likert (1 = Rarely/Never true of me, 5 = Almost always true).
// Items marked reverse:true are reverse-scored (6 - raw).
// ============================================================

const EQ_DOMAINS = [
  'Self-Awareness',
  'Self-Regulation',
  'Motivation',
  'Empathy',
  'Social Skills'
];

const EQ_ITEMS = [
  // Self-Awareness (8)
  { id: 'SA1', domain: 'Self-Awareness', text: 'I can usually name the specific emotion I\'m feeling in the moment.', reverse: false },
  { id: 'SA2', domain: 'Self-Awareness', text: 'I notice physical signs (tight chest, clenched jaw) before I realize I\'m upset.', reverse: false },
  { id: 'SA3', domain: 'Self-Awareness', text: 'I\'m often surprised by my own emotional reactions.', reverse: true },
  { id: 'SA4', domain: 'Self-Awareness', text: 'I understand how my moods affect my decisions.', reverse: false },
  { id: 'SA5', domain: 'Self-Awareness', text: 'I know which situations reliably trigger stress or frustration for me.', reverse: false },
  { id: 'SA6', domain: 'Self-Awareness', text: 'I have a clear sense of my own strengths and limitations.', reverse: false },
  { id: 'SA7', domain: 'Self-Awareness', text: 'I rarely reflect on why I reacted the way I did after a conflict.', reverse: true },
  { id: 'SA8', domain: 'Self-Awareness', text: 'Feedback about my blind spots rarely feels surprising to me.', reverse: false },

  // Self-Regulation (8)
  { id: 'SR1', domain: 'Self-Regulation', text: 'When I feel angry, I can pause before reacting.', reverse: false },
  { id: 'SR2', domain: 'Self-Regulation', text: 'I say things I regret when I\'m stressed.', reverse: true },
  { id: 'SR3', domain: 'Self-Regulation', text: 'I stay composed under pressure better than most people I know.', reverse: false },
  { id: 'SR4', domain: 'Self-Regulation', text: 'I adapt well when plans change unexpectedly.', reverse: false },
  { id: 'SR5', domain: 'Self-Regulation', text: 'Small setbacks can derail my whole day.', reverse: true },
  { id: 'SR6', domain: 'Self-Regulation', text: 'I hold myself accountable rather than blaming circumstances.', reverse: false },
  { id: 'SR7', domain: 'Self-Regulation', text: 'I can calm myself down without relying on someone else.', reverse: false },
  { id: 'SR8', domain: 'Self-Regulation', text: 'I act impulsively when emotions run high.', reverse: true },

  // Motivation (8)
  { id: 'MO1', domain: 'Motivation', text: 'I keep working toward goals even without external rewards.', reverse: false },
  { id: 'MO2', domain: 'Motivation', text: 'Setbacks make me want to quit rather than try again.', reverse: true },
  { id: 'MO3', domain: 'Motivation', text: 'I hold myself to a high personal standard.', reverse: false },
  { id: 'MO4', domain: 'Motivation', text: 'I look for the opportunity in a difficult situation.', reverse: false },
  { id: 'MO5', domain: 'Motivation', text: 'I lose enthusiasm quickly when a project gets hard.', reverse: true },
  { id: 'MO6', domain: 'Motivation', text: 'I set goals for myself even when no one is checking on me.', reverse: false },
  { id: 'MO7', domain: 'Motivation', text: 'I bounce back from failure faster than I used to.', reverse: false },
  { id: 'MO8', domain: 'Motivation', text: 'I need frequent praise to stay motivated.', reverse: true },

  // Empathy (8)
  { id: 'EM1', domain: 'Empathy', text: 'I can tell when someone is upset even if they don\'t say so.', reverse: false },
  { id: 'EM2', domain: 'Empathy', text: 'I find it hard to see things from another person\'s point of view.', reverse: true },
  { id: 'EM3', domain: 'Empathy', text: 'People tell me I\'m a good listener.', reverse: false },
  { id: 'EM4', domain: 'Empathy', text: 'I consider how a decision will affect others before making it.', reverse: false },
  { id: 'EM5', domain: 'Empathy', text: 'I get impatient with people who are struggling emotionally.', reverse: true },
  { id: 'EM6', domain: 'Empathy', text: 'I can sense the mood of a room or group quickly.', reverse: false },
  { id: 'EM7', domain: 'Empathy', text: 'I adjust how I communicate based on who I\'m talking to.', reverse: false },
  { id: 'EM8', domain: 'Empathy', text: 'I tend to focus on my own reaction rather than the other person\'s.', reverse: true },

  // Social Skills (8)
  { id: 'SS1', domain: 'Social Skills', text: 'I can influence others without being pushy.', reverse: false },
  { id: 'SS2', domain: 'Social Skills', text: 'I avoid conflict even when it needs to be addressed.', reverse: true },
  { id: 'SS3', domain: 'Social Skills', text: 'I build rapport with new people fairly easily.', reverse: false },
  { id: 'SS4', domain: 'Social Skills', text: 'I can deliver critical feedback without damaging the relationship.', reverse: false },
  { id: 'SS5', domain: 'Social Skills', text: 'I struggle to resolve disagreements without them escalating.', reverse: true },
  { id: 'SS6', domain: 'Social Skills', text: 'People come to me to help mediate their disagreements.', reverse: false },
  { id: 'SS7', domain: 'Social Skills', text: 'I work well on teams with people very different from me.', reverse: false },
  { id: 'SS8', domain: 'Social Skills', text: 'I find it hard to build trust with new colleagues or clients.', reverse: true }
];

/**
 * Scores a completed EQ questionnaire.
 * @param {Object} responses - map of item id -> raw Likert value (1-5)
 * @return {Object} { domainScores: {domain: {raw, max, pct}}, overall: {raw, max, pct} }
 */
function scoreEQ(responses) {
  const domainTotals = {};
  EQ_DOMAINS.forEach(d => domainTotals[d] = { raw: 0, max: 0 });

  let overallRaw = 0;
  const maxPerItem = 5;

  EQ_ITEMS.forEach(item => {
    const rawVal = Number(responses[item.id]) || 0;
    const scored = item.reverse ? (6 - rawVal) : rawVal;
    domainTotals[item.domain].raw += scored;
    domainTotals[item.domain].max += maxPerItem;
    overallRaw += scored;
  });

  const domainScores = {};
  EQ_DOMAINS.forEach(d => {
    const t = domainTotals[d];
    domainScores[d] = { raw: t.raw, max: t.max, pct: Math.round((t.raw / t.max) * 100) };
  });

  const overallMax = EQ_ITEMS.length * maxPerItem;
  return {
    domainScores: domainScores,
    overall: { raw: overallRaw, max: overallMax, pct: Math.round((overallRaw / overallMax) * 100) }
  };
}

/**
 * Writes an EQ submission to the "EQ_Responses" sheet tab.
 */
function recordEQResponse(participantId, participantName, responses) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('EQ_Responses');
  if (!sheet) {
    sheet = ss.insertSheet('EQ_Responses');
    const header = ['Timestamp', 'ParticipantId', 'Name'].concat(EQ_ITEMS.map(i => i.id));
    sheet.appendRow(header);
  }
  const row = [new Date(), participantId, participantName].concat(
    EQ_ITEMS.map(i => responses[i.id] || '')
  );
  sheet.appendRow(row);
}

// ============================================================
// MODULE 2: JOHARI WINDOW
// Public-domain 55-adjective list (Luft & Ingham). Self picks ~5-6
// words that describe them; each peer independently picks ~5-6
// words that describe the participant. Overlap/gaps map to the
// four quadrants.
// ============================================================

const JOHARI_ADJECTIVES = [
  'able','accepting','adaptable','bold','brave','calm','caring','cheerful',
  'clever','complex','confident','dependable','dignified','empathetic','energetic',
  'extroverted','friendly','giving','happy','helpful','idealistic','independent',
  'ingenious','intelligent','introverted','kind','knowledgeable','logical','loving',
  'mature','modest','nervous','observant','organized','patient','powerful',
  'proud','quiet','reflective','relaxed','religious','responsive','searching',
  'self-assertive','self-conscious','sensible','sentimental','shy','silly',
  'spontaneous','sympathetic','tense','trustworthy','warm','wise','witty'
];

/**
 * Computes the Johari Window quadrants for one participant.
 * @param {string[]} selfWords - words the participant chose for themselves
 * @param {string[][]} peerWordSets - array of word-arrays, one per peer rater
 * @return {Object} { open, blind, hidden, unknown, peerFrequency }
 */
function scoreJohari(selfWords, peerWordSets) {
  const selfSet = new Set(selfWords.map(w => w.toLowerCase()));

  const freq = {};
  peerWordSets.forEach(set => {
    set.forEach(w => {
      const wl = w.toLowerCase();
      freq[wl] = (freq[wl] || 0) + 1;
    });
  });

  // A word counts as "peer-selected" if at least 1 peer chose it.
  // (Raise this threshold, e.g. >=2, for a stricter blind-spot signal.)
  const peerWords = new Set(Object.keys(freq));

  const open = [...selfSet].filter(w => peerWords.has(w));
  const blind = [...peerWords].filter(w => !selfSet.has(w));
  const hidden = [...selfSet].filter(w => !peerWords.has(w));
  const unknown = JOHARI_ADJECTIVES
    .map(w => w.toLowerCase())
    .filter(w => !selfSet.has(w) && !peerWords.has(w));

  return {
    open: open,
    blind: blind.sort((a, b) => freq[b] - freq[a]),
    hidden: hidden,
    unknown: unknown,
    peerFrequency: freq
  };
}

/**
 * Writes a self-selection or peer-selection submission to the
 * "Johari_Responses" sheet tab. raterType is 'self' or 'peer'.
 */
function recordJohariResponse(participantId, participantName, raterType, raterName, words) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Johari_Responses');
  if (!sheet) {
    sheet = ss.insertSheet('Johari_Responses');
    sheet.appendRow(['Timestamp', 'ParticipantId', 'ParticipantName', 'RaterType', 'RaterName', 'Words']);
  }
  sheet.appendRow([new Date(), participantId, participantName, raterType, raterName, words.join(', ')]);
}

/**
 * Pulls all recorded responses for a participant and runs scoreJohari().
 */
function getJohariResultsForParticipant(participantId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Johari_Responses');
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  let selfWords = [];
  const peerWordSets = [];

  for (let i = 1; i < data.length; i++) {
    const [, pid, , raterType, , wordsStr] = data[i];
    if (pid !== participantId) continue;
    const words = String(wordsStr).split(',').map(w => w.trim()).filter(Boolean);
    if (raterType === 'self') selfWords = words;
    else peerWordSets.push(words);
  }

  return scoreJohari(selfWords, peerWordSets);
}

