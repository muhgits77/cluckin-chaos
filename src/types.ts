export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: 'mains' | 'sides' | 'drinks';
  image: string;
  tags?: string[];
  chaosLevel?: number; // 1 to 5 flame stars
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export interface ScheduleItem {
  day: string;
  location: string;
  hours: string;
  status: 'active' | 'scheduled' | 'resting';
  coordinates: string;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  text: string;
  rating: number;
  avatar: string;
}

export interface GalleryItem {
  id: string;
  url: string;
  title: string;
  description: string;
}
