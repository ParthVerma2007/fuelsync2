-- Create fuel_stations table to store pump data
CREATE TABLE public.fuel_stations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  legacy_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_trust_scores table for DVE trust scoring
CREATE TABLE public.user_trust_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anonymous_user_id TEXT NOT NULL UNIQUE,
  trust_score DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  total_reports INTEGER NOT NULL DEFAULT 0,
  correct_reports INTEGER NOT NULL DEFAULT 0,
  incorrect_reports INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create crowdsourced_reports table for raw user submissions
CREATE TABLE public.crowdsourced_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  station_id UUID REFERENCES public.fuel_stations(id) ON DELETE CASCADE NOT NULL,
  anonymous_user_id TEXT NOT NULL,
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('E10', 'E20', 'Pure Petrol', 'Diesel', 'CNG')),
  user_lat DOUBLE PRECISION NOT NULL,
  user_lon DOUBLE PRECISION NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- DVE scoring fields
  trust_score_at_submission DOUBLE PRECISION,
  time_decay_factor DOUBLE PRECISION,
  location_factor DOUBLE PRECISION,
  dve_score DOUBLE PRECISION,
  is_verified BOOLEAN DEFAULT false,
  is_rejected BOOLEAN DEFAULT false,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create verified_fuel_data table for DVE-approved data shown on map
CREATE TABLE public.verified_fuel_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  station_id UUID REFERENCES public.fuel_stations(id) ON DELETE CASCADE NOT NULL,
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('E10', 'E20', 'Pure Petrol', 'Diesel', 'CNG')),
  is_available BOOLEAN NOT NULL DEFAULT true,
  confidence_score DOUBLE PRECISION NOT NULL,
  verified_by_count INTEGER NOT NULL DEFAULT 1,
  last_verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(station_id, fuel_type)
);

-- Enable RLS on all tables
ALTER TABLE public.fuel_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crowdsourced_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verified_fuel_data ENABLE ROW LEVEL SECURITY;

-- Fuel stations are publicly readable
CREATE POLICY "Fuel stations are publicly readable"
ON public.fuel_stations FOR SELECT
USING (true);

-- User trust scores are publicly readable (anonymous system)
CREATE POLICY "Trust scores are publicly readable"
ON public.user_trust_scores FOR SELECT
USING (true);

-- Allow inserting trust scores (anonymous users)
CREATE POLICY "Allow inserting trust scores"
ON public.user_trust_scores FOR INSERT
WITH CHECK (true);

-- Allow updating trust scores
CREATE POLICY "Allow updating trust scores"
ON public.user_trust_scores FOR UPDATE
USING (true);

-- Crowdsourced reports are publicly readable for admin view
CREATE POLICY "Reports are publicly readable"
ON public.crowdsourced_reports FOR SELECT
USING (true);

-- Allow inserting reports (anonymous system)
CREATE POLICY "Allow inserting reports"
ON public.crowdsourced_reports FOR INSERT
WITH CHECK (true);

-- Allow updating reports (for DVE processing)
CREATE POLICY "Allow updating reports"
ON public.crowdsourced_reports FOR UPDATE
USING (true);

-- Verified fuel data is publicly readable
CREATE POLICY "Verified data is publicly readable"
ON public.verified_fuel_data FOR SELECT
USING (true);

-- Allow inserting verified data
CREATE POLICY "Allow inserting verified data"
ON public.verified_fuel_data FOR INSERT
WITH CHECK (true);

-- Allow updating verified data
CREATE POLICY "Allow updating verified data"
ON public.verified_fuel_data FOR UPDATE
USING (true);

-- Allow deleting verified data
CREATE POLICY "Allow deleting verified data"
ON public.verified_fuel_data FOR DELETE
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_fuel_stations_updated_at
BEFORE UPDATE ON public.fuel_stations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_trust_scores_updated_at
BEFORE UPDATE ON public.user_trust_scores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_verified_fuel_data_updated_at
BEFORE UPDATE ON public.verified_fuel_data
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();