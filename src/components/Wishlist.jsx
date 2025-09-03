import { useState, useEffect } from 'react';
import { DEFAULT_AVATAR_URL } from '../constants/media';
import { Heart, Star, MapPin, Clock, BookOpen, Trash2 } from 'lucide-react';
import { wishlistAPI } from '../services/api';
import { useApi } from '../hooks/useApi';

const Wishlist = ({ onSelectTutor, onContactTutor }) => {
  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { execute } = useApi();

  // Fetch wishlist on component mount
  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setIsLoading(true);
        const res = await execute(() => wishlistAPI.getWishlist(), { silent: true });
        setWishlist(res?.data || []);
      } catch (error) {
        console.error('Failed to fetch wishlist:', error);
        setWishlist([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlist();
  }, [execute]);

  const handleRemoveFromWishlist = async (tutorId) => {
    try {
      await execute(() => wishlistAPI.removeFromWishlist(tutorId), {
        showSuccessAlert: true,
        successMessage: 'Removed from wishlist'
      });

      // Update local state
      setWishlist(prev => prev.filter(item =>
        (item.tutorId !== tutorId) &&
        (item.tutor?.id !== tutorId) &&
        (item.tutor?._id !== tutorId)
      ));
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      // The useApi hook will handle showing error alerts
    }
  };

  const WishlistCard = ({ item }) => {
    const tutor = item.tutor || item;
    const tutorId = item.tutorId || tutor.id || tutor._id;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-6 hover:shadow-md transition-all duration-300">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Avatar and basic info */}
          <div className="flex-shrink-0">
            <img
              src={tutor.avatar || tutor.profilePicture || DEFAULT_AVATAR_URL}
              alt={tutor.name || tutor.fullName}
              className="w-20 h-20 rounded-full object-cover"
            />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {tutor.name || tutor.fullName}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                    <span className="font-medium">{tutor.rating || 0}</span>
                    <span className="ml-1">({tutor.reviewCount || 0} reviews)</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{tutor.location}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleRemoveFromWishlist(tutorId)}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors group"
                title="Remove from wishlist"
              >
                <Trash2 className="h-5 w-5 text-gray-400 group-hover:text-red-500 transition-colors" />
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
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                  +{(tutor.subjects || []).length - 3} more
                </span>
              )}
            </div>

            {/* Bio */}
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
              {tutor.bio}
            </p>

            {/* Bottom info */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{tutor.experience || 0} yrs exp</span>
                </div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  ${tutor.hourlyRate || 0}/hr
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => onContactTutor(tutor)}
                  className="btn btn-secondary text-sm px-4 py-2"
                >
                  Message
                </button>
                <button
                  onClick={() => onSelectTutor(tutor)}
                  className="btn btn-primary text-sm px-4 py-2"
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

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <Heart className="h-6 w-6 text-red-500 mr-2" />
          My Wishlist
        </h1>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <Heart className="h-6 w-6 text-red-500 mr-2" />
          My Wishlist
        </h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {wishlist.length} {wishlist.length === 1 ? 'tutor' : 'tutors'} saved
        </div>
      </div>

      {/* Content */}
      {wishlist.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Your wishlist is empty
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start adding tutors you're interested in to your wishlist
          </p>
          <button 
            onClick={() => window.history.back()}
            className="btn btn-primary"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Browse Tutors
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {wishlist.map((item, index) => (
            <WishlistCard 
              key={item.id || item.tutorId || index} 
              item={item} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
