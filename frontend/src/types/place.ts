export interface Place {
  _id: string;
  name: string;
  description?: string;
  category: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  address?: Address;
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

export interface Address {
  fullAddress: string;
  street: string;
  houseNumber: string;
  postcode: string;
  district: string;
  city: string;
}

export interface DistrictStat {
  _id: string;
  count: number;
}