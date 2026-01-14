import { Button } from "@/components/ui/button";
import { Fuel, Droplets, Battery, Wind } from "lucide-react";

export type FuelType = "all" | "e10" | "e20" | "pure" | "diesel" | "cng" | "ev";

interface FuelFilterProps {
  selectedFuel: FuelType;
  onFilterChange: (fuel: FuelType) => void;
}

const FuelFilter = ({ selectedFuel, onFilterChange }: FuelFilterProps) => {
  const filters: { type: FuelType; label: string; icon: React.ReactNode; color: string }[] = [
    { type: "all", label: "All", icon: <Fuel className="w-4 h-4" />, color: "bg-muted" },
    { type: "e10", label: "E10", icon: <Droplets className="w-4 h-4" />, color: "bg-[hsl(var(--e10-color))]" },
    { type: "e20", label: "E20", icon: <Droplets className="w-4 h-4" />, color: "bg-[hsl(var(--e20-color))]" },
    { type: "pure", label: "Pure", icon: <Fuel className="w-4 h-4" />, color: "bg-[hsl(var(--pure-color))]" },
    { type: "diesel", label: "Diesel", icon: <Fuel className="w-4 h-4" />, color: "bg-[hsl(var(--diesel-color))]" },
    { type: "cng", label: "CNG", icon: <Wind className="w-4 h-4" />, color: "bg-[hsl(var(--cng-color))]" },
    { type: "ev", label: "EV", icon: <Battery className="w-4 h-4" />, color: "bg-[hsl(var(--ev-color))]" },
  ];

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-card border-b border-border">
      {filters.map((filter) => (
        <Button
          key={filter.type}
          variant={selectedFuel === filter.type ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(filter.type)}
          className={`flex items-center gap-2 transition-all ${
            selectedFuel === filter.type 
              ? "shadow-[0_0_15px_hsl(var(--primary)/0.5)]" 
              : "hover:scale-105"
          }`}
        >
          {filter.icon}
          <span className="font-mono">{filter.label}</span>
        </Button>
      ))}
    </div>
  );
};

export default FuelFilter;
