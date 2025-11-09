import { useState, useEffect } from 'react';
import api from '../../utils/api';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: '',
    images: []
  });

  useEffect(() => {
    fetchReviews();
    fetchCompletedBookings();
  }, []);

  const fetchReviews = async () => {
    try {
      console.log('📝 Fetching user reviews from backend...');
      const response = await api.get(`/api/user/reviews`);
      console.log('✅ Reviews received:', response.data);
      
      // Transform backend data to match frontend expectations
      const transformedReviews = response.data.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        establishmentName: review.establishment?.name || 'Unknown Establishment',
        establishmentType: review.establishment?.type || 'UNKNOWN',
        visitDate: review.createdAt,
        createdAt: review.createdAt,
        images: review.images || [],
        helpfulCount: review.helpfulCount || 0,
        replyCount: review.replyCount || 0
      }));
      
      setReviews(transformedReviews);
    } catch (error) {
      console.error('❌ Failed to fetch reviews:', error);
      setReviews([]);
    }
  };

  const fetchCompletedBookings = async () => {
    try {
      console.log('📋 Fetching completed bookings for reviews...');
      
      // Get recent bookings and filter for completed ones that might need reviews
      const response = await api.get(`/api/user/recent-bookings`);
      console.log('✅ Bookings received:', response.data);
      
      // Filter for completed bookings (in a real app, you'd check if they already have reviews)
      const completedBookings = response.data
        .filter(booking => booking.status === 'COMPLETED')
        .map(booking => ({
          id: booking.id,
          establishmentName: booking.establishmentName,
          establishmentType: booking.establishmentType,
          establishmentId: booking.establishmentId,
          bookingDate: booking.visitingDate,
          bookingTime: booking.visitingTime
        }));
      
      setCompletedBookings(completedBookings);
    } catch (error) {
      console.error('❌ Failed to fetch completed bookings:', error);
      setCompletedBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      console.log('📝 Submitting review...');
      
      const reviewPayload = {
        bookingId: selectedBooking.id,
        establishmentId: selectedBooking.establishmentId,
        establishmentName: selectedBooking.establishmentName,
        rating: reviewData.rating,
        comment: reviewData.comment
      };
      
      console.log('Review payload:', reviewPayload);

      const response = await api.post(`/api/user/reviews`, reviewPayload);
      console.log('✅ Review submitted successfully:', response.data);

      alert('Review submitted successfully! It will be visible after approval.');

      setShowReviewForm(false);
      setSelectedBooking(null);
      setReviewData({ rating: 5, comment: '', images: [] });
      fetchReviews();
      fetchCompletedBookings();
    } catch (error) {
      console.error('❌ Failed to submit review:', error);
      alert('Failed to submit review: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setReviewData(prev => ({
      ...prev,
      images: [...prev.images, ...files].slice(0, 5) // Max 5 images
    }));
  };

  const removeImage = (index) => {
    setReviewData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const StarRating = ({ rating, onRatingChange, readonly = false }) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !readonly && onRatingChange(star)}
            className={`text-2xl transition-all duration-200 ${
              star <= rating 
                ? 'text-yellow-400 hover:text-yellow-500' 
                : 'text-gray-300 hover:text-gray-400'
            } ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
            disabled={readonly}
          >
            ⭐
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-slate-600">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
            Reviews & Ratings ⭐
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 font-medium max-w-3xl mx-auto">
            Share your experiences and help others make better choices
          </p>
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-slate-500 text-sm sm:text-base">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-pulse"></span>
              {reviews.length} Reviews Written
            </span>
            <span className="hidden sm:inline">•</span>
            <span>{completedBookings.length} Pending Reviews</span>
          </div>
        </div>

        {/* Pending Reviews Section */}
        {completedBookings.length > 0 && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl sm:rounded-3xl shadow-xl border border-amber-200 p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6 flex items-center">
              <span className="mr-2 sm:mr-3">✍️</span>
              Write Reviews for Recent Visits
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {completedBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                      <span className="text-white text-lg sm:text-xl">
                        {booking.establishmentType === 'HOTEL' ? '🏨' :
                         booking.establishmentType === 'HOSPITAL' ? '🏥' : '🛍️'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{booking.establishmentName}</h3>
                      <p className="text-xs sm:text-sm text-slate-600">
                        {new Date(booking.bookingDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-slate-600 text-xs sm:text-sm mb-3 sm:mb-4">
                    How was your experience? Share your thoughts to help others.
                  </p>
                  
                  <button
                    onClick={() => {
                      setSelectedBooking(booking);
                      setShowReviewForm(true);
                    }}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-2 sm:py-3 rounded-xl sm:rounded-2xl font-semibold hover:from-amber-700 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                  >
                    Write Review ✨
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Reviews Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-white/60 p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6 flex items-center">
            <span className="mr-2 sm:mr-3">📝</span>
            My Reviews ({reviews.length})
          </h2>

          {reviews.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-amber-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
                <span className="text-4xl sm:text-6xl">⭐</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">No reviews yet</h3>
              <p className="text-slate-600 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base">
                Complete your bookings and share your experiences to help other users make better choices.
              </p>
              <a href="/user/bookings" className="btn-primary text-sm sm:text-base">
                View My Bookings
              </a>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-slate-50 rounded-2xl p-6 hover:bg-slate-100 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4">
                      <span className="text-white text-xl">
                        {review.establishmentType === 'HOTEL' ? '🏨' :
                         review.establishmentType === 'HOSPITAL' ? '🏥' : '🛍️'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{review.establishmentName}</h3>
                      <p className="text-sm text-slate-600">
                        Visited on {new Date(review.visitDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <StarRating rating={review.rating} readonly />
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <p className="text-slate-700 mb-4 leading-relaxed">{review.comment}</p>

                {review.images && review.images.length > 0 && (
                  <div className="flex space-x-2 overflow-x-auto">
                    {review.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Review image ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center space-x-4 text-sm text-slate-500">
                    <span className="flex items-center">
                      <span className="mr-1">👍</span>
                      {review.helpfulCount || 0} helpful
                    </span>
                    <span className="flex items-center">
                      <span className="mr-1">💬</span>
                      {review.replyCount || 0} replies
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Edit
                    </button>
                    <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>

      {/* Review Form Modal */}
      {showReviewForm && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Write Review</h2>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="text-slate-400 hover:text-slate-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4">
                    <span className="text-white text-xl">
                      {selectedBooking.establishmentType === 'HOTEL' ? '🏨' :
                       selectedBooking.establishmentType === 'HOSPITAL' ? '🏥' : '🛍️'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{selectedBooking.establishmentName}</h3>
                    <p className="text-sm text-slate-600">
                      Visited on {new Date(selectedBooking.bookingDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-6">
                <div>
                  <label className="block text-lg font-semibold text-slate-700 mb-3">
                    Overall Rating
                  </label>
                  <div className="flex items-center space-x-4">
                    <StarRating 
                      rating={reviewData.rating} 
                      onRatingChange={(rating) => setReviewData(prev => ({ ...prev, rating }))}
                    />
                    <span className="text-slate-600 font-medium">
                      {reviewData.rating === 5 ? 'Excellent' :
                       reviewData.rating === 4 ? 'Very Good' :
                       reviewData.rating === 3 ? 'Good' :
                       reviewData.rating === 2 ? 'Fair' : 'Poor'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-semibold text-slate-700 mb-3">
                    Your Review
                  </label>
                  <textarea
                    value={reviewData.comment}
                    onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 resize-none"
                    placeholder="Share your experience... What did you like? What could be improved?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-lg font-semibold text-slate-700 mb-3">
                    Add Photos (Optional)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:border-blue-500 transition-all duration-300"
                  />
                  
                  {reviewData.images.length > 0 && (
                    <div className="flex space-x-2 mt-4 overflow-x-auto">
                      {reviewData.images.map((image, index) => (
                        <div key={index} className="relative flex-shrink-0">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Upload ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-xl"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex space-x-4 pt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-amber-700 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Submit Review ⭐
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="flex-1 bg-gradient-to-r from-slate-500 to-slate-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-slate-600 hover:to-slate-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;