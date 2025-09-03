import { Star, MapPin, Clock, CheckCircle, Heart } from 'lucide-react';
import { DEFAULT_AVATAR_URL } from '../constants/media';
import { useState, useEffect } from 'react';
import { wishlistAPI } from '../services/api';
import { useApi } from '../hooks/useApi';

const TutorCard = ({ tutor, onSelect, onContact, wishlist = [], onWishlistUpdate }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const { execute } = useApi();

  // Check if tutor is in wishlist on component mount
  useEffect(() => {
    const tutorId = tutor.id || tutor._id;
    const isInWishlist = wishlist.some(item =>
      (item.tutorId === tutorId) || (item.tutor?.id === tutorId) || (item.tutor?._id === tutorId)
    );
    setIsFavorite(isInWishlist);
  }, [tutor, wishlist]);

  const handleWishlistToggle = async () => {
    const tutorId = tutor.id || tutor._id;

    try {
      if (isFavorite) {
        await execute(() => wishlistAPI.removeFromWishlist(tutorId), {
          showSuccessAlert: true,
          successMessage: 'Removed from wishlist'
        });
      } else {
        await execute(() => wishlistAPI.addToWishlist(tutorId), {
          showSuccessAlert: true,
          successMessage: 'Added to wishlist'
        });
      }
      setIsFavorite(!isFavorite);

      // Refresh wishlist data after successful operation
      if (onWishlistUpdate) {
        onWishlistUpdate();
      }
    } catch (error) {
      console.error('Wishlist operation failed:', error);
      // The useApi hook will handle showing error alerts
    }
  };

  console.log('TutorCard received tutor:', tutor);

  return (
    <div className="card p-6 hover:shadow-lg transition-all duration-300 dark:bg-gray-800">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Avatar and basic info */}
        <div className="flex-shrink-0">
          <div className="relative">
            <img
              src={tutor.avatar || tutor.profilePicture || DEFAULT_AVATAR_URL}
              alt={tutor.name}
              className="w-20 h-20 rounded-full object-cover"
            />
            {tutor.verified && (
              <div className="absolute -bottom-1 -right-1">
                <CheckCircle className="h-6 w-6 text-accent-500 bg-white rounded-full" />
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 truncate">{tutor.name || tutor.fullName}</h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                  <span className="font-medium">{tutor.rating || 0}</span>
                  <span className="ml-1">({tutor.reviewCount || 0} reviews)</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="truncate">{tutor.location}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleWishlistToggle}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
              title={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart className={`h-5 w-5 transition-colors ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400 hover:text-red-400'}`} />
            </button>
          </div>

          {/* Subjects */}
          <div className="flex flex-wrap gap-2 mb-3">
            {(tutor.subjects || []).slice(0, 3).map((subject) => (
              <span
                key={subject}
                className="px-2 py-1 bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs rounded-full"
              >
                {subject}
              </span>
            ))}
            {(tutor.subjects || []).length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{(tutor.subjects || []).length - 3} more
              </span>
            )}
          </div>

          {/* Bio */}
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{tutor.bio}</p>

          {/* Bottom info */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex items-center justify-between sm:gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{tutor.experience || 0} yrs exp</span>
              </div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                ${tutor.hourlyRate || 0}/hr
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => onContact(tutor)}
                className="btn btn-secondary text-sm px-3 sm:px-4 py-2 flex-1 sm:flex-none"
              >
                Message
              </button>
              <button
                onClick={() => onSelect(tutor)}
                className="btn btn-primary text-sm px-3 sm:px-4 py-2 flex-1 sm:flex-none"
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorCard;
