import { DayData } from '@/types';

// Get date string 'YYYY-MM-DD' in a given timezone using native Intl API
function getDateInTZ(date: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export const TRIP_START_DATE = '2026-09-04';
export const TRIP_END_DATE = '2026-09-11';
export const TRIP_TIMEZONE = 'America/New_York';

// Approximate waypoints (city centers) along the route. Not a road-accurate
// polyline — swap in a GPX export from the Strava routes for a precise line.
export const EST_ROUTE_COORDINATES: [number, number][] = [
  [-73.9442, 40.6782], // Brooklyn
  [-73.9210, 41.7004], // Poughkeepsie
  [-73.7902, 42.2528], // Hudson
  [-73.7562, 42.6526], // Albany
  [-73.5843, 43.2634], // Fort Edward
  [-73.4207, 43.8503], // Ticonderoga
  [-73.4529, 44.6995], // Plattsburgh
  [-73.3617, 45.0835], // Lacolle, QC
  [-73.5674, 45.5019], // Montreal, QC
];

export const DAYS_DATA: DayData[] = [
  {
    id: 1,
    date: '2026-09-04',
    title: 'Brooklyn to Poughkeepsie',
    from_location: 'Brooklyn',
    to_location: 'Poughkeepsie',
    distance_km: 163,
    elevation_m: 740,
    route_url: 'https://www.strava.com/routes/3509759797565925176',
    strava_activity_id: null,
    accommodation_name: 'Airbnb — 57 Montgomery St',
    accommodation_url: 'https://www.airbnb.com.au/rooms/14994000',
    accommodation_booking_ref: null,
    accommodation_notes: 'Private bathroom. Owner has cats. Bikes OK inside. Holiday weekend — hotels ~2x normal price.',
    dinner_options: [],
    dinner_booked: false,
    dinner_booking_notes: null,
    resupply_notes: null,
    start_lat: 40.6782,
    start_lng: -73.9442,
    end_lat: 41.7004,
    end_lng: -73.9210,
  },
  {
    id: 2,
    date: '2026-09-05',
    title: 'Poughkeepsie to Hudson',
    from_location: 'Poughkeepsie',
    to_location: 'Hudson',
    distance_km: 95.9,
    elevation_m: 758,
    route_url: 'https://www.strava.com/routes/3509759797582612280',
    strava_activity_id: null,
    accommodation_name: 'Airbnb — 343 State St',
    accommodation_url: 'https://www.airbnb.com/rooms/22437701',
    accommodation_booking_ref: null,
    accommodation_notes: 'Bikes OK inside the house. Refundable up to Sept 4. Close to town for dinner and a stroll.',
    dinner_options: [],
    dinner_booked: false,
    dinner_booking_notes: null,
    resupply_notes: null,
    start_lat: 41.7004,
    start_lng: -73.9210,
    end_lat: 42.2528,
    end_lng: -73.7902,
  },
  {
    id: 3,
    date: '2026-09-06',
    title: 'Hudson to Albany',
    from_location: 'Hudson',
    to_location: 'Albany',
    distance_km: 62.5,
    elevation_m: 379,
    route_url: 'https://www.strava.com/routes/3509774140284331634',
    strava_activity_id: null,
    accommodation_name: 'TBD',
    accommodation_url: null,
    accommodation_booking_ref: null,
    accommodation_notes: 'Not booked yet. The Argus Hotel (~$200/night) is short walk from downtown / Center Square — cocktail lounge closed Sundays.',
    dinner_options: [],
    dinner_booked: false,
    dinner_booking_notes: null,
    resupply_notes: 'Shorter day — could explore breweries in Albany.',
    start_lat: 42.2528,
    start_lng: -73.7902,
    end_lat: 42.6526,
    end_lng: -73.7562,
  },
  {
    id: 4,
    date: '2026-09-07',
    title: 'Albany to Fort Edward',
    from_location: 'Albany',
    to_location: 'Fort Edward',
    distance_km: 65,
    elevation_m: 290,
    route_url: 'https://www.strava.com/routes/3509767728755291666',
    strava_activity_id: null,
    accommodation_name: 'Airbnb — 110 Broadway',
    accommodation_url: 'https://www.airbnb.com.au/rooms/1563889805245117698',
    accommodation_booking_ref: null,
    accommodation_notes: 'Bikes OK inside the house.',
    dinner_options: [],
    dinner_booked: false,
    dinner_booking_notes: null,
    resupply_notes: null,
    start_lat: 42.6526,
    start_lng: -73.7562,
    end_lat: 43.2634,
    end_lng: -73.5843,
  },
  {
    id: 5,
    date: '2026-09-08',
    title: 'Fort Edward to Ticonderoga',
    from_location: 'Fort Edward',
    to_location: 'Ticonderoga',
    distance_km: 77,
    elevation_m: 692,
    route_url: 'https://www.strava.com/routes/3509747882131398512',
    strava_activity_id: null,
    accommodation_name: 'TBD',
    accommodation_url: 'https://circlecourtmotel.com/',
    accommodation_booking_ref: null,
    accommodation_notes: 'Pending review — Option 1: Circle Court Motel in Ticonderoga (~$109, shorter day, food walkable). Option 2: Crown Point Airbnb (~$150, longer day today but shorter Day 6, deep soak tub, no food nearby). Lodging thins out substantially from here — book soon.',
    dinner_options: [],
    dinner_booked: false,
    dinner_booking_notes: null,
    resupply_notes: null,
    start_lat: 43.2634,
    start_lng: -73.5843,
    end_lat: 43.8503,
    end_lng: -73.4207,
  },
  {
    id: 6,
    date: '2026-09-09',
    title: 'Ticonderoga to Plattsburgh',
    from_location: 'Ticonderoga',
    to_location: 'Plattsburgh',
    distance_km: 116,
    elevation_m: 1414,
    route_url: 'https://www.strava.com/routes/3509759797592059704',
    strava_activity_id: null,
    accommodation_name: 'Airbnb — 5436 Peru St',
    accommodation_url: 'https://www.airbnb.com/rooms/579915989815721458',
    accommodation_booking_ref: null,
    accommodation_notes: 'Bikes can be stored in the storage shed overnight. Biggest elevation day of the trip.',
    dinner_options: [],
    dinner_booked: false,
    dinner_booking_notes: null,
    resupply_notes: null,
    start_lat: 43.8503,
    start_lng: -73.4207,
    end_lat: 44.6995,
    end_lng: -73.4529,
  },
  {
    id: 7,
    date: '2026-09-10',
    title: 'Plattsburgh to Lacolle, QC',
    from_location: 'Plattsburgh',
    to_location: 'Lacolle',
    distance_km: 51.7,
    elevation_m: 137,
    route_url: 'https://www.strava.com/routes/3509760683135987490',
    strava_activity_id: null,
    accommodation_name: 'TBD',
    accommodation_url: 'https://maps.app.goo.gl/K8JJPMLCPH3TbzFw5',
    accommodation_booking_ref: null,
    accommodation_notes: 'Not booked yet — suggested: Motel Lacolle.',
    dinner_options: [],
    dinner_booked: false,
    dinner_booking_notes: null,
    resupply_notes: 'Crossing the US/Canada border today — bring passports.',
    start_lat: 44.6995,
    start_lng: -73.4529,
    end_lat: 45.0835,
    end_lng: -73.3617,
  },
  {
    id: 8,
    date: '2026-09-11',
    title: 'Lacolle to Montreal',
    from_location: 'Lacolle',
    to_location: 'Montreal',
    distance_km: 74,
    elevation_m: 231,
    route_url: 'https://www.strava.com/routes/3509801905862093652',
    strava_activity_id: null,
    accommodation_name: 'TBD',
    accommodation_url: 'https://hotelbonaventure.com/en/',
    accommodation_booking_ref: null,
    accommodation_notes: 'Not booked yet — could splurge on the Hotel Bonaventure (heated rooftop pool, 20 min walk to Bota Bota) or an Airbnb.',
    dinner_options: [],
    dinner_booked: false,
    dinner_booking_notes: null,
    resupply_notes: null,
    start_lat: 45.0835,
    start_lng: -73.3617,
    end_lat: 45.5019,
    end_lng: -73.5674,
  },
];

// Post-ride day IDs: 9 = Sat Sep 12, 10 = Sun Sep 13, 11 = Mon Sep 14
export const POST_HIKE_DAYS = [
  { id: 9, date: '2026-09-12', label: 'Saturday, Sep 12', title: 'Montreal' },
  { id: 10, date: '2026-09-13', label: 'Sunday, Sep 13', title: 'Montreal' },
  { id: 11, date: '2026-09-14', label: 'Monday, Sep 14', title: 'Fly home to NYC' },
];

export const TRIP_STATS = {
  totalDistance: 705.1,
  totalElevation: 4641,
  totalDays: 8,
};

export function getDayStatus(dayDate: string, currentDate: Date, tz: string = TRIP_TIMEZONE): 'upcoming' | 'active' | 'completed' {
  const today = getDateInTZ(currentDate, tz);
  if (today < dayDate) return 'upcoming';
  if (today === dayDate) return 'active';
  return 'completed';
}

export function getTripPhase(currentDate: Date): 'before' | 'during' | 'after' {
  const today = getDateInTZ(currentDate, TRIP_TIMEZONE);
  if (today < TRIP_START_DATE) return 'before';
  if (today > TRIP_END_DATE) return 'after';
  return 'during';
}

export function getDaysUntilTrip(currentDate: Date): number {
  const tripStart = new Date(TRIP_START_DATE + 'T00:00:00Z');
  const today = new Date(getDateInTZ(currentDate, TRIP_TIMEZONE) + 'T00:00:00Z');
  return Math.round((tripStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
