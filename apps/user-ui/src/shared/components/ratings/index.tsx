import { Star, StarHalf } from "lucide-react";
import React from "react";

interface Props {
  ratings: number;
}
export default function Ratings({ ratings }: Props) {
  const stars = [];

  for (let i = 1; i <= 5; i++) {
    if (i < ratings) {
      stars.push(<Star key={`full-${i}`} fill="#eab308" />);
    } else if (i === Math.ceil(ratings) && !Number.isInteger(ratings)) {
      stars.push(<StarHalf key={`half-${i}`} />);
    } else {
      stars.push(<Star key={`empty-${i}`} />);
    }
  }
  return <div className="flex gap-1">{stars}</div>;
}
