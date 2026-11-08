import type { Page, PageSize, PhotoMap } from '@/lib/album/types';

export interface ProjectSummaryLite {
  id: string;
  title: string;
  status: string;
  pageCount: number;
  updatedAt: string;
  cover: Page;
  size: PageSize;
  photos: PhotoMap;
}
