import React from 'react';

interface StarIconProps {
  rating: number;
  index: number;
  className?: string;
  onClick?: (event: React.MouseEvent<SVGSVGElement>) => void;
  displayMode?: 'reviewForm' | 'averageRating';
}

const FULL_STAR_PATH =
  'M10 15.27L16.18 19l-1.64-7.03L20 8.24l-7.19-.61L10 1l-2.81 6.63L0 8.24l5.46 3.73L3.82 19z';
const HALF_STAR_PATH = 'M10 1L7.19 7.63 0 8.24l5.46 3.73L3.82 19l6.18-3.73z';

const StarIcon: React.FC<StarIconProps> = ({
  rating,
  index,
  className = '',
  onClick,
  displayMode = 'reviewForm',
}) => {
  const starValue = index + 1; // The score this star represents (from 1 to 5)

  let isFilled = false;
  let hasHalfStar = false;

  if (displayMode === 'reviewForm') {
    // ReviewForm only fills in integers
    isFilled = starValue <= rating;
  } else if (displayMode === 'averageRating') {
    // SidePanel (average rating) handles 0.5 increments
    let normalizedRating = rating;
    const decimalPart = rating - Math.floor(rating);

    if (decimalPart >= 0.2 && decimalPart < 0.3) {
      normalizedRating = Math.floor(rating); // x.2 is discarded
    } else if (decimalPart >= 0.3 && decimalPart < 0.8) {
      normalizedRating = Math.floor(rating) + 0.5; // x.3 ~ x.7 is half
    } else if (decimalPart >= 0.8) {
      normalizedRating = Math.floor(rating) + 1; // Anything above x.8 is rounded up.
    } else {
      normalizedRating = Math.floor(rating); // x.0, x.1 are discarded
    }

    const floorNormalizedRating = Math.floor(normalizedRating);
    hasHalfStar = normalizedRating - floorNormalizedRating >= 0.5;

    isFilled = starValue <= floorNormalizedRating;

    if (starValue === floorNormalizedRating + 1 && hasHalfStar) {
      isFilled = false; // Currently not filling stars for half stars
    }
  }

  const fillColorClass = isFilled ? 'text-yellow-400' : 'text-gray-300';

  // Conditional rendering for half stars
  const renderHalfStarOverlay =
    displayMode === 'averageRating' &&
    starValue === Math.floor(rating) + 1 &&
    hasHalfStar;

  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
    >
      {/* Basic star (filled or empty) */}
      <path className={fillColorClass} d={FULL_STAR_PATH}></path>

      {/* Half star overlay (average star rating mode only) */}
      {renderHalfStarOverlay && (
        <React.Fragment>
          {/* half filled */}
          <path className="text-yellow-400" d={HALF_STAR_PATH}></path>
          {/* the other half is empty */}
          <path
            className="text-gray-300"
            d="M10 15.27L16.18 19l-1.64-7.03L20 8.24l-7.19-.61L10 1z"
            fill="transparent"
          />
        </React.Fragment>
      )}
    </svg>
  );
};

export default StarIcon;
