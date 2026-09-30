/**
 * StrengthsContent.gs — Strengths Compass content.
 *
 * This is an ORIGINAL framework, not a reproduction of any commercial
 * strengths-assessment product. 24 themes across 4 domains, each with two
 * self-report statements rated 1-5. Edit freely; the portal reads whatever
 * is here.
 */

const STRENGTHS_DOMAINS = {
  drive: {
    name: 'Drive',
    color: '#C1440E',
    desc: 'How you create momentum and get things across the finish line. A team is rarely short on ideas — it is often short on people who reliably close the loop.'
  },
  connection: {
    name: 'Connection',
    color: '#1F8A70',
    desc: 'How you build trust and belonging with the people around you. This is the quiet infrastructure that makes people willing to be led by you at all.'
  },
  insight: {
    name: 'Insight',
    color: '#2F6FE0',
    desc: 'How you think — the way you gather information, spot patterns, and imagine what is next. This is the raw material good decisions are made from.'
  },
  influence: {
    name: 'Influence',
    color: '#7B4B94',
    desc: 'How you move people — through authority, words, conviction, or action. This is what turns a good decision into something that actually happens.'
  }
};

const STRENGTHS_THEMES = [
  // ---- Drive ----
  { key: 'momentum', name: 'Momentum', domain: 'drive',
    desc: 'You build energy through action — finishing one task naturally pulls you into the next.',
    statements: ["I feel best on days when I've checked several things off my list.", 'Once I start a task, I have a strong pull to finish it before stopping.'],
    tip: 'Protect blocks of uninterrupted time — you do your best work in motion, not in planning meetings about motion.',
    watch: 'You can mistake being busy for being effective. Pause occasionally to check the list itself is still the right one.' },
  { key: 'direction', name: 'Direction', domain: 'drive',
    desc: "You set a clear target and instinctively filter out what doesn't serve it.",
    statements: ["I get uncomfortable when a project doesn't have a clear goal.", "I naturally say no to things that don't serve my main priority."],
    tip: 'State the one goal out loud at the start of a project — it becomes the filter everyone else can use too.',
    watch: 'Your clarity can look like tunnel vision to people who value exploring options first.' },
  { key: 'order', name: 'Order', domain: 'drive',
    desc: 'You create structure, routines, and precision that others can rely on.',
    statements: ['I feel unsettled when my workspace or plan is disorganized.', 'I like having a defined process to follow rather than improvising.'],
    tip: 'Document your systems — what feels obvious to you is often the exact thing a team is missing.',
    watch: 'Rigid process can slow a team down when the situation calls for improvising instead.' },
  { key: 'followthrough', name: 'Follow-Through', domain: 'drive',
    desc: 'You own commitments end-to-end and take real pride in reliability.',
    statements: ["If I say I'll do something, it gets done — on time, without reminders.", "I feel a strong sense of obligation once I've agreed to a task."],
    tip: 'Be selective about what you commit to out loud — your word carries real weight, so spend it deliberately.',
    watch: 'You may take on too much rather than risk being seen as unreliable.' },
  { key: 'ambition', name: 'Ambition', domain: 'drive',
    desc: "You're energized by competition and measuring yourself against a standard.",
    statements: ["I pay close attention to how my results compare with others'.", 'Being ranked or measured makes me perform better, not worse.'],
    tip: "Turn your competitive edge toward the market or the clock instead of your own teammates.",
    watch: "Not everyone is motivated by comparison — leading only through competition can alienate cooperative teammates." },
  { key: 'troubleshooting', name: 'Troubleshooting', domain: 'drive',
    desc: "You're drawn to what's broken and get real satisfaction from fixing it.",
    statements: ["I'm the person people bring problems to, not just ideas.", 'I get more energy from fixing something than from starting something new.'],
    tip: "Make sure you're not only ever handed the fires — ask for a mix of building and repairing work.",
    watch: 'A bias toward fixing problems can mean you underinvest in things that are already working well.' },

  // ---- Connection ----
  { key: 'empathy', name: 'Empathy', domain: 'connection',
    desc: "You sense what others are feeling, often before they say it.",
    statements: ["I can usually tell when someone is upset, even if they haven't said anything.", 'I naturally adjust how I say things based on how someone seems to be feeling.'],
    tip: "Name what you're sensing out loud sometimes — 'you seem frustrated' — it builds trust fast.",
    watch: "Absorbing others' emotions constantly can leave you drained if you don't set some boundaries." },
  { key: 'harmony', name: 'Harmony', domain: 'connection',
    desc: 'You look for common ground and would rather find agreement than win an argument.',
    statements: ['I look for the points people agree on before pointing out where they differ.', 'Conflict at work drains me more than it energizes me.'],
    tip: 'Use your gift to find the shared goal in a disagreement — it often unlocks a resolution the arguers could not find themselves.',
    watch: 'Avoiding necessary conflict to preserve peace can let real problems go unresolved.' },
  { key: 'belonging', name: 'Belonging', domain: 'connection',
    desc: "You notice who's left out and instinctively work to include them.",
    statements: ["I notice quickly when someone new or quiet isn't part of the conversation.", 'I go out of my way to make sure everyone gets a turn to contribute.'],
    tip: "In meetings, you're the natural person to draw out the quietest voice in the room — do it on purpose.",
    watch: 'Trying to include everyone equally can slow decisions that need a smaller, faster group.' },
  { key: 'mentoring', name: 'Mentoring', domain: 'connection',
    desc: 'You get genuine satisfaction from someone else\u2019s growth, and you see potential early.',
    statements: ['I get real satisfaction from watching someone improve because of something I taught them.', 'I notice specific potential in people before they see it in themselves.'],
    tip: "Say what you see in someone directly and specifically — 'you're good at X, have you thought about Y' changes careers.",
    watch: 'You may invest heavily in one promising person\u2019s growth at the expense of your own.' },
  { key: 'closeness', name: 'Closeness', domain: 'connection',
    desc: 'You build a few deep relationships rather than many shallow ones.',
    statements: ["I'd rather have a few close working relationships than a large network of contacts.", 'I open up more once I trust someone, and it shows.'],
    tip: 'Your close relationships are a real asset in a crisis — people you trust deeply will tell you the truth.',
    watch: "New teammates or leaders can misread your reserve as coldness before they've earned the closeness." },
  { key: 'encouragement', name: 'Encouragement', domain: 'connection',
    desc: 'You default to what is going well, and your optimism is genuinely contagious.',
    statements: ["In a tough situation, I'm usually the one pointing out what's still going right.", "People have told me my energy changes the mood of a room."],
    tip: "Your praise means more than you think — be specific about what someone did well, not just that they did well.",
    watch: 'Constant positivity can come across as dismissive when someone actually needs their frustration acknowledged first.' },
  { key: 'rapport', name: 'Rapport', domain: 'connection',
    desc: 'You meet new people easily and warm up a room fast.',
    statements: ['Meeting new people energizes me rather than drains me.', 'I can usually get a stranger talking within the first few minutes.'],
    tip: 'Use this gift deliberately in the first five minutes of any new relationship — first impressions rarely get a second chance.',
    watch: 'Easy rapport with everyone can be mistaken for depth — pair it with real follow-through to build lasting trust.' },

  // ---- Insight ----
  { key: 'analysis', name: 'Analysis', domain: 'insight',
    desc: 'You look for the data and the logic behind a claim before you accept it.',
    statements: ['I want to see the numbers behind a decision before I commit to it.', 'I naturally look for holes in an argument, even one I mostly agree with.'],
    tip: "Share your reasoning, not just your conclusion — it's usually the part people actually needed.",
    watch: 'Waiting for complete data can slow decisions that needed to be made with 80% of the picture.' },
  { key: 'ideation', name: 'Ideation', domain: 'insight',
    desc: "You're energized by new concepts and enjoy connecting ideas that don't obviously belong together.",
    statements: ['I often see a connection between two unrelated ideas that other people miss.', 'Brainstorming energizes me more than most other kinds of meetings.'],
    tip: "Capture your ideas somewhere before they scatter — write them down, they're often more useful later than they seem in the moment.",
    watch: 'Not every idea needs to be shared immediately; a flood of them can overwhelm a team trying to focus.' },
  { key: 'curiosity', name: 'Curiosity', domain: 'insight',
    desc: "You're drawn to learning for its own sake, and picking up a new subject energizes you.",
    statements: ['Learning a new skill or subject gives me real energy.', 'I will go down a research rabbit hole just because something interested me.'],
    tip: 'Be the person who researches the unfamiliar thing before a big decision — your team benefits from your default curiosity.',
    watch: 'The process of learning can become more interesting to you than actually applying what you learned.' },
  { key: 'patternfinding', name: 'Pattern-Finding', domain: 'insight',
    desc: 'You see the best path forward among several options, often before others do.',
    statements: ['When a situation is messy, I can usually see the most promising path through it.', 'I naturally think several steps ahead when planning something.'],
    tip: "Explain the 'why' behind the path you see — others need the reasoning to follow you there.",
    watch: "What's obvious to you may not be obvious to your team; slow down to bring them along." },
  { key: 'perspective', name: 'Perspective', domain: 'insight',
    desc: 'You draw on history and precedent to understand where something is headed.',
    statements: ['I find myself referencing how something similar played out before.', 'Understanding the history of a situation helps me make sense of it now.'],
    tip: 'Bring relevant precedent into planning conversations — it can save a team from repeating an old mistake.',
    watch: "Leaning on 'how it's always been done' can hold a team back when circumstances have genuinely changed." },
  { key: 'collecting', name: 'Collecting', domain: 'insight',
    desc: 'You gather information, resources, and ideas the way others collect physical things.',
    statements: ["I keep notes, articles, or resources 'just in case' they're useful later.", 'I like knowing a wide range of facts, even ones without an obvious use yet.'],
    tip: "You're often the person with exactly the right resource on hand — make it easy for others to ask you for it.",
    watch: 'Collecting can become an end in itself; make sure what you gather actually gets used.' },
  { key: 'vision', name: 'Vision', domain: 'insight',
    desc: "You're pulled toward what could be, and a future possibility motivates you more than the present.",
    statements: ['I spend real time imagining how things could be different in the future.', 'A compelling vision of what is possible motivates me more than the current plan.'],
    tip: 'Paint the picture of the future out loud — your vision can be the thing that gets a tired team moving again.',
    watch: "Living in what's next can mean under-appreciating what's already working right now." },

  // ---- Influence ----
  { key: 'command', name: 'Command', domain: 'influence',
    desc: 'You take charge naturally, and people tend to look to you when a decision is needed.',
    statements: ['In a group without a clear leader, I tend to step into that role.', "I'm comfortable making an unpopular decision if it needs to be made."],
    tip: "Use your natural authority to make space for others' input, not just your own call.",
    watch: 'Taking charge by default can crowd out someone else who was ready to lead, given the chance.' },
  { key: 'storytelling', name: 'Storytelling', domain: 'influence',
    desc: "You explain and persuade through words, and you're aware of how you land.",
    statements: ['People have told me I explain things in a way that is easy to follow.', 'I think about how to phrase something so it lands well, not just what to say.'],
    tip: "Use a concrete story or example whenever you're introducing a new idea — it sticks better than the idea alone.",
    watch: 'Polished delivery can sometimes get more credit than the substance behind it deserves.' },
  { key: 'conviction', name: 'Conviction', domain: 'influence',
    desc: "You trust your own judgment and don't need external validation to act on it.",
    statements: ['I can make a decision and stand by it, even without others\u2019 agreement.', "Other people's doubt doesn't shake my confidence in a decision I've thought through."],
    tip: 'Your steadiness is reassuring under pressure — be explicit that you welcome challenge, so it does not look like certainty is a wall.',
    watch: 'Confidence can tip into not seeking out the input that would have improved the decision.' },
  { key: 'initiative', name: 'Initiative', domain: 'influence',
    desc: 'You move from idea to action fast, and waiting is genuinely uncomfortable for you.',
    statements: ["I'd rather start imperfectly than spend more time planning.", 'Waiting for full consensus before acting frustrates me.'],
    tip: "Your bias to act is valuable for breaking deadlock — just say out loud that you're starting a trial, not committing everyone forever.",
    watch: 'Moving before the team is ready can leave people feeling like they were never consulted.' }
];

const STRENGTHS_DISCLAIMER = 'Strengths Compass reflects self-reported tendencies at one point in time, based on an original set of themes. ' +
  'It is a tool for reflection and development, not a validated psychometric instrument or a clinical assessment, and is not affiliated ' +
  'with or a substitute for any commercial strengths-assessment product.';

