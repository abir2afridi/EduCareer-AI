import { Star, StarHalf } from "lucide-react";

interface StarRatingProps {
  rating: number;
  totalReviews?: number;
  size?: number;
  className?: string;
  showReviewCount?: boolean;
}

export function StarRating({ 
  rating, 
  totalReviews, 
  size = 16, 
  className = "",
  showReviewCount = true
}: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} size={size} className="fill-yellow-400 text-yellow-400" />
      ))}
      
      {hasHalfStar && (
        <div className="relative">
          <Star size={size} className="text-gray-200" />
          <div className="absolute left-0 top-0 w-1/2 overflow-hidden">
            <Star size={size} className="fill-yellow-400 text-yellow-400" />
          </div>
        </div>
      )}
      
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} size={size} className="text-gray-200" />
      ))}
      
      {totalReviews !== undefined && showReviewCount && (
        <span className="ml-1 text-sm text-muted-foreground">
          ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
        </span>
      )}
      
      {!totalReviews && showReviewCount && (
        <span className="ml-1 text-sm text-muted-foreground">
          (No reviews yet)
        </span>
      )}
    </div>
  );
}
