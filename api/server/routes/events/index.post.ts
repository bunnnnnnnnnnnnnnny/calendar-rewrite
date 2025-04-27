import postgres from 'postgres';

export type CreateEventBody = {
  body: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  pattern?: {
    year?: number;
    month?: number;
    day?: number;
    week?: number;
    weekday?: number;
  };
};

type CalendarEvent = {
  id: number;
  body: string;
};

export default defineEventHandler(async (event) => {
  const sql = useDatabase();
  const body = await readBody<CreateEventBody>(event);

  if (body.body == null || typeof body.body !== 'string') {
    return createError({
      statusCode: 400,
      statusMessage: 'Event body is required and must be a string',
    });
  }

  if (body.endDate && !body.pattern) {
    return createError({
      statusCode: 400,
      statusMessage: 'endDate can only be used with recurring events',
    });
  }

  return await sql.begin(async (sql) => {
    const [newEvent] = await sql<{ id: number; body: string }[]>`
      insert into events (body)
      values (${body.body})
      returning *
    `;

    if (body.pattern) {
      return await createRecurringEventMeta(sql, newEvent, body);
    }

    return await createSingleEventMeta(sql, newEvent, body);
  });
});

async function createRecurringEventMeta(sql: postgres.Sql, newEvent: CalendarEvent, body: CreateEventBody) {
  const { startDate, endDate = null, pattern = {} } = body;

  if (!startDate) {
    return createError({
      statusCode: 400,
      statusMessage: 'Start date is required for recurring events',
    });
  }

  // only allow one pattern to be set
  const patternKeys = ['year', 'month', 'day', 'week', 'weekday'].filter((key) => pattern[key] != null);

  if (patternKeys.length === 0) {
    return createError({
      statusCode: 400,
      statusMessage: 'At least one repeat pattern key (year, month, day, week, or weekday) is required',
    });
  }

  if (patternKeys.length > 1) {
    return createError({
      statusCode: 400,
      statusMessage: 'Only one repeat pattern key is allowed. Received: ' + patternKeys.join(', '),
    });
  }

  const patternKey = patternKeys[0];
  const patternValue = pattern[patternKey];

  if (patternKey === 'month' && typeof patternValue === 'number') {
    if (patternValue < 0 || patternValue > 11) {
      return createError({
        statusCode: 400,
        statusMessage: 'Month must be between 0 and 11',
      });
    }
  }

  if (patternKey === 'weekday' && typeof patternValue === 'number') {
    if (patternValue < 0 || patternValue > 6) {
      return createError({
        statusCode: 400,
        statusMessage: 'Weekday must be between 0 and 6',
      });
    }
  }

  if (patternKey === 'day' && typeof patternValue === 'number') {
    if (patternValue < 1 || patternValue > 31) {
      return createError({
        statusCode: 400,
        statusMessage: 'Day must be between 1 and 31',
      });
    }
  }

  const repeatPattern = {
    year: patternKey === 'year' ? patternValue : null,
    month: patternKey === 'month' ? patternValue : null,
    day: patternKey === 'day' ? patternValue : null,
    week: patternKey === 'week' ? patternValue : null,
    weekday: patternKey === 'weekday' ? patternValue : null,
  };

  const [meta] = await sql`
    insert into recurring_event_meta (
      event_id,
      repeat_start,
      repeat_end,
      repeat_year,
      repeat_month,
      repeat_day,
      repeat_week,
      repeat_weekday
    ) values (
      ${newEvent.id},
      ${new Date(startDate)},
      ${endDate ? new Date(endDate) : null},
      ${repeatPattern.year},
      ${repeatPattern.month},
      ${repeatPattern.day},
      ${repeatPattern.week},
      ${repeatPattern.weekday}
    )
    returning *
  `;

  return { ...newEvent, meta };
}

async function createSingleEventMeta(sql: postgres.Sql, newEvent: CalendarEvent, body: CreateEventBody) {
  const { date } = body;

  if (!date) {
    return createError({
      statusCode: 400,
      statusMessage: 'Date is required for single-time events',
    });
  }

  const [meta] = await sql`
    insert into event_meta (
      event_id,
      date
    ) values (
      ${newEvent.id},
      ${new Date(date)}
    )
    returning *
  `;

  return { ...newEvent, meta };
}
