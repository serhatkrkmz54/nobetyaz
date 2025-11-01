'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, EventClickArg, DatesSetArg } from '@fullcalendar/core';
import { ScheduledShift } from '@/services/scheduleService';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface ScheduleCalendarProps {
  events: EventInput[];
  isLoading: boolean;
  onDatesSet: (start: string, end: string) => void;
  isReadOnly?: boolean;
  onEventClick?: (clickInfo: EventClickArg) => void;
  contentHeight?: number | 'auto';
}

export default function ScheduleCalendar({
  events,
  isLoading,
  onEventClick,
  onDatesSet,
  isReadOnly = false,
  contentHeight = 700
}: ScheduleCalendarProps) {

const handleEventClick = (clickInfo: EventClickArg) => {
    if (!isReadOnly && onEventClick) {
      onEventClick(clickInfo);
    }
  };

  const handleDatesSet = (dateInfo: DatesSetArg) => {
    const midTime = dateInfo.start.getTime() + (dateInfo.end.getTime() - dateInfo.start.getTime()) / 2;
    const midDate = new Date(midTime);
    const monthStart = startOfMonth(midDate);
    const monthEnd = endOfMonth(midDate);

    const startDate = format(monthStart, 'yyyy-MM-dd');
    const endDate = format(monthEnd, 'yyyy-MM-dd');
    onDatesSet(startDate, endDate);
  };

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Çizelge yükleniyor...
        </div>
      )}
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek'
        }}
        locale="tr"
        buttonText={{ today: 'Bugün', month: 'Ay', week: 'Hafta' }}
        events={events}
        datesSet={handleDatesSet}
        eventClick={handleEventClick}
        height="auto"
        contentHeight={contentHeight}
        expandRows={true}
      />
    </div>
  );
}