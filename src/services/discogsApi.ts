import axios from 'axios';
import { DiscogsCollectionResponse, Record } from '../types';

const DISCOGS_API_BASE = 'https://api.discogs.com';

// Note: For production, you should use a proper API key
// For now, we'll use the public API with limited rate limits
const api = axios.create({
  baseURL: DISCOGS_API_BASE,
  headers: {
    'User-Agent': 'DiscogsCollectionViewer/1.0',
  },
});

export const fetchUserCollection = async (username: string): Promise<Record[]> => {
  try {
    const allRecords: Record[] = [];
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const response = await api.get<DiscogsCollectionResponse>(
        `/users/${username}/collection/folders/0/releases`,
        {
          params: {
            page,
            per_page: 100, // Maximum allowed by Discogs API
          },
        }
      );

      const records = response.data.releases.map((release) => ({
        id: release.basic_information.id,
        title: release.basic_information.title,
        artist: release.basic_information.artists[0]?.name || 'Unknown Artist',
        year: release.basic_information.year || 0,
        coverImage: release.basic_information.cover_image,
        dateAdded: release.date_added,
        rating: release.rating,
        genres: release.basic_information.genres || [],
        styles: release.basic_information.styles || [],
      }));

      allRecords.push(...records);

      // Check if there are more pages
      hasMorePages = page < response.data.pagination.pages;
      page++;
    }

    return allRecords;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error('User not found. Please check the username and try again.');
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Failed to fetch collection: ${error.message}`);
      }
    }
    throw new Error('An unexpected error occurred while fetching the collection.');
  }
}; 