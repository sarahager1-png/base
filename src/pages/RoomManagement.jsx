import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Home, Plus, X, Trash2, Edit2, Calendar, Clock } from 'lucide-react';

export default function RoomManagementPage() {
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  const [roomForm, setRoomForm] = useState({
    room_number: '',
    room_type: 'classroom',
    capacity: 30,
    building: '',
    floor: 1,
    equipment: [],
  });

  const [bookingForm, setBookingForm] = useState({
    booking_type: 'recurring',
    day_of_week: 0,
    hour_number: 1,
    specific_date: '',
    subject: '',
    class_name: '',
    notes: '',
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => base44.entities.Room.list(),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['roomBookings'],
    queryFn: () => base44.entities.RoomBooking.list(),
  });

  const createRoom = useMutation({
    mutationFn: (data) => base44.entities.Room.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setShowAddRoom(false);
      setRoomForm({ room_number: '', room_type: 'classroom', capacity: 30, building: '', floor: 1, equipment: [] });
    },
  });

  const updateRoom = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Room.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setEditingRoom(null);
      setShowAddRoom(false);
    },
  });

  const deleteRoom = useMutation({
    mutationFn: (id) => base44.entities.Room.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  const createBooking = useMutation({
    mutationFn: (data) => base44.entities.RoomBooking.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roomBookings'] });
      setShowBooking(false);
      setBookingForm({ booking_type: 'recurring', day_of_week: 0, hour_number: 1, specific_date: '', subject: '', class_name: '', notes: '' });
    },
  });

  const deleteBooking = useMutation({
    mutationFn: (id) => base44.entities.RoomBooking.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roomBookings'] });
    },
  });

  const handleRoomSubmit = () => {
    if (editingRoom) {
      updateRoom.mutate({ id: editingRoom, data: roomForm });
    } else {
      createRoom.mutate(roomForm);
    }
  };

  const handleBookingSubmit = () => {
    createBooking.mutate({
      ...bookingForm,
      room_id: selectedRoom.id,
      room_number: selectedRoom.room_number,
      teacher_email: user.email,
      teacher_name: user.full_name,
    });
  };

  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  return (
    <div className="space-y-6 p-6">
      <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Home className="h-8 w-8" />
          ניהול חדרים
        </h1>
        <p className="text-purple-100 mt-2">שיבוץ חדרים ומערכת</p>
      </div>

      {/* Rooms Management */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">רשימת חדרים</h2>
          <button
            onClick={() => {
              setShowAddRoom(true);
              setEditingRoom(null);
              setRoomForm({ room_number: '', room_type: 'classroom', capacity: 30, building: '', floor: 1, equipment: [] });
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            חדר חדש
          </button>
        </div>

        {showAddRoom && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800">
                {editingRoom ? 'עריכת חדר' : 'חדר חדש'}
              </h3>
              <button onClick={() => setShowAddRoom(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">מספר חדר</label>
                <input
                  type="text"
                  value={roomForm.room_number}
                  onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="101"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">סוג חדר</label>
                <select
                  value={roomForm.room_type}
                  onChange={(e) => setRoomForm({ ...roomForm, room_type: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="classroom">כיתה רגילה</option>
                  <option value="lab">מעבדה</option>
                  <option value="computer_room">חדר מחשבים</option>
                  <option value="library">ספרייה</option>
                  <option value="multipurpose">רב תכליתי</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">קיבולת</label>
                <input
                  type="number"
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">בניין</label>
                <input
                  type="text"
                  value={roomForm.building}
                  onChange={(e) => setRoomForm({ ...roomForm, building: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="בניין א'"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">קומה</label>
                <input
                  type="number"
                  value={roomForm.floor}
                  onChange={(e) => setRoomForm({ ...roomForm, floor: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>

            <button
              onClick={handleRoomSubmit}
              className="mt-4 w-full py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700"
            >
              שמור
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rooms.map(room => (
            <div key={room.id} className="border-2 border-slate-200 rounded-xl p-4 hover:border-purple-300 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-slate-800 text-lg">חדר {room.room_number}</h4>
                  <p className="text-xs text-slate-500">
                    {room.room_type === 'classroom' ? 'כיתה' :
                     room.room_type === 'lab' ? 'מעבדה' :
                     room.room_type === 'computer_room' ? 'מחשבים' :
                     room.room_type === 'library' ? 'ספרייה' : 'רב תכליתי'}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingRoom(room.id);
                      setRoomForm(room);
                      setShowAddRoom(true);
                    }}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteRoom.mutate(room.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="text-xs text-slate-600 space-y-1 mb-3">
                <p>קיבולת: {room.capacity}</p>
                {room.building && <p>בניין: {room.building}</p>}
                {room.floor && <p>קומה: {room.floor}</p>}
              </div>

              <button
                onClick={() => {
                  setSelectedRoom(room);
                  setShowBooking(true);
                }}
                className="w-full py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-bold hover:bg-purple-200"
              >
                תפוס חדר
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Modal */}
      {showBooking && selectedRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">תפיסת חדר {selectedRoom.room_number}</h3>
              <button onClick={() => setShowBooking(false)}>
                <X className="h-6 w-6 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">סוג תפיסה</label>
                <select
                  value={bookingForm.booking_type}
                  onChange={(e) => setBookingForm({ ...bookingForm, booking_type: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="recurring">קבוע - כל שבוע</option>
                  <option value="one_time">חד פעמי</option>
                </select>
              </div>

              {bookingForm.booking_type === 'recurring' ? (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">יום בשבוע</label>
                    <select
                      value={bookingForm.day_of_week}
                      onChange={(e) => setBookingForm({ ...bookingForm, day_of_week: parseInt(e.target.value) })}
                      className="w-full p-2 border rounded-lg"
                    >
                      {dayNames.map((day, idx) => (
                        <option key={idx} value={idx}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">שעה</label>
                    <select
                      value={bookingForm.hour_number}
                      onChange={(e) => setBookingForm({ ...bookingForm, hour_number: parseInt(e.target.value) })}
                      className="w-full p-2 border rounded-lg"
                    >
                      {[1,2,3,4,5,6,7,8].map(h => (
                        <option key={h} value={h}>שעה {h}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">תאריך</label>
                  <input
                    type="date"
                    value={bookingForm.specific_date}
                    onChange={(e) => setBookingForm({ ...bookingForm, specific_date: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">מקצוע</label>
                <input
                  type="text"
                  value={bookingForm.subject}
                  onChange={(e) => setBookingForm({ ...bookingForm, subject: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="מתמטיקה"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">כיתה</label>
                <input
                  type="text"
                  value={bookingForm.class_name}
                  onChange={(e) => setBookingForm({ ...bookingForm, class_name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="ח'1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">הערות</label>
                <textarea
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  rows="2"
                />
              </div>

              <button
                onClick={handleBookingSubmit}
                className="w-full py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700"
              >
                אשר תפיסה
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Current Bookings */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">תפיסות נוכחיות</h2>
        <div className="space-y-3">
          {bookings.map(booking => (
            <div key={booking.id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800">
                  חדר {booking.room_number} - {booking.subject} ({booking.class_name})
                </p>
                <p className="text-sm text-slate-600">
                  {booking.booking_type === 'recurring' 
                    ? `${dayNames[booking.day_of_week]} שעה ${booking.hour_number}` 
                    : booking.specific_date}
                </p>
                <p className="text-xs text-slate-500">{booking.teacher_name}</p>
              </div>
              <button
                onClick={() => deleteBooking.mutate(booking.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}