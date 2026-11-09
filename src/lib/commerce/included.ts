/** What every album includes. One list, used wherever we sell, so the promise is always the same. */
export const INCLUDED = [
  { id: 'pages', title: 'As many pages as you like', text: 'Add pages any time, from 25+ layouts.' },
  { id: 'music', title: 'Your music', text: 'Add a song that plays as the album opens.' },
  { id: 'motion', title: 'Page-turn animations', text: 'Real page turns, or a style of your choosing.' },
  { id: 'share', title: 'Share link + QR code', text: 'A private link to send, and a QR code to print.' },
  { id: 'pdf', title: 'High-resolution PDF', text: 'Download it to keep or print anywhere.' },
  { id: 'edit', title: 'Edit any time', text: 'Your link and PDF always show the latest version.' },
] as const;
