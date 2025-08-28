import { useState, useEffect } from 'react';
import TutorCard from './TutorCard';
import { wishlistAPI } from '../services/api';
import { useApi } from '../hooks/useApi';

const TutorList = ({ tutors, onSelectTutor, onContactTutor }) => {
  const [wishlist, setWishlist] = useState([]);
  const { execute } = useApi();

  console.log('TutorList received tutors:', tutors);
  console.log('Tutors length:', tutors?.length);

  // Fetch wishlist function
  const fetchWishlist = async () => {
    try {
      const res = await execute(() => wishlistAPI.getWishlist(), { silent: true });
      setWishlist(res?.data || []);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
      setWishlist([]);
    }
  };

  // Fetch wishlist on component mount
  useEffect(() => {
    fetchWishlist();
  }, [execute]);
  
  if (tutors.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🔍</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No tutors found</h3>
        <p className="text-gray-600">Try adjusting your search filters to find more tutors.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
          {tutors.length} tutor{tutors.length !== 1 ? 's' : ''} found
        </h2>
        <select className="input w-full sm:w-auto sm:max-w-xs">
          <option value="rating">Sort by Rating</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="experience">Experience</option>
        </select>
      </div>
      
      <div className="space-y-4">
        {tutors.map((tutor, index) => (
          <TutorCard
            key={tutor.id || tutor._id || `tutor-${index}`}
            tutor={tutor}
            onSelect={onSelectTutor}
            onContact={onContactTutor}
            wishlist={wishlist}
            onWishlistUpdate={fetchWishlist}
          />
        ))}
      </div>
    </div>
  );
};

export default TutorList;
