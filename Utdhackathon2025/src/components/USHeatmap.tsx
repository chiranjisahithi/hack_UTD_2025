import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { useState } from "react";

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

interface HeatmapProps {
  locations: Array<{
    location: string;
    reports: number;
  }>;
}

// City coordinates mapping
const cityCoordinates: Record<string, [number, number]> = {
  "Cedar Hill, TX": [-96.9561, 32.5885],
  "Chicago, IL": [-87.6298, 41.8781],
  "Seattle, WA": [-122.3321, 47.6062],
  "Minneapolis, MN": [-93.2650, 44.9778],
  "Dallas, TX": [-96.7970, 32.7767],
  "Atlanta, GA": [-84.3880, 33.7490],
  "Houston, TX": [-95.3698, 29.7604],
  "Charlotte, NC": [-80.8431, 35.2271],
  "Sacramento, CA": [-121.4944, 38.5816],
  "Eastpointe, MI": [-82.9555, 42.4684],
  "Los Angeles, CA": [-118.2437, 34.0522],
  "New York City, NY": [-74.0060, 40.7128],
  "Detroit, MI": [-83.0458, 42.3314],
  "Oklahoma City, OK": [-97.5164, 35.4676],
  "Philadelphia, PA": [-75.1652, 39.9526],
  "Orlando, FL": [-81.3792, 28.5383],
  "Pittsburgh, PA": [-79.9959, 40.4406],
  "St. Louis, MO": [-90.1994, 38.6270],
  "Memphis, TN": [-90.0490, 35.1495],
  "Jacksonville, FL": [-81.6557, 30.3322],
  "Austin, TX": [-97.7431, 30.2672],
  "Denver, CO": [-104.9903, 39.7392],
  "Phoenix, AZ": [-112.0740, 33.4484],
  "Indianapolis, IN": [-86.1581, 39.7684],
  "San Antonio, TX": [-98.4936, 29.4241],
  "San Leandro, CA": [-122.1561, 37.7249],
  "Portland, OR": [-122.6765, 45.5152],
  "Kansas City, MO": [-94.5786, 39.0997],
  "Ashburn, VA": [-77.4874, 39.0438],
  "Birmingham, AL": [-86.8025, 33.5207],
};

export const USHeatmap = ({ locations }: HeatmapProps) => {
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  const reportsValues = locations.map((l) => l.reports);
  const maxReports = reportsValues.length > 0 ? Math.max(...reportsValues) : 1;

  const getMarkerSize = (reports: number) => {
    const normalized = reports / maxReports;
    return 3 + normalized * 12;
  };

  const getMarkerOpacity = (reports: number) => {
    const normalized = reports / maxReports;
    return 0.3 + normalized * 0.7;
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="relative">
        <CardTitle>Last 15 Days - Outage Heatmap</CardTitle>
        <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full">
          <div className="relative">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-2 h-2 bg-red-500 rounded-full animate-ping" />
          </div>
          <span className="text-sm font-medium text-white">Live</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative" onMouseMove={handleMouseMove}>
          <ComposableMap projection="geoAlbersUsa" className="w-full h-[500px]">
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="hsl(var(--secondary))"
                    stroke="hsl(var(--border))"
                    strokeWidth={0.5}
                  />
                ))
              }
            </Geographies>
            {locations.map((location) => {
              const coords = cityCoordinates[location.location];
              if (!coords) return null;

              return (
                <Marker key={location.location} coordinates={coords}>
                  <circle
                    r={getMarkerSize(location.reports)}
                    fill="hsl(var(--primary))"
                    opacity={getMarkerOpacity(location.reports)}
                    className="animate-pulse cursor-pointer transition-all hover:stroke-primary hover:stroke-2"
                    onMouseEnter={() => setHoveredLocation(location.location)}
                    onMouseLeave={() => setHoveredLocation(null)}
                  />
                </Marker>
              );
            })}
          </ComposableMap>
          
          {hoveredLocation && (
            <div
              className="fixed z-50 px-3 py-2 text-sm bg-popover text-popover-foreground border rounded-md shadow-md pointer-events-none"
              style={{
                left: `${tooltipPosition.x + 10}px`,
                top: `${tooltipPosition.y + 10}px`,
              }}
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium leading-none">{hoveredLocation}</span>
                <span className="text-xs text-muted-foreground">
                  {locations.find(l => l.location === hoveredLocation)?.reports.toLocaleString()} reports
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary opacity-30" />
            <span>Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-primary opacity-60" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-primary" />
            <span>High</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
