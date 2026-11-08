import { redirect } from 'next/navigation';

/** The workspace is one page now: older links (drafts, downloads, share links, billing…) land on it. */
export default function OldWorkspacePage() {
  redirect('/dashboard');
}
