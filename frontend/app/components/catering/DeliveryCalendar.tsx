'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Package } from 'lucide-react';

interface DeliveryEvent {
  id: number;
  date: string;
  school: string;
  portions: number;
  time: string;
  status: 'scheduled' | 'completed' | 'pending';
}

interface DeliveryCalendarProps {
  events: DeliveryEvent[];
}

const DeliveryCalendar: React.FC<DeliveryCalendarProps> = ({ events }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const selectedDateEvents = selectedDate
    ? getEventsForDate(selectedDate.getDate())
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-2 glass rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Jadwal Pengiriman
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={previousMonth}
              className="p-2 glass-subtle rounded-xl hover:shadow-modern transition-smooth"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <span className="text-lg font-bold text-gray-900 min-w-[200px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 glass-subtle rounded-xl hover:shadow-modern transition-smooth"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-gray-600 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = getEventsForDate(day);
            const isToday =
              day === new Date().getDate() &&
              currentDate.getMonth() === new Date().getMonth() &&
              currentDate.getFullYear() === new Date().getFullYear();
            const isSelected =
              selectedDate?.getDate() === day &&
              selectedDate?.getMonth() === currentDate.getMonth();

            return (
              <button
                key={day}
                onClick={() =>
                  setSelectedDate(
                    new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                  )
                }
                className={`aspect-square rounded-xl p-2 transition-smooth relative ${
                  isToday
                    ? 'gradient-bg-1 text-white shadow-glow'
                    : isSelected
                    ? 'glass-subtle border-2 border-blue-500'
                    : dayEvents.length > 0
                    ? 'glass-subtle hover:shadow-modern'
                    : 'hover:bg-gray-100'
                }`}
              >
                <span
                  className={`text-sm font-semibold ${
                    isToday ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
                    {dayEvents.slice(0, 3).map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full ${
                          isToday ? 'bg-white' : 'bg-blue-500'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Event details */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {selectedDate
            ? `Pengiriman ${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]}`
            : 'Pilih Tanggal'}
        </h3>

        {selectedDateEvents.length > 0 ? (
          <div className="space-y-3">
            {selectedDateEvents.map((event) => (
              <div
                key={event.id}
                className="glass-subtle rounded-xl p-4 hover:shadow-modern transition-smooth"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      {event.school}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{event.time}</p>
                  </div>
                  <div
                    className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                      event.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : event.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {event.status === 'completed'
                      ? 'Selesai'
                      : event.status === 'pending'
                      ? 'Menunggu'
                      : 'Dijadwalkan'}
                  </div>
                </div>
                <p className="text-sm text-gray-700 flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  {event.portions} Porsi
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Tidak ada pengiriman</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryCalendar;
