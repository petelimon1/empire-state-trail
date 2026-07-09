export interface DayData {
  id: number;
  date: string;
  title: string;
  from_location: string;
  to_location: string;
  distance_km: number;
  elevation_m: number;
  route_url: string;
  strava_activity_id?: string | null;
  accommodation_name: string;
  accommodation_url?: string | null;
  accommodation_booking_ref?: string | null;
  accommodation_notes?: string | null;
  dinner_options: DinnerOption[];
  dinner_booked: boolean;
  dinner_booking_notes?: string | null;
  resupply_notes?: string | null;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  created_at?: string;
}

export interface DinnerOption {
  name: string;
  notes?: string;
}

export interface DiaryEntry {
  id: string;
  day_id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  day_id: number;
  storage_path: string;
  public_url: string;
  caption?: string | null;
  sort_order: number;
  created_at: string;
}

export interface Comment {
  id: string;
  day_id: number;
  user_id: string;
  user_name: string;
  user_avatar?: string | null;
  content: string;
  created_at: string;
}

export interface TripStatus {
  id: number;
  current_day: number | null;
  garmin_livetrack_url: string | null;
  updated_at: string;
}

export interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  start_date: string;
  start_date_local?: string;
  type: string;
  sport_type: string;
  athlete: {
    id: number;
  };
}

export type DayStatus = 'upcoming' | 'active' | 'completed';

export interface DayWithStatus extends DayData {
  status: DayStatus;
}
