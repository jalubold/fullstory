/** First letter of a name, for avatars and diagram labels. */
export const initial = (name: string) => (name.trim()[0] ?? '?').toUpperCase();
