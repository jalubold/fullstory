import type { Locale } from './i18n';
import type { AxisId, Relation, SignatureId } from './types';

/**
 * Every sentence the Blueprint builder writes, per language. Templates are
 * functions so each language can order names, possessives and numbers
 * naturally (e.g. "Daniel’s care" ↔ "Perhatian Daniel").
 */

type Pole = { adj: string; noun: string; desc: string };

export type Horizon = 'week' | 'month' | 'ongoing';

export interface ReportStrings {
  signatures: Record<SignatureId, { title: string; tagline: string; description: string }>;
  relations: Record<Relation, string>;
  axes: Record<AxisId, { label: string; left: string; right: string; pos: Pole; neg: Pole }>;
  profile: {
    headlineTwo: (adj: string, noun: string) => string;
    headlineOne: (noun: string) => string;
    headlineNeutral: string;
    summaryTwo: (name: string, d1: string, d2: string) => string;
    summaryOne: (name: string, d1: string) => string;
    summaryNeutral: (name: string) => string;
  };
  care: Record<string, { noun: string; action: (name: string) => string }>;
  disclaimer: string;
  dimensionHeadline: (alignment: number) => string;
  both: (plural: string) => string;
  contrast: (a: string, ta: string, b: string, tb: string) => string;
  closeNote: string;
  closeShort: string;
  careEvidence: { topic: string; prompt: (receiver: string, giver: string) => string };
  careMatch: { title: (giver: string, receiver: string) => string; body: (receiver: string, giver: string, noun: string) => string };
  careMismatch: {
    title: (giver: string, receiver: string) => string;
    body: (receiver: string, giver: string, lovedNoun: string, showsNoun: string) => string[];
    tip: (giver: string, action: string, receiver: string, showsNoun: string) => string;
  };
  pursue: { title: string; body: (p: string, w: string) => string[]; tip: (w: string, p: string) => string };
  quietDistance: { title: string; body: (x: string, y: string) => string[]; tip: (x: string, y: string) => string };
  depleted: { title: string; body: (x: string, y: string) => string[]; tip: string };
  dimensionIntro: (a: { label: string; alignment: number; matched: number; total: number; tension: number }) => string;
  deepDives: { emotional: string; communication: string; conflict: string; future: string };
  emotionalIntro: string;
  conflictPattern: (p: string, w: string) => string;
  strengths: {
    dimTitle: (label: string) => string;
    dimBody: (alignment: number, topics: string[]) => string;
    complementTitle: (topic: string) => string;
    sharedTitle: (topic: string) => string;
    curiosity: { title: string; body: string };
  };
  blind: { title: (topic: string) => string; noneTitle: string; noneBody: string[] };
  starters: { whyShared: (label: string) => string; whyDifferent: (a: string, la: string, b: string, lb: string) => string };
  actions: {
    becauseShared: (plural: string) => string;
    becauseDifferent: (a: string, ta: string, b: string, tb: string) => string;
    loveTitle: (receiver: string) => string;
    loveBody: (giver: string, action: string) => string;
    loveBecause: (receiver: string, lovedNoun: string, giver: string, showsNoun: string) => string;
    loveBecauseShort: (receiver: string, lovedNoun: string) => string;
    keepDoing: { title: string; body: string; because: string };
  };
  summary: {
    p1Even: (a: string, b: string, same: number, total: number, alignment: number) => string;
    p1: (x: { a: string; b: string; same: number; total: number; alignment: number; top: string; topScore: number; low: string; lowScore: number }) => string;
    noDifferences: string;
    differences: (count: number, complementary: number) => string;
    tension: (n: number) => string;
  };
  horizons: Record<Horizon, string>;
}

const listEn = (xs: string[]) => (xs.length <= 2 ? xs.join(' and ') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const listId = (xs: string[]) => (xs.length <= 2 ? xs.join(' dan ') : `${xs.slice(0, -1).join(', ')}, dan ${xs[xs.length - 1]}`);

const EN: ReportStrings = {
  signatures: {
    mirror: { title: 'The Mirror Pair', tagline: 'You see the world through remarkably similar eyes.', description: 'Your answers line up across most of what you were asked. Shared instincts make everyday life feel easy — the thing to protect is curiosity, so that similarity never turns into assumption.' },
    puzzle: { title: 'The Puzzle Pieces', tagline: 'Your differences fit together.', description: 'Several of your differences are complementary: where one of you leans one way, the other fills the gap. You’re not identical — you interlock.' },
    anchors: { title: 'The Steady Anchors', tagline: 'Grounded, and aligned on much of what matters.', description: 'You agree on a lot, and where you differ the gaps are mostly small. That’s a steady base to build on.' },
    bridge: { title: 'The Bridge Builders', tagline: 'Different views, solid ways back to each other.', description: 'You see several things differently, but you’re well aligned on how you handle disagreement — the skill that matters most when views differ.' },
    explorers: { title: 'The Explorers', tagline: 'Two different worlds, curious about each other.', description: 'You approach many things differently, but few of those differences pull against each other. There’s a lot to discover in each other’s way of seeing things.' },
    conversation: { title: 'The Deep Divers', tagline: 'Plenty to talk about — and that’s where closeness grows.', description: 'Your answers point to several places where you could easily misunderstand each other. That’s not a verdict, it’s a map: couples who talk these things through openly often end up closer than couples who never had to.' },
    balanced: { title: 'The Balanced Pair', tagline: 'A mix of common ground and fresh perspectives.', description: 'You share a good amount and differ in places — a healthy mix of the familiar and the new.' },
  },
  relations: { shared: 'Same answer', close: 'Close', complementary: 'Complementary', different: 'Different', tension: 'Worth discussing' },
  axes: {
    expression: { label: 'Expressing feelings', left: 'Private', right: 'Expressive', pos: { adj: 'Open-hearted', noun: 'Sharer', desc: 'puts feelings into words easily and values openness' }, neg: { adj: 'Quietly deep', noun: 'Observer', desc: 'keeps feelings close and expresses care in quieter ways' } },
    togetherness: { label: 'Closeness & space', left: 'Independent', right: 'Together', pos: { adj: 'Close-knit', noun: 'Connector', desc: 'draws energy from closeness and shared time' }, neg: { adj: 'Independent', noun: 'Free Spirit', desc: 'values independence and personal space' } },
    engagement: { label: 'Handling issues', left: 'Takes time', right: 'Addresses now', pos: { adj: 'Direct', noun: 'Resolver', desc: 'prefers to address issues head-on' }, neg: { adj: 'Reflective', noun: 'Reflector', desc: 'needs time and calm before working through issues' } },
    structure: { label: 'Plans & spontaneity', left: 'Spontaneous', right: 'Planned', pos: { adj: 'Steady', noun: 'Planner', desc: 'feels secure with plans and predictability' }, neg: { adj: 'Spontaneous', noun: 'Adventurer', desc: 'enjoys spontaneity and keeping things open' } },
    reassurance: { label: 'Reassurance', left: 'Self-assured', right: 'Likes reassurance', pos: { adj: 'Heartfelt', noun: 'Romantic', desc: 'feels most secure when care is expressed often' }, neg: { adj: 'Self-assured', noun: 'Anchor', desc: 'feels secure without needing much reassurance' } },
    horizon: { label: 'Looking ahead', left: 'Present-focused', right: 'Future-focused', pos: { adj: 'Future-minded', noun: 'Builder', desc: 'thinks ahead and likes a sense of direction' }, neg: { adj: 'Present-minded', noun: 'Savourer', desc: 'lives in the present and lets the future unfold' } },
  },
  profile: {
    headlineTwo: (adj, noun) => `The ${adj} ${noun}`,
    headlineOne: (noun) => `The ${noun}`,
    headlineNeutral: 'The Even-Keeled Partner',
    summaryTwo: (n, d1, d2) => `${n} ${d1}, and ${d2}.`,
    summaryOne: (n, d1) => `${n} ${d1}, and is fairly flexible otherwise.`,
    summaryNeutral: (n) => `${n}’s answers sit close to the middle on most spectrums — flexible, adaptable and hard to put in a box.`,
  },
  care: {
    words: { noun: 'words', action: (n) => `tell ${n} one specific thing you appreciate, out loud, every day this week` },
    time: { noun: 'undivided time', action: (n) => `plan one phone-free hour with ${n} this week, just the two of you` },
    help: { noun: 'practical help', action: (n) => `take one task off ${n}’s plate this week without being asked` },
    touch: { noun: 'physical closeness', action: (n) => `offer ${n} more everyday affection — a hand on the back, a longer hug` },
    thought: { noun: 'thoughtful surprises', action: (n) => `leave ${n} one small, unexpected sign that you were thinking of them` },
  },
  disclaimer:
    'This Blueprint is for reflection and entertainment. It is built from the 20 answers each of you gave at one moment in time — not from a validated psychological assessment — and it cannot predict whether a relationship will succeed. You know your relationship better than any questionnaire.',
  dimensionHeadline: (a) => (a >= 80 ? 'Deeply in sync' : a >= 65 ? 'Mostly aligned' : a >= 50 ? 'Common ground with real differences' : 'Different perspectives worth exploring'),
  both: (p) => `You both ${p}.`,
  contrast: (a, ta, b, tb) => `${a} ${ta}. ${b} ${tb}.`,
  closeNote: 'Your answers sit right next to each other — a small difference in degree rather than a gap.',
  closeShort: 'A small difference in degree.',
  careEvidence: { topic: 'Care, given and received', prompt: (r, g) => `What makes ${r} feel most loved · How ${g} naturally shows care` },
  careMatch: {
    title: (g, r) => `${g}’s care lands with ${r}`,
    body: (r, g, noun) => `${r} feels most loved through ${noun} — and that’s exactly how ${g} naturally shows care. ${g}’s instinct already speaks ${r}’s language.`,
  },
  careMismatch: {
    title: (g, r) => `Translating ${g}’s care for ${r}`,
    body: (r, g, ln, sn) => [`${r} feels most loved through ${ln}, while ${g} naturally shows care through ${sn}.`, `${g}’s love may be completely real and still be easy for ${r} to miss — and ${g} may wonder why it doesn’t always land.`],
    tip: (g, action, r, sn) => `${g}: ${action}. ${r}: try to notice ${sn} as ${g}’s way of saying it.`,
  },
  pursue: {
    title: 'The chase-and-retreat risk',
    body: (p, w) => [
      `${p}’s answers lean toward addressing issues straight away, while ${w} tends to need time and calm first.`,
      `Under stress this can become a loop: the more ${p} presses, the more ${w} pulls back — and the more ${w} pulls back, the more ${p} presses. Neither of you is wrong; you’re each protecting the relationship in your own way.`,
    ],
    tip: (w, p) => `${w}: when you need a break, say when you’ll come back. ${p}: trust that time, and give the space fully.`,
  },
  quietDistance: {
    title: 'When quiet reads as distance',
    body: (x, y) => [`${x} values reassurance and likes regular contact, while ${y} prefers lighter contact during the day.`, `On busy days, ${y}’s quiet may feel to ${x} like distance — even when nothing at all is wrong.`],
    tip: (x, y) => `${y}: one small, unprompted message on busy days goes a long way. ${x}: when worry starts rising, ask rather than guess.`,
  },
  depleted: {
    title: 'When you’re both running low',
    body: (x, y) => [`When ${x} is upset, ${x} reaches for closeness — while ${y} recharges with time alone.`, 'In a hard week you might both be depleted at once and need opposite things, which can leave both of you feeling unmet.'],
    tip: 'Agree on a “both depleted” plan in advance: a long hug first, then an hour apart, then dinner together.',
  },
  dimensionIntro: ({ label, alignment, matched, total, tension }) => {
    const band = alignment >= 80 ? 'deeply in sync' : alignment >= 65 ? 'on largely the same page' : alignment >= 50 ? 'a real mix of common ground and difference' : 'seeing things quite differently — which makes it the richest area to talk about';
    const rest = total - matched;
    const parts = [`In ${label.toLowerCase()} you’re ${alignment}% aligned: ${band}.`];
    parts.push(matched === total ? `All ${total} of your answers here line up or fit together.` : matched === 0 ? `None of your ${total} answers here line up closely.` : `${matched} of your ${total} answers here line up or fit together, and ${rest} ${rest === 1 ? 'shows a different perspective' : 'show different perspectives'}.`);
    if (tension) parts.push(tension === 1 ? 'One topic could lead to misunderstandings if it stays unspoken.' : `${tension} topics could lead to misunderstandings if they stay unspoken.`);
    return parts.join(' ');
  },
  deepDives: { emotional: 'Emotional Needs', communication: 'Communication Dynamics', conflict: 'Conflict & Understanding', future: 'Future Expectations' },
  emotionalIntro: 'This section looks at how each of you gives and receives care, how much reassurance and openness you need, and how you balance closeness with space.',
  conflictPattern: (p, w) => `One pattern to know about: ${p} tends to move toward a problem while ${w} steps back to think it over. It’s covered in Potential Blind Spots, with a simple way to handle it.`,
  strengths: {
    dimTitle: (l) => `Strong ground in ${l.toLowerCase()}`,
    dimBody: (a, topics) => `You’re ${a}% aligned here, with answers that match or fit together on ${listEn(topics)}. It’s an area you can lean on when other things feel harder.`,
    complementTitle: (t) => `${t}: a natural fit`,
    sharedTitle: (t) => `Aligned on ${t.toLowerCase()}`,
    curiosity: { title: 'Curiosity about each other', body: 'You both chose to sit down and answer twenty honest questions about how you love, argue and plan. Couples who stay curious about each other give themselves room to grow — and that’s exactly what you’re doing.' },
  },
  blind: {
    title: (t) => `Shared blind spot: ${t.toLowerCase()}`,
    noneTitle: 'No major blind spots stood out',
    noneBody: [
      'None of your answer combinations matched the patterns we look for — shared avoidance, chase-and-retreat, or needs that quietly cancel each other out.',
      'One gentle caution: where you answered the same, it’s easy to assume you mean the same thing. Use a conversation starter or two on the topics you agree on, too.',
    ],
  },
  starters: {
    whyShared: (l) => `You both answered “${l}”. The same words can hide different pictures — compare yours.`,
    whyDifferent: (a, la, b, lb) => `${a} answered “${la}”; ${b} answered “${lb}”.`,
  },
  actions: {
    becauseShared: (p) => `Because you both ${p}.`,
    becauseDifferent: (a, ta, b, tb) => `Because ${a} ${ta}, and ${b} ${tb}.`,
    loveTitle: (r) => `Love in ${r}’s language`,
    loveBody: (g, action) => `${g}: ${action}.`,
    loveBecause: (r, ln, g, sn) => `Because ${r} feels most loved through ${ln}, and ${g} naturally shows care through ${sn}.`,
    loveBecauseShort: (r, ln) => `Because ${r} feels most loved through ${ln}.`,
    keepDoing: { title: 'Keep doing what works', body: 'Your ways of showing care already land with each other. This week, name one thing the other did that made you feel loved — out loud, specifically.', because: 'Because the way each of you shows care matches how the other feels most loved.' },
  },
  summary: {
    p1Even: (a, b, same, total, al) => `${a} and ${b}, you gave the same answer on ${same} of ${total} questions, with an overall alignment of ${al}% that’s remarkably even across all five areas.`,
    p1: (x) => `${x.a} and ${x.b}, you gave the same answer on ${x.same} of ${x.total} questions, with an overall alignment of ${x.alignment}%. Your strongest common ground is ${x.top.toLowerCase()} (${x.topScore}%), and the area with the most to explore is ${x.low.toLowerCase()} (${x.lowScore}%).`,
    noDifferences: 'You didn’t differ on a single topic — rare, and worth celebrating, though it’s worth checking that the same words mean the same things to both of you.',
    differences: (n, c) => `Of the ${n} topics where your answers differ, ${c ? `${c} look complementary — they fit together rather than pull apart` : 'none are clear-cut complements, but most are simply different perspectives'}.`,
    tension: (n) => (n === 1 ? 'One could lead to a misunderstanding if it stays unspoken, and this Blueprint shows exactly where.' : `${n} could lead to misunderstandings if they stay unspoken, and this Blueprint shows exactly where.`),
  },
  horizons: { week: 'This week', month: 'This month', ongoing: 'Ongoing' },
};

const ID: ReportStrings = {
  signatures: {
    mirror: { title: 'Bagai Pinang Dibelah Dua', tagline: 'Cara kalian memandang dunia sungguh mirip.', description: 'Jawaban kalian sejalan di hampir semua hal yang ditanyakan. Naluri yang sama membuat keseharian terasa ringan — yang perlu dijaga adalah rasa ingin tahu, supaya kemiripan tidak berubah menjadi asumsi.' },
    puzzle: { title: 'Kepingan Puzzle', tagline: 'Perbedaan kalian saling melengkapi.', description: 'Beberapa perbedaan kalian justru saling mengisi: saat yang satu condong ke satu arah, yang lain mengisi celahnya. Kalian tidak sama persis — kalian saling mengunci.' },
    anchors: { title: 'Jangkar yang Kokoh', tagline: 'Membumi, dan sejalan dalam banyak hal penting.', description: 'Kalian sepakat dalam banyak hal, dan di bagian yang berbeda, jaraknya umumnya kecil. Itu fondasi yang stabil untuk dibangun bersama.' },
    bridge: { title: 'Pembangun Jembatan', tagline: 'Pandangan berbeda, jalan pulang yang kokoh.', description: 'Kalian melihat beberapa hal secara berbeda, tetapi sangat sejalan dalam cara menghadapi perselisihan — keterampilan yang paling penting ketika pandangan berbeda.' },
    explorers: { title: 'Para Penjelajah', tagline: 'Dua dunia berbeda, saling penasaran.', description: 'Kalian mendekati banyak hal dengan cara berbeda, tetapi hanya sedikit perbedaan itu yang saling bertentangan. Ada banyak hal yang bisa ditemukan dalam cara pandang satu sama lain.' },
    conversation: { title: 'Para Penyelam', tagline: 'Banyak yang bisa dibicarakan — dan di situlah kedekatan tumbuh.', description: 'Jawaban kalian menunjukkan beberapa titik di mana salah paham mudah terjadi. Itu bukan vonis, melainkan peta: pasangan yang membicarakan hal-hal ini secara terbuka sering justru menjadi lebih dekat daripada yang tidak pernah perlu melakukannya.' },
    balanced: { title: 'Pasangan Seimbang', tagline: 'Perpaduan titik temu dan sudut pandang baru.', description: 'Kalian punya cukup banyak kesamaan dan berbeda di beberapa hal — perpaduan yang sehat antara yang akrab dan yang baru.' },
  },
  relations: { shared: 'Jawaban sama', close: 'Berdekatan', complementary: 'Saling melengkapi', different: 'Berbeda', tension: 'Perlu dibicarakan' },
  axes: {
    expression: { label: 'Mengungkapkan perasaan', left: 'Menyimpan', right: 'Ekspresif', pos: { adj: 'Terbuka', noun: 'Pencerita', desc: 'mudah mengungkapkan perasaan lewat kata-kata dan menghargai keterbukaan' }, neg: { adj: 'Tenang dan Dalam', noun: 'Pengamat', desc: 'menyimpan perasaan rapat-rapat dan menunjukkan kasih sayang dengan cara yang lebih tenang' } },
    togetherness: { label: 'Kedekatan & ruang', left: 'Mandiri', right: 'Bersama', pos: { adj: 'Hangat', noun: 'Penyambung', desc: 'mendapat energi dari kedekatan dan waktu bersama' }, neg: { adj: 'Mandiri', noun: 'Jiwa Bebas', desc: 'menghargai kemandirian dan ruang pribadi' } },
    engagement: { label: 'Menghadapi masalah', left: 'Butuh waktu', right: 'Langsung dibahas', pos: { adj: 'Lugas', noun: 'Penyelesai', desc: 'lebih suka membahas masalah secara langsung' }, neg: { adj: 'Reflektif', noun: 'Perenung', desc: 'butuh waktu dan suasana tenang sebelum membahas masalah' } },
    structure: { label: 'Rencana & spontanitas', left: 'Spontan', right: 'Terencana', pos: { adj: 'Teratur', noun: 'Perencana', desc: 'merasa aman dengan rencana dan kepastian' }, neg: { adj: 'Spontan', noun: 'Petualang', desc: 'menikmati spontanitas dan membiarkan segala sesuatu tetap terbuka' } },
    reassurance: { label: 'Kepastian', left: 'Yakin sendiri', right: 'Suka diyakinkan', pos: { adj: 'Penuh Rasa', noun: 'Romantis', desc: 'merasa paling aman ketika kasih sayang sering diungkapkan' }, neg: { adj: 'Percaya Diri', noun: 'Jangkar', desc: 'merasa aman tanpa perlu banyak diyakinkan' } },
    horizon: { label: 'Memandang ke depan', left: 'Fokus saat ini', right: 'Fokus masa depan', pos: { adj: 'Visioner', noun: 'Pembangun', desc: 'berpikir ke depan dan suka punya arah yang jelas' }, neg: { adj: 'Santai', noun: 'Penikmat Momen', desc: 'hidup di saat ini dan membiarkan masa depan terungkap dengan sendirinya' } },
  },
  profile: {
    headlineTwo: (adj, noun) => `Si ${noun} yang ${adj}`,
    headlineOne: (noun) => `Si ${noun}`,
    headlineNeutral: 'Si Penyeimbang',
    summaryTwo: (n, d1, d2) => `${n} ${d1}, serta ${d2}.`,
    summaryOne: (n, d1) => `${n} ${d1}, dan cukup fleksibel dalam hal lain.`,
    summaryNeutral: (n) => `Jawaban ${n} cenderung berada di tengah pada sebagian besar spektrum — fleksibel, mudah menyesuaikan diri, dan sulit dikotak-kotakkan.`,
  },
  care: {
    words: { noun: 'kata-kata', action: (n) => `ucapkan satu hal spesifik yang kamu hargai dari ${n}, secara langsung, setiap hari minggu ini` },
    time: { noun: 'waktu yang utuh', action: (n) => `rencanakan satu jam tanpa HP bersama ${n} minggu ini, cuma berdua` },
    help: { noun: 'bantuan nyata', action: (n) => `ambil alih satu tugas ${n} minggu ini tanpa diminta` },
    touch: { noun: 'kedekatan fisik', action: (n) => `berikan ${n} lebih banyak sentuhan sehari-hari — tangan di punggung, pelukan yang lebih lama` },
    thought: { noun: 'kejutan kecil yang penuh perhatian', action: (n) => `tinggalkan untuk ${n} satu tanda kecil tak terduga bahwa kamu sedang memikirkannya` },
  },
  disclaimer:
    'Blueprint ini untuk refleksi dan hiburan. Isinya disusun dari 20 jawaban kalian masing-masing pada satu titik waktu — bukan dari asesmen psikologis yang tervalidasi — dan tidak bisa memprediksi apakah sebuah hubungan akan berhasil. Kalian lebih mengenal hubungan kalian daripada kuesioner mana pun.',
  dimensionHeadline: (a) => (a >= 80 ? 'Sangat selaras' : a >= 65 ? 'Sebagian besar sejalan' : a >= 50 ? 'Ada titik temu, ada perbedaan nyata' : 'Sudut pandang berbeda yang layak dijelajahi'),
  both: (p) => `Kalian berdua ${p}.`,
  contrast: (a, ta, b, tb) => `${a} ${ta}. ${b} ${tb}.`,
  closeNote: 'Jawaban kalian bersebelahan — perbedaan kecil dalam kadar, bukan jurang.',
  closeShort: 'Perbedaan kecil dalam kadar.',
  careEvidence: { topic: 'Perhatian yang diberi dan diterima', prompt: (r, g) => `Yang membuat ${r} paling merasa dicintai · Cara ${g} menunjukkan perhatian` },
  careMatch: {
    title: (g, r) => `Perhatian ${g} sampai ke ${r}`,
    body: (r, g, noun) => `${r} paling merasa dicintai lewat ${noun} — dan justru begitulah cara ${g} biasa menunjukkan perhatian. Naluri ${g} sudah berbicara dalam bahasa ${r}.`,
  },
  careMismatch: {
    title: (g, r) => `Menerjemahkan perhatian ${g} untuk ${r}`,
    body: (r, g, ln, sn) => [`${r} paling merasa dicintai lewat ${ln}, sementara ${g} biasa menunjukkan perhatian lewat ${sn}.`, `Cinta ${g} bisa sepenuhnya tulus namun tetap mudah terlewat oleh ${r} — dan ${g} mungkin bertanya-tanya mengapa perhatiannya tidak selalu sampai.`],
    tip: (g, action, r, sn) => `${g}: ${action}. ${r}: coba kenali ${sn} sebagai cara ${g} mengungkapkan sayangnya.`,
  },
  pursue: {
    title: 'Risiko kejar-dan-mundur',
    body: (p, w) => [
      `Jawaban ${p} cenderung ingin langsung membahas masalah, sementara ${w} biasanya butuh waktu dan ketenangan lebih dulu.`,
      `Saat sedang tegang, ini bisa jadi lingkaran: makin ${p} mendesak, makin ${w} menarik diri — dan makin ${w} menarik diri, makin ${p} mendesak. Tidak ada yang salah; kalian masing-masing sedang menjaga hubungan dengan cara sendiri.`,
    ],
    tip: (w, p) => `${w}: saat butuh jeda, sebutkan kapan kamu akan kembali. ${p}: percayai waktu itu, dan berikan ruangnya sepenuhnya.`,
  },
  quietDistance: {
    title: 'Saat diam terasa seperti jarak',
    body: (x, y) => [`${x} menghargai kepastian dan suka kontak rutin, sementara ${y} lebih nyaman dengan kontak yang ringan di siang hari.`, `Di hari-hari sibuk, diamnya ${y} bisa terasa seperti jarak bagi ${x} — padahal tidak ada apa-apa.`],
    tip: (x, y) => `${y}: satu pesan kecil tanpa diminta di hari sibuk sangat berarti. ${x}: saat rasa khawatir muncul, tanyakan saja daripada menebak.`,
  },
  depleted: {
    title: 'Saat kalian sama-sama lelah',
    body: (x, y) => [`Saat ${x} sedang sedih, ${x} mencari kedekatan — sementara ${y} mengisi ulang tenaga dengan waktu sendiri.`, 'Di minggu yang berat, kalian bisa sama-sama terkuras dan butuh hal yang berlawanan — sampai akhirnya dua-duanya merasa kurang diperhatikan.'],
    tip: 'Sepakati rencana “sama-sama lelah” dari awal: pelukan panjang dulu, lalu satu jam terpisah, lalu makan malam bersama.',
  },
  dimensionIntro: ({ label, alignment, matched, total, tension }) => {
    const band = alignment >= 80 ? 'sangat selaras' : alignment >= 65 ? 'sebagian besar sejalan' : alignment >= 50 ? 'perpaduan nyata antara titik temu dan perbedaan' : 'cukup berbeda dalam memandang — justru inilah area paling kaya untuk dibicarakan';
    const rest = total - matched;
    const parts = [`Dalam hal ${label.toLowerCase()}, kalian ${alignment}% selaras: ${band}.`];
    parts.push(matched === total ? `Keempat jawaban kalian di sini sejalan atau saling melengkapi.` : matched === 0 ? `Tidak satu pun dari ${total} jawaban kalian di sini yang berdekatan.` : `${matched} dari ${total} jawaban kalian di sini sejalan atau saling melengkapi, dan ${rest} menunjukkan sudut pandang berbeda.`);
    if (tension) parts.push(tension === 1 ? 'Ada satu topik yang bisa memicu salah paham kalau tidak dibicarakan.' : `Ada ${tension} topik yang bisa memicu salah paham kalau tidak dibicarakan.`);
    return parts.join(' ');
  },
  deepDives: { emotional: 'Kebutuhan Emosional', communication: 'Dinamika Komunikasi', conflict: 'Konflik & Saling Memahami', future: 'Harapan Masa Depan' },
  emotionalIntro: 'Bagian ini membahas bagaimana kalian masing-masing memberi dan menerima perhatian, seberapa besar kebutuhan akan kepastian dan keterbukaan, serta bagaimana kalian menyeimbangkan kedekatan dengan ruang pribadi.',
  conflictPattern: (p, w) => `Satu pola yang perlu diketahui: ${p} cenderung mendekati masalah, sementara ${w} mundur sejenak untuk memikirkannya. Pola ini dibahas di Potensi Titik Buta, beserta cara sederhana menghadapinya.`,
  strengths: {
    dimTitle: (l) => `Pijakan kuat dalam ${l.toLowerCase()}`,
    dimBody: (a, topics) => `Kalian ${a}% selaras di sini, dengan jawaban yang sama atau saling melengkapi soal ${listId(topics)}. Ini area yang bisa kalian andalkan saat hal lain terasa lebih berat.`,
    complementTitle: (t) => `${t}: saling melengkapi`,
    sharedTitle: (t) => `Sejalan soal ${t.toLowerCase()}`,
    curiosity: { title: 'Rasa ingin tahu tentang satu sama lain', body: 'Kalian berdua memilih untuk duduk dan menjawab dua puluh pertanyaan jujur tentang cara kalian mencintai, berselisih, dan merencanakan masa depan. Pasangan yang terus penasaran satu sama lain memberi ruang untuk bertumbuh — dan itulah yang sedang kalian lakukan.' },
  },
  blind: {
    title: (t) => `Titik buta bersama: ${t.toLowerCase()}`,
    noneTitle: 'Tidak ada titik buta besar yang menonjol',
    noneBody: [
      'Tidak ada kombinasi jawaban kalian yang cocok dengan pola yang kami cari — menghindar bersama, kejar-dan-mundur, atau kebutuhan yang diam-diam saling meniadakan.',
      'Satu catatan lembut: di bagian yang jawabannya sama, mudah sekali mengira kalian memaksudkan hal yang sama. Pakai satu-dua bahan obrolan untuk topik yang kalian sepakati juga.',
    ],
  },
  starters: {
    whyShared: (l) => `Kalian berdua menjawab “${l}”. Kata yang sama bisa menyimpan gambaran berbeda — bandingkan versi kalian.`,
    whyDifferent: (a, la, b, lb) => `${a} menjawab “${la}”; ${b} menjawab “${lb}”.`,
  },
  actions: {
    becauseShared: (p) => `Karena kalian berdua ${p}.`,
    becauseDifferent: (a, ta, b, tb) => `Karena ${a} ${ta}, sementara ${b} ${tb}.`,
    loveTitle: (r) => `Cinta dalam bahasa ${r}`,
    loveBody: (g, action) => `${g}: ${action}.`,
    loveBecause: (r, ln, g, sn) => `Karena ${r} paling merasa dicintai lewat ${ln}, sementara ${g} biasa menunjukkan perhatian lewat ${sn}.`,
    loveBecauseShort: (r, ln) => `Karena ${r} paling merasa dicintai lewat ${ln}.`,
    keepDoing: { title: 'Teruskan yang sudah berhasil', body: 'Cara kalian menunjukkan perhatian sudah sampai satu sama lain. Minggu ini, saling sampaikan satu hal yang dilakukan yang lain dan membuat kalian merasa dicintai — secara langsung dan spesifik.', because: 'Karena cara kalian masing-masing menunjukkan perhatian cocok dengan cara yang lain merasa paling dicintai.' },
  },
  summary: {
    p1Even: (a, b, same, total, al) => `${a} dan ${b}, jawaban kalian sama di ${same} dari ${total} pertanyaan, dengan keselarasan keseluruhan ${al}% yang merata di kelima area.`,
    p1: (x) => `${x.a} dan ${x.b}, jawaban kalian sama di ${x.same} dari ${x.total} pertanyaan, dengan keselarasan keseluruhan ${x.alignment}%. Titik temu terkuat kalian ada di ${x.top.toLowerCase()} (${x.topScore}%), sementara area yang paling seru untuk digali adalah ${x.low.toLowerCase()} (${x.lowScore}%).`,
    noDifferences: 'Kalian tidak berbeda di satu topik pun — langka, dan layak dirayakan! Tetap baik untuk memastikan kata yang sama memang berarti sama buat kalian berdua.',
    differences: (n, c) => `Dari ${n} topik yang jawabannya berbeda, ${c ? `${c} justru saling melengkapi — saling mengisi, bukan saling tarik` : 'tidak ada yang jelas saling melengkapi, tapi sebagian besar hanyalah sudut pandang yang berbeda'}.`,
    tension: (n) => (n === 1 ? 'Satu di antaranya bisa memicu salah paham kalau tidak dibicarakan — dan Blueprint ini menunjukkan persis di mana.' : `${n} di antaranya bisa memicu salah paham kalau tidak dibicarakan — dan Blueprint ini menunjukkan persis di mana.`),
  },
  horizons: { week: 'Minggu ini', month: 'Bulan ini', ongoing: 'Seterusnya' },
};

export const REPORT_STRINGS: Record<Locale, ReportStrings> = { en: EN, id: ID };
