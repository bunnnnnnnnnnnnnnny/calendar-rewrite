import { KeyboardEvent, useState } from 'react';
import { CalendarEvent, CalendarEventResponse } from '../types/calendar';
import { TextAreaAutoGrow } from './TextAreaAutoGrow';
import { apiUrl } from '../utils/calendar';

interface DayEventProps {
  event: CalendarEvent;
  editable: boolean;
  onUpdate: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
}

async function updateEvent(event: CalendarEvent, newBody: string): Promise<CalendarEvent> {
  const url = apiUrl(`/events/${event.id}`);

  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body: newBody }),
  });

  if (!response.ok) {
    throw new Error(`Error updating event: ${response.statusText}`);
  }
  const updatedEvent: CalendarEventResponse = await response.json();

  const newEvent: CalendarEvent = {
    id: updatedEvent.id,
    body: updatedEvent.body,
    day: updatedEvent.day,
    created_at: new Date(updatedEvent.created_at),
    recurring: event.recurring,
  };

  return newEvent;
}

async function deleteEvent(event: CalendarEvent): Promise<void> {
  const url = apiUrl(`/events/${event.id}`);

  const response = await fetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Error deleting event: ${response.statusText}`);
  }
}

export function DayEvent({ event, editable, onUpdate, onDelete }: DayEventProps) {
  const [text, setText] = useState(event.body);

  async function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      const body = text.trim();
      if (body) {
        const updatedEvent = await updateEvent(event, body);
        if (updatedEvent) {
          onUpdate(updatedEvent);
        }
      } else {
        await deleteEvent(event);
        onDelete(event);
      }
    }
  }

  return (
    <TextAreaAutoGrow
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      disabled={!editable}
    />
  );
}
