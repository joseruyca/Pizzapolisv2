import React from "react";
import { Star } from "lucide-react";

export default function StarRating({ rating = 0, onRate, size = "md", interactive = false }) {
  const sizeMap = { sm: "w-3.5 h-3.5", md: "w-5 h-5", lg: "w-6 h-6" };
  const iconSize = sizeMap[size] || sizeMap.md;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRate?.(star)}
          className={`${interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}`}
        >
          <Star
            className={`${iconSize} ${
              star <= rating
                ? "fill-red-500 text-red-500"
                : star <= Math.round(rating)
                ? "fill-red-500/50 text-red-500/50"
                : "text-stone-600"
            }`}
          />
        </button>
      ))}
    </div>
  );
}