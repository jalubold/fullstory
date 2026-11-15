import type { RelationshipContext } from './types';

export interface ContextInfo {
  id: RelationshipContext;
  label: string;
  hint: string;
  /** How the report frames the results for this stage. */
  framing: string;
  /** A closing, stage-appropriate habit for the action plan. */
  ritual: { title: string; body: string };
}

export const CONTEXTS: ContextInfo[] = [
  {
    id: 'talking',
    label: 'Getting to know each other',
    hint: 'The talking stage — early days',
    framing: 'At this early stage, these answers are a map of what to be curious about, not a forecast. Early on, the most valuable thing is learning how the other person works — before assumptions fill in the gaps.',
    ritual: { title: 'Keep it curious', body: 'Pick one conversation starter from this Blueprint for each of your next few dates. Early relationships grow on curiosity, not conclusions.' },
  },
  {
    id: 'dating',
    label: 'Dating',
    hint: 'Together, and finding your rhythm',
    framing: 'You’re past first impressions and into real patterns. This is the ideal moment to notice differences while they’re still small and easy to talk about.',
    ritual: { title: 'A monthly “us” evening', body: 'Once a month, spend one evening on the relationship itself: what felt good this month, and one thing to try next month.' },
  },
  {
    id: 'long_term',
    label: 'Long-term relationship',
    hint: 'Committed, building something together',
    framing: 'You know each other well — which is exactly why some differences become invisible. Long-term couples often discover they’ve been guessing about things they could simply ask.',
    ritual: { title: 'A quarterly check-in', body: 'Every few months, revisit one section of this Blueprint together. Ask: is this still true? People change, and relationships stay close when you keep updating your picture of each other.' },
  },
  {
    id: 'married',
    label: 'Married',
    hint: 'Partners for life',
    framing: 'After a shared history, answers like these are less about whether you fit and more about how to keep understanding each other as you both keep changing.',
    ritual: { title: 'An anniversary ritual', body: 'Retake this assessment once a year — around an anniversary is perfect — and compare. Seeing what has shifted is a conversation in itself.' },
  },
  {
    id: 'other',
    label: 'Something else',
    hint: 'Friends, curious, or hard to label',
    framing: 'Whatever your connection, these answers show how each of you approaches closeness, conflict and the future — useful for any relationship that matters to you.',
    ritual: { title: 'Revisit together', body: 'Come back to this Blueprint in a few months and talk about what still rings true. Connections change; the conversation keeps them honest.' },
  },
];

export function getContext(id: string): ContextInfo {
  return CONTEXTS.find((c) => c.id === id) ?? CONTEXTS[CONTEXTS.length - 1];
}

export const isContext = (v: unknown): v is RelationshipContext => typeof v === 'string' && CONTEXTS.some((c) => c.id === v);
