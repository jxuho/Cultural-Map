export interface Review {
  _id: string;
  culturalSite: any;
  user:
    | {
        _id: string;
        username: string;
        profileImage?: string;
      }
    | string;
  rating: number;
  comment?: string;
  createdAt: string;
  active: boolean;
}

export interface ReviewInput {
  rating: number;
  comment: string;
}
