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

// Trip overall starts Fri Sep 4 (train to Poughkeepsie — see PRE_RIDE_DAY).
// Riding itself doesn't start until Day 1 on Sat Sep 5.
export const TRIP_START_DATE = '2026-09-04';
export const TRIP_END_DATE = '2026-09-11';
export const TRIP_TIMEZONE = 'America/New_York';

// Fri Sep 4: not a riding day. Train up from NYC, spend the day in
// Poughkeepsie, stay in the same Airbnb the ride departs from the next
// morning. Deliberately lightweight (no diary/photos backing) — it's a
// travel day, not a numbered route day.
export const PRE_RIDE_DAY = {
  date: '2026-09-04',
  label: 'Friday, Sep 4',
  title: 'Travel day — train to Poughkeepsie',
  accommodation_name: 'Airbnb — Poughkeepsie',
  accommodation_notes: '3pm check-in, 11am check-out. No laundry. Same Airbnb the ride departs from Saturday morning.',
};

// Approximate waypoints (city centers) along the route. Not a road-accurate
// polyline — swap in a GPX export from the Strava routes for a precise line.
export const EST_ROUTE_COORDINATES: [number, number][] = [
  [-73.9210, 41.7004], // Poughkeepsie
  [-73.7902, 42.2528], // Hudson
  [-73.7562, 42.6526], // Albany
  [-73.5843, 43.2634], // Fort Edward
  [-73.4334, 43.9453], // Crown Point
  [-73.4529, 44.6995], // Plattsburgh
  [-73.3945, 45.1319], // Napierville area, QC
  [-73.5674, 45.5019], // Montreal, QC
];

export const DAYS_DATA: DayData[] = [
  {
    id: 1,
    date: '2026-09-05',
    title: 'Poughkeepsie to Hudson',
    from_location: 'Poughkeepsie',
    to_location: 'Hudson',
    distance_km: 98.5,
    elevation_m: 768,
    route_url: 'https://www.strava.com/routes/3509759797582612280',
    strava_activity_id: null,
    accommodation_name: 'Airbnb — Hudson',
    accommodation_url: 'https://www.airbnb.com/rooms/22437701',
    accommodation_booking_ref: null,
    accommodation_notes: 'Bikes OK inside the house. 3pm check-in, 12pm check-out. No laundry.',
    dinner_options: [
      { name: "Alex's", notes: '0 km — opens 8am, breakfast, 4 min ride from the Airbnb' },
      { name: 'Dry Fly Coffee', notes: '18 km in — coffee' },
      { name: 'Sorry, Charlie', notes: '43 km in — lunch' },
      { name: "Fortune's Ice Cream", notes: '68 km in' },
      { name: "Otto's Market", notes: '80 km in' },
    ],
    dinner_booked: false,
    dinner_booking_notes: null,
    resupply_notes: null,
    start_lat: 41.7004,
    start_lng: -73.9210,
    end_lat: 42.2528,
    end_lng: -73.7902,
  },
  {
    id: 2,
    date: '2026-09-06',
    title: 'Hudson to Albany',
    from_location: 'Hudson',
    to_location: 'Albany',
    distance_km: 62.6,
    elevation_m: 422,
    route_url: 'https://www.strava.com/routes/3509774140284331634',
    strava_activity_id: null,
    accommodation_name: 'Airbnb — Albany',
    accommodation_url: null,
    accommodation_booking_ref: null,
    accommodation_notes: 'No laundry, laundromat nearby. Free cancellation before 3pm Sep 5. Maybe a quick Uber to Dinosaur BBQ in Troy tonight!',
    dinner_options: [
      { name: "Goodboybob or Kitty's Market", notes: 'Both open 8am — bacon egg and cheese' },
      { name: 'Saisonnier', notes: '21 km in, opens 11:30am — cheeky morning beer, short day' },
      { name: 'Smash and Dash Burgers', notes: '21.5 km in — lunch' },
      { name: "Smile's Soft Serve", notes: '37 km in' },
    ],
    dinner_booked: false,
    dinner_booking_notes: null,
    resupply_notes: 'Shorter day — could explore breweries in Albany.',
    start_lat: 42.2528,
    start_lng: -73.7902,
    end_lat: 42.6526,
    end_lng: -73.7562,
  },
  {
    id: 3,
    date: '2026-09-07',
    title: 'Albany to Fort Edward',
    from_location: 'Albany',
    to_location: 'Fort Edward',
    distance_km: 80.5,
    elevation_m: 262,
    route_url: 'https://www.strava.com/routes/3509767728755291666',
    strava_activity_id: null,
    accommodation_name: 'Airbnb — Fort Edward',
    accommodation_url: 'https://www.airbnb.com.au/rooms/1563889805245117698',
    accommodation_booking_ref: null,
    accommodation_notes: 'Bikes OK inside. 3pm check-in, 11am check-out. No laundry, laundromat nearby. Final $206.81 charged 8/23.',
    dinner_options: [
      { name: 'Iron Gate Cafe', notes: '4 min ride from accom, opens 8:30am — breakfast' },
      { name: 'Undeniable Nutrition', notes: '22 mi in — tea, smoothie' },
      { name: 'Damn Good Jerky', notes: '27 mi in' },
      { name: 'Old Saratoga Eatery', notes: '38.5 mi in — lunch. Kickstart Coffee on the same block for a road coffee.' },
    ],
    dinner_booked: false,
    dinner_booking_notes: null,
    resupply_notes: null,
    start_lat: 42.6526,
    start_lng: -73.7562,
    end_lat: 43.2634,
    end_lng: -73.5843,
  },
  {
    id: 4,
    date: '2026-09-08',
    title: 'Fort Edward to Crown Point',
    from_location: 'Fort Edward',
    to_location: 'Crown Point',
    distance_km: 101.5,
    elevation_m: 1079,
    route_url: 'https://www.strava.com/routes/3509747882131398512',
    strava_activity_id: null,
    accommodation_name: 'Airbnb — Crown Point',
    accommodation_url: null,
    accommodation_booking_ref: null,
    accommodation_notes: 'Check-in from 4pm, check-out 11am. No laundry, laundromat nearby.',
    dinner_options: [
      { name: "Mamma's Cafe", notes: '1 min ride from the Airbnb — breakfast' },
      { name: 'Dunkin (Fort Anne)', notes: '13 mi in — coffee/munchkins' },
      { name: "Joe's Pizza, Bigfoot Wine and Liquor", notes: '26 mi in — lunch' },
      { name: 'Walmart', notes: '~26.5 mi in — groceries for dinner + next morning' },
      { name: "Frenchy's", notes: '2 mi from the Airbnb — ice cream' },
      { name: '5 Eleven Deli Mart', notes: 'Just after Frenchy\'s — snacks/liquids. Message host Adam when you get here.' },
    ],
    dinner_booked: false,
    dinner_booking_notes: null,
    resupply_notes: null,
    start_lat: 43.2634,
    start_lng: -73.5843,
    end_lat: 43.9453,
    end_lng: -73.4334,
  },
  {
    id: 5,
    date: '2026-09-09',
    title: 'Crown Point to Plattsburgh',
    from_location: 'Crown Point',
    to_location: 'Plattsburgh',
    distance_km: 99.6,
    elevation_m: 1262,
    route_url: 'https://www.strava.com/routes/3510096533741219614',
    strava_activity_id: null,
    accommodation_name: 'Airbnb — Plattsburgh',
    accommodation_url: 'https://www.airbnb.com/rooms/579915989815721458',
    accommodation_booking_ref: null,
    accommodation_notes: 'Bikes stored in the shed overnight. Check-in 3pm, check-out 11am. Washer/dryer in unit. Biggest elevation day of the trip.',
    dinner_options: [
      { name: "Stewart's Shops", notes: '10 km in — gas station, drinks/coffee' },
      { name: 'Jambs on Main', notes: '27 km in — coffee. K&D Deli & Grocery next door for early lunch.' },
      { name: 'The Old Dock', notes: '48 km in — lunch or snack' },
      { name: 'Village Roast Coffee', notes: '76 km in, closes 3pm. Stewart\'s Shops also here if closed.' },
      { name: 'The Scoop', notes: '99 km in — ice cream, almost there' },
    ],
    dinner_booked: false,
    dinner_booking_notes: null,
    resupply_notes: null,
    start_lat: 43.9453,
    start_lng: -73.4334,
    end_lat: 44.6995,
    end_lng: -73.4529,
  },
  {
    id: 6,
    date: '2026-09-10',
    title: 'Plattsburgh to Napierville, QC',
    from_location: 'Plattsburgh',
    to_location: 'Napierville',
    distance_km: 67.9,
    elevation_m: 236,
    route_url: 'https://www.strava.com/routes/3528107852197359460',
    strava_activity_id: null,
    accommodation_name: 'Motel — Napierville',
    accommodation_url: null,
    accommodation_booking_ref: null,
    accommodation_notes: 'Collect key at the restaurant when checking in. Bikes OK in room. Not yet paid.',
    dinner_options: [
      { name: "Banjo's Bagels or Campus Corner", notes: '2-3 min ride from the Airbnb — breakfast' },
      { name: 'Frencheez', notes: '39 km in — lunch' },
      { name: 'Depanneur St Bernard', notes: '56 km in — gas station ice cream' },
    ],
    dinner_booked: false,
    dinner_booking_notes: null,
    resupply_notes: 'Crossing the US/Canada border today — bring passports.',
    start_lat: 44.6995,
    start_lng: -73.4529,
    end_lat: 45.1319,
    end_lng: -73.3945,
  },
  {
    id: 7,
    date: '2026-09-11',
    title: 'Napierville to Montreal',
    from_location: 'Napierville',
    to_location: 'Montreal',
    distance_km: 53.9,
    elevation_m: 97,
    route_url: 'https://www.strava.com/routes/3528126665997450560',
    strava_activity_id: null,
    accommodation_name: 'TBD',
    accommodation_url: null,
    accommodation_booking_ref: null,
    accommodation_notes: 'Not booked yet.',
    dinner_options: [
      { name: "Resto-bar Douglas or l'oasis", notes: 'Same spot as last night, or 1 min over' },
      { name: 'Le Duo Choc', notes: '25 km in — pastry' },
      { name: "Cafe le'apostrophe", notes: '30 km in — coffee and pastry' },
    ],
    dinner_booked: false,
    dinner_booking_notes: null,
    resupply_notes: null,
    start_lat: 45.1319,
    start_lng: -73.3945,
    end_lat: 45.5019,
    end_lng: -73.5674,
  },
];

// Post-ride day IDs: 9 = Sat Sep 12, 10 = Sun Sep 13, 11 = Mon Sep 14
export const POST_HIKE_DAYS = [
  { id: 9, date: '2026-09-12', label: 'Saturday, Sep 12', title: 'Montreal - Plans TBD' },
  { id: 10, date: '2026-09-13', label: 'Sunday, Sep 13', title: 'Montreal - Plans TBD' },
  { id: 11, date: '2026-09-14', label: 'Monday, Sep 14', title: 'Rental car pickup 9am, drive back to Brooklyn' },
];

export const TRIP_STATS = {
  totalDistance: 564.5,
  totalElevation: 4126,
  totalDays: 7,
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
