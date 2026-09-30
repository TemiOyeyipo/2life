/**
 * JohariContent.gs — the word list and educational content for the
 * Johari Window feature. Edit freely; the portal reads whatever is here.
 */

/**
 * The trait words people choose from. Keep this list identical on every
 * device — self and peer selections are compared word-for-word.
 */
const JOHARI_ADJECTIVES = [
  'Able', 'Adaptable', 'Bold', 'Calm', 'Caring', 'Cheerful', 'Complex',
  'Confident', 'Considerate', 'Dependable', 'Determined', 'Diplomatic',
  'Disciplined', 'Empathetic', 'Energetic', 'Extroverted', 'Fair', 'Friendly',
  'Generous', 'Helpful', 'Honest', 'Idealistic', 'Independent', 'Ingenious',
  'Intelligent', 'Introverted', 'Inventive', 'Kind', 'Knowledgeable',
  'Logical', 'Loyal', 'Mature', 'Modest', 'Observant', 'Organized',
  'Patient', 'Powerful', 'Proud', 'Quiet', 'Reflective', 'Relaxed',
  'Reliable', 'Resourceful', 'Self-assertive', 'Self-conscious', 'Sensible',
  'Sentimental', 'Shy', 'Spontaneous', 'Sympathetic', 'Tactful', 'Tense',
  'Trustworthy', 'Warm', 'Wise', 'Witty'
];

const JOHARI_INTRO = 'The Johari Window compares how you see yourself with how colleagues see you. ' +
  'You and each colleague independently choose words that describe you from the same list. ' +
  'Where your choices overlap or differ is the result — there is no pass, fail, or score.';

const JOHARI_INFO = {
  arena: {
    title: 'Open Area',
    subtitle: 'You know it, they know it',
    desc: 'Traits you picked for yourself that colleagues also picked for you. This is the version of you that is visible and agreed upon — the foundation people already trust.',
    tip: 'Lean on this area deliberately. When you need buy-in fast, work from these traits — they are the ones nobody needs convincing of.'
  },
  blind: {
    title: 'Blind Spot',
    subtitle: 'They know it, you don\u2019t',
    desc: 'Traits colleagues picked for you that you did not pick for yourself. These are usually not secrets, just things that are harder to see from the inside — often strengths you undersell, sometimes habits worth a second look.',
    tip: 'Pick one or two of these and ask a colleague for a specific example of when they saw it. A blind spot becomes useful the moment you can picture it.'
  },
  facade: {
    title: 'Hidden Area',
    subtitle: 'You know it, they don\u2019t',
    desc: 'Traits you picked for yourself that no colleague picked. This could mean it genuinely does not show at work, or that you have not had the chance or safety to show it yet.',
    tip: 'Choose one and look for a low-stakes moment to show it this month. Growing the Open Area usually starts with a small, deliberate disclosure, not a big reveal.'
  },
  unknown: {
    title: 'Unknown Area',
    subtitle: 'Neither of you has named it yet',
    desc: 'Traits nobody picked, either about you or by you. This is not a verdict — it often just means the situations that would reveal these traits have not come up yet.',
    tip: 'Treat new projects, stretch assignments, or unfamiliar teams as a chance to find out. This area shrinks through new experience, not more feedback on the old ones.'
  }
};

const JOHARI_DISCLAIMER = 'The Johari Window reflects self-perception and colleague perception at one point in time. ' +
  'It is a tool for reflection and conversation, not a clinical or diagnostic assessment, and should not be used alone to make hiring or promotion decisions.';

