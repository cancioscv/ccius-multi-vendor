import { cn } from "@e-com/ui";
import { StarHalf, StarIcon } from "lucide-react";

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
          return <StarIcon key={index} className={cn("size-4 fill-black", iconClassName)} />;
        } else if (fill > 0 && fill < 1) {
          // Half star
          return (
            <div key={index} className="relative size-4">
              {/* Full empty star for the outline */}
              <StarIcon className={cn("size-4 absolute inset-0", iconClassName)} />
              {/* Half filled star on top */}
              <StarHalf className={cn("size-4 absolute inset-0 fill-black", iconClassName)} />
            </div>
          );
        } else {
          // Empty star
          return <StarIcon key={index} className={cn("size-4", iconClassName)} />;
        }
      })}
      {text && <p>{text}</p>}
    </div>
  );
}
