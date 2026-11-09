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
  /** Paid for and open for editing. */
  unlocked: boolean;
}

/** What a bought album offers right from its card. */
export interface AlbumExtras {
  /** Latest paid order, for receipts and share settings. */
  orderId?: string;
  /** Paid order that includes the PDF. */
  pdfOrderId?: string;
  /** Path of a live share link, e.g. /share/abc. */
  sharePath?: string;
}
