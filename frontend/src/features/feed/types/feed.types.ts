export interface FeedPost {
  _id: string;
  title: string;
  content: string;
  image: {
    originalUrl?: string;
    mobileUrl: string;
    webUrl: string;
  };
  status: 'PUBLISHED' | 'DRAFT';
  publishedAt?: string;
  createdAt: string;
}
