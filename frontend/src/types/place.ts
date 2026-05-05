export interface Place {
  _id: string;
  name: string;
  description?: string;
  category: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  address?: string;
  website?: string;
  imageUrl?: string;
  openingHours?: string;
  licenseInfo?: string;
  sourceId: string;
  reviews: string[];
  favoritesCount: number;
  originalTags: any;
  proposedBy?: string;
  registeredBy?: string;
  createdAt: string;
  updatedAt: string;

  averageRating?: number;
  reviewCount?: number;
}
