import { authed } from '@/lib/server/http';
import { handleSave } from '../route';

/** POST variant of PUT /api/projects/:id — used by navigator.sendBeacon on page exit. */
export const POST = authed<{ id: string }>(async (req, { params, user }) => handleSave(req, user.id, params.id));
