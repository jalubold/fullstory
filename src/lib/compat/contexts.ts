import type { Locale } from './i18n';
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

const CONTEXTS_ID: ContextInfo[] = [
  {
    id: 'talking',
    label: 'Sedang saling mengenal',
    hint: 'Masa pendekatan — awal-awal',
    framing: 'Di tahap awal ini, jawaban-jawaban ini adalah peta tentang hal yang patut kalian kenali, bukan ramalan. Di awal hubungan, hal paling berharga adalah memahami cara satu sama lain bekerja — sebelum asumsi mengisi kekosongan.',
    ritual: { title: 'Tetap penasaran', body: 'Pilih satu pembuka obrolan dari Blueprint ini untuk setiap kencan kalian berikutnya. Hubungan yang baru tumbuh lewat rasa ingin tahu, bukan kesimpulan.' },
  },
  {
    id: 'dating',
    label: 'Pacaran',
    hint: 'Bersama, dan sedang menemukan ritme',
    framing: 'Kalian sudah melewati kesan pertama dan masuk ke pola yang nyata. Inilah saat yang ideal untuk mengenali perbedaan selagi masih kecil dan mudah dibicarakan.',
    ritual: { title: 'Malam “kita” setiap bulan', body: 'Sebulan sekali, luangkan satu malam khusus untuk hubungan kalian: apa yang terasa menyenangkan bulan ini, dan satu hal yang ingin dicoba bulan depan.' },
  },
  {
    id: 'long_term',
    label: 'Hubungan jangka panjang',
    hint: 'Berkomitmen, membangun sesuatu bersama',
    framing: 'Kalian sudah saling mengenal dengan baik — justru karena itu beberapa perbedaan jadi tak terlihat. Pasangan yang sudah lama bersama sering menyadari bahwa mereka selama ini menebak hal-hal yang sebenarnya bisa ditanyakan.',
    ritual: { title: 'Obrolan rutin tiap tiga bulan', body: 'Setiap beberapa bulan, buka kembali satu bagian Blueprint ini bersama. Tanyakan: apakah ini masih benar? Orang berubah, dan hubungan tetap dekat jika kalian terus memperbarui gambaran tentang satu sama lain.' },
  },
  {
    id: 'married',
    label: 'Menikah',
    hint: 'Pasangan seumur hidup',
    framing: 'Setelah perjalanan panjang bersama, jawaban seperti ini bukan lagi soal cocok atau tidak, melainkan bagaimana terus memahami satu sama lain seiring kalian berdua terus berubah.',
    ritual: { title: 'Ritual hari jadi', body: 'Ulangi tes ini setahun sekali — sekitar hari jadi pernikahan sangat pas — lalu bandingkan. Melihat apa yang berubah sudah menjadi obrolan tersendiri.' },
  },
  {
    id: 'other',
    label: 'Lainnya',
    hint: 'Teman, penasaran, atau sulit didefinisikan',
    framing: 'Apa pun bentuk hubungan kalian, jawaban ini menunjukkan bagaimana kalian masing-masing mendekati kedekatan, konflik, dan masa depan — berguna untuk hubungan apa pun yang berarti bagi kalian.',
    ritual: { title: 'Buka kembali bersama', body: 'Kembalilah ke Blueprint ini beberapa bulan lagi dan bicarakan apa yang masih terasa benar. Hubungan berubah; obrolan menjaganya tetap jujur.' },
  },
];

/** Relationship stages in the given language. */
export function getContexts(locale: Locale = 'en'): ContextInfo[] {
  return locale === 'id' ? CONTEXTS_ID : CONTEXTS;
}

export function getContext(id: string, locale: Locale = 'en'): ContextInfo {
  const list = getContexts(locale);
  return list.find((c) => c.id === id) ?? list[list.length - 1];
}

export const isContext = (v: unknown): v is RelationshipContext => typeof v === 'string' && CONTEXTS.some((c) => c.id === v);
