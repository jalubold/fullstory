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
    label: 'Masa PDKT',
    hint: 'Baru saling kenal — masih awal-awal',
    framing: 'Di tahap awal seperti ini, jawaban-jawaban ini adalah peta tentang hal-hal yang menarik untuk dikenali — bukan ramalan. Di awal hubungan, yang paling berharga adalah memahami cara satu sama lain berpikir dan merasa, sebelum asumsi mengisi kekosongan.',
    ritual: { title: 'Tetap penasaran', body: 'Bawa satu bahan obrolan dari Blueprint ini ke setiap kencan kalian berikutnya. Hubungan yang baru tumbuh lewat rasa ingin tahu, bukan kesimpulan.' },
  },
  {
    id: 'dating',
    label: 'Pacaran',
    hint: 'Sudah jadian, lagi menemukan ritme',
    framing: 'Kalian sudah melewati kesan pertama dan mulai masuk ke pola yang sebenarnya. Ini saat yang pas untuk mengenali perbedaan selagi masih kecil dan gampang dibicarakan.',
    ritual: { title: 'Malam “kita” sebulan sekali', body: 'Sebulan sekali, sisihkan satu malam khusus untuk hubungan kalian: apa yang terasa menyenangkan bulan ini, dan satu hal yang ingin dicoba bulan depan.' },
  },
  {
    id: 'long_term',
    label: 'Hubungan serius',
    hint: 'Sudah lama bersama dan saling berkomitmen',
    framing: 'Kalian sudah saling kenal dengan baik — justru karena itu, beberapa perbedaan jadi tidak kelihatan. Pasangan yang sudah lama bersama sering baru sadar bahwa selama ini mereka menebak-nebak hal yang sebenarnya bisa ditanyakan.',
    ritual: { title: 'Ngobrol rutin tiap tiga bulan', body: 'Setiap beberapa bulan, buka lagi satu bagian Blueprint ini bersama dan tanyakan: apakah ini masih benar? Orang berubah — dan hubungan tetap dekat kalau kalian terus memperbarui gambaran tentang satu sama lain.' },
  },
  {
    id: 'married',
    label: 'Menikah',
    hint: 'Teman hidup, untuk seterusnya',
    framing: 'Setelah perjalanan panjang bersama, jawaban seperti ini bukan lagi soal cocok atau tidak, melainkan bagaimana terus saling memahami seiring kalian berdua terus bertumbuh.',
    ritual: { title: 'Ritual hari jadi', body: 'Ulangi tes ini setahun sekali — sekitar hari jadi pernikahan pas sekali — lalu bandingkan hasilnya. Melihat apa yang berubah sudah jadi obrolan tersendiri.' },
  },
  {
    id: 'other',
    label: 'Lainnya',
    hint: 'Sahabat, sekadar penasaran, atau susah dijelaskan',
    framing: 'Apa pun bentuk hubungan kalian, jawaban ini menunjukkan cara kalian masing-masing memandang kedekatan, konflik, dan masa depan — berguna untuk hubungan apa pun yang berarti buat kalian.',
    ritual: { title: 'Buka lagi bersama', body: 'Kembali ke Blueprint ini beberapa bulan lagi dan obrolkan apa yang masih terasa benar. Hubungan berubah; obrolanlah yang menjaganya tetap jujur.' },
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
