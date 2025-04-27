import { H3Event } from 'h3';

export type UpdateEventBody = {
  body: string;
};

export default defineEventHandler(async (event: H3Event) => {
  const sql = useDatabase();
  const body = await readBody<UpdateEventBody>(event);
  const id = event.context.params.id;

  if (body.body == null || typeof body.body !== 'string') {
    return createError({
      statusCode: 400,
      statusMessage: 'Event body is required and must be a string',
    });
  }

  const [updatedEvent] = await sql`
    update events
    set body = ${body.body}
    where id = ${id}
    returning *
  `;

  if (!updatedEvent) {
    return createError({
      statusCode: 404,
      statusMessage: 'Event not found',
    });
  }

  return updatedEvent;
});
