export interface GenreMatch {
  id: string;
  score: number;
  fields: {
    genres: string[];
  };
}