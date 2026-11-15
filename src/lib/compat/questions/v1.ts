import type { Dimension, Question, QuestionSet } from '../types';

/**
 * Question set v1 — 20 original questions, 4 per dimension.
 *
 * Written for this product; not adapted from any published psychological
 * instrument. Never edit a published set in place: answers are stored by
 * question and option id, so copy this file to v2.ts, change it there and
 * register it in ./index.ts. Old assessments keep scoring against v1.
 */

export const DIMENSIONS: Dimension[] = [
  {
    id: 'communication',
    label: 'Communication',
    short: 'Talk',
    description: 'How you stay in touch, raise things and support each other with words.',
  },
  {
    id: 'emotional',
    label: 'Emotional Connection',
    short: 'Feel',
    description: 'How you give and receive love, reassurance and openness.',
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle & Personal Space',
    short: 'Live',
    description: 'How you recharge, spend free time and balance together with apart.',
  },
  {
    id: 'future',
    label: 'Future Expectations',
    short: 'Build',
    description: 'Pace, money, family and the life you imagine ahead.',
  },
  {
    id: 'conflict',
    label: 'Conflict & Understanding',
    short: 'Repair',
    description: 'What happens when you disagree — and how you find your way back.',
  },
];

const QUESTIONS: Question[] = [
  /* ───────────────────────────── Communication ───────────────────────────── */
  {
    id: 'com-rhythm',
    dimension: 'communication',
    kind: 'scale',
    prompt: 'On a typical day apart, how much contact feels right to you?',
    topic: 'Daily contact',
    tensionAt: 3,
    options: [
      { id: 'steady', label: 'A steady flow — little messages throughout the day', trait: 'feels closest with a steady flow of little messages through the day', plural: 'feel closest with a steady flow of little messages through the day', axes: { togetherness: 0.8, reassurance: 0.5 } },
      { id: 'checkins', label: 'A few check-ins — morning, evening, the odd funny thing', trait: 'likes a few check-ins spread across the day', plural: 'like a few check-ins spread across the day', axes: { togetherness: 0.4 } },
      { id: 'one', label: 'One proper catch-up is plenty', trait: 'is happy with one proper catch-up a day', plural: 'are happy with one proper catch-up a day', axes: { togetherness: -0.3 } },
      { id: 'light', label: 'Very little — I’d rather save it for when we’re together', trait: 'prefers to save most of the conversation for time together', plural: 'prefer to save most of the conversation for time together', axes: { togetherness: -0.7, reassurance: -0.4 } },
    ],
    insight: {
      why: 'Contact rhythm is one of the first places people read meaning into — warmth, interest or pressure.',
      shared: 'You expect the same rhythm, so silences and messages are less likely to be misread.',
      different: 'Neither rhythm is more caring. Frequent messages can feel like warmth to one person and like a to-do list to another; quiet can feel like trust to one and distance to the other.',
      bridge: 'Agree on a simple minimum — a good-morning and a “home safe”, say — so the person who wants more feels held and the person who wants less doesn’t feel monitored.',
    },
    starter: 'When the other person goes quiet for a few hours, what story do you tell yourself — and how often is it true?',
  },
  {
    id: 'com-raise',
    dimension: 'communication',
    kind: 'choice',
    prompt: 'When something small about the relationship bothers you, what do you usually do?',
    topic: 'Raising small issues',
    options: [
      { id: 'now', label: 'Say it soon, while it’s fresh', trait: 'raises small issues soon, while they’re fresh', plural: 'raise small issues soon, while they’re fresh', axes: { engagement: 0.9, expression: 0.6 } },
      { id: 'calm', label: 'Wait for a calm moment, then bring it up', trait: 'waits for a calm moment before raising something', plural: 'wait for a calm moment before raising something', axes: { engagement: 0.4, expression: 0.4, structure: 0.2 } },
      { id: 'hint', label: 'Hint at it and hope it’s noticed', trait: 'tends to hint and hope the other person notices', plural: 'tend to hint and hope the other person notices', axes: { expression: -0.5, engagement: -0.2 } },
      { id: 'hold', label: 'Let it go unless it becomes a big deal', trait: 'usually lets small things go unless they grow', plural: 'usually let small things go unless they grow', axes: { expression: -0.8, engagement: -0.6 } },
    ],
    complements: [
      { a: 'now', b: 'calm', note: 'One of you names things quickly and the other picks the moment. Together that can mean issues get raised early and kindly.' },
    ],
    frictions: [
      { a: 'now', b: 'hold', note: 'One of you raises things straight away; the other lets them slide. The risk is that one feels nagged while the other keeps a silent tally.' },
      { a: 'now', b: 'hint', note: 'One of you says it plainly; the other hints. Hints are easy to miss for someone who expects directness — and missed hints can feel like not being cared about.' },
    ],
    blindSpots: [
      { options: ['hint', 'hold'], note: 'Neither of you naturally raises small things. That keeps the peace now, but unspoken things tend to pile up and surface all at once.' },
    ],
    insight: {
      why: 'How small frustrations travel — or don’t — decides whether they stay small.',
      shared: 'You handle small frustrations the same way, which makes each other’s behaviour easy to read.',
      different: 'You surface small frustrations at different speeds. That’s workable once each of you knows the other’s default.',
      bridge: 'Try a weekly “small stuff” check-in: ten minutes, one thing each, no defending — just hearing.',
    },
    starter: 'Is there a small thing you’ve been letting go that you’d actually like to mention? How would you want the other person to respond?',
  },
  {
    id: 'com-upset',
    dimension: 'communication',
    kind: 'choice',
    prompt: 'When you’re upset about something in your life, what helps most from the other person?',
    topic: 'Support when upset',
    differentScore: 60,
    options: [
      { id: 'listen', label: 'Listen, and let me get it all out', trait: 'mostly needs to be heard when upset', plural: 'mostly need to be heard when upset', axes: { expression: 0.5 } },
      { id: 'solve', label: 'Help me work out what to do', trait: 'feels supported by practical help with the problem', plural: 'feel supported by practical help with the problem', axes: { structure: 0.3 } },
      { id: 'comfort', label: 'Comfort — closeness, a hug, reassurance', trait: 'needs comfort and closeness first', plural: 'need comfort and closeness first', axes: { reassurance: 0.6, togetherness: 0.5 } },
      { id: 'space', label: 'Some space first — I’ll talk when I’m ready', trait: 'needs a little space before talking', plural: 'need a little space before talking', axes: { togetherness: -0.5, engagement: -0.5 } },
    ],
    insight: {
      why: 'Support only works when it’s the kind the other person actually needs.',
      shared: 'You want the same kind of support, so your instinct to give what you’d want yourself will usually land.',
      different: 'You need different things when life gets hard. The trap is offering what you would want — solutions to someone who needs listening, closeness to someone who needs space.',
      bridge: 'When one of you is upset, ask: “Do you want me to listen, help, hold you, or give you a minute?” It feels clunky for a week, then it becomes shorthand.',
    },
    starter: 'Think of a time the other person supported you really well. What exactly did they do?',
  },
  {
    id: 'com-closest',
    dimension: 'communication',
    kind: 'choice',
    prompt: 'Which kind of conversation makes you feel closest to someone?',
    topic: 'Conversations that connect',
    options: [
      { id: 'deep', label: 'Deep talks — dreams, fears, the big questions', trait: 'feels closest in deep conversations about dreams and fears', plural: 'feel closest in deep conversations about dreams and fears', axes: { expression: 0.7, horizon: 0.3 } },
      { id: 'playful', label: 'Playful banter and inside jokes', trait: 'connects through playful banter and inside jokes', plural: 'connect through playful banter and inside jokes', axes: { expression: 0.2 } },
      { id: 'everyday', label: 'Sharing the little details of our days', trait: 'feels close when sharing the little details of the day', plural: 'feel close when sharing the little details of the day', axes: { togetherness: 0.5 } },
      { id: 'quiet', label: 'Comfortable silence — not needing to talk', trait: 'feels closest in comfortable silence', plural: 'feel closest in comfortable silence', axes: { expression: -0.5, togetherness: -0.1 } },
    ],
    complements: [
      { a: 'deep', b: 'playful', note: 'One of you brings depth, the other lightness — a good balance, as long as banter doesn’t become a way to dodge the serious talks.' },
      { a: 'deep', b: 'everyday', note: 'Big questions and small details are two halves of knowing someone. Between you, both get covered.' },
      { a: 'playful', b: 'everyday', note: 'Jokes and daily details make for an easy, warm, everyday connection.' },
    ],
    frictions: [
      { a: 'deep', b: 'quiet', note: 'One of you comes alive in deep conversation, the other in shared silence. Unnamed, one may feel the talks are one-sided and the other may feel quizzed.' },
    ],
    insight: {
      why: 'The kind of conversation that makes you feel close is a big part of feeling known.',
      shared: 'You connect in the same register, so it’s easy to create those moments on purpose.',
      different: 'You feel close through different kinds of conversation. Neither is shallower — you just recharge your connection in different ways.',
      bridge: 'Take turns choosing: one evening of the conversation one of you loves, then one of the other’s.',
    },
    starter: 'What’s a conversation between you that you still think about? What made it feel close?',
  },

  /* ────────────────────────── Emotional Connection ───────────────────────── */
  {
    id: 'emo-loved',
    dimension: 'emotional',
    kind: 'choice',
    prompt: 'What makes you feel most loved?',
    topic: 'Feeling loved',
    weight: 1.2,
    differentScore: 60,
    options: [
      { id: 'words', label: 'Hearing it — kind words, compliments, ‘I’m proud of you’', trait: 'feels most loved through words — hearing it said', plural: 'feel most loved through words — hearing it said', axes: { expression: 0.3, reassurance: 0.4 } },
      { id: 'time', label: 'Undivided time and attention', trait: 'feels most loved through undivided time and attention', plural: 'feel most loved through undivided time and attention', axes: { togetherness: 0.5 } },
      { id: 'help', label: 'Practical help — someone making life easier', trait: 'feels most loved when someone makes life easier in practical ways', plural: 'feel most loved when someone makes life easier in practical ways' },
      { id: 'touch', label: 'Physical closeness — a hand to hold, a long hug', trait: 'feels most loved through physical closeness', plural: 'feel most loved through physical closeness', axes: { togetherness: 0.3 } },
      { id: 'thought', label: 'Thoughtful surprises that show they were thinking of me', trait: 'feels most loved by thoughtful little surprises', plural: 'feel most loved by thoughtful little surprises' },
    ],
    insight: {
      why: 'People tend to give love the way they’d like to receive it — which doesn’t always match what the other person needs.',
      shared: 'You feel loved in the same way, so the care you give naturally tends to land.',
      different: 'You feel loved in different ways. That’s very common — and easy to work with once it’s visible.',
      bridge: 'Each write down three small, specific things that would make you feel loved this week. Swap lists.',
    },
    starter: 'What’s something small the other person has done that made you feel really loved?',
  },
  {
    id: 'emo-show',
    dimension: 'emotional',
    kind: 'choice',
    prompt: 'How do you most naturally show someone you care?',
    topic: 'Showing care',
    differentScore: 60,
    options: [
      { id: 'words', label: 'I tell them — often and openly', trait: 'shows care by saying it, openly and often', plural: 'show care by saying it, openly and often', axes: { expression: 0.7 } },
      { id: 'time', label: 'I make time and give them my full attention', trait: 'shows care by making time and giving full attention', plural: 'show care by making time and giving full attention', axes: { togetherness: 0.4 } },
      { id: 'help', label: 'I do things for them — help out, take care of things', trait: 'shows care by doing things — helping and taking care of things', plural: 'show care by doing things — helping and taking care of things', axes: { structure: 0.2 } },
      { id: 'touch', label: 'Affection — hugs, closeness, touch', trait: 'shows care through physical affection', plural: 'show care through physical affection', axes: { togetherness: 0.3 } },
      { id: 'thought', label: 'Little gifts and gestures I’ve planned', trait: 'shows care through little planned gestures and gifts', plural: 'show care through little planned gestures and gifts', axes: { structure: 0.2 } },
    ],
    insight: {
      why: 'How each of you shows care is the language the other needs to learn to hear.',
      shared: 'You express care in the same way, so it’s easy to recognise it in each other.',
      different: 'You express care differently. Make sure each of you can recognise the other’s way as love, not just habit.',
      bridge: 'Name it out loud for a week: “I made you coffee — that’s me saying I love you.” It helps the other person learn your language.',
    },
    starter: 'What’s a way you show care that you suspect the other person doesn’t notice?',
  },
  {
    id: 'emo-reassure',
    dimension: 'emotional',
    kind: 'scale',
    prompt: 'How much reassurance do you like about where you stand with someone?',
    topic: 'Reassurance',
    tensionAt: 3,
    options: [
      { id: 'lots', label: 'A lot — I like hearing it regularly', trait: 'likes regular reassurance about where they stand', plural: 'like regular reassurance about where you stand', axes: { reassurance: 1 } },
      { id: 'some', label: 'Some — especially when things feel uncertain', trait: 'values reassurance mostly when things feel uncertain', plural: 'value reassurance mostly when things feel uncertain', axes: { reassurance: 0.4 } },
      { id: 'little', label: 'A little — I trust it unless I’m told otherwise', trait: 'mostly trusts where things stand unless told otherwise', plural: 'mostly trust where things stand unless told otherwise', axes: { reassurance: -0.4 } },
      { id: 'none', label: 'Hardly any — actions tell me everything', trait: 'reads actions rather than needing reassurance', plural: 'read actions rather than needing reassurance', axes: { reassurance: -0.9, expression: -0.3 } },
    ],
    insight: {
      why: 'Reassurance needs are often invisible to someone who doesn’t share them.',
      shared: 'You need similar amounts of reassurance, so neither of you is likely to feel smothered or starved.',
      different: 'One of you likes to hear where you stand more than the other. Neither is “needy” or “cold” — it’s simply how security feels to each of you.',
      bridge: 'The person who needs less reassurance can make it routine rather than reactive — a regular, unprompted “I’m glad we’re us” goes a long way.',
    },
    starter: 'What helps you feel secure in a relationship — and what quietly makes you doubt it?',
  },
  {
    id: 'emo-open',
    dimension: 'emotional',
    kind: 'scale',
    prompt: 'How easily do you share your deeper feelings — worries, insecurities, hopes?',
    topic: 'Opening up',
    tensionAt: 3,
    options: [
      { id: 'easily', label: 'Easily — I’m an open book', trait: 'opens up easily — an open book', plural: 'open up easily', axes: { expression: 1 } },
      { id: 'safe', label: 'Fairly easily, once I feel safe', trait: 'opens up once they feel safe', plural: 'open up once you feel safe', axes: { expression: 0.4 } },
      { id: 'slowly', label: 'Slowly — it takes me a while', trait: 'opens up slowly, over time', plural: 'open up slowly, over time', axes: { expression: -0.4 } },
      { id: 'rarely', label: 'Rarely — I tend to work things out on my own', trait: 'tends to work through feelings alone', plural: 'tend to work through feelings alone', axes: { expression: -0.9, togetherness: -0.4 } },
    ],
    blindSpots: [
      { options: ['slowly', 'rarely'], note: 'You both keep deeper feelings close. That can feel calm and respectful — but it can also mean you each know less about the other’s inner world than you think.' },
    ],
    insight: {
      why: 'How quickly someone opens up affects how close — or shut out — the other person feels.',
      shared: 'You open up at a similar pace, so neither of you is likely to feel the other is holding back or oversharing.',
      different: 'You open up at different speeds. The faster sharer may feel the other is holding back; the slower sharer may feel pressured.',
      bridge: 'The more open person can ask gentle, specific questions and leave room; the more private person can share one small true thing at a time.',
    },
    starter: 'What’s something you’d like the other person to know about you that’s hard to say?',
  },

  /* ─────────────────────── Lifestyle & Personal Space ────────────────────── */
  {
    id: 'life-recharge',
    dimension: 'lifestyle',
    kind: 'scale',
    prompt: 'After a long, draining day, how do you prefer to recharge?',
    topic: 'Recharging',
    tensionAt: 3,
    options: [
      { id: 'together', label: 'Together — being close helps me unwind', trait: 'recharges by being close together', plural: 'recharge by being close together', axes: { togetherness: 1 } },
      { id: 'nearby', label: 'In the same room, each doing our own thing', trait: 'likes to unwind side by side, doing separate things', plural: 'like to unwind side by side, doing separate things', axes: { togetherness: 0.3 } },
      { id: 'alone', label: 'Some time alone first, then together', trait: 'needs some time alone first, then reconnects', plural: 'need some time alone first, then reconnect', axes: { togetherness: -0.4 } },
      { id: 'solo', label: 'Alone — I need the evening to myself', trait: 'recharges best with time fully alone', plural: 'recharge best with time fully alone', axes: { togetherness: -0.9 } },
    ],
    insight: {
      why: 'Recharge needs are easy to take personally — but they’re about energy, not affection.',
      shared: 'You recharge the same way, which makes evenings easy to share.',
      different: 'You recharge differently. When one of you reaches for closeness and the other for solitude, it can feel like rejection — even though it’s just a battery running low.',
      bridge: 'Create a signal — a word or a gesture — that means “I need an hour, and I’ll come and find you after.” The promise to return is what makes space feel safe.',
    },
    starter: 'When you need space, how can the other person tell — and what would you like them to do?',
  },
  {
    id: 'life-weekend',
    dimension: 'lifestyle',
    kind: 'choice',
    prompt: 'What does a perfect free weekend look like to you?',
    topic: 'Free time',
    options: [
      { id: 'social', label: 'Out with friends and people', trait: 'loves weekends full of friends and people', plural: 'love weekends full of friends and people', axes: { togetherness: 0.2 } },
      { id: 'adventure', label: 'Trying something new — a trip, an activity', trait: 'loves weekends of new experiences and small adventures', plural: 'love weekends of new experiences and small adventures', axes: { structure: -0.3 } },
      { id: 'home', label: 'Cosy at home together, no plans', trait: 'loves a slow, cosy weekend at home', plural: 'love a slow, cosy weekend at home', axes: { togetherness: 0.5 } },
      { id: 'own', label: 'Time for my own hobbies and plans', trait: 'wants weekend time for personal hobbies and plans', plural: 'want weekend time for personal hobbies and plans', axes: { togetherness: -0.5 } },
    ],
    complements: [
      { a: 'adventure', b: 'home', note: 'One of you pulls toward adventure, the other toward rest — together you can find a rhythm of exploring and recovering.' },
      { a: 'home', b: 'own', note: 'One wants cosy shared time, the other personal time. Very compatible, as long as both get planned into the weekend.' },
    ],
    frictions: [
      { a: 'social', b: 'home', note: 'One of you recharges with people, the other with privacy at home. Unspoken, this can turn every weekend into a quiet negotiation.' },
    ],
    insight: {
      why: 'Free time is where everyday closeness — or friction — gets built.',
      shared: 'You want the same kind of weekend, which makes free time effortless to plan.',
      different: 'You’d spend a free weekend differently. That keeps life varied — as long as both versions get their turn.',
      bridge: 'Split the weekend on purpose: one block for each person’s idea of a good time, and one block you share.',
    },
    starter: 'Describe your perfect lazy Sunday, hour by hour. Where do your two versions overlap?',
  },
  {
    id: 'life-social',
    dimension: 'lifestyle',
    kind: 'scale',
    prompt: 'How intertwined would you like your social lives to be?',
    topic: 'Shared social life',
    tensionAt: 3,
    options: [
      { id: 'fully', label: 'Fully — same friends, everything together', trait: 'wants your social lives to be fully shared', plural: 'want your social lives to be fully shared', axes: { togetherness: 0.9 } },
      { id: 'mostly', label: 'Mostly shared, with a few separate friendships', trait: 'likes mostly shared circles with some separate friendships', plural: 'like mostly shared circles with some separate friendships', axes: { togetherness: 0.4 } },
      { id: 'balanced', label: 'Half and half — some shared, plenty separate', trait: 'likes an even balance of shared and separate social life', plural: 'like an even balance of shared and separate social life', axes: { togetherness: -0.2 } },
      { id: 'separate', label: 'Mostly separate — we each keep our own worlds', trait: 'prefers each person to keep their own social world', plural: 'prefer to keep your own social worlds', axes: { togetherness: -0.8 } },
    ],
    insight: {
      why: 'How much you merge your social worlds affects both belonging and freedom.',
      shared: 'You picture the same overlap between your social lives.',
      different: 'You picture your social lives overlapping by different amounts. One may hear “separate” as distance; the other may hear “together” as losing independence.',
      bridge: 'Choose one friendship ritual to share — a regular dinner with friends — and protect one thing each that’s just yours.',
    },
    starter: 'Which of your friends would you most like the other person to know better, and why?',
  },
  {
    id: 'life-plans',
    dimension: 'lifestyle',
    kind: 'scale',
    prompt: 'How do you feel when plans change at the last minute?',
    topic: 'Plans & spontaneity',
    tensionAt: 3,
    options: [
      { id: 'love', label: 'Love it — spontaneity is fun', trait: 'loves last-minute changes and spontaneity', plural: 'love last-minute changes and spontaneity', axes: { structure: -1 } },
      { id: 'fine', label: 'Fine — I can roll with it', trait: 'rolls with last-minute changes easily', plural: 'roll with last-minute changes easily', axes: { structure: -0.4 } },
      { id: 'prefer', label: 'I’d rather know in advance, but I’ll adapt', trait: 'prefers to know plans in advance, but adapts', plural: 'prefer to know plans in advance, but adapt', axes: { structure: 0.4 } },
      { id: 'stressed', label: 'It really throws me — I like plans to hold', trait: 'finds last-minute changes stressful and likes plans to hold', plural: 'find last-minute changes stressful and like plans to hold', axes: { structure: 1 } },
    ],
    insight: {
      why: 'Spontaneity and predictability both create security — just for different people.',
      shared: 'You share a similar comfort with change, so plans rarely become a sore point.',
      different: 'One of you likes things open, the other likes them settled. The spontaneous one can feel restricted; the planner can feel disregarded.',
      bridge: 'Keep “fixed” and “flexible” plans: anything fixed is protected, anything flexible is fair game for spontaneity.',
    },
    starter: 'What’s a spontaneous moment between you that you loved — and a last-minute change that stressed you out?',
  },

  /* ─────────────────────────── Future Expectations ───────────────────────── */
  {
    id: 'fut-pace',
    dimension: 'future',
    kind: 'scale',
    prompt: 'How do you feel about the pace of a relationship?',
    topic: 'Pace of commitment',
    weight: 1.2,
    tensionAt: 3,
    options: [
      { id: 'fast', label: 'When it feels right, I like to move forward quickly', trait: 'likes to move forward quickly when it feels right', plural: 'like to move forward quickly when it feels right', axes: { horizon: 0.8 } },
      { id: 'steady', label: 'Steady — clear steps, without rushing', trait: 'prefers steady, clear steps forward', plural: 'prefer steady, clear steps forward', axes: { horizon: 0.4, structure: 0.3 } },
      { id: 'slow', label: 'Slow — I like to take my time and be sure', trait: 'likes to take time and be sure', plural: 'like to take your time and be sure', axes: { horizon: -0.2 } },
      { id: 'present', label: 'I don’t think in steps — I’d rather enjoy now', trait: 'would rather enjoy the present than think in steps', plural: 'would rather enjoy the present than think in steps', axes: { horizon: -0.8, structure: -0.4 } },
    ],
    insight: {
      why: 'A mismatch in pace is one of the most common sources of quiet anxiety in relationships.',
      shared: 'You’re comfortable moving at the same pace — a real source of ease.',
      different: 'You move at different speeds. Faster isn’t more committed and slower isn’t less interested — but unspoken, a pace gap can feel like exactly that.',
      bridge: 'Talk about the next step, not the final destination: what would feel right to each of you in the next three to six months?',
    },
    starter: 'What does “moving forward” mean to you right now — and what would feel too fast or too slow?',
  },
  {
    id: 'fut-money',
    dimension: 'future',
    kind: 'scale',
    prompt: 'If you built a life together, how would you want to handle money?',
    topic: 'Money',
    weight: 1.1,
    tensionAt: 3,
    options: [
      { id: 'pooled', label: 'Fully shared — one pot for everything', trait: 'would want money to be fully shared', plural: 'would want money to be fully shared', axes: { togetherness: 0.6 } },
      { id: 'mostly', label: 'Mostly shared, with some personal money each', trait: 'would want mostly shared money, with some personal funds', plural: 'would want mostly shared money, with some personal funds', axes: { togetherness: 0.3, structure: 0.2 } },
      { id: 'split', label: 'Split the shared costs, keep the rest separate', trait: 'would split shared costs and keep the rest separate', plural: 'would split shared costs and keep the rest separate', axes: { togetherness: -0.3, structure: 0.3 } },
      { id: 'separate', label: 'Fully separate — we each manage our own', trait: 'would keep finances fully separate', plural: 'would keep finances fully separate', axes: { togetherness: -0.7 } },
    ],
    insight: {
      why: 'Money arrangements carry feelings about trust, fairness and independence.',
      shared: 'You picture handling money the same way — one less thing to negotiate.',
      different: 'You’d organise money differently. Usually this isn’t about money itself, but about what it represents — security, fairness or freedom.',
      bridge: 'Before choosing a system, each share what money meant in the home you grew up in. The system gets easier once the feelings are understood.',
    },
    starter: 'What did you learn about money growing up — and what do you want to do the same, or differently?',
  },
  {
    id: 'fut-children',
    dimension: 'future',
    kind: 'scale',
    prompt: 'How do you feel about having children someday?',
    topic: 'Children',
    weight: 1.3,
    tensionAt: 3,
    options: [
      { id: 'yes', label: 'I want children (or more of them)', trait: 'wants children', plural: 'want children', axes: { horizon: 0.6 } },
      { id: 'likely', label: 'I probably do', trait: 'probably wants children', plural: 'probably want children', axes: { horizon: 0.3 } },
      { id: 'unsure', label: 'I’m genuinely unsure', trait: 'is genuinely unsure about children', plural: 'are genuinely unsure about children' },
      { id: 'likelyNot', label: 'I probably don’t', trait: 'probably doesn’t want children', plural: 'probably don’t want children' },
      { id: 'no', label: 'I don’t', trait: 'doesn’t want children', plural: 'don’t want children' },
    ],
    insight: {
      why: 'Few topics shape a shared future as directly — and it’s kinder to talk about it early than late.',
      shared: 'You feel the same way about children, which is a meaningful point of alignment.',
      different: 'You feel differently about children. That’s important information — not a verdict. Feelings here can be firm or still forming, and both deserve an honest conversation.',
      bridge: 'Have this conversation with curiosity rather than negotiation: what’s behind each of your feelings, and how certain does each of you feel today?',
    },
    starter: 'What’s behind how you feel about children — and how sure do you feel right now?',
  },
  {
    id: 'fut-family',
    dimension: 'future',
    kind: 'scale',
    prompt: 'What role should extended family play in your life as a couple?',
    topic: 'Extended family',
    tensionAt: 3,
    options: [
      { id: 'central', label: 'Central — close involvement and lots of time together', trait: 'sees extended family as central, with close involvement', plural: 'see extended family as central, with close involvement', axes: { togetherness: 0.4, horizon: 0.2 } },
      { id: 'close', label: 'Close, but we make our own decisions', trait: 'wants family close, with decisions kept between the two of you', plural: 'want family close, with decisions kept between the two of you' },
      { id: 'occasional', label: 'Occasional — holidays and special occasions', trait: 'prefers family time mostly at holidays and special occasions', plural: 'prefer family time mostly at holidays and special occasions' },
      { id: 'independent', label: 'Minimal — we build our own life', trait: 'prefers a life largely independent of extended family', plural: 'prefer a life largely independent of extended family', axes: { togetherness: -0.2 } },
    ],
    insight: {
      why: 'Expectations about family often come from how each of you grew up, and shape holidays, decisions and boundaries.',
      shared: 'You picture the same place for family in your life together.',
      different: 'You picture family playing different roles. This often reflects what felt normal and loving in the homes you each grew up in.',
      bridge: 'Talk about one specific occasion — the next holiday or big family event — and what a good version of it would look like for each of you.',
    },
    starter: 'What’s one family tradition you’d love to keep, and one you’d happily leave behind?',
  },

  /* ───────────────────────── Conflict & Understanding ────────────────────── */
  {
    id: 'con-heat',
    dimension: 'conflict',
    kind: 'choice',
    prompt: 'In the middle of a disagreement, what do you tend to do?',
    topic: 'During disagreements',
    weight: 1.2,
    options: [
      { id: 'push', label: 'Keep talking until we’ve sorted it out', trait: 'wants to keep talking until it’s resolved', plural: 'want to keep talking until it’s resolved', axes: { engagement: 1 } },
      { id: 'pause', label: 'Suggest a break, then come back to it', trait: 'prefers to take a break and come back to it', plural: 'prefer to take a break and come back to it', axes: { engagement: 0.1, structure: 0.2 } },
      { id: 'quiet', label: 'Go quiet and withdraw', trait: 'tends to go quiet and withdraw', plural: 'tend to go quiet and withdraw', axes: { engagement: -0.8, expression: -0.5 } },
      { id: 'heated', label: 'Get heated, then calm down quickly', trait: 'can get heated, then calms down quickly', plural: 'can get heated, then calm down quickly', axes: { engagement: 0.6, expression: 0.6 } },
    ],
    complements: [
      { a: 'push', b: 'pause', note: 'One of you wants resolution, the other a pause. That works well when the pause always comes with a time to return.' },
      { a: 'pause', b: 'heated', note: 'The one who heats up quickly is helped by the one who suggests a pause — as long as it’s offered kindly, not as a dismissal.' },
    ],
    frictions: [
      { a: 'push', b: 'quiet', note: 'One of you leans in to resolve it while the other goes quiet. This “chase and retreat” loop is one of the most common patterns couples fall into — the more one pushes, the more the other withdraws.' },
      { a: 'heated', b: 'quiet', note: 'One of you runs hot, the other goes quiet. Intensity can feel overwhelming to the quiet one, and silence can feel like indifference to the other.' },
    ],
    blindSpots: [
      { options: ['quiet'], note: 'You both tend to withdraw in conflict. Things may stay calm on the surface while issues stay unresolved underneath.' },
      { options: ['heated'], note: 'You can both get heated. Nothing festers — but two sparks at once can escalate faster than either of you intends.' },
    ],
    insight: {
      why: 'How each of you behaves in the heat of the moment matters more than how often you disagree.',
      shared: 'You handle disagreements in a similar way, so each of you knows what to expect.',
      different: 'You handle disagreements differently. That’s normal — what matters is making a plan for those moments while you’re both calm.',
      bridge: 'Agree on a “pause rule” now, while calm: either of you can call a 20-minute break, and whoever calls it suggests when to come back.',
    },
    starter: 'In an argument, what’s the one thing you wish the other person would do — or stop doing?',
  },
  {
    id: 'con-repair',
    dimension: 'conflict',
    kind: 'choice',
    prompt: 'After an argument, what helps you feel okay again?',
    topic: 'Making up',
    differentScore: 55,
    options: [
      { id: 'apology', label: 'A sincere apology, in words', trait: 'needs a sincere apology in words', plural: 'need a sincere apology in words', axes: { expression: 0.4 } },
      { id: 'talk', label: 'Talking through what happened', trait: 'needs to talk through what happened', plural: 'need to talk through what happened', axes: { engagement: 0.6, expression: 0.4 } },
      { id: 'gesture', label: 'A hug or a kind gesture', trait: 'is reassured most by a hug or a kind gesture', plural: 'are reassured most by a hug or a kind gesture', axes: { togetherness: 0.4 } },
      { id: 'move', label: 'Moving on — no need to revisit it', trait: 'prefers to move on without revisiting it', plural: 'prefer to move on without revisiting it', axes: { engagement: -0.6 } },
    ],
    frictions: [
      { a: 'talk', b: 'move', note: 'One of you needs to talk it through; the other would rather move on. One may feel the issue was swept aside, the other that it’s being dragged out.' },
    ],
    blindSpots: [
      { options: ['move'], note: 'You both prefer to move on quickly. That keeps things light, but some issues may quietly repeat because they never get unpacked.' },
    ],
    insight: {
      why: 'Repair — how you find your way back — is one of the clearest signs of a resilient relationship.',
      shared: 'You find your way back after conflict in the same way, which makes repair simpler.',
      different: 'You need different things to feel okay again. Offering your own preferred kind of repair may not land for the other person.',
      bridge: 'After your next disagreement, each say what would help: “I’d love a hug” or “Can we talk it through tonight?” Repair works best when it’s asked for and offered.',
    },
    starter: 'Think of a time you made up well after a disagreement. What helped?',
  },
  {
    id: 'con-sorry',
    dimension: 'conflict',
    kind: 'scale',
    prompt: 'How easy is it for you to say “I was wrong”?',
    topic: 'Owning mistakes',
    tensionAt: 3,
    options: [
      { id: 'easy', label: 'Easy — if I’m wrong, I say so', trait: 'finds it easy to admit being wrong', plural: 'find it easy to admit being wrong', axes: { expression: 0.4 } },
      { id: 'time', label: 'I get there, after some time to think', trait: 'gets there after some time to reflect', plural: 'get there after some time to reflect', axes: { engagement: -0.2 } },
      { id: 'hard', label: 'Hard — I need to cool off a lot first', trait: 'finds it hard, and needs to cool off first', plural: 'find it hard, and need to cool off first', axes: { engagement: -0.3 } },
      { id: 'show', label: 'Very hard — I’d rather show it than say it', trait: 'would rather show regret than say it', plural: 'would rather show regret than say it', axes: { expression: -0.6 } },
    ],
    blindSpots: [
      { options: ['hard', 'show'], note: 'Neither of you finds it easy to say “I was wrong”. Disagreements may end without either of you fully closing them.' },
    ],
    insight: {
      why: 'Being able to own a mistake keeps small hurts from hardening.',
      shared: 'You own mistakes in a similar way, so apologies tend to be met on equal terms.',
      different: 'Saying “I was wrong” comes more easily to one of you. The one who finds it harder may be showing it in other ways — through actions or softer words.',
      bridge: 'Agree that “I see your point, and I’m sorry it hurt” counts. It lowers the bar for whoever finds full apologies hard.',
    },
    starter: 'What makes an apology feel real to you?',
  },
  {
    id: 'con-matters',
    dimension: 'conflict',
    kind: 'choice',
    prompt: 'When you disagree about something important, what matters most to you?',
    topic: 'What you need from a disagreement',
    options: [
      { id: 'understood', label: 'Feeling understood, even if we don’t agree', trait: 'most needs to feel understood, even without agreement', plural: 'most need to feel understood, even without agreement', axes: { expression: 0.4 } },
      { id: 'fair', label: 'Reaching a fair compromise', trait: 'cares most about reaching a fair compromise', plural: 'care most about reaching a fair compromise', axes: { structure: 0.3 } },
      { id: 'right', label: 'Getting to the right answer', trait: 'cares most about getting to the right answer', plural: 'care most about getting to the right answer', axes: { engagement: 0.4 } },
      { id: 'peace', label: 'Keeping the peace between us', trait: 'cares most about keeping the peace', plural: 'care most about keeping the peace', axes: { engagement: -0.5 } },
    ],
    complements: [
      { a: 'understood', b: 'fair', note: 'One of you wants to be understood, the other wants fairness — a strong pairing: hear each other first, then find the middle.' },
    ],
    frictions: [
      { a: 'right', b: 'understood', note: 'One of you focuses on the right answer, the other on feeling understood. Logic offered to someone who needs empathy can feel like being dismissed.' },
      { a: 'right', b: 'peace', note: 'One of you wants to settle what’s right, the other wants calm. One may feel issues are being dodged; the other may feel cornered.' },
    ],
    blindSpots: [
      { options: ['peace'], note: 'You both put keeping the peace first. Harmony is a gift — but important differences can go unsaid for too long.' },
    ],
    insight: {
      why: 'Knowing what each person is really arguing for turns arguments into conversations.',
      shared: 'You want the same thing out of a disagreement, which makes it easier to get there together.',
      different: 'You want different things out of a disagreement. Name it in the moment: “I need to feel heard first” or “Can we find a middle ground?”',
      bridge: 'Start important disagreements by each saying what you need from the conversation — before getting into the topic itself.',
    },
    starter: 'When you disagree, what would help you feel you’re on the same team?',
  },
];

export const QUESTION_SET_V1: QuestionSet = {
  version: 'v1',
  dimensions: DIMENSIONS,
  questions: QUESTIONS,
};
