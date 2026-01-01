
export interface Place {
  id: string;
  name: string;
  address?: string;
  uri?: string;
  rating?: number;
  userRatingCount?: number;
  phoneNumber?: string;
  website?: string;
  types?: string[];
  thumbnail?: string;
  location?: {
    lat: number;
    lng: number;
  };
  // Google Maps 相關欄位
  google_place_id?: string;
  place_id?: string;  // 別名，與 google_place_id 相同
  formatted_address?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;  // 別名
  lng?: number;  // 別名
  business_status?: string;
  google_rating?: number;
  user_ratings_total?: number;
  photos?: any[];
}

export interface ItineraryItem {
  id: string;
  place: Place;
  startTime: string; // e.g., "10:00"
  duration: number; // minutes
  travelTimeToNext?: string; // e.g., "15 分鐘"
}

export interface DayPlan {
  date: string;
  items: ItineraryItem[];
}

export interface TravelPlan {
  days: DayPlan[];
}
