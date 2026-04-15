import { cn } from "@e-com/ui";
import { Star, StarHalf } from "lucide-react";

const MAX_RATING = 5;
const MIN_RATING = 0;

interface StarRatingProps {
  rating: number;
  className?: string;
  iconClassName?: string;
  text?: string;
}

export default function StarRating({ rating, className, iconClassName, text }: StarRatingProps) {
  const safeRating = Math.max(MIN_RATING, Math.min(rating, MAX_RATING));

  return (
    <div className={cn("flex items-center gap-x-1", className)}>
      {Array.from({ length: MAX_RATING }).map((_, index) => {
        const fill = safeRating - index;

        if (fill >= 1) {
          // Full star
          return <Star key={index} size={15} className="fill-orange-400 text-orange-400" />;
        } else if (fill > 0 && fill < 1) {
          // Half star
          return (
            <span key={index} className="relative" style={{ width: 15, height: 15, display: "inline-block" }}>
              <Star size={15} className="absolute inset-0 text-gray-300" />
              <StarHalf size={15} className="absolute inset-0 fill-orange-400 text-orange-400" />
            </span>
          );
        } else {
          // Empty star
          return <Star key={index} size={15} className="text-gray-300" />;
        }
      })}
      {text && <p>{text}</p>}
    </div>
  );
}
