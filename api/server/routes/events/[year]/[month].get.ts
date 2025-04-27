import postgres from 'postgres';

function getWeek(date: Date): number {
  var dayNum = date.getUTCDay() || 7;

  date.setUTCDate(date.getUTCDate() + 4 - dayNum);

  var yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));

  // @ts-expect-error
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
}

export default defineEventHandler(async (event) => {
  const sql = useDatabase();

  const { year: yearString, month: monthString } = event.context.params;

  if (yearString == null || monthString == null) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Year and month are required',
    });
  }

  const year = Number.parseInt(yearString, 10);
  const month = Number.parseInt(monthString, 10);

  if (Number.isNaN(year) || Number.isNaN(month)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Year and month must be numbers',
    });
  }

  const minDate = new Date(year, month, 1);
  const maxDate = new Date(year, month, 0);

  const eventRows = await sql`
    select events.*, meta.date from events
    right join event_meta meta on meta.event_id = events.id
    where meta.date >= ${minDate} and meta.date < ${maxDate}
    order by meta.date asc
  `;

  const events = eventRows.map((row) => {
    const date = new Date(row.date);
    const day = date.getDate();

    return {
      id: row.id,
      body: row.body,
      day,
      created_at: row.created_at,
    };
  });

  const recurringEventPromises: [Date, Promise<postgres.Row[]>][] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const weekday = date.getDay();
    const week = getWeek(date);

    const recurringEventsForDay = sql`
      select 
        events.*
      from events
      right join recurring_event_meta meta on meta.event_id = events.id
      where (
        (meta.repeat_year = ${year} or meta.repeat_year is null)
        and (meta.repeat_month = ${month} or meta.repeat_month is null)
        and (meta.repeat_week = ${week} or meta.repeat_week is null)
        and (meta.repeat_weekday = ${weekday} or meta.repeat_weekday is null)
        and (meta.repeat_day = ${day} or meta.repeat_day is null)
        and (meta.repeat_start <= ${date})
        and (meta.repeat_end >= ${date} or meta.repeat_end is null)
      )
    `;

    recurringEventPromises.push([date, recurringEventsForDay]);
  }

  const queryResults = await Promise.all(
    recurringEventPromises.map(([date, promise]) => promise.then((rows) => [date, rows] as const)),
  );

  const uniqueEvents = new Map<number, postgres.Row>();
  for (const [date, rows] of queryResults) {
    for (const row of rows) {
      if (!uniqueEvents.has(row.id)) {
        uniqueEvents.set(row.id, { ...row, date });
      }
    }
  }

  const recurringEvents = Array.from(uniqueEvents.values());

  return { events, recurringEvents };
});
