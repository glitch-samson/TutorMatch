import { Calendar, Clock, MessageCircle, Video, Star, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { bookingAPI, tutorAPI, reviewsAPI } from '../services/api';
import { useApi } from '../hooks/useApi';

const MyBookings = ({ currentUser }) => {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [error, setError] = useState(null);
  const { execute, isLoading } = useApi();

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setError(null);
        console.log('Starting fetchBookings for user type:', currentUser?.type);

        let res;
        if (currentUser?.type === 'tutor') {
          console.log('Fetching tutor bookings...');
          res = await execute(() => tutorAPI.getBookings(), { silent: true });
        } else {
          console.log('Fetching student bookings...');
          res = await execute(() => bookingAPI.getBookings(), { silent: true });
        }

        console.log('Fetch bookings response:', res);

        // Check if we got an error response
        if (res?.error) {
          console.error('API returned error:', res.error);
          setError(`Failed to load bookings: ${res.error}`);
          setBookings([]);
          return;
        }

        // Handle different response structures
        const rawBookings = Array.isArray(res?.data) ? res.data :
                           Array.isArray(res) ? res : [];

        console.log('Raw bookings data:', rawBookings);

        // Normalize for UI based on user type
        const mappedBookings = rawBookings.map(b => {
          const scheduledDate = new Date(b.scheduledDate);
          const currentTime = new Date();

          // Keep original status, don't auto-complete
          let status = b.status;

          const isTutor = currentUser?.type === 'tutor';

          if (isTutor) {
            // Tutor view: Show student information
            return {
              id: b._id || b.id,
              tutorId: currentUser.id,
              studentId: b.studentId?._id || b.studentId?.id || b.studentId,
              // Show student info
              otherParty: {
                name: b.studentId?.fullName || 'Unknown Student',
                avatar: b.studentId?.avatar || '/default-avatar.png',
                email: b.studentId?.email || '',
              },
              // Legacy field - shows student for tutors
              tutor: {
                name: b.studentId?.fullName || 'Unknown Student',
                avatar: b.studentId?.avatar || '/default-avatar.png',
              },
              subject: b.subject,
              status: status,
              notes: b.notes,
              rating: b.rating,
              reviewComment: b.reviewComment,
              scheduledDate: b.scheduledDate,
              startTime: b.startTime,
              endTime: b.endTime,
              duration: b.duration,
              totalCost: b.totalAmount || b.hourlyRate || 0,
              createdAt: b.createdAt,
              paymentStatus: b.paymentStatus,
              meetingPreference: b.meetingPreference,
              sessionType: b.sessionType,
            };
          } else {
            // Student view: Show tutor information
            return {
              id: b._id || b.id,
              tutorId: b.tutorId?._id || b.tutorId?.id || b.tutorId,
              studentId: currentUser.id,
              // Show tutor info
              otherParty: {
                name: b.tutorId?.fullName || 'Unknown Tutor',
                avatar: b.tutorId?.avatar || '/default-avatar.png',
                email: b.tutorId?.email || '',
                hourlyRate: b.tutorId?.hourlyRate || b.hourlyRate,
                subjects: b.tutorId?.subjects || [],
              },
              // Legacy field - shows tutor for students
              tutor: {
                name: b.tutorId?.fullName || 'Unknown Tutor',
                avatar: b.tutorId?.avatar || '/default-avatar.png',
              },
              subject: b.subject,
              status: status,
              notes: b.notes,
              rating: b.rating,
              reviewComment: b.reviewComment,
              scheduledDate: b.scheduledDate,
              startTime: b.startTime,
              endTime: b.endTime,
              duration: b.duration,
              totalCost: b.totalAmount || b.hourlyRate || 0,
              createdAt: b.createdAt,
              paymentStatus: b.paymentStatus,
              meetingPreference: b.meetingPreference,
              sessionType: b.sessionType,
            };
          }
        });
        setBookings(mappedBookings);
      } catch (err) {
        console.error('Error loading bookings', err);
        setError(`Failed to load bookings: ${err.message}`);
        setBookings([]);
      }
    };
    fetchBookings();
  }, [execute, currentUser?.type]);

  const filteredBookings = bookings.filter(b => filter === 'all' || b.status === filter);

  // Cancel booking (students only)
  const confirmCancel = async () => {
    try {
      if (currentUser?.type === 'tutor') {
        console.error('Tutors cannot cancel bookings');
        return;
      }

      await execute(() => bookingAPI.cancelBooking(selectedBooking.id), {
        showSuccessAlert: true,
        successMessage: 'Booking cancelled successfully!'
      });

      setBookings(prev =>
        prev.map(b =>
          b.id === selectedBooking.id ? { ...b, status: 'cancelled' } : b
        )
      );
      setShowCancelModal(false);
      setSelectedBooking(null);
    } catch (err) {
      console.error('Cancel failed:', err);
    }
  };

  // Mark booking as completed (tutor only)
const markAsCompleted = async (booking) => {
  try {
    console.log("Booking object:", booking); // 👈 Debug to confirm lesson field

    await execute(() => tutorAPI.markLessonAsCompleted(booking.id), {
      showSuccessAlert: true,
      successMessage: 'Session marked as completed successfully!'
    });

    setBookings(prev =>
      prev.map(b =>
        b.id === booking.id ? { ...b, status: 'completed' } : b
      )
    );
  } catch (err) {
    console.error('Mark as completed failed:', err);
  }
};



  const BookingCard = ({ b }) => {
    const ratingObj = b && typeof b.rating === 'object' && b.rating !== null ? b.rating : null;
    const ratingValue = ratingObj ? ratingObj.rating : (typeof b?.rating === 'number' ? b.rating : null);
    const hasReview = ratingValue !== null && ratingValue !== undefined;

    return (
      <div className="bg-white rounded-2xl shadow-sm border p-5 hover:shadow-md transition">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <img
              src={b.tutor?.avatar || '/default-avatar.png'}
              alt={b.tutor?.name || 'Tutor'}
              className="w-12 h-12 rounded-full border"
            />
            <div>
              <h3 className="font-semibold text-gray-800">
                {b.tutor?.name || (currentUser?.type === 'tutor' ? 'Unknown Student' : 'Unknown Tutor')}
              </h3>
              <p className="text-sm text-gray-500">{b.subject}</p>
            </div>
          </div>
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${
              b.status === 'upcoming'
                ? 'bg-blue-100 text-blue-700'
                : b.status === 'completed'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {b.status}
          </span>
        </div>

        {/* Date / Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            {b.scheduledDate ? new Date(b.scheduledDate).toLocaleDateString() : 'N/A'}
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-gray-400" />
            {b.scheduledDate
              ? new Date(b.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'N/A'}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-5 gap-3">
          <div className="font-semibold text-gray-800">${b.totalCost || 0}</div>
          <div className="flex flex-wrap gap-2">
            {/* Common actions for upcoming/pending bookings */}
            {(b.status === 'upcoming' || b.status === 'pending') && (
              <>
                <button className="btn btn-secondary text-sm flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" /> Message
                </button>
                <button className="btn btn-primary text-sm flex items-center gap-1">
                  <Video className="h-4 w-4" /> Join
                </button>

                {/* Tutor-specific actions */}
                {currentUser?.type === 'tutor' ? (
                  <button
                    onClick={() => markAsCompleted(b)}
                    className="btn bg-green-500 hover:bg-green-600 text-white text-sm flex items-center gap-1"
                  >
                    <Star className="h-4 w-4" /> Mark Complete
                  </button>
                ) : (
                  /* Student-specific actions */
                  <button
                    onClick={() => {
                      setSelectedBooking(b);
                      setShowCancelModal(true);
                    }}
                    className="btn bg-red-500 hover:bg-red-600 text-white text-sm flex items-center gap-1"
                  >
                    <X className="h-4 w-4" /> Cancel
                  </button>
                )}
              </>
            )}

            {/* Student review actions for completed bookings */}
            {b.status === 'completed' && currentUser?.type !== 'tutor' && (
              <>
                {!hasReview ? (
                  <button
                    onClick={() => {
                      setSelectedBooking(b);
                      setShowReviewModal(true);
                    }}
                    className="btn btn-primary text-sm flex items-center gap-1"
                  >
                    <Star className="h-4 w-4" /> Leave Review
                  </button>
                ) : (
                  <div className="flex items-center text-yellow-500 text-sm font-medium">
                    <Star className="h-4 w-4 fill-current mr-1" />
                    {ratingValue}/5 - Reviewed
                  </div>
                )}
              </>
            )}

            {/* For tutors viewing completed bookings */}
            {b.status === 'completed' && currentUser?.type === 'tutor' && (
              <div className="text-green-600 text-sm font-medium flex items-center gap-1">
                <Star className="h-4 w-4" /> Completed
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
        <h1 className="text-2xl font-bold">
          {currentUser?.type === 'tutor' ? 'My Sessions' : 'My Bookings'}
        </h1>
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'upcoming', 'completed', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm capitalize transition ${
                filter === s
                  ? 'bg-brown-600 text-white shadow'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : error ? (
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-600 mb-2">⚠️ Error Loading Bookings</div>
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No {filter} bookings found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map(b => (
            <BookingCard key={b.id} b={b} />
          ))}
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              Cancel {currentUser?.type === 'tutor' ? 'Session' : 'Booking'}
            </h3>
            <p className="mb-6 text-gray-600">
              {currentUser?.type === 'tutor'
                ? `Cancel session with student ${selectedBooking?.tutor?.name}?`
                : `Cancel booking with tutor ${selectedBooking?.tutor?.name}?`
              } This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)} className="btn btn-secondary flex-1">
                Keep
              </button>
              <button onClick={confirmCancel} className="btn bg-red-500 hover:bg-red-600 text-white flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <ReviewModal
          booking={selectedBooking}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedBooking(null);
          }}
          onSubmit={async (rating, comment) => {
            try {
              await execute(() => reviewsAPI.createReview({
                tutorId: selectedBooking.tutorId,
                bookingId: selectedBooking.id,
                rating: rating,
                comment: comment
              }), {
                showSuccessAlert: true,
                successMessage: 'Review submitted successfully!'
              });

              // Update local state to reflect the new rating
              setBookings(prev =>
                prev.map(b =>
                  b.id === selectedBooking.id ? { ...b, rating, reviewComment: comment } : b
                )
              );

              setShowReviewModal(false);
              setSelectedBooking(null);
            } catch (error) {
              console.error('Failed to submit review:', error);
              // Error handling is done by useApi hook
            }
          }}
        />
      )}
    </div>
  );
};

// Review Modal
const ReviewModal = ({ booking, onClose, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(rating, comment);
    } catch (error) {
      console.error('Review submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold dark:text-white">Leave a Review</h3>
          <button onClick={onClose} disabled={isSubmitting}>
            <X className="h-5 w-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <img
            src={booking?.tutor?.avatar || '/default-avatar.png'}
            alt={booking?.tutor?.name}
            className="w-12 h-12 rounded-full border"
          />
          <div>
            <h4 className="font-medium dark:text-white">{booking?.tutor?.name}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">{booking?.subject}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Rating */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  disabled={isSubmitting}
                  className={`transition-colors ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} ${isSubmitting ? 'opacity-50' : 'hover:scale-110'}`}
                >
                  <Star className="h-6 w-6 fill-current" />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </p>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">
              Comment <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows="4"
              disabled={isSubmitting}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm disabled:opacity-50"
              placeholder="Share your experience with this tutor..."
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {comment.length}/500 characters
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-secondary flex-1 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </div>
              ) : (
                'Submit Review'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MyBookings;
