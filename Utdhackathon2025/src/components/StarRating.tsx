import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating?: number | string;
  count?: string;
}

export const StarRating = ({ rating, count }: StarRatingProps = {}) => {
  // Parse rating if it's a string like "2.58 out of 5"
  let displayRating: string;
  if (typeof rating === 'number') {
    displayRating = rating.toFixed(2);
  } else if (typeof rating === 'string') {
    displayRating = rating.split(" ")[0];
  } else {
    displayRating = "N/A";
  }
  
  const displayCount = count || "No ratings";

  return (
    <Card className="p-6 animate-fade-in">
      <div className="flex flex-col items-center justify-center h-full">
        <Star className="h-12 w-12 fill-primary text-primary mb-3" />
        <div className="text-5xl font-bold text-foreground leading-none mb-2">
          {displayRating}
        </div>
        <div className="text-sm text-muted-foreground text-center">
          <div className="font-medium">User Rating</div>
          <div className="mt-1">{displayCount}</div>
        </div>
      </div>
    </Card>
  );
};

