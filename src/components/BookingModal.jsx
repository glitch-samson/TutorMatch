import { X, Calendar, Clock, CreditCard, BookOpen, MessageSquare } from 'lucide-react';
import { useState } from 'react';

const BookingModal = ({ tutor, onClose, onBookingCreated }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [subject, setSubject] = useState(tutor?.subjects?.[0] || '');
  const [notes, setNotes] = useState('');
  const [meetingPreference, setMeetingPreference] = useState('zoom');
  const [loading, setLoading] = useState(false);

  const availableTimes = [
    '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00'
  ];

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !subject) {
      alert('Please select date, time, and subject.');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('You must be logged in to book.');
      return;
    }

    setLoading(true);

    try {
      const scheduledDate = new Date(`${selectedDate}T${selectedTime}:00Z`).toISOString();

      // Prepare booking data
      const bookingPayload = {
        tutorId: tutor._id || tutor.id,
        subject,
        scheduledDate,
        duration: Number(duration) / 60,
        notes,
        meetingPreference,
      };

      console.log('Booking payload:', bookingPayload);
      console.log('API URL:', `${import.meta.env.VITE_API_BASE_URL}/users/bookings`);

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingPayload),
      });

      console.log('Response status:', res.status, res.statusText);

      // Try to get the response body for better error messages
      let responseData;
      try {
        const responseText = await res.text();
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        responseData = { message: 'Invalid response from server' };
      }

      console.log('Response data:', responseData);

      if (!res.ok) {
        const errorMessage = responseData.message || responseData.error || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(errorMessage);
      }

      if (onBookingCreated) onBookingCreated(responseData);
      onClose();
      alert('Booking created successfully!');
    } catch (error) {
      console.error('Booking error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      alert(`Could not create booking: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm sm:max-w-lg md:max-w-xl p-4 sm:p-6 overflow-y-auto max-h-[90vh]">

        {/* Header */}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Book a Session</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4 sm:space-y-5">

          {/* Subject */}
          <div>
            <label className="block mb-1 font-medium flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              {tutor?.subjects?.map((subj) => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block mb-1 font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block mb-1 font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" /> Time
            </label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Select a time</option>
              {availableTimes.map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block mb-1 font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Duration (minutes)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="60">60 minutes</option>
              <option value="120">120 minutes</option>
            </select>
          </div>

          {/* Meeting Preference */}
          <div>
            <label className="block mb-1 font-medium">Meeting Preference</label>
            <select
              value={meetingPreference}
              onChange={(e) => setMeetingPreference(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="zoom">Zoom</option>
              <option value="in-person">In-Person</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block mb-1 font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              placeholder="Any extra details..."
              className="w-full border rounded-lg px-3 py-2 resize-none"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 sm:py-2 px-4 rounded-lg transition text-sm sm:text-base"
          >
            {loading ? 'Booking...' : 'Confirm Booking'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 py-3 sm:py-2 px-4 rounded-lg transition text-sm sm:text-base"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
