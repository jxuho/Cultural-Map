import React from 'react';
import { FaHeart, FaCommentAlt } from 'react-icons/fa';
import { Place } from '../../types/place';
import StarIcon from '../StarIcon';

interface PlaceCardProps {
  site: Place;
  onClick: (site: Place) => void;
}

const formatCategoryName = (name: string): string => {
  if (!name) return '';
  return name.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const PlaceCard: React.FC<PlaceCardProps> = React.memo(({ site, onClick }) => {
  return (
    <article
      className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col cursor-pointer border border-transparent hover:border-blue-100"
      onClick={() => onClick(site)}
    >
      <h2 className="text-xl font-semibold text-blue-900 mb-2">{site.name}</h2>
      <div className="flex flex-wrap items-center text-sm text-gray-700 mb-3 gap-3">
        {site.averageRating != null && (
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <StarIcon key={i} rating={site.averageRating!} index={i} className="w-4 h-4" displayMode="averageRating" onClick={() => {}} />
            ))}
            <span className="ml-1 font-semibold">{site.averageRating.toFixed(1)}</span>
          </div>
        )}
        <div className="flex items-center">
          <FaCommentAlt className="text-blue-500 mr-1" />
          <span>{site.reviewCount ?? site.reviews?.length ?? 0} Reviews</span>
        </div>
        <div className="flex items-center">
          <FaHeart className="text-red-500 mr-1" />
          <span>{site.favoritesCount || 0} Favorites</span>
        </div>
      </div>
      <div className="mt-auto">
        <p className="text-gray-700 text-sm mb-1"><strong>Category: </strong>{formatCategoryName(site.category)}</p>
        {/* <p className="text-gray-600 text-sm mb-2">{site.address?.fullAddress || 'Address not available'}</p> */}
        {site.description && <p className="text-gray-800 text-sm line-clamp-3 italic">{site.description}</p>}
      </div>
    </article>
  );
});

export default PlaceCard;