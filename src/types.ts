export interface MediaItem {
  id?: number;
  type: 'image' | 'video';
  data: string;
}

export interface ReviewItem {
  id?: number;
  user: string;
  rating: number;
  text: string;
  date: string;
}

export interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  stock: number;
  description: string;
  features: string[];
  image: string;
  category: string;
  rating: number;
  reviews: number;
  media?: MediaItem[];
  reviewsList?: ReviewItem[];
}

export interface User {
  email: string;
  name: string;
  isAdmin: boolean;
}

export interface Wishlist {
  id: number;
  email: string;
  productId: number;
}
