import { useEffect, useRef, useState, useCallback, useMemo, memo } from "react";
import { PumpData } from "@/data/pumpsData";
import { VerifiedFuelInfo } from "@/services/stationService";

interface MapProps {
  pumps: PumpData[];
  onPumpClick: (pump: PumpData) => void;
  selectedPump: PumpData | null;
  verifiedData?: VerifiedFuelInfo[];
}

const GEOAPIFY_API_KEY = "7467d8bd3f3549bbad82ef9853724c7b";

const Map = memo(({ pumps, onPumpClick, selectedPump, verifiedData = [] }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  
  // Memoize verified data lookup for performance
  const verifiedLookup = useMemo(() => {
    const lookup: Record<number, boolean> = {};
    verifiedData.forEach(v => {
      if (v.fuelTypes.length > 0) {
        lookup[v.legacyId] = true;
      }
    });
    return lookup;
  }, [verifiedData]);

  useEffect(() => {
    const initMap = () => {
      if (mapContainer.current && (window as any).L && !mapRef.current) {
        const L = (window as any).L;
        const newMap = L.map(mapContainer.current).setView([18.5204, 73.8567], 12);
        L.tileLayer(
          `https://maps.geoapify.com/v1/tile/dark-matter/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`,
          {
            attribution: '© <a href="https://www.geoapify.com/">Geoapify</a>',
            maxZoom: 20,
          }
        ).addTo(newMap);
        mapRef.current = newMap;
        setMapReady(true);
      }
    };

    // Check if Leaflet is already loaded
    if ((window as any).L) {
      initMap();
      return;
    }
    
    // Load Leaflet CSS only once
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Load Leaflet JS only once
    if (!document.querySelector('script[src*="leaflet"]')) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = initMap;
      document.body.appendChild(script);
    } else {
      // Script exists but may still be loading, wait for it
      const checkLeaflet = setInterval(() => {
        if ((window as any).L) {
          clearInterval(checkLeaflet);
          initMap();
        }
      }, 100);
      return () => clearInterval(checkLeaflet);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // Memoize icon creator
  const createIcon = useCallback((L: any, isSelected: boolean, isVerified: boolean) => {
    const bgColor = isVerified 
      ? 'hsl(142, 76%, 36%)'
      : isSelected 
        ? 'hsl(210, 15%, 60%)' 
        : 'hsl(200, 20%, 50%)';
    const borderColor = isSelected ? 'hsl(220, 20%, 10%)' : 'hsl(220, 18%, 14%)';
    const glowColor = isVerified 
      ? 'hsl(142, 76%, 36%, 0.6)' 
      : isSelected 
        ? 'hsl(210, 15%, 60%, 0.6)' 
        : 'hsl(200, 20%, 50%, 0.4)';
    
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: 32px;
        height: 32px;
        background: ${bgColor};
        border: 3px solid ${borderColor};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 0 20px ${glowColor};
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 12px;
          height: 12px;
          background: hsl(220, 20%, 10%);
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
        ${isVerified ? `<div style="
          position: absolute;
          top: -8px;
          right: -8px;
          width: 14px;
          height: 14px;
          background: hsl(142, 76%, 36%);
          border: 2px solid white;
          border-radius: 50%;
          transform: rotate(45deg);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="transform: rotate(-45deg); color: white; font-size: 8px; font-weight: bold;">✓</span>
        </div>` : ''}
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !(window as any).L) return;

    const L = (window as any).L;
    const map = mapRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for pumps with coordinates
    const newMarkers = pumps
      .filter(pump => pump.lat && pump.lon)
      .map(pump => {
        const isSelected = selectedPump?.id === pump.id;
        const isVerified = verifiedLookup[pump.id] || false;
        const marker = L.marker([pump.lat!, pump.lon!], {
          icon: createIcon(L, isSelected, isVerified)
        }).addTo(map);

        marker.on('click', () => {
          onPumpClick(pump);
        });

        return marker;
      });

    markersRef.current = newMarkers;
  }, [mapReady, pumps, selectedPump, onPumpClick, verifiedLookup, createIcon]);

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-full z-0"
      style={{ background: 'hsl(220, 15%, 8%)' }}
    />
  );
});

Map.displayName = 'Map';

export default Map;
