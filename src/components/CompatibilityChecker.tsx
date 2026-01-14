import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, AlertTriangle, CheckCircle2 } from "lucide-react";

const CompatibilityChecker = () => {
  const [rcNumber, setRcNumber] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const checkCompatibility = () => {
    if (!rcNumber.trim()) return;
    
    // Mock DVE logic as per requirements
    const highRiskVehicles = ["MH12JC2653", "MH14GT9678"];
    if (highRiskVehicles.includes(rcNumber.toUpperCase())) {
      setResult("High Risk: Seek E10");
    } else {
      setResult("Low Risk: E20 Compliant");
    }
  };

  const isHighRisk = result?.includes("High Risk");

  return (
    <Card className="p-4 bg-card/95 backdrop-blur-md border border-border space-y-4">
      <div className="flex items-center gap-2">
        <Car className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg">Vehicle Compatibility</h3>
      </div>

      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter RC Number (e.g., MH12A)"
          value={rcNumber}
          onChange={(e) => setRcNumber(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && checkCompatibility()}
          className="font-mono bg-background/50 border-border"
        />
        <Button 
          onClick={checkCompatibility}
          className="shrink-0 shadow-[0_0_15px_hsl(var(--primary)/0.4)]"
        >
          Check
        </Button>
      </div>

      {result && (
        <div className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
          isHighRisk 
            ? "bg-destructive/10 border-destructive/50" 
            : "bg-secondary/10 border-secondary/50"
        }`}>
          {isHighRisk ? (
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
          )}
          <div className="flex-1">
            <p className="text-sm font-mono text-muted-foreground">RC: {rcNumber}</p>
            <Badge 
              variant={isHighRisk ? "destructive" : "secondary"}
              className="mt-1 font-mono"
            >
              {result}
            </Badge>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CompatibilityChecker;
