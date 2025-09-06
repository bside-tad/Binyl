export interface DiscogsRelease {
  id: number;
  basic_information: {
    id: number;
    title: string;
    year: number;
    artists: Array<{
      id: number;
      name: string;
    }>;
    cover_image: string;
    resource_url: string;
    genres: string[];
    styles?: string[];
  };
  date_added: string;
  rating: number;
}

export interface DiscogsCollectionResponse {
  pagination: {
    page: number;
    pages: number;
    per_page: number;
    items: number;
    urls: {
      last: string;
      next: string;
    };
  };
  releases: DiscogsRelease[];
}

export interface Record {
  id: number;
  title: string;
  artist: string;
  year: number;
  coverImage: string;
  dateAdded: string;
  rating: number;
  genres: string[];
  styles?: string[];
}

export interface User {
  username: string;
  collection: Record[];
} 