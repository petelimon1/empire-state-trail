-- Empire State Trail 2026 - Supabase Schema
-- Run this in your Supabase SQL Editor

-- Days table (pre-seeded with trip data)
CREATE TABLE IF NOT EXISTS days (
  id INTEGER PRIMARY KEY,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  distance_km DECIMAL(5,1),
  elevation_m INTEGER,
  route_url TEXT,
  strava_activity_id BIGINT,
  accommodation_name TEXT,
  accommodation_url TEXT,
  accommodation_booking_ref TEXT,
  accommodation_notes TEXT,
  dinner_options JSONB DEFAULT '[]',
  dinner_booked BOOLEAN DEFAULT false,
  dinner_booking_notes TEXT,
  resupply_notes TEXT,
  departure_time TEXT,
  arrival_time TEXT,
  start_lat DECIMAL(8,6),
  start_lng DECIMAL(9,6),
  end_lat DECIMAL(8,6),
  end_lng DECIMAL(9,6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diary_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_id INTEGER REFERENCES days(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(day_id)
);

CREATE TABLE IF NOT EXISTS photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_id INTEGER REFERENCES days(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_id INTEGER REFERENCES days(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE days ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read days" ON days FOR SELECT USING (true);
CREATE POLICY "Public read diary" ON diary_entries FOR SELECT USING (true);
CREATE POLICY "Public read photos" ON photos FOR SELECT USING (true);
CREATE POLICY "Public read comments" ON comments FOR SELECT USING (true);

-- Authenticated users can insert comments
CREATE POLICY "Auth users insert comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role handles admin writes (diary, photos)

CREATE TABLE IF NOT EXISTS trip_status (
  id INTEGER PRIMARY KEY DEFAULT 1,
  current_day INTEGER REFERENCES days(id),
  garmin_livetrack_url TEXT,
  current_lat DECIMAL(9,6),
  current_lng DECIMAL(9,6),
  location_updated_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE trip_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read trip status" ON trip_status FOR SELECT USING (true);

-- Seed initial trip_status
INSERT INTO trip_status (id, current_day) VALUES (1, NULL) ON CONFLICT DO NOTHING;

-- Seed/update the 7 riding days (Day 1 = Sat Sep 5, Poughkeepsie — Fri Sep 4
-- is a travel day by train, not a numbered ride day; see PRE_RIDE_DAY in
-- lib/tripData.ts). Uses DO UPDATE so re-running this after a doc change
-- refreshes existing rows instead of silently no-op'ing.
INSERT INTO days (id, date, title, from_location, to_location, distance_km, elevation_m, route_url, accommodation_name, accommodation_url, accommodation_booking_ref, accommodation_notes, dinner_options, dinner_booked, dinner_booking_notes, resupply_notes, start_lat, start_lng, end_lat, end_lng) VALUES
(1, '2026-09-05', 'Poughkeepsie to Hudson', 'Poughkeepsie', 'Hudson', 98.5, 768, 'https://www.strava.com/routes/3509759797582612280', 'Airbnb — Hudson', 'https://www.airbnb.com/rooms/22437701', null, 'Bikes OK inside the house. 3pm check-in, 12pm check-out. No laundry.', '[{"name": "Alex'\''s", "notes": "0 km — opens 8am, breakfast, 4 min ride from the Airbnb"}, {"name": "Dry Fly Coffee", "notes": "18 km in — coffee"}, {"name": "Sorry, Charlie", "notes": "43 km in — lunch"}, {"name": "Fortune'\''s Ice Cream", "notes": "68 km in"}, {"name": "Otto'\''s Market", "notes": "80 km in"}]', false, null, null, 41.7004, -73.9210, 42.2528, -73.7902),
(2, '2026-09-06', 'Hudson to Albany', 'Hudson', 'Albany', 62.6, 422, 'https://www.strava.com/routes/3509774140284331634', 'Booked — Albany', null, null, 'No laundry, laundromat nearby. Free cancellation before 3pm Sep 5. Maybe a quick Uber to Dinosaur BBQ in Troy tonight!', '[{"name": "Goodboybob or Kitty'\''s Market", "notes": "Both open 8am — bacon egg and cheese"}, {"name": "Saisonnier", "notes": "21 km in, opens 11:30am — cheeky morning beer, short day"}, {"name": "Smash and Dash Burgers", "notes": "21.5 km in — lunch"}, {"name": "Smile'\''s Soft Serve", "notes": "37 km in"}]', false, null, 'Shorter day — could explore breweries in Albany.', 42.2528, -73.7902, 42.6526, -73.7562),
(3, '2026-09-07', 'Albany to Fort Edward', 'Albany', 'Fort Edward', 80.5, 262, 'https://www.strava.com/routes/3509767728755291666', 'Airbnb — Fort Edward', 'https://www.airbnb.com.au/rooms/1563889805245117698', null, 'Bikes OK inside. 3pm check-in, 11am check-out. No laundry, laundromat nearby. Final $206.81 charged 8/23.', '[{"name": "Iron Gate Cafe", "notes": "4 min ride from accom, opens 8:30am — breakfast"}, {"name": "Undeniable Nutrition", "notes": "22 mi in — tea, smoothie"}, {"name": "Damn Good Jerky", "notes": "27 mi in"}, {"name": "Old Saratoga Eatery", "notes": "38.5 mi in — lunch. Kickstart Coffee same block for a road coffee."}]', false, null, null, 42.6526, -73.7562, 43.2634, -73.5843),
(4, '2026-09-08', 'Fort Edward to Crown Point', 'Fort Edward', 'Crown Point', 101.5, 1079, 'https://www.strava.com/routes/3509747882131398512', 'Booked — Crown Point', null, null, 'Check-in from 4pm, check-out 11am. No laundry, laundromat nearby.', '[{"name": "Mamma'\''s Cafe", "notes": "1 min ride from the Airbnb — breakfast"}, {"name": "Dunkin (Fort Anne)", "notes": "13 mi in — coffee/munchkins"}, {"name": "Joe'\''s Pizza, Bigfoot Wine and Liquor", "notes": "26 mi in — lunch"}, {"name": "Walmart", "notes": "~26.5 mi in — groceries for dinner + next morning"}, {"name": "Frenchy'\''s", "notes": "2 mi from the Airbnb — ice cream"}, {"name": "5 Eleven Deli Mart", "notes": "Just after Frenchy'\''s — snacks/liquids. Message host Adam."}]', false, null, null, 43.2634, -73.5843, 43.9453, -73.4334),
(5, '2026-09-09', 'Crown Point to Plattsburgh', 'Crown Point', 'Plattsburgh', 99.6, 1262, 'https://www.strava.com/routes/3510096533741219614', 'Airbnb — Plattsburgh', 'https://www.airbnb.com/rooms/579915989815721458', null, 'Bikes stored in shed overnight. Check-in 3pm, check-out 11am. Washer/dryer in unit. Biggest elevation day of the trip.', '[{"name": "Stewart'\''s Shops", "notes": "10 km in — gas station, drinks/coffee"}, {"name": "Jambs on Main", "notes": "27 km in — coffee. K&D Deli & Grocery next door for early lunch."}, {"name": "The Old Dock", "notes": "48 km in — lunch or snack"}, {"name": "Village Roast Coffee", "notes": "76 km in, closes 3pm. Stewart'\''s Shops also here if closed."}, {"name": "The Scoop", "notes": "99 km in — ice cream, almost there"}]', false, null, null, 43.9453, -73.4334, 44.6995, -73.4529),
(6, '2026-09-10', 'Plattsburgh to Napierville, QC', 'Plattsburgh', 'Napierville', 59.9, 216, 'https://www.strava.com/routes/3528107852197359460', 'Motel — Napierville, QC', null, null, 'Collect key at the restaurant when checking in. Bikes OK in room. Not yet paid.', '[{"name": "Banjo'\''s Bagels or Campus Corner", "notes": "2-3 min ride from the Airbnb — breakfast"}, {"name": "Frencheez", "notes": "39 km in — lunch"}, {"name": "Depanneur St Bernard", "notes": "56 km in — gas station ice cream"}]', false, null, 'Crossing the US/Canada border today — bring passports.', 44.6995, -73.4529, 45.1319, -73.3945),
(7, '2026-09-11', 'Napierville to Montreal', 'Napierville', 'Montreal', 53.9, 97, 'https://www.strava.com/routes/3528126665997450560', 'TBD', null, null, 'Not booked yet.', '[{"name": "Resto-bar Douglas or l'\''oasis", "notes": "Same spot as last night, or 1 min over"}, {"name": "Le Duo Choc", "notes": "25 km in — pastry"}, {"name": "Cafe le'\''apostrophe", "notes": "30 km in — coffee and pastry"}]', false, null, null, 45.1319, -73.3945, 45.5019, -73.5674)
ON CONFLICT (id) DO UPDATE SET
  date = EXCLUDED.date, title = EXCLUDED.title, from_location = EXCLUDED.from_location, to_location = EXCLUDED.to_location,
  distance_km = EXCLUDED.distance_km, elevation_m = EXCLUDED.elevation_m, route_url = EXCLUDED.route_url,
  accommodation_name = EXCLUDED.accommodation_name, accommodation_url = EXCLUDED.accommodation_url,
  accommodation_notes = EXCLUDED.accommodation_notes, dinner_options = EXCLUDED.dinner_options,
  resupply_notes = EXCLUDED.resupply_notes, start_lat = EXCLUDED.start_lat, start_lng = EXCLUDED.start_lng,
  end_lat = EXCLUDED.end_lat, end_lng = EXCLUDED.end_lng;

-- Day 8 no longer exists as a ride day (trip is now 7 riding days). Remove it
-- so nothing stale lingers — cascades to any diary/photos/comments on it.
DELETE FROM days WHERE id = 8;

-- Post-ride placeholder rows (9/10/11 = Sat/Sun/Mon Sep 12-14, Montreal).
-- These exist purely so diary_entries/photos can reference them via FK —
-- the site doesn't read from these rows for display, only diary content.
INSERT INTO days (id, date, title, from_location, to_location) VALUES
(9, '2026-09-12', 'Montreal', 'Montreal', 'Montreal'),
(10, '2026-09-13', 'Montreal — rental car pickup', 'Montreal', 'Montreal'),
(11, '2026-09-14', 'Drive home to Brooklyn', 'Montreal', 'Brooklyn')
ON CONFLICT (id) DO UPDATE SET date = EXCLUDED.date, title = EXCLUDED.title;

-- Create storage bucket for photos
-- Note: Run this separately in Supabase dashboard Storage section, or via API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true) ON CONFLICT DO NOTHING;

-- Storage policy (run after creating bucket)
-- CREATE POLICY "Public read photos storage" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
-- CREATE POLICY "Service role upload photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos');
-- CREATE POLICY "Service role delete photos" ON storage.objects FOR DELETE USING (bucket_id = 'photos');
