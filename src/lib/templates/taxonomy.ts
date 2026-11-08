export type CategoryId =
  | 'wedding'
  | 'travel'
  | 'family'
  | 'couple'
  | 'baby'
  | 'birthday'
  | 'graduation'
  | 'anniversary'
  | 'year-in-review'
  | 'lifestyle'
  | 'everyday';

export type StyleId = 'minimalist' | 'editorial' | 'modern' | 'vintage' | 'romantic' | 'scrapbook' | 'luxury' | 'playful';

export interface Category {
  id: CategoryId;
  label: string;
  tagline: string;
  description: string;
}

export const CATEGORIES: Category[] = [
  { id: 'wedding', label: 'Wedding', tagline: 'The day, from first look to last dance.', description: 'Timeless wedding albums for vows, portraits, details and the celebration that followed.' },
  { id: 'travel', label: 'Travel', tagline: 'Places that changed you.', description: 'Journals, road trips and city breaks — designed around landscapes, streets and the people you went with.' },
  { id: 'family', label: 'Family', tagline: 'Ordinary days, extraordinary people.', description: 'Albums for the family archive: holidays, weekends at home and the years that go by too quickly.' },
  { id: 'couple', label: 'Couple', tagline: 'Your story, so far.', description: 'For anniversaries, engagements and the everyday romance of two people building a life.' },
  { id: 'baby', label: 'Baby & Kids', tagline: 'Tiny hands, big firsts.', description: 'First-year books and childhood albums to keep every milestone and every small, sweet moment.' },
  { id: 'birthday', label: 'Birthday', tagline: 'Another year worth keeping.', description: 'Celebrate milestone birthdays with friends, cake, candles and the stories behind them.' },
  { id: 'graduation', label: 'Graduation', tagline: 'The years that shaped you.', description: 'Commemorate the friendships, late nights and proud moments of school and university.' },
  { id: 'anniversary', label: 'Anniversary', tagline: 'Love, measured in years.', description: 'Elegant albums for marking years together — ideal as a gift or a shared keepsake.' },
  { id: 'year-in-review', label: 'Year in Review', tagline: 'Twelve months, one beautiful book.', description: 'Month-by-month layouts to gather a whole year of photos into a single, effortless album.' },
  { id: 'lifestyle', label: 'Lifestyle', tagline: 'The beauty of slow days.', description: 'Calm, editorial albums for home, rituals, food and the spaces you love.' },
  { id: 'everyday', label: 'Everyday Memories', tagline: 'The little things are the big things.', description: 'Collect the walks, the pets, the coffee runs and the small joys that make up a life.' },
];

export const STYLES: Array<{ id: StyleId; label: string; description: string }> = [
  { id: 'minimalist', label: 'Minimalist', description: 'Generous white space and quiet typography.' },
  { id: 'editorial', label: 'Editorial', description: 'Magazine-inspired layouts with strong type.' },
  { id: 'modern', label: 'Modern', description: 'Clean grids and confident sans-serifs.' },
  { id: 'vintage', label: 'Vintage', description: 'Warm paper tones and classic serifs.' },
  { id: 'romantic', label: 'Romantic', description: 'Soft colour, script accents and delicate details.' },
  { id: 'scrapbook', label: 'Scrapbook', description: 'Tilted prints, tape and handwritten notes.' },
  { id: 'luxury', label: 'Luxury', description: 'Dark, refined palettes with gilded accents.' },
  { id: 'playful', label: 'Playful', description: 'Bright colour, rounded shapes and joyful details.' },
];

export const categoryById = (id: string) => CATEGORIES.find((c) => c.id === id);
export const styleById = (id: string) => STYLES.find((s) => s.id === id);
