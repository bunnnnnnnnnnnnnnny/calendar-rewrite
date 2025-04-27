import { KeyboardEvent, useState } from 'react';
import { apiUrl } from '../utils/calendar';
import { TextAreaAutoGrow } from './TextAreaAutoGrow';

interface NewEventInputProps {
  day: number;
  /** `0-11` */
  month: number;
  year: number;
  onEventCreated: () => void;
}

export async function createEvent(date: Date, body: string) {
  const url = apiUrl('/events');
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body, date }),
  });

  if (!response.ok) {
    throw new Error(`Error creating event: ${response.statusText}`);
  }
}

export function NewEventInput({ day, month, year, onEventCreated }: NewEventInputProps) {
  const [text, setText] = useState('');

  async function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();

      const body = text.trim();
      if (body) {
        // month is already 0-based here
        const date = new Date(year, month, day);

        await createEvent(date, body);

        setText('');
        onEventCreated();
      }
    }
  }

  return <TextAreaAutoGrow value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown} />;
}
