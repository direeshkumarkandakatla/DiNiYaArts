import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { enUS } from 'date-fns/locale';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { sessionsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CreateSessionDialog from '../components/CreateSessionDialog';
import SessionDetailDialog from '../components/SessionDetailDialog';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 0 }),
  getDay,
  locales,
});

export default function SessionCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentView, setCurrentView] = useState('month');
  const { user } = useAuth();

  const fetchSessions = useCallback(async (date) => {
    try {
      setLoading(true);
      const from = startOfMonth(subMonths(date, 1)).toISOString();
      const to = endOfMonth(addMonths(date, 1)).toISOString();
      const response = await sessionsAPI.getAll({ from, to });

      const calendarEvents = response.data.map((session) => ({
        id: session.id,
        title: `${session.classTypeName} (${session.currentStudentCount}/${session.maxStudents})`,
        start: new Date(session.startDateTime),
        end: new Date(session.endDateTime),
        resource: session,
      }));

      setEvents(calendarEvents);
      setError('');
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions(currentDate);
  }, [currentDate, fetchSessions]);

  const handleNavigate = (date) => {
    setCurrentDate(date);
  };

  const handleSelectSlot = (slotInfo) => {
    setSelectedSlot(slotInfo);
    setCreateOpen(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event.resource);
    setDetailOpen(true);
  };

  const handleSessionCreated = () => {
    setCreateOpen(false);
    fetchSessions(currentDate);
  };

  const handleSessionUpdated = () => {
    setDetailOpen(false);
    fetchSessions(currentDate);
  };

  const eventStyleGetter = (event) => {
    const color = event.resource?.classTypeColor || '#3174ad';
    return {
      style: {
        backgroundColor: color,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        fontSize: '0.85rem',
      },
    };
  };

  if (loading && events.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const isAdminOrInstructor = user?.roles?.some(
    (r) => r === 'Administrator' || r === 'Instructor'
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Session Calendar</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            label="Click on a date to create a session"
            variant="outlined"
            size="small"
          />
          {isAdminOrInstructor && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedSlot({ start: new Date() });
                setCreateOpen(true);
              }}
            >
              New Session
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      <Box sx={{ height: 'calc(100vh - 200px)', minHeight: 600 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          date={currentDate}
          view={currentView}
          onNavigate={handleNavigate}
          onView={(view) => setCurrentView(view)}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day']}
          step={30}
          timeslots={2}
          min={new Date(2026, 0, 1, 7, 0)}
          max={new Date(2026, 0, 1, 21, 0)}
          popup
          style={{ height: '100%' }}
        />
      </Box>

      <CreateSessionDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleSessionCreated}
        initialDate={selectedSlot?.start}
      />

      <SessionDetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        session={selectedEvent}
        onUpdated={handleSessionUpdated}
      />
    </Box>
  );
}
