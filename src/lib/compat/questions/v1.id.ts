import type { QuestionSetTranslation } from '../types';

/**
 * Question set v1 — Bahasa Indonesia.
 *
 * Same ids as ./v1.ts; only the text changes. Grammar contract for the report
 * builder:
 *   label  — first person ("aku"), "kita" for the two of them.
 *   trait  — predicate after a name: "Sam {trait}." (lowercase, no period).
 *   plural — predicate after "Kalian berdua": "Kalian berdua {plural}."
 *   insight / pair / blind-spot notes — full sentences addressed to "kalian".
 *   prompt / starter — address the reader as "kamu", the other person as "dia".
 */
export const QUESTION_SET_V1_ID: QuestionSetTranslation = {
  dimensions: {
    communication: {
      label: 'Komunikasi',
      short: 'Bicara',
      description: 'Cara kalian saling berkabar, menyampaikan sesuatu, dan saling mendukung lewat kata-kata.',
    },
    emotional: {
      label: 'Kedekatan Emosional',
      short: 'Rasa',
      description: 'Cara kalian memberi dan menerima cinta, rasa aman, dan keterbukaan.',
    },
    lifestyle: {
      label: 'Gaya Hidup & Ruang Pribadi',
      short: 'Hidup',
      description: 'Cara kalian mengisi ulang energi, menghabiskan waktu luang, dan menyeimbangkan waktu bersama dengan waktu sendiri.',
    },
    future: {
      label: 'Harapan Masa Depan',
      short: 'Arah',
      description: 'Tempo, uang, keluarga, dan kehidupan yang kalian bayangkan ke depan.',
    },
    conflict: {
      label: 'Konflik & Saling Memahami',
      short: 'Pulih',
      description: 'Apa yang terjadi saat kalian berbeda pendapat — dan bagaimana kalian menemukan jalan kembali.',
    },
  },

  questions: {
    /* ───────────────────────────── Komunikasi ───────────────────────────── */
    'com-rhythm': {
      prompt: 'Di hari biasa saat kamu dan dia tidak bertemu, seberapa sering berkabar yang terasa pas buatmu?',
      topic: 'Kontak sehari-hari',
      options: {
        steady: {
          label: 'Terus berkabar — pesan-pesan kecil sepanjang hari',
          trait: 'merasa paling dekat lewat pesan-pesan kecil sepanjang hari',
          plural: 'merasa paling dekat lewat pesan-pesan kecil sepanjang hari',
        },
        checkins: {
          label: 'Beberapa kali saja — pagi, malam, sesekali hal lucu',
          trait: 'suka berkabar beberapa kali sepanjang hari',
          plural: 'suka berkabar beberapa kali sepanjang hari',
        },
        one: {
          label: 'Cukup sekali ngobrol panjang dalam sehari',
          trait: 'sudah merasa cukup dengan sekali ngobrol panjang dalam sehari',
          plural: 'sudah merasa cukup dengan sekali ngobrol panjang dalam sehari',
        },
        light: {
          label: 'Sedikit saja — aku lebih suka menyimpannya untuk saat kita bertemu',
          trait: 'lebih suka menyimpan sebagian besar obrolan untuk saat bertemu langsung',
          plural: 'lebih suka menyimpan sebagian besar obrolan untuk saat bertemu langsung',
        },
      },
      insight: {
        why: 'Ritme berkabar adalah salah satu hal pertama yang sering diberi makna — sebagai tanda kehangatan, ketertarikan, atau justru tekanan.',
        shared: 'Ritme yang kalian harapkan sama, jadi jeda maupun pesan tidak mudah disalahartikan.',
        different: 'Tidak ada ritme yang lebih perhatian daripada yang lain. Pesan yang sering bisa terasa hangat bagi satu orang, tapi seperti daftar tugas bagi yang lain; diam bisa terasa sebagai tanda percaya bagi yang satu, dan seperti jarak bagi yang lain.',
        bridge: 'Sepakati batas minimum yang sederhana — misalnya ucapan selamat pagi dan kabar “sudah sampai rumah” — supaya yang ingin lebih banyak kabar merasa diperhatikan, dan yang ingin lebih sedikit tidak merasa diawasi.',
      },
      starter: 'Saat dia tidak ada kabar selama beberapa jam, cerita apa yang muncul di kepalamu — dan seberapa sering cerita itu benar?',
    },

    'com-raise': {
      prompt: 'Saat ada hal kecil dalam hubungan ini yang mengganggumu, apa yang biasanya kamu lakukan?',
      topic: 'Menyampaikan hal kecil',
      options: {
        now: {
          label: 'Langsung bilang, selagi masih hangat',
          trait: 'menyampaikan hal kecil yang mengganjal secepatnya, selagi masih hangat',
          plural: 'menyampaikan hal kecil yang mengganjal secepatnya, selagi masih hangat',
        },
        calm: {
          label: 'Menunggu suasana tenang, baru membicarakannya',
          trait: 'menunggu suasana tenang sebelum membicarakan sesuatu',
          plural: 'menunggu suasana tenang sebelum membicarakan sesuatu',
        },
        hint: {
          label: 'Memberi kode dan berharap dia peka',
          trait: 'cenderung memberi kode dan berharap kodenya ditangkap',
          plural: 'cenderung memberi kode dan berharap kodenya ditangkap',
        },
        hold: {
          label: 'Membiarkannya, kecuali kalau jadi masalah besar',
          trait: 'biasanya membiarkan hal kecil berlalu, kecuali kalau makin besar',
          plural: 'biasanya membiarkan hal kecil berlalu, kecuali kalau makin besar',
        },
      },
      pairs: {
        'now|calm': 'Yang satu cepat menyampaikan sesuatu, yang lain pandai memilih waktu. Bersama, artinya masalah bisa dibicarakan lebih awal — dan dengan cara yang baik.',
        'now|hold': 'Yang satu langsung menyampaikan sesuatu; yang lain membiarkannya lewat. Risikonya, yang satu merasa diomeli, sementara yang lain diam-diam mencatat semuanya dalam hati.',
        'now|hint': 'Yang satu bicara terus terang; yang lain memberi kode. Kode mudah terlewat oleh orang yang terbiasa dengan keterusterangan — dan kode yang terlewat bisa terasa seperti tidak dipedulikan.',
      },
      blindSpots: [
        'Tidak ada di antara kalian yang terbiasa mengangkat hal-hal kecil. Itu menjaga suasana tetap damai untuk sekarang, tapi hal yang tak terucap cenderung menumpuk lalu muncul sekaligus.',
      ],
      insight: {
        why: 'Cara rasa kesal kecil disampaikan — atau dipendam — menentukan apakah ia tetap kecil.',
        shared: 'Kalian menangani rasa kesal kecil dengan cara yang sama, jadi sikap masing-masing mudah dipahami.',
        different: 'Kalian menyampaikan rasa kesal kecil dengan kecepatan berbeda. Itu tetap bisa dijalani, asal masing-masing tahu kebiasaan dasar yang lain.',
        bridge: 'Coba sesi “hal-hal kecil” seminggu sekali: sepuluh menit, satu hal dari masing-masing, tanpa membela diri — cukup mendengarkan.',
      },
      starter: 'Adakah hal kecil yang selama ini kamu biarkan, tapi sebenarnya ingin kamu sampaikan? Kamu ingin dia menanggapinya seperti apa?',
    },

    'com-upset': {
      prompt: 'Saat ada hal dalam hidupmu yang membuatmu sedih atau kesal, dukungan seperti apa dari dia yang paling membantu?',
      topic: 'Dukungan saat sedih',
      options: {
        listen: {
          label: 'Dengarkan aku, biarkan aku curhat sepuasnya',
          trait: 'paling butuh didengarkan saat sedang sedih',
          plural: 'paling butuh didengarkan saat sedang sedih',
        },
        solve: {
          label: 'Bantu aku mencari tahu harus berbuat apa',
          trait: 'merasa didukung lewat bantuan praktis untuk menyelesaikan masalah',
          plural: 'merasa didukung lewat bantuan praktis untuk menyelesaikan masalah',
        },
        comfort: {
          label: 'Dihibur — kedekatan, pelukan, kata-kata yang menenangkan',
          trait: 'butuh dihibur dan didekap lebih dulu',
          plural: 'butuh dihibur dan didekap lebih dulu',
        },
        space: {
          label: 'Beri aku ruang dulu — aku akan bicara kalau sudah siap',
          trait: 'butuh sedikit ruang sebelum mau bicara',
          plural: 'butuh sedikit ruang sebelum mau bicara',
        },
      },
      insight: {
        why: 'Dukungan baru terasa membantu kalau bentuknya memang yang dibutuhkan.',
        shared: 'Kalian menginginkan jenis dukungan yang sama, jadi naluri untuk memberi apa yang kalian sendiri inginkan biasanya akan tepat sasaran.',
        different: 'Kalian membutuhkan hal yang berbeda saat hidup sedang berat. Jebakannya adalah memberi apa yang kalian sendiri inginkan — solusi untuk orang yang butuh didengar, kedekatan untuk orang yang butuh ruang.',
        bridge: 'Saat salah satu dari kalian sedang sedih, tanyakan: “Kamu mau aku dengarkan, bantu, peluk, atau kasih waktu sebentar?” Rasanya canggung selama seminggu, lalu jadi bahasa singkat kalian sendiri.',
      },
      starter: 'Ingat saat dia benar-benar berhasil mendukungmu. Apa persisnya yang dia lakukan?',
    },

    'com-closest': {
      prompt: 'Obrolan seperti apa yang paling membuatmu merasa dekat dengan seseorang?',
      topic: 'Obrolan yang mendekatkan',
      options: {
        deep: {
          label: 'Obrolan mendalam — mimpi, ketakutan, pertanyaan besar dalam hidup',
          trait: 'merasa paling dekat lewat obrolan mendalam tentang mimpi dan ketakutan',
          plural: 'merasa paling dekat lewat obrolan mendalam tentang mimpi dan ketakutan',
        },
        playful: {
          label: 'Saling bercanda dan lelucon yang cuma kita yang paham',
          trait: 'merasa terhubung lewat saling bercanda dan lelucon khas berdua',
          plural: 'merasa terhubung lewat saling bercanda dan lelucon khas berdua',
        },
        everyday: {
          label: 'Berbagi cerita kecil tentang hari kita masing-masing',
          trait: 'merasa dekat saat saling berbagi cerita kecil sehari-hari',
          plural: 'merasa dekat saat saling berbagi cerita kecil sehari-hari',
        },
        quiet: {
          label: 'Hening yang nyaman — tanpa perlu bicara',
          trait: 'merasa paling dekat dalam keheningan yang nyaman',
          plural: 'merasa paling dekat dalam keheningan yang nyaman',
        },
      },
      pairs: {
        'deep|playful': 'Yang satu membawa kedalaman, yang lain keceriaan — keseimbangan yang baik, selama candaan tidak berubah jadi cara untuk menghindari obrolan serius.',
        'deep|everyday': 'Pertanyaan besar dan detail kecil adalah dua sisi dari mengenal seseorang. Di antara kalian berdua, keduanya terpenuhi.',
        'playful|everyday': 'Candaan dan cerita sehari-hari menciptakan kedekatan yang santai, hangat, dan terasa di keseharian.',
        'deep|quiet': 'Yang satu paling hidup dalam obrolan mendalam, yang lain dalam hening bersama. Kalau tidak dibicarakan, yang satu bisa merasa obrolannya hanya sepihak, dan yang lain merasa terus dicecar pertanyaan.',
      },
      insight: {
        why: 'Jenis obrolan yang membuat kalian merasa dekat adalah bagian penting dari rasa benar-benar dikenal.',
        shared: 'Kalian terhubung lewat jenis obrolan yang sama, jadi mudah untuk menciptakan momen-momen itu dengan sengaja.',
        different: 'Kalian merasa dekat lewat jenis obrolan yang berbeda. Tidak ada yang lebih dangkal — kalian hanya punya cara berbeda untuk menyegarkan kedekatan.',
        bridge: 'Bergantian memilih: satu malam untuk jenis obrolan favorit salah satu dari kalian, lalu satu malam untuk favorit yang lain.',
      },
      starter: 'Obrolan apa dengan dia yang sampai sekarang masih kamu ingat? Apa yang membuatnya terasa begitu dekat?',
    },

    /* ────────────────────────── Kedekatan Emosional ───────────────────────── */
    'emo-loved': {
      prompt: 'Apa yang paling membuatmu merasa dicintai?',
      topic: 'Merasa dicintai',
      options: {
        words: {
          label: 'Mendengarnya langsung — kata-kata hangat, pujian, ‘Aku bangga sama kamu’',
          trait: 'paling merasa dicintai lewat kata-kata — mendengarnya diucapkan',
          plural: 'paling merasa dicintai lewat kata-kata — mendengarnya diucapkan',
        },
        time: {
          label: 'Waktu dan perhatian yang utuh',
          trait: 'paling merasa dicintai lewat waktu dan perhatian yang utuh',
          plural: 'paling merasa dicintai lewat waktu dan perhatian yang utuh',
        },
        help: {
          label: 'Bantuan nyata — seseorang yang membuat hidupku lebih ringan',
          trait: 'paling merasa dicintai saat hidupnya dibuat lebih ringan lewat hal-hal praktis',
          plural: 'paling merasa dicintai saat hidup kalian dibuat lebih ringan lewat hal-hal praktis',
        },
        touch: {
          label: 'Kedekatan fisik — tangan untuk digenggam, pelukan yang lama',
          trait: 'paling merasa dicintai lewat kedekatan fisik',
          plural: 'paling merasa dicintai lewat kedekatan fisik',
        },
        thought: {
          label: 'Kejutan kecil yang menunjukkan dia sedang memikirkanku',
          trait: 'paling merasa dicintai lewat kejutan kecil yang penuh perhatian',
          plural: 'paling merasa dicintai lewat kejutan kecil yang penuh perhatian',
        },
      },
      insight: {
        why: 'Orang cenderung menunjukkan cinta dengan cara yang ingin mereka terima — padahal belum tentu itu yang dibutuhkan orang lain.',
        shared: 'Kalian merasa dicintai dengan cara yang sama, jadi perhatian yang kalian berikan cenderung langsung sampai.',
        different: 'Kalian merasa dicintai dengan cara yang berbeda. Itu sangat umum — dan mudah dijalani begitu sudah terlihat jelas.',
        bridge: 'Masing-masing tuliskan tiga hal kecil dan spesifik yang akan membuat kalian merasa dicintai minggu ini. Lalu tukar daftarnya.',
      },
      starter: 'Hal kecil apa yang pernah dia lakukan dan membuatmu benar-benar merasa dicintai?',
    },

    'emo-show': {
      prompt: 'Apa caramu yang paling alami untuk menunjukkan rasa sayang ke seseorang?',
      topic: 'Menunjukkan rasa sayang',
      options: {
        words: {
          label: 'Aku mengatakannya — sering dan terang-terangan',
          trait: 'menunjukkan rasa sayang dengan mengucapkannya, terang-terangan dan sering',
          plural: 'menunjukkan rasa sayang dengan mengucapkannya, terang-terangan dan sering',
        },
        time: {
          label: 'Aku meluangkan waktu dan memberi perhatian penuh',
          trait: 'menunjukkan rasa sayang dengan meluangkan waktu dan memberi perhatian penuh',
          plural: 'menunjukkan rasa sayang dengan meluangkan waktu dan memberi perhatian penuh',
        },
        help: {
          label: 'Aku melakukan sesuatu untuknya — membantu, mengurus banyak hal',
          trait: 'menunjukkan rasa sayang lewat tindakan — membantu dan mengurus banyak hal',
          plural: 'menunjukkan rasa sayang lewat tindakan — membantu dan mengurus banyak hal',
        },
        touch: {
          label: 'Lewat sentuhan — pelukan, rangkulan, kedekatan',
          trait: 'menunjukkan rasa sayang lewat sentuhan fisik',
          plural: 'menunjukkan rasa sayang lewat sentuhan fisik',
        },
        thought: {
          label: 'Hadiah kecil dan kejutan yang sudah kurencanakan',
          trait: 'menunjukkan rasa sayang lewat hadiah kecil dan kejutan yang direncanakan',
          plural: 'menunjukkan rasa sayang lewat hadiah kecil dan kejutan yang direncanakan',
        },
      },
      insight: {
        why: 'Cara kalian masing-masing menunjukkan rasa sayang adalah bahasa yang perlu dipelajari oleh yang lain.',
        shared: 'Kalian mengungkapkan rasa sayang dengan cara yang sama, jadi mudah untuk saling mengenalinya.',
        different: 'Kalian mengungkapkan rasa sayang dengan cara berbeda. Pastikan masing-masing bisa mengenali cara yang lain sebagai bentuk cinta, bukan sekadar kebiasaan.',
        bridge: 'Ucapkan dengan jelas selama seminggu: “Aku bikinkan kopi — itu caraku bilang sayang.” Ini membantu yang lain mempelajari bahasa kalian masing-masing.',
      },
      starter: 'Apa satu caramu menunjukkan rasa sayang yang kamu duga tidak disadari olehnya?',
    },

    'emo-reassure': {
      prompt: 'Seberapa sering kamu ingin diyakinkan tentang posisimu di hati seseorang?',
      topic: 'Kepastian',
      options: {
        lots: {
          label: 'Sering — aku suka mendengarnya secara rutin',
          trait: 'suka sering mendapat kepastian tentang posisinya dalam hubungan',
          plural: 'suka sering mendapat kepastian tentang posisi kalian di hati satu sama lain',
        },
        some: {
          label: 'Secukupnya — terutama saat keadaan terasa tidak pasti',
          trait: 'menghargai kepastian terutama saat keadaan terasa tidak menentu',
          plural: 'menghargai kepastian terutama saat keadaan terasa tidak menentu',
        },
        little: {
          label: 'Sedikit — aku percaya semuanya baik-baik saja, kecuali ada tanda sebaliknya',
          trait: 'umumnya percaya semuanya baik-baik saja kecuali diberi tahu sebaliknya',
          plural: 'umumnya percaya semuanya baik-baik saja kecuali diberi tahu sebaliknya',
        },
        none: {
          label: 'Hampir tidak perlu — tindakan sudah menjelaskan semuanya',
          trait: 'lebih membaca tindakan daripada butuh diyakinkan',
          plural: 'lebih membaca tindakan daripada butuh diyakinkan',
        },
      },
      insight: {
        why: 'Kebutuhan untuk diyakinkan sering tak terlihat oleh orang yang tidak merasakannya.',
        shared: 'Kebutuhan kalian untuk diyakinkan kurang lebih sama, jadi kecil kemungkinan salah satu merasa sesak atau justru kekurangan.',
        different: 'Salah satu dari kalian lebih ingin mendengar kepastian dibanding yang lain. Itu bukan berarti “manja” atau “cuek” — begitulah rasa aman terasa bagi masing-masing.',
        bridge: 'Yang lebih jarang butuh diyakinkan bisa menjadikannya kebiasaan, bukan sekadar reaksi — ucapan rutin tanpa diminta seperti “Aku senang ada kita” sangat berarti.',
      },
      starter: 'Apa yang membuatmu merasa aman dalam hubungan — dan apa yang diam-diam membuatmu ragu?',
    },

    'emo-open': {
      prompt: 'Seberapa mudah kamu berbagi perasaan terdalammu — kekhawatiran, rasa tidak percaya diri, harapan?',
      topic: 'Membuka diri',
      options: {
        easily: {
          label: 'Mudah — aku seperti buku yang terbuka',
          trait: 'mudah membuka diri — seperti buku yang terbuka',
          plural: 'mudah membuka diri',
        },
        safe: {
          label: 'Cukup mudah, asal aku sudah merasa aman',
          trait: 'membuka diri begitu merasa aman',
          plural: 'membuka diri begitu merasa aman',
        },
        slowly: {
          label: 'Pelan-pelan — aku butuh waktu',
          trait: 'membuka diri pelan-pelan, seiring waktu',
          plural: 'membuka diri pelan-pelan, seiring waktu',
        },
        rarely: {
          label: 'Jarang — biasanya aku pendam dan urai sendiri',
          trait: 'cenderung memproses perasaannya sendiri',
          plural: 'cenderung memproses perasaan sendiri-sendiri',
        },
      },
      blindSpots: [
        'Kalian berdua sama-sama menyimpan perasaan terdalam rapat-rapat. Itu bisa terasa tenang dan saling menghormati — tapi bisa juga berarti kalian tahu lebih sedikit tentang dunia batin satu sama lain daripada yang kalian kira.',
      ],
      insight: {
        why: 'Kecepatan seseorang membuka diri memengaruhi apakah yang lain merasa dekat — atau justru merasa tidak diberi tempat.',
        shared: 'Kalian membuka diri dengan tempo yang mirip, jadi kecil kemungkinan salah satu merasa yang lain menutup diri atau terlalu banyak bercerita.',
        different: 'Kalian membuka diri dengan kecepatan yang berbeda. Yang lebih cepat berbagi bisa merasa yang lain menahan diri; yang lebih lambat bisa merasa didesak.',
        bridge: 'Yang lebih terbuka bisa mengajukan pertanyaan yang lembut dan spesifik, lalu memberi ruang; yang lebih tertutup bisa membagikan satu hal kecil yang jujur, sedikit demi sedikit.',
      },
      starter: 'Apa satu hal tentang dirimu yang ingin dia ketahui, tapi sulit untuk kamu ucapkan?',
    },

    /* ─────────────────────── Gaya Hidup & Ruang Pribadi ────────────────────── */
    'life-recharge': {
      prompt: 'Setelah hari yang panjang dan melelahkan, bagaimana caramu mengisi ulang energi?',
      topic: 'Mengisi ulang energi',
      options: {
        together: {
          label: 'Bersama — berdekatan membantuku melepas lelah',
          trait: 'mengisi ulang energi dengan berdekatan',
          plural: 'mengisi ulang energi dengan berdekatan',
        },
        nearby: {
          label: 'Di ruangan yang sama, sibuk dengan kegiatan masing-masing',
          trait: 'suka bersantai berdampingan sambil sibuk dengan kegiatan masing-masing',
          plural: 'suka bersantai berdampingan sambil sibuk dengan kegiatan masing-masing',
        },
        alone: {
          label: 'Aku butuh waktu sendiri dulu, lalu kita bersama lagi',
          trait: 'butuh waktu sendiri dulu, lalu kembali mendekat',
          plural: 'butuh waktu sendiri dulu, lalu kembali mendekat',
        },
        solo: {
          label: 'Sendiri — aku butuh malam itu untuk diriku sendiri',
          trait: 'paling bisa mengisi ulang energi dengan benar-benar menyendiri',
          plural: 'paling bisa mengisi ulang energi dengan benar-benar menyendiri',
        },
      },
      insight: {
        why: 'Kebutuhan mengisi ulang energi mudah dianggap personal — padahal ini soal tenaga, bukan soal sayang.',
        shared: 'Cara kalian mengisi ulang energi sama, jadi malam hari mudah dinikmati bersama.',
        different: 'Cara kalian mengisi ulang energi berbeda. Saat yang satu mencari kedekatan dan yang lain mencari waktu sendiri, itu bisa terasa seperti penolakan — padahal hanya baterai yang sedang menipis.',
        bridge: 'Buat sebuah tanda — kata atau gerakan — yang artinya “Aku butuh waktu sejam, nanti aku cari kamu lagi.” Janji untuk kembali itulah yang membuat ruang terasa aman.',
      },
      starter: 'Saat kamu butuh ruang, bagaimana dia bisa tahu — dan apa yang kamu ingin dia lakukan?',
    },

    'life-weekend': {
      prompt: 'Seperti apa akhir pekan bebas yang sempurna menurutmu?',
      topic: 'Waktu luang',
      options: {
        social: {
          label: 'Pergi bersama teman-teman, ramai-ramai',
          trait: 'suka akhir pekan yang penuh teman dan keramaian',
          plural: 'suka akhir pekan yang penuh teman dan keramaian',
        },
        adventure: {
          label: 'Mencoba hal baru — jalan-jalan, kegiatan seru',
          trait: 'suka akhir pekan berisi pengalaman baru dan petualangan kecil',
          plural: 'suka akhir pekan berisi pengalaman baru dan petualangan kecil',
        },
        home: {
          label: 'Bersantai di rumah berdua, tanpa rencana',
          trait: 'suka akhir pekan yang santai dan nyaman di rumah',
          plural: 'suka akhir pekan yang santai dan nyaman di rumah',
        },
        own: {
          label: 'Waktu untuk hobi dan rencanaku sendiri',
          trait: 'ingin punya waktu akhir pekan untuk hobi dan rencana pribadinya',
          plural: 'ingin punya waktu akhir pekan untuk hobi dan rencana pribadi',
        },
      },
      pairs: {
        'adventure|home': 'Yang satu tertarik pada petualangan, yang lain pada istirahat — bersama, kalian bisa menemukan ritme antara menjelajah dan memulihkan diri.',
        'home|own': 'Yang satu ingin waktu santai berdua, yang lain ingin waktu pribadi. Keduanya sangat bisa berjalan beriringan, asal sama-sama masuk dalam rencana akhir pekan.',
        'social|home': 'Yang satu mengisi ulang energi bersama banyak orang, yang lain dengan menyendiri di rumah. Kalau tidak dibicarakan, setiap akhir pekan bisa berubah jadi tawar-menawar diam-diam.',
      },
      insight: {
        why: 'Waktu luang adalah tempat kedekatan sehari-hari — atau gesekan — terbentuk.',
        shared: 'Kalian menginginkan akhir pekan yang serupa, jadi waktu luang mudah sekali direncanakan.',
        different: 'Kalian akan menghabiskan akhir pekan bebas dengan cara berbeda. Itu membuat hidup lebih beragam — asal kedua versi sama-sama mendapat giliran.',
        bridge: 'Bagi akhir pekan dengan sengaja: satu bagian untuk versi menyenangkan masing-masing, dan satu bagian untuk dinikmati bersama.',
      },
      starter: 'Ceritakan hari Minggu santai idealmu, jam demi jam. Di bagian mana versimu dan versinya bertemu?',
    },

    'life-social': {
      prompt: 'Sejauh mana kamu ingin kehidupan sosialmu dan kehidupan sosialnya menyatu?',
      topic: 'Kehidupan sosial bersama',
      options: {
        fully: {
          label: 'Sepenuhnya — teman yang sama, semuanya bersama',
          trait: 'ingin kehidupan sosial kalian sepenuhnya menyatu',
          plural: 'ingin kehidupan sosial kalian sepenuhnya menyatu',
        },
        mostly: {
          label: 'Sebagian besar sama, dengan beberapa pertemanan terpisah',
          trait: 'suka lingkar pertemanan yang sebagian besar sama, dengan beberapa pertemanan sendiri',
          plural: 'suka lingkar pertemanan yang sebagian besar sama, dengan beberapa pertemanan sendiri',
        },
        balanced: {
          label: 'Setengah-setengah — sebagian bersama, banyak juga yang terpisah',
          trait: 'suka keseimbangan antara kehidupan sosial bersama dan terpisah',
          plural: 'suka keseimbangan antara kehidupan sosial bersama dan terpisah',
        },
        separate: {
          label: 'Sebagian besar terpisah — kita masing-masing punya dunia sendiri',
          trait: 'lebih suka masing-masing punya dunia sosialnya sendiri',
          plural: 'lebih suka punya dunia sosial masing-masing',
        },
      },
      insight: {
        why: 'Seberapa jauh kalian menyatukan dunia sosial memengaruhi rasa memiliki sekaligus rasa bebas.',
        shared: 'Bayangan kalian tentang seberapa menyatu kehidupan sosial kalian ternyata sama.',
        different: 'Kalian membayangkan kehidupan sosial yang menyatu dalam porsi berbeda. Yang satu bisa mendengar “terpisah” sebagai jarak; yang lain bisa mendengar “bersama” sebagai kehilangan kebebasan.',
        bridge: 'Pilih satu ritual pertemanan untuk dijalani bersama — misalnya makan malam rutin dengan teman-teman — dan jaga satu hal yang hanya milik masing-masing.',
      },
      starter: 'Siapa temanmu yang paling ingin kamu kenalkan lebih dekat pada dia, dan kenapa?',
    },

    'life-plans': {
      prompt: 'Bagaimana perasaanmu kalau rencana berubah di menit terakhir?',
      topic: 'Rencana & spontanitas',
      options: {
        love: {
          label: 'Aku suka — yang spontan itu seru',
          trait: 'senang dengan perubahan mendadak dan hal-hal spontan',
          plural: 'senang dengan perubahan mendadak dan hal-hal spontan',
        },
        fine: {
          label: 'Santai — aku bisa mengikuti arus',
          trait: 'mudah mengikuti perubahan mendadak',
          plural: 'mudah mengikuti perubahan mendadak',
        },
        prefer: {
          label: 'Aku lebih suka tahu dari awal, tapi tetap bisa menyesuaikan',
          trait: 'lebih suka tahu rencana dari awal, tapi tetap bisa menyesuaikan diri',
          plural: 'lebih suka tahu rencana dari awal, tapi tetap bisa menyesuaikan diri',
        },
        stressed: {
          label: 'Bikin aku nggak tenang — aku suka rencana yang pasti',
          trait: 'merasa stres dengan perubahan mendadak dan suka rencana yang tetap berjalan',
          plural: 'merasa stres dengan perubahan mendadak dan suka rencana yang tetap berjalan',
        },
      },
      insight: {
        why: 'Spontanitas dan keteraturan sama-sama memberi rasa aman — hanya saja untuk orang yang berbeda.',
        shared: 'Tingkat kenyamanan kalian terhadap perubahan mirip, jadi rencana jarang jadi titik sensitif.',
        different: 'Yang satu suka segala sesuatu tetap terbuka, yang lain suka semuanya sudah pasti. Yang spontan bisa merasa terkekang; yang suka merencanakan bisa merasa tidak dihargai.',
        bridge: 'Bedakan rencana “tetap” dan “fleksibel”: yang tetap dijaga, yang fleksibel boleh diubah secara spontan.',
      },
      starter: 'Momen spontan apa bersama dia yang kamu suka — dan perubahan mendadak apa yang pernah membuatmu stres?',
    },

    /* ─────────────────────────── Harapan Masa Depan ───────────────────────── */
    'fut-pace': {
      prompt: 'Seperti apa tempo hubungan yang terasa pas buatmu?',
      topic: 'Tempo komitmen',
      options: {
        fast: {
          label: 'Kalau sudah terasa pas, aku suka melangkah cepat',
          trait: 'suka melangkah cepat kalau sudah terasa pas',
          plural: 'suka melangkah cepat kalau sudah terasa pas',
        },
        steady: {
          label: 'Bertahap — langkah yang jelas, tanpa terburu-buru',
          trait: 'lebih suka melangkah bertahap dengan langkah yang jelas',
          plural: 'lebih suka melangkah bertahap dengan langkah yang jelas',
        },
        slow: {
          label: 'Pelan — aku suka meluangkan waktu sampai benar-benar yakin',
          trait: 'suka meluangkan waktu sampai benar-benar yakin',
          plural: 'suka meluangkan waktu sampai benar-benar yakin',
        },
        present: {
          label: 'Aku tidak berpikir soal tahapan — aku lebih suka menikmati saat ini',
          trait: 'lebih suka menikmati saat ini daripada berpikir soal tahapan',
          plural: 'lebih suka menikmati saat ini daripada berpikir soal tahapan',
        },
      },
      insight: {
        why: 'Perbedaan tempo adalah salah satu sumber kecemasan diam-diam yang paling umum dalam hubungan.',
        shared: 'Kalian nyaman bergerak dengan tempo yang sama — dan itu benar-benar melegakan.',
        different: 'Kalian bergerak dengan kecepatan berbeda. Lebih cepat bukan berarti lebih berkomitmen, dan lebih lambat bukan berarti kurang tertarik — tapi kalau tidak dibicarakan, perbedaan tempo bisa terasa persis seperti itu.',
        bridge: 'Bicarakan langkah berikutnya, bukan tujuan akhirnya: apa yang terasa pas bagi masing-masing dalam tiga sampai enam bulan ke depan?',
      },
      starter: 'Apa arti “melangkah maju” buatmu saat ini — dan apa yang akan terasa terlalu cepat atau terlalu lambat?',
    },

    'fut-money': {
      prompt: 'Kalau kamu dan dia membangun hidup bersama, bagaimana kamu ingin mengatur keuangan?',
      topic: 'Keuangan',
      options: {
        pooled: {
          label: 'Sepenuhnya digabung — satu kantong untuk semuanya',
          trait: 'ingin keuangan sepenuhnya digabung',
          plural: 'ingin keuangan sepenuhnya digabung',
        },
        mostly: {
          label: 'Sebagian besar digabung, dengan sedikit uang pribadi masing-masing',
          trait: 'ingin keuangan sebagian besar digabung, dengan sedikit uang pribadi',
          plural: 'ingin keuangan sebagian besar digabung, dengan sedikit uang pribadi masing-masing',
        },
        split: {
          label: 'Biaya bersama dibagi, sisanya terpisah',
          trait: 'lebih memilih membagi biaya bersama dan memisahkan sisanya',
          plural: 'lebih memilih membagi biaya bersama dan memisahkan sisanya',
        },
        separate: {
          label: 'Sepenuhnya terpisah — kita atur uang masing-masing',
          trait: 'ingin keuangan tetap terpisah sepenuhnya',
          plural: 'ingin keuangan tetap terpisah sepenuhnya',
        },
      },
      insight: {
        why: 'Cara mengatur uang membawa perasaan tentang kepercayaan, keadilan, dan kemandirian.',
        shared: 'Kalian membayangkan cara mengatur uang yang sama — satu hal yang tidak perlu dinegosiasikan lagi.',
        different: 'Kalian akan mengatur uang dengan cara berbeda. Biasanya ini bukan soal uangnya, melainkan apa yang diwakilinya — rasa aman, keadilan, atau kebebasan.',
        bridge: 'Sebelum memilih sistem, masing-masing ceritakan apa arti uang di rumah tempat kalian dibesarkan. Sistemnya jadi lebih mudah dipilih begitu perasaannya dipahami.',
      },
      starter: 'Apa yang kamu pelajari tentang uang semasa kecil — dan apa yang ingin kamu teruskan, atau lakukan secara berbeda?',
    },

    'fut-children': {
      prompt: 'Bagaimana perasaanmu soal punya anak suatu hari nanti?',
      topic: 'Anak',
      options: {
        yes: {
          label: 'Aku ingin punya anak (atau menambah anak)',
          trait: 'ingin punya anak',
          plural: 'ingin punya anak',
        },
        likely: {
          label: 'Sepertinya iya',
          trait: 'kemungkinan besar ingin punya anak',
          plural: 'kemungkinan besar ingin punya anak',
        },
        unsure: {
          label: 'Aku benar-benar belum yakin',
          trait: 'benar-benar belum yakin soal punya anak',
          plural: 'benar-benar belum yakin soal punya anak',
        },
        likelyNot: {
          label: 'Sepertinya tidak',
          trait: 'kemungkinan besar tidak ingin punya anak',
          plural: 'kemungkinan besar tidak ingin punya anak',
        },
        no: {
          label: 'Aku tidak ingin',
          trait: 'tidak ingin punya anak',
          plural: 'tidak ingin punya anak',
        },
      },
      insight: {
        why: 'Hanya sedikit topik yang membentuk masa depan bersama sejelas ini — dan lebih baik bagi kalian berdua untuk membicarakannya sejak awal daripada belakangan.',
        shared: 'Perasaan kalian soal anak sama, dan itu titik kesamaan yang berarti.',
        different: 'Perasaan kalian soal anak berbeda. Itu informasi penting — bukan vonis. Perasaan tentang hal ini bisa sudah mantap atau masih berkembang, dan keduanya layak dibicarakan dengan jujur.',
        bridge: 'Bicarakan ini dengan rasa ingin tahu, bukan tawar-menawar: apa yang ada di balik perasaan masing-masing, dan seberapa yakin kalian masing-masing hari ini?',
      },
      starter: 'Apa yang ada di balik perasaanmu soal punya anak — dan seberapa yakin kamu saat ini?',
    },

    'fut-family': {
      prompt: 'Menurutmu, seberapa besar peran keluarga besar dalam hidup kamu dan dia nantinya?',
      topic: 'Keluarga besar',
      options: {
        central: {
          label: 'Sangat penting — terlibat erat dan sering berkumpul',
          trait: 'melihat keluarga besar sebagai pusat, dengan keterlibatan yang erat',
          plural: 'melihat keluarga besar sebagai pusat, dengan keterlibatan yang erat',
        },
        close: {
          label: 'Dekat, tapi keputusan tetap di tangan kita',
          trait: 'ingin keluarga tetap dekat, tapi keputusan ada di tangan kalian berdua',
          plural: 'ingin keluarga tetap dekat, tapi keputusan ada di tangan kalian sendiri',
        },
        occasional: {
          label: 'Sesekali — saat hari raya dan acara khusus',
          trait: 'lebih suka waktu bersama keluarga terutama saat hari raya dan acara khusus',
          plural: 'lebih suka waktu bersama keluarga terutama saat hari raya dan acara khusus',
        },
        independent: {
          label: 'Seminimal mungkin — kita membangun hidup sendiri',
          trait: 'lebih suka hidup yang sebagian besar mandiri dari keluarga besar',
          plural: 'lebih suka hidup yang sebagian besar mandiri dari keluarga besar',
        },
      },
      insight: {
        why: 'Harapan soal keluarga sering berasal dari cara kalian masing-masing dibesarkan, dan memengaruhi hari raya, keputusan, serta batasan.',
        shared: 'Kalian membayangkan tempat yang sama untuk keluarga dalam kehidupan kalian bersama.',
        different: 'Kalian membayangkan peran keluarga yang berbeda. Ini sering mencerminkan apa yang terasa wajar dan penuh kasih di rumah tempat kalian masing-masing tumbuh.',
        bridge: 'Bicarakan satu momen spesifik — hari raya berikutnya atau acara keluarga besar — dan seperti apa versi idealnya bagi masing-masing.',
      },
      starter: 'Apa satu tradisi keluarga yang ingin kamu pertahankan, dan satu yang rela kamu tinggalkan?',
    },

    /* ───────────────────────── Konflik & Saling Memahami ────────────────────── */
    'con-heat': {
      prompt: 'Di tengah perbedaan pendapat, apa yang cenderung kamu lakukan?',
      topic: 'Saat berselisih',
      options: {
        push: {
          label: 'Terus membicarakannya sampai tuntas',
          trait: 'ingin terus membicarakannya sampai tuntas',
          plural: 'ingin terus membicarakannya sampai tuntas',
        },
        pause: {
          label: 'Mengusulkan jeda, lalu membahasnya lagi',
          trait: 'lebih suka mengambil jeda, lalu kembali membahasnya',
          plural: 'lebih suka mengambil jeda, lalu kembali membahasnya',
        },
        quiet: {
          label: 'Diam dan menarik diri',
          trait: 'cenderung diam dan menarik diri',
          plural: 'cenderung diam dan menarik diri',
        },
        heated: {
          label: 'Terpancing emosi, lalu cepat reda',
          trait: 'bisa terpancing emosi, tapi cepat reda',
          plural: 'bisa terpancing emosi, tapi cepat reda',
        },
      },
      pairs: {
        'push|pause': 'Yang satu ingin segera tuntas, yang lain butuh jeda. Itu bisa berjalan baik, asal jedanya selalu disertai waktu yang jelas untuk kembali membahasnya.',
        'pause|heated': 'Yang mudah terpancing emosi terbantu oleh yang mengusulkan jeda — asal jeda itu ditawarkan dengan lembut, bukan sebagai cara untuk mengabaikan.',
        'push|quiet': 'Yang satu maju untuk menyelesaikan masalah, sementara yang lain diam. Pola “mengejar dan menghindar” ini termasuk pola paling umum dalam hubungan — makin yang satu mendesak, makin yang lain menarik diri.',
        'heated|quiet': 'Yang satu cepat panas, yang lain jadi diam. Intensitas bisa terasa membebani bagi yang diam, dan diam bisa terasa seperti tidak peduli bagi yang lain.',
      },
      blindSpots: [
        'Kalian berdua cenderung menarik diri saat berkonflik. Di permukaan semuanya bisa tampak tenang, sementara masalahnya tetap belum selesai di bawahnya.',
        'Kalian berdua bisa sama-sama terpancing emosi. Tidak ada yang dipendam — tapi dua percikan sekaligus bisa memanas lebih cepat dari yang kalian inginkan.',
      ],
      insight: {
        why: 'Cara kalian bersikap di saat panas lebih penting daripada seberapa sering kalian berbeda pendapat.',
        shared: 'Kalian menghadapi perbedaan pendapat dengan cara yang mirip, jadi masing-masing tahu apa yang bisa diharapkan.',
        different: 'Kalian menghadapi perbedaan pendapat dengan cara berbeda. Itu wajar — yang penting adalah menyiapkan rencana untuk momen-momen itu selagi kalian sama-sama tenang.',
        bridge: 'Sepakati “aturan jeda” sekarang, selagi tenang: siapa pun boleh meminta jeda 20 menit, dan yang memintanya mengusulkan kapan kembali membahasnya.',
      },
      starter: 'Saat bertengkar, apa satu hal yang kamu harap dia lakukan — atau berhenti lakukan?',
    },

    'con-repair': {
      prompt: 'Setelah bertengkar, apa yang membantumu merasa baik-baik saja lagi?',
      topic: 'Berbaikan',
      options: {
        apology: {
          label: 'Permintaan maaf yang tulus, diucapkan langsung',
          trait: 'butuh permintaan maaf yang tulus dan diucapkan langsung',
          plural: 'butuh permintaan maaf yang tulus dan diucapkan langsung',
        },
        talk: {
          label: 'Membicarakan apa yang terjadi',
          trait: 'perlu membicarakan apa yang terjadi',
          plural: 'perlu membicarakan apa yang terjadi',
        },
        gesture: {
          label: 'Pelukan atau perhatian kecil yang hangat',
          trait: 'paling merasa tenang lewat pelukan atau perhatian kecil yang hangat',
          plural: 'paling merasa tenang lewat pelukan atau perhatian kecil yang hangat',
        },
        move: {
          label: 'Melanjutkan saja — tidak perlu dibahas lagi',
          trait: 'lebih suka melanjutkan tanpa membahasnya lagi',
          plural: 'lebih suka melanjutkan tanpa membahasnya lagi',
        },
      },
      pairs: {
        'talk|move': 'Yang satu perlu membicarakannya sampai tuntas; yang lain lebih suka melanjutkan. Yang satu bisa merasa masalahnya disapu ke bawah karpet, yang lain merasa semuanya jadi berlarut-larut.',
      },
      blindSpots: [
        'Kalian berdua lebih suka cepat melanjutkan. Itu membuat suasana tetap ringan, tapi beberapa masalah bisa diam-diam terulang karena tidak pernah benar-benar diurai.',
      ],
      insight: {
        why: 'Berbaikan — cara kalian menemukan jalan kembali — adalah salah satu tanda paling jelas dari hubungan yang tangguh.',
        shared: 'Cara kalian berbaikan setelah konflik sama, jadi proses memulihkannya lebih sederhana.',
        different: 'Kalian butuh hal yang berbeda untuk merasa baik-baik saja lagi. Menawarkan cara berbaikan yang kalian sukai sendiri belum tentu sampai ke yang lain.',
        bridge: 'Setelah perbedaan pendapat berikutnya, masing-masing sampaikan apa yang akan membantu: “Aku ingin dipeluk” atau “Bisa kita bicarakan nanti malam?” Berbaikan paling berhasil saat diminta dan ditawarkan.',
      },
      starter: 'Ingat saat kamu dan dia berhasil berbaikan dengan baik setelah berselisih. Apa yang membantu?',
    },

    'con-sorry': {
      prompt: 'Seberapa mudah bagimu untuk bilang “Aku salah”?',
      topic: 'Mengakui kesalahan',
      options: {
        easy: {
          label: 'Mudah — kalau aku salah, aku bilang',
          trait: 'mudah mengakui kesalahan',
          plural: 'mudah mengakui kesalahan',
        },
        time: {
          label: 'Akhirnya bisa, setelah punya waktu untuk berpikir',
          trait: 'akhirnya bisa mengakui kesalahan setelah punya waktu untuk merenung',
          plural: 'akhirnya bisa mengakui kesalahan setelah punya waktu untuk merenung',
        },
        hard: {
          label: 'Sulit — aku perlu menenangkan diri cukup lama dulu',
          trait: 'merasa sulit mengakui kesalahan, dan perlu menenangkan diri dulu',
          plural: 'merasa sulit mengakui kesalahan, dan perlu menenangkan diri dulu',
        },
        show: {
          label: 'Sangat sulit — aku lebih suka menunjukkannya daripada mengucapkannya',
          trait: 'lebih suka menunjukkan penyesalan daripada mengucapkannya',
          plural: 'lebih suka menunjukkan penyesalan daripada mengucapkannya',
        },
      },
      blindSpots: [
        'Tidak ada di antara kalian yang merasa mudah mengucapkan “Aku salah”. Akibatnya, perselisihan bisa selesai tanpa pernah benar-benar ditutup.',
      ],
      insight: {
        why: 'Kemampuan mengakui kesalahan menjaga luka kecil agar tidak mengeras.',
        shared: 'Cara kalian mengakui kesalahan mirip, jadi permintaan maaf cenderung disambut dengan setara.',
        different: 'Mengucapkan “Aku salah” lebih mudah bagi salah satu dari kalian. Yang merasa lebih sulit mungkin menunjukkannya dengan cara lain — lewat tindakan atau kata-kata yang lebih lembut.',
        bridge: 'Sepakati bahwa “Aku paham maksudmu, dan aku minta maaf sudah menyakitimu” sudah cukup sebagai permintaan maaf. Ini memudahkan siapa pun yang merasa sulit meminta maaf secara penuh.',
      },
      starter: 'Apa yang membuat sebuah permintaan maaf terasa tulus bagimu?',
    },

    'con-matters': {
      prompt: 'Saat kamu dan dia berbeda pendapat tentang hal penting, apa yang paling berarti bagimu?',
      topic: 'Yang dibutuhkan saat berselisih',
      options: {
        understood: {
          label: 'Merasa dipahami, meski kita tidak sepakat',
          trait: 'paling butuh merasa dipahami, meski tanpa kesepakatan',
          plural: 'paling butuh merasa dipahami, meski tanpa kesepakatan',
        },
        fair: {
          label: 'Mencapai kompromi yang adil',
          trait: 'paling mementingkan kompromi yang adil',
          plural: 'paling mementingkan kompromi yang adil',
        },
        right: {
          label: 'Menemukan jawaban yang benar',
          trait: 'paling mementingkan jawaban yang benar',
          plural: 'paling mementingkan jawaban yang benar',
        },
        peace: {
          label: 'Menjaga suasana tetap damai di antara kita',
          trait: 'paling mementingkan suasana yang tetap damai',
          plural: 'paling mementingkan suasana yang tetap damai',
        },
      },
      pairs: {
        'understood|fair': 'Yang satu ingin dipahami, yang lain ingin keadilan — kombinasi yang kuat: dengarkan satu sama lain dulu, lalu cari jalan tengah.',
        'right|understood': 'Yang satu fokus pada jawaban yang benar, yang lain pada rasa dipahami. Logika yang ditawarkan kepada seseorang yang butuh empati bisa terasa seperti diabaikan.',
        'right|peace': 'Yang satu ingin memastikan mana yang benar, yang lain ingin suasana tenang. Yang satu bisa merasa masalahnya dihindari; yang lain bisa merasa terpojok.',
      },
      blindSpots: [
        'Kalian berdua sama-sama mendahulukan kedamaian. Keharmonisan itu anugerah — tapi perbedaan yang penting bisa terlalu lama tak terucap.',
      ],
      insight: {
        why: 'Memahami apa yang sebenarnya diperjuangkan masing-masing mengubah pertengkaran menjadi percakapan.',
        shared: 'Kalian menginginkan hal yang sama dari sebuah perbedaan pendapat, jadi lebih mudah mencapainya bersama.',
        different: 'Kalian menginginkan hal yang berbeda dari sebuah perbedaan pendapat. Sebutkan saat itu juga: “Aku perlu merasa didengar dulu” atau “Bisa kita cari jalan tengah?”',
        bridge: 'Awali perbedaan pendapat yang penting dengan masing-masing menyebutkan apa yang dibutuhkan dari obrolan itu — sebelum masuk ke topiknya.',
      },
      starter: 'Saat kamu dan dia berbeda pendapat, apa yang bisa membuatmu merasa kalian ada di tim yang sama?',
    },
  },
};
