import { supabase } from "@/integrations/supabase/client";
import { pumpsData, PumpData } from "@/data/pumpsData";

// Seed fuel stations from pumpsData if not already in database
export async function seedFuelStations(): Promise<void> {
  const { data: existingStations } = await supabase
    .from("fuel_stations")
    .select("legacy_id")
    .limit(1);

  // If stations already exist, skip seeding
  if (existingStations && existingStations.length > 0) {
    return;
  }

  // Insert all pump data as fuel stations
  const stationsToInsert = pumpsData.map((pump) => ({
    legacy_id: pump.id,
    name: pump.name,
    address: pump.address,
    lat: pump.lat || null,
    lon: pump.lon || null,
  }));

  const { error } = await supabase.from("fuel_stations").insert(stationsToInsert);

  if (error) {
    console.error("Error seeding fuel stations:", error);
  } else {
    console.log("Fuel stations seeded successfully");
  }
}

// Update station coordinates after geocoding
export async function updateStationCoordinates(
  legacyId: number,
  lat: number,
  lon: number
): Promise<void> {
  const { error } = await supabase
    .from("fuel_stations")
    .update({ lat, lon })
    .eq("legacy_id", legacyId);

  if (error) {
    console.error("Error updating station coordinates:", error);
  }
}

// Get verified fuel data for display on map
export interface VerifiedFuelInfo {
  stationId: string;
  legacyId: number;
  fuelTypes: {
    type: string;
    confidence: number;
    verifiedByCount: number;
  }[];
}

export async function getVerifiedFuelData(): Promise<VerifiedFuelInfo[]> {
  const { data, error } = await supabase
    .from("verified_fuel_data")
    .select(`
      station_id,
      fuel_type,
      confidence_score,
      verified_by_count,
      fuel_stations!inner (
        id,
        legacy_id
      )
    `)
    .eq("is_available", true);

  if (error || !data) {
    console.error("Error fetching verified fuel data:", error);
    return [];
  }

  // Group by station
  const stationMap = new Map<string, VerifiedFuelInfo>();

  for (const item of data) {
    const stationId = item.station_id;
    const fuelStations = item.fuel_stations as unknown as { id: string; legacy_id: number };
    
    if (!stationMap.has(stationId)) {
      stationMap.set(stationId, {
        stationId,
        legacyId: fuelStations.legacy_id,
        fuelTypes: [],
      });
    }

    stationMap.get(stationId)!.fuelTypes.push({
      type: item.fuel_type,
      confidence: item.confidence_score,
      verifiedByCount: item.verified_by_count,
    });
  }

  return Array.from(stationMap.values());
}