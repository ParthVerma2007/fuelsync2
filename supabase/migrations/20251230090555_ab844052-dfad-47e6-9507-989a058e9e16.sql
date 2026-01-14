-- Add INSERT policy for fuel_stations to allow seeding
CREATE POLICY "Allow inserting fuel stations" 
ON public.fuel_stations 
FOR INSERT 
WITH CHECK (true);