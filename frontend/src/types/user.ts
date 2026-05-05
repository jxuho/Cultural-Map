export interface User {
  _id: string;
  username?: string;
  email: string;
  googleId: string;
  profileImage?: string;
  role: 'user' | 'admin';
  bio?: string;
  favoriteSites: string[];
  createdAt: string;
  updatedAt: string;
}
