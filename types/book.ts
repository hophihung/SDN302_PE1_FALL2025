export interface Book {
  id: string;
  title: string;
  author: string;
  tags: string[];
  coverImage: string | null;
  createdAt: Date;
  updatedAt: Date;
}
