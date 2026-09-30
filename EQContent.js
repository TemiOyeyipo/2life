/**
 * EQContent.gs — Emotional Intelligence (EQ) content.
 *
 * Based on Goleman's five-domain model of emotional intelligence. 40
 * statements across 5 domains (8 each), rated 1-5. Edit freely; the
 * portal reads whatever is here — same pattern as StrengthsContent.gs.
 */

const EQ_DOMAINS = {
  selfAwareness: {
    name: 'Self-Awareness',
    color: '#2F6FE0',
    desc: 'How clearly you notice your own emotions as they happen, and how well you understand your own patterns, triggers, strengths and limits.'
  },
  selfRegulation: {
    name: 'Self-Regulation',
    color: '#1F8A70',
    desc: 'How well you manage disruptive emotions and impulses, stay composed under pressure, and hold yourself accountable rather than reacting on autopilot.'
  },
  motivation: {
    name: 'Motivation',
    color: '#C1440E',
    desc: 'How consistently you drive yourself toward goals, especially without external reward, and how you respond when things get hard.'
  },
  empathy: {
    name: 'Empathy',
    color: '#7B4B94',
    desc: 'How accurately you read what others are feeling, and how much you factor that into how you listen, decide, and communicate.'
  },
  socialSkills: {
    name: 'Social Skills',
    color: '#B98B4E',
    desc: 'How well you build rapport, influence others, navigate conflict, and manage relationships day to day.'
  }
};

/**
 * Each item: key (unique id), domain (matches an EQ_DOMAINS key),
 * text (the statement), reverse (true if a high raw rating should
 * count AGAINST the domain score, because the statement describes
 * low EQ rather than high EQ).
 */
const EQ_ITEMS = [
  // Self-Awareness (8)
  { key: 'sa1', domain: 'selfAwareness', text: "I can usually name the specific emotion I'm feeling in the moment.", reverse: false },
  { key: 'sa2', domain: 'selfAwareness', text: 'I notice physical signs (tight chest, clenched jaw) before I realize I\u2019m upset.', reverse: false },
  { key: 'sa3', domain: 'selfAwareness', text: "I'm often surprised by my own emotional reactions.", reverse: true },
  { key: 'sa4', domain: 'selfAwareness', text: 'I understand how my moods affect my decisions.', reverse: false },
  { key: 'sa5', domain: 'selfAwareness', text: 'I know which situations reliably trigger stress or frustration for me.', reverse: false },
  { key: 'sa6', domain: 'selfAwareness', text: 'I have a clear sense of my own strengths and limitations.', reverse: false },
  { key: 'sa7', domain: 'selfAwareness', text: 'I rarely reflect on why I reacted the way I did after a conflict.', reverse: true },
  { key: 'sa8', domain: 'selfAwareness', text: 'Feedback about my blind spots rarely feels surprising to me.', reverse: false },

  // Self-Regulation (8)
  { key: 'sr1', domain: 'selfRegulation', text: 'When I feel angry, I can pause before reacting.', reverse: false },
  { key: 'sr2', domain: 'selfRegulation', text: "I say things I regret when I'm stressed.", reverse: true },
  { key: 'sr3', domain: 'selfRegulation', text: 'I stay composed under pressure better than most people I know.', reverse: false },
  { key: 'sr4', domain: 'selfRegulation', text: 'I adapt well when plans change unexpectedly.', reverse: false },
  { key: 'sr5', domain: 'selfRegulation', text: 'Small setbacks can derail my whole day.', reverse: true },
  { key: 'sr6', domain: 'selfRegulation', text: 'I hold myself accountable rather than blaming circumstances.', reverse: false },
  { key: 'sr7', domain: 'selfRegulation', text: 'I can calm myself down without relying on someone else.', reverse: false },
  { key: 'sr8', domain: 'selfRegulation', text: 'I act impulsively when emotions run high.', reverse: true },

  // Motivation (8)
  { key: 'mo1', domain: 'motivation', text: 'I keep working toward goals even without external rewards.', reverse: false },
  { key: 'mo2', domain: 'motivation', text: 'Setbacks make me want to quit rather than try again.', reverse: true },
  { key: 'mo3', domain: 'motivation', text: 'I hold myself to a high personal standard.', reverse: false },
  { key: 'mo4', domain: 'motivation', text: 'I look for the opportunity in a difficult situation.', reverse: false },
  { key: 'mo5', domain: 'motivation', text: 'I lose enthusiasm quickly when a project gets hard.', reverse: true },
  { key: 'mo6', domain: 'motivation', text: 'I set goals for myself even when no one is checking on me.', reverse: false },
  { key: 'mo7', domain: 'motivation', text: 'I bounce back from failure faster than I used to.', reverse: false },
  { key: 'mo8', domain: 'motivation', text: 'I need frequent praise to stay motivated.', reverse: true },

  // Empathy (8)
  { key: 'em1', domain: 'empathy', text: "I can tell when someone is upset even if they don't say so.", reverse: false },
  { key: 'em2', domain: 'empathy', text: "I find it hard to see things from another person's point of view.", reverse: true },
  { key: 'em3', domain: 'empathy', text: "People tell me I'm a good listener.", reverse: false },
  { key: 'em4', domain: 'empathy', text: 'I consider how a decision will affect others before making it.', reverse: false },
  { key: 'em5', domain: 'empathy', text: 'I get impatient with people who are struggling emotionally.', reverse: true },
  { key: 'em6', domain: 'empathy', text: 'I can sense the mood of a room or group quickly.', reverse: false },
  { key: 'em7', domain: 'empathy', text: "I adjust how I communicate based on who I'm talking to.", reverse: false },
  { key: 'em8', domain: 'empathy', text: "I tend to focus on my own reaction rather than the other person's.", reverse: true },

  // Social Skills (8)
  { key: 'ss1', domain: 'socialSkills', text: 'I can influence others without being pushy.', reverse: false },
  { key: 'ss2', domain: 'socialSkills', text: 'I avoid conflict even when it needs to be addressed.', reverse: true },
  { key: 'ss3', domain: 'socialSkills', text: 'I build rapport with new people fairly easily.', reverse: false },
  { key: 'ss4', domain: 'socialSkills', text: 'I can deliver critical feedback without damaging the relationship.', reverse: false },
  { key: 'ss5', domain: 'socialSkills', text: 'I struggle to resolve disagreements without them escalating.', reverse: true },
  { key: 'ss6', domain: 'socialSkills', text: 'People come to me to help mediate their disagreements.', reverse: false },
  { key: 'ss7', domain: 'socialSkills', text: 'I work well on teams with people very different from me.', reverse: false },
  { key: 'ss8', domain: 'socialSkills', text: 'I find it hard to build trust with new colleagues or clients.', reverse: true }
];

const EQ_DISCLAIMER = 'This Emotional Intelligence reflection is based on Goleman\u2019s widely used five-domain model. ' +
  'It reflects self-reported tendencies at one point in time. It is a tool for reflection and development, not a ' +
  'validated psychometric instrument or a clinical assessment.';

