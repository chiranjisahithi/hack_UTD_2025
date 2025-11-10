import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface City {
  city: string;
  href: string;
}

interface AffectedCitiesProps {
  cities: City[];
}

export const AffectedCities = ({ cities }: AffectedCitiesProps) => {
  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground mb-1">Affected Locations</h3>
        <p className="text-sm text-muted-foreground">{cities.length} cities reporting issues</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cities.map((location) => (
          <div 
            key={location.city}
            className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <MapPin className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium text-foreground truncate">{location.city}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};
