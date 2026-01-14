import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { pumpsData, PumpData } from "@/data/pumpsData";
import { geocodeAllPumps } from "@/services/geocodingService";
import { seedFuelStations, getVerifiedFuelData, VerifiedFuelInfo } from "@/services/stationService";
import Map from "@/components/Map";
import FuelFilter, { FuelType } from "@/components/FuelFilter";
import PumpDetails from "@/components/PumpDetails";
import CompatibilityChecker from "@/components/CompatibilityChecker";
import ReportFuelModal from "@/components/ReportFuelModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Fuel, Loader2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [pumps, setPumps] = useState<PumpData[]>(pumpsData);
  const [filteredPumps, setFilteredPumps] = useState<PumpData[]>(pumpsData);
  const [selectedFuel, setSelectedFuel] = useState<FuelType>("all");
  const [selectedPump, setSelectedPump] = useState<PumpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifiedFuelData, setVerifiedFuelData] = useState<VerifiedFuelInfo[]>([]);
  const { toast } = useToast();

  // Get verified data for selected pump
  const getVerifiedDataForPump = (pump: PumpData | null): VerifiedFuelInfo | null => {
    if (!pump) return null;
    return verifiedFuelData.find(v => v.legacyId === pump.id) || null;
  };

  useEffect(() => {
    const loadPumps = async () => {
      try {
        setLoading(true);
        const geocoded = await geocodeAllPumps(pumpsData);
        setPumps(geocoded);
        setFilteredPumps(geocoded);
        
        // Seed fuel stations to database
        await seedFuelStations();
        
        // Load verified fuel data
        const verified = await getVerifiedFuelData();
        setVerifiedFuelData(verified);
        
        const geocodedCount = geocoded.filter(p => p.lat && p.lon).length;
        toast({
          title: "Pumps Loaded",
          description: `Successfully geocoded ${geocodedCount} out of ${geocoded.length} fuel pumps`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load pump locations",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPumps();
  }, [toast]);

  useEffect(() => {
    if (selectedFuel === "all") {
      setFilteredPumps(pumps);
    } else {
      const filtered = pumps.filter(pump => {
        switch (selectedFuel) {
          case "e10": return pump.e10;
          case "e20": return pump.e20;
          case "pure": return pump.pure;
          case "diesel": return pump.diesel;
          case "cng": return pump.cng;
          case "ev": return pump.evCharging;
          default: return true;
        }
      });
      setFilteredPumps(filtered);
    }
  }, [selectedFuel, pumps]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card border-b-2 border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.2)] z-30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
              <Fuel className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-fuel-glow">FuelSync</h1>
              <p className="text-xs text-muted-foreground font-mono">Smart City Fuel Mapping</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <ReportFuelModal />
            <Link to="/admin">
              <Button variant="outline" size="sm" className="gap-2">
                <Shield className="w-4 h-4" />
                DVE Admin
              </Button>
            </Link>
            <p className="text-sm font-mono text-muted-foreground">
              {loading ? "Loading..." : `${filteredPumps.length} Pumps`}
            </p>
          </div>
        </div>
      </header>

      {/* Filters */}
      <FuelFilter selectedFuel={selectedFuel} onFilterChange={setSelectedFuel} />

      {/* Map Container */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
              <p className="text-lg font-mono text-muted-foreground">Geocoding pump locations...</p>
            </div>
          </div>
        ) : (
          <Map 
            pumps={filteredPumps} 
            onPumpClick={setSelectedPump}
            selectedPump={selectedPump}
            verifiedData={verifiedFuelData}
          />
        )}

        {/* Compatibility Checker - Top Right */}
        <div className="absolute top-4 right-4 w-80 z-40 hidden md:block">
          <CompatibilityChecker />
        </div>

        {/* Pump Details */}
        <PumpDetails 
          pump={selectedPump} 
          onClose={() => setSelectedPump(null)} 
          verifiedData={getVerifiedDataForPump(selectedPump)}
        />
      </div>

      {/* Mobile Compatibility Checker */}
      <div className="md:hidden p-4 bg-card border-t border-border">
        <CompatibilityChecker />
      </div>
    </div>
  );
};

export default Index;
