import './App.css';

import { useEffect, useState } from 'react';
import { DayCell } from './components/DayCell';
import { CalendarEvent, CalendarEventResponse } from './types/calendar';
import { apiUrl, calculateGrid } from './utils/calendar';

const ROWS = 5;
const COLS = 7;

function validateYear(year: number | null): number {
  if (year === null || isNaN(year) || year < 1900 || year > 9999) {
    return new Date().getFullYear();
  }
  return year;
}

function validateMonth(month: number | null): number {
  const zeroBasedMonth = month !== null ? month - 1 : null;
  if (zeroBasedMonth === null || isNaN(zeroBasedMonth) || zeroBasedMonth < 0 || zeroBasedMonth > 11) {
    return new Date().getMonth();
  }
  return zeroBasedMonth;
}

function mapEventResponse(response: CalendarEventResponse): CalendarEvent {
  return {
    id: response.id,
    body: response.body,
    day: response.day,
    date: new Date(response.date),
    created_at: new Date(response.created_at),
    recurring: false,
  };
}

function App() {
  const [month, setMonth] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const monthParam = params.get('month');
    return validateMonth(monthParam ? parseInt(monthParam, 10) : null);
  });

  const [year, setYear] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const yearParam = params.get('year');
    return validateYear(yearParam ? parseInt(yearParam, 10) : null);
  });

  const [grid, setGrid] = useState(() => calculateGrid(month, year));
  const [events, setEvents] = useState<Map<number, CalendarEvent[]>>(new Map());
  const [recurringEvents, setRecurringEvents] = useState<CalendarEvent[]>([]);

  function updateGrid(month: number, year: number) {
    setMonth(month);
    setYear(year);
    setGrid(calculateGrid(month, year));

    const params = new URLSearchParams(window.location.search);
    params.set('month', (month + 1).toString());
    params.set('year', year.toString());
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
  }

  function nextMonth() {
    if (month === 11) {
      updateGrid(0, year + 1);
    } else {
      updateGrid(month + 1, year);
    }
  }

  function prevMonth() {
    if (month === 0) {
      updateGrid(11, year - 1);
    } else {
      updateGrid(month - 1, year);
    }
  }

  function currentMonth() {
    const today = new Date();
    if (today.getFullYear() !== year || today.getMonth() !== month) {
      updateGrid(today.getMonth(), today.getFullYear());
    }
  }

  useEffect(() => {
    function handlePopState() {
      const params = new URLSearchParams(window.location.search);
      const monthParam = params.get('month');
      const yearParam = params.get('year');

      const newMonth = validateMonth(monthParam ? parseInt(monthParam, 10) : null);
      const newYear = validateYear(yearParam ? parseInt(yearParam, 10) : null);

      if (newMonth !== month || newYear !== year) {
        setMonth(newMonth);
        setYear(newYear);
        setGrid(calculateGrid(newMonth, newYear));
      }
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [month, year]);

  async function getEvents(month: number, year: number) {
    const response = await fetch(apiUrl(`/events/${year}/${month + 1}`));

    if (!response.ok) {
      throw new Error(`Error fetching events: ${response.statusText}`);
    }

    const data: { events: CalendarEventResponse[]; recurringEvents: CalendarEventResponse[] } = await response.json();

    const newEventsMap = new Map<number, CalendarEvent[]>();
    const newRecurringEvents: CalendarEvent[] = [];

    // single time events
    data.events.forEach((response) => {
      const event = mapEventResponse(response);

      const eventsForDay = newEventsMap.get(event.day) || [];
      eventsForDay.push(event);
      newEventsMap.set(event.day, eventsForDay);
    });

    // recurring events
    data.recurringEvents.forEach((response) => {
      const event = {
        ...mapEventResponse(response),
        recurring: true,
      };

      const eventsForDay = newEventsMap.get(event.day) || [];
      eventsForDay.push(event);
      newEventsMap.set(event.day, eventsForDay);
      newRecurringEvents.push(event);
    });

    setEvents(newEventsMap);
    setRecurringEvents(newRecurringEvents);
  }

  function refreshEvents() {
    getEvents(month, year).catch((error) => {
      console.error('Error fetching events:', error);
    });
  }

  // refresh events on month/year change
  useEffect(() => {
    refreshEvents();
  }, [month, year]);

  function onEventUpdated(event: CalendarEvent) {
    const eventsForDay = events.get(event.day) || [];
    const updatedEvent = eventsForDay.find((e) => e.id === event.id);
    if (updatedEvent) {
      updatedEvent.body = event.body;
    }
    setEvents((prev) => new Map(prev).set(event.day, eventsForDay));
  }

  function onEventDeleted(event: CalendarEvent) {
    const eventsForDay = events.get(event.day) || [];
    const updatedEvents = eventsForDay.filter((e) => e.id !== event.id);

    if (updatedEvents.length === 0) {
      setEvents((prev) => {
        const newMap = new Map(prev);
        newMap.delete(event.day);
        return newMap;
      });
    } else {
      setEvents((prev) => new Map(prev).set(event.day, updatedEvents));
    }

    if (event.recurring) {
      setRecurringEvents((prev) => prev.filter((e) => e.id !== event.id));
    }
  }

  return (
    <>
      <main>
        <div className="controls">
          <button onClick={prevMonth}>&lt;</button>
          <h1 onClick={currentMonth}>
            {new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h1>
          <button onClick={nextMonth}>&gt;</button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Sunday</th>
              <th>Monday</th>
              <th>Tuesday</th>
              <th>Wednesday</th>
              <th>Thursday</th>
              <th>Friday</th>
              <th>Saturday</th>
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: ROWS }, (_, rowIndex) => (
              <tr key={rowIndex}>
                {grid.slice(rowIndex * COLS, (rowIndex + 1) * COLS).map((cell, cellIndex) => (
                  <DayCell
                    key={cellIndex}
                    {...cell}
                    month={month}
                    year={year}
                    events={events}
                    onCreate={refreshEvents}
                    onUpdate={onEventUpdated}
                    onDelete={onEventDeleted}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <aside className="events">
          <h1>Recurring Events</h1>
          <ul>
            {recurringEvents.map((event) => {
              return (
                <li key={event.id}>
                  <span>{event.body}</span>
                  <time>
                    {event.date.toLocaleDateString('default', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                </li>
              );
            })}
          </ul>
        </aside>
      </main>
    </>
  );
}

export default App;
