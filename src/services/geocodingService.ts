import { PumpData } from "@/data/pumpsData";

const GEOAPIFY_API_KEY = "7467d8bd3f3549bbad82ef9853724c7b";

export interface GeocodedLocation {
  lat: number;
  lon: number;
}

export const geocodeAddress = async (address: string): Promise<GeocodedLocation | null> => {
  try {
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${GEOAPIFY_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [lon, lat] = data.features[0].geometry.coordinates;
      return { lat, lon };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

export const geocodeAllPumps = async (pumps: PumpData[]): Promise<PumpData[]> => {
  const geocodedPumps = await Promise.all(
    pumps.map(async (pump) => {
      if (pump.lat && pump.lon) {
        return pump;
      }
      
      const location = await geocodeAddress(pump.address);
      
      if (location) {
        return {
          ...pump,
          lat: location.lat,
          lon: location.lon
        };
      }
      
      return pump;
    })
  );
  
  return geocodedPumps;
};
