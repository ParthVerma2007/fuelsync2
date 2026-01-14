import { PumpData } from "@/data/pumpsData";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Fuel, Droplets, Battery, Wind, Star, MapPin, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerifiedFuelInfo } from "@/services/stationService";

interface PumpDetailsProps {
  pump: PumpData | null;
  onClose: () => void;
  verifiedData?: VerifiedFuelInfo | null;
}

const PumpDetails = ({ pump, onClose, verifiedData }: PumpDetailsProps) => {
  if (!pump) return null;

  // Check if a fuel type is verified by crowdsourcing
  const getVerifiedInfo = (fuelType: string) => {
    return verifiedData?.fuelTypes.find(f => f.type.toLowerCase() === fuelType.toLowerCase());
  };

  const fuelTypes = [
    { available: pump.e10, label: "E10", key: "e10", color: "bg-[hsl(var(--e10-color))]", icon: <Droplets className="w-3 h-3" /> },
    { available: pump.e20, label: "E20", key: "e20", color: "bg-[hsl(var(--e20-color))]", icon: <Droplets className="w-3 h-3" /> },
    { available: pump.pure, label: "Pure", key: "pure", color: "bg-[hsl(var(--pure-color))]", icon: <Fuel className="w-3 h-3" /> },
    { available: pump.diesel, label: "Diesel", key: "diesel", color: "bg-[hsl(var(--diesel-color))]", icon: <Fuel className="w-3 h-3" /> },
    { available: pump.cng, label: "CNG", key: "cng", color: "bg-[hsl(var(--cng-color))]", icon: <Wind className="w-3 h-3" /> },
    { available: pump.evCharging, label: "EV", key: "ev", color: "bg-[hsl(var(--ev-color))]", icon: <Battery className="w-3 h-3" /> },
  ];

  return (
    <Card className="absolute bottom-4 left-4 right-4 md:right-auto md:w-96 z-40 bg-card/95 backdrop-blur-md border-2 border-primary/30 shadow-[0_0_30px_hsl(var(--primary)/0.3)] animate-in slide-in-from-bottom duration-300">
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-fuel-glow mb-1">{pump.name}</h3>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="line-clamp-2">{pump.address}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0 hover:bg-destructive/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div>
          <p className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">Available Fuels</p>
          <div className="flex flex-wrap gap-2">
            {fuelTypes
              .filter(fuel => fuel.available)
              .map((fuel) => {
                const verified = getVerifiedInfo(fuel.key);
                const isVerified = !!verified;
                return (
                  <div key={fuel.label} className="flex flex-col items-center gap-1">
                    <Badge 
                      className={`${isVerified ? 'bg-green-600 hover:bg-green-700' : fuel.color} text-background font-mono flex items-center gap-1.5 px-2.5 py-1`}
                    >
                      {fuel.icon}
                      {fuel.label}
                      {isVerified && <ShieldCheck className="w-3 h-3 ml-0.5" />}
                    </Badge>
                    {verified && (
                      <div className="flex items-center gap-1 text-[10px] text-green-500 font-mono">
                        <Users className="w-3 h-3" />
                        <span>{verified.verifiedByCount} verified</span>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Verified by DVE section */}
        {verifiedData && verifiedData.fuelTypes.length > 0 && (
          <div className="pt-2 border-t border-green-500/30">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <p className="text-xs font-mono text-green-500 uppercase tracking-wider">DVE Verified</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {verifiedData.fuelTypes.map((fuel) => (
                <Badge 
                  key={fuel.type} 
                  className="font-mono text-xs bg-green-600/20 border-green-500/50 text-green-400"
                >
                  {fuel.type} • {Math.round(fuel.confidence * 100)}% • {fuel.verifiedByCount} users
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Service</p>
              <p className="font-bold text-foreground">{pump.servicesRating}/5</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-secondary" />
            <div>
              <p className="text-xs text-muted-foreground">Staff</p>
              <p className="font-bold text-foreground">{pump.staffRating}/5</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {pump.washroom && <Badge variant="outline" className="font-mono">Washroom</Badge>}
          {pump.airPuncture && <Badge variant="outline" className="font-mono">Air/Puncture</Badge>}
        </div>
      </div>
    </Card>
  );
};

export default PumpDetails;
