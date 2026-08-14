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

-- Seed days
INSERT INTO days (id, date, title, from_location, to_location, distance_km, elevation_m, route_url, accommodation_name, accommodation_url, accommodation_booking_ref, accommodation_notes, dinner_options, dinner_booked, dinner_booking_notes, resupply_notes, start_lat, start_lng, end_lat, end_lng) VALUES
(1, '2026-09-04', 'Brooklyn to Poughkeepsie', 'Brooklyn', 'Poughkeepsie', 163, 740, 'https://www.strava.com/routes/3509759797565925176', 'Airbnb — 57 Montgomery St', 'https://www.airbnb.com.au/rooms/14994000', null, 'Private bathroom. Owner has cats. Bikes OK inside. Holiday weekend — hotels ~2x normal price.', '[{"name": "Elmsford Deli", "notes": "~30 mi in — early lunch/snack + sports drink"}, {"name": "Trailside Cafe", "notes": "~50 mi in — lunch"}, {"name": "Klobacher'\''s Market", "notes": "~70 mi in — pastry/snack + sports drink. Not much between here and Poughkeepsie, stock up on water."}]', false, null, null, 40.6782, -73.9442, 41.7004, -73.9210),
(2, '2026-09-05', 'Poughkeepsie to Hudson', 'Poughkeepsie', 'Hudson', 95.9, 758, 'https://www.strava.com/routes/3509759797582612280', 'Airbnb — 343 State St', 'https://www.airbnb.com/rooms/22437701', null, 'Bikes OK inside the house. Refundable up to Sept 4. Close to town for dinner and a stroll.', '[{"name": "Alex'\''s", "notes": "Opens 8am — breakfast, 4 min ride from the Airbnb"}, {"name": "Dry Fly Coffee", "notes": "~10 mi in — coffee"}, {"name": "Sorry, Charlie", "notes": "~26 mi in — lunch"}, {"name": "Fortune'\''s Ice Cream", "notes": "~40 mi in"}]', false, null, null, 41.7004, -73.9210, 42.2528, -73.7902),
(3, '2026-09-06', 'Hudson to Albany', 'Hudson', 'Albany', 62.5, 379, 'https://www.strava.com/routes/3509774140284331634', 'Booked — name TBD', null, null, '$115.52 charged Aug 28, free cancellation until 3pm Sep 5. Property name not yet noted in the planning doc.', '[{"name": "Goodboybob or Kitty'\''s Market", "notes": "Both open 8am — bacon egg and cheese"}, {"name": "Saisonnier", "notes": "Opens 11:30am, ~14 mi in — cheeky morning beer, short day"}, {"name": "Smash and Dash Burgers", "notes": "~16 mi in — lunch"}, {"name": "Smile'\''s Soft Serve", "notes": "~26 mi in"}]', false, null, 'Shorter day — could explore breweries in Albany.', 42.2528, -73.7902, 42.6526, -73.7562),
(4, '2026-09-07', 'Albany to Fort Edward', 'Albany', 'Fort Edward', 65, 290, 'https://www.strava.com/routes/3509767728755291666', 'Airbnb — 110 Broadway', 'https://www.airbnb.com.au/rooms/1563889805245117698', null, 'Bikes OK inside the house.', '[{"name": "Breakfast", "notes": "Depends on Albany accommodation"}, {"name": "Damn Good Jerky", "notes": "~27 mi in"}, {"name": "Amigos Cantina", "notes": "~39 mi in — lunch"}]', false, null, null, 42.6526, -73.7562, 43.2634, -73.5843),
(5, '2026-09-08', 'Fort Edward to Crown Point', 'Fort Edward', 'Crown Point', 77, 692, 'https://www.strava.com/routes/3509747882131398512', '173 Factoryville Road', null, null, 'Crown Point NY 12928. Check-in from 4pm. No laundry on site, laundromat nearby.', '[]', false, null, null, 43.2634, -73.5843, 43.9453, -73.4334),
(6, '2026-09-09', 'Crown Point to Plattsburgh', 'Crown Point', 'Plattsburgh', 99, 1249, 'https://www.strava.com/routes/3510096533741219614', 'Airbnb — 5436 Peru St', 'https://www.airbnb.com/rooms/579915989815721458', null, 'Bikes can be stored in the storage shed overnight. Biggest elevation day of the trip.', '[]', false, null, null, 43.9453, -73.4334, 44.6995, -73.4529),
(7, '2026-09-10', 'Plattsburgh to Lacolle, QC', 'Plattsburgh', 'Lacolle', 51.7, 137, 'https://www.strava.com/routes/3509760683135987490', 'TBD', 'https://maps.app.goo.gl/K8JJPMLCPH3TbzFw5', null, 'Not booked yet — suggested: Motel Lacolle.', '[]', false, null, 'Crossing the US/Canada border today — bring passports.', 44.6995, -73.4529, 45.0835, -73.3617),
(8, '2026-09-11', 'Lacolle to Montreal', 'Lacolle', 'Montreal', 74, 231, 'https://www.strava.com/routes/3509801905862093652', 'TBD', 'https://hotelbonaventure.com/en/', null, 'Not booked yet — could splurge on the Hotel Bonaventure (heated rooftop pool, 20 min walk to Bota Bota) or an Airbnb.', '[]', false, null, null, 45.0835, -73.3617, 45.5019, -73.5674)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for photos
-- Note: Run this separately in Supabase dashboard Storage section, or via API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true) ON CONFLICT DO NOTHING;

-- Storage policy (run after creating bucket)
-- CREATE POLICY "Public read photos storage" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
-- CREATE POLICY "Service role upload photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos');
-- CREATE POLICY "Service role delete photos" ON storage.objects FOR DELETE USING (bucket_id = 'photos');
