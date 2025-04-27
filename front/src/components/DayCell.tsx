import { CalendarEvent } from '../types/calendar';
import { DayEvent } from './DayEvent';
import { NewEventInput } from './NewEventInput';

interface DayCellProps {
  /** `1-31` */
  day: number;
  /** `0-11` */
  month: number;
  /** `YYYY` */
  year: number;
  /** is part of current month */
  isCurrent: boolean;
  /** day -> event map for current month */
  events: Map<number, CalendarEvent[]>;
  onCreate: () => void;
  onUpdate: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
}

export function DayCell({ day, month, year, isCurrent, events, onCreate, onUpdate, onDelete }: DayCellProps) {
  const className = isCurrent ? 'day' : 'day other-month';
  const eventsForDay = (events.get(day) || []).sort((a, b) => a.id - b.id);

  return (
    <td className={className}>
      <h1>{day}</h1>
      <ul>
        {isCurrent &&
          eventsForDay.map((event) => (
            <li key={event.id}>
              <DayEvent event={event} editable={isCurrent} onUpdate={onUpdate} onDelete={onDelete} />
            </li>
          ))}
        {isCurrent && (
          <li>
            <NewEventInput day={day} month={month} year={year} onEventCreated={onCreate} />
          </li>
        )}
      </ul>
    </td>
  );
}
