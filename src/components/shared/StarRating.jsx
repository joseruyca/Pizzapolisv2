import React from "react";
import { Star } from "lucide-react";

function StarIcon({ fill = 0, className = "" }) {
  const clamped = Math.max(0, Math.min(1, fill));

  return (
    <span className={`relative inline-flex ${className}`}>
      <Star className="h-full w-full text-stone-600" />
      {clamped > 0 ? (
        <span
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${clamped * 100}%` }}
        >
          <Star className="h-full w-full fill-red-500 text-red-500" />
        </span>
      ) : null}
    </span>
  );
}

export default function StarRating({
  rating = 0,
  onRate,
  size = "md",
  interactive = false,
  step = 1,
  showValue = false,
}) {
  const sizeMap = { sm: "h-3.5 w-3.5", md: "h-5 w-5", lg: "h-6 w-6" };
  const iconSize = sizeMap[size] || sizeMap.md;
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = Math.max(0, Math.min(1, safeRating - (star - 1)));

          if (!interactive) {
            return <StarIcon key={star} fill={fill} className={iconSize} />;
          }

          return (
            <div key={star} className={`relative ${iconSize}`}>
              <StarIcon fill={fill} className="h-full w-full" />

              <button
                type="button"
                aria-label={`Rate ${star - 0.5} stars`}
                onClick={() => onRate?.(step === 0.5 ? star - 0.5 : star)}
                className="absolute inset-y-0 left-0 w-1/2"
              />
              <button
                type="button"
                aria-label={`Rate ${star} stars`}
                onClick={() => onRate?.(star)}
                className="absolute inset-y-0 right-0 w-1/2"
              />
            </div>
          );
        })}
      </div>

      {showValue ? <span className="text-sm font-semibold text-stone-300">{safeRating.toFixed(1)}</span> : null}
    </div>
  );
}
