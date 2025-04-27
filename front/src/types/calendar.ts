export type CalendarEventResponse = {
  id: number;
  body: string;
  day: number;
  date: string;
  created_at: string;
};

export type CalendarEvent = {
  id: number;
  body: string;
  day: number;
  date: Date;
  created_at: Date;
  recurring: boolean;
};

export type DayInfo = {
  day: number;
  isCurrent: boolean;
};
