export interface Book {
  id: string;
  title: string;
  author: string;
  tags: string[];
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
}
