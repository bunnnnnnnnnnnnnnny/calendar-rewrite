export default defineEventHandler(async (event) => {
  const sql = useDatabase();
  const id = event.context.params.id;

  const [deletedEvent] = await sql`
    delete from events
    where id = ${id}
    returning *
  `;

  if (!deletedEvent) {
    return createError({
      statusCode: 404,
      statusMessage: 'Event not found',
    });
  }

  return {
    id: deletedEvent.id,
    message: 'Event deleted successfully',
  };
});
