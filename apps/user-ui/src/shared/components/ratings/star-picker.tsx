"use client";

import { cn } from "@e-com/ui";
import { StarIcon } from "lucide-react";
import { useState } from "react";

interface StarPickerProps {
  value?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export default function StarPicker({ value, onChange, disabled, className }: StarPickerProps) {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className={cn("flex items-center gap-0.5", disabled && "opacity-60 cursor-not-allowed", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          className={cn("p-0.5 hover:scale-110 transition-transform", !disabled && "cursor-pointer")}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
        >
          <StarIcon
            className={cn(
              "size-8 transition-colors",
              (value || hoverValue) >= star ? "fill-[#e07b39] stroke-[#e07b39]" : "fill-gray-100 stroke-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}
