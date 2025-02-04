import axios from 'axios';

export async function getTopGenres(genre: string): Promise<string[]> {
  try {
    const response = await axios.post('/api/genres', { genre });
    return response.data.genres;
  } catch (error) {
    console.error('Failed to fetch genres:', error);
    throw error;
  }
}