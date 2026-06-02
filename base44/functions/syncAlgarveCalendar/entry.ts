import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CALENDAR_ID = '4d8c0629af457843ba6ba2b825d4c4b7260ad0c92538f95fd4be459a5d25fe94@group.calendar.google.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString(); // 120 days ahead

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?timeMin=${timeMin}&timeMax=${timeMax}&maxResults=100&singleEvents=true&orderBy=startTime`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
      const errText = await res.text();
      return Response.json({ error: `Google Calendar API error: ${errText}` }, { status: 500 });
    }

    const data = await res.json();
    const events = data.items || [];

    // Get existing AlgarveNews entries from Google Calendar
    const existingNews = await base44.asServiceRole.entities.AlgarveNews.filter({ data_source: 'google_calendar' });
    const existingMap = {};
    existingNews.forEach(n => { if (n.external_id) existingMap[n.external_id] = n; });

    let created = 0;
    let updated = 0;

    for (const event of events) {
      if (event.status === 'cancelled') {
        if (existingMap[event.id]) {
          await base44.asServiceRole.entities.AlgarveNews.update(existingMap[event.id].id, { active: false });
        }
        continue;
      }

      const dateFrom = event.start?.date || (event.start?.dateTime ? event.start.dateTime.slice(0, 10) : null);
      const dateTo = event.end?.date || (event.end?.dateTime ? event.end.dateTime.slice(0, 10) : null);

      const newsData = {
        title: event.summary || 'Evento Algarve',
        description: event.description || '',
        type: 'event',
        location: event.location || 'Algarve',
        date_from: dateFrom,
        date_to: dateTo,
        external_link: event.htmlLink || '',
        active: true,
        data_source: 'google_calendar',
        external_id: event.id,
        priority: 1
      };

      if (existingMap[event.id]) {
        await base44.asServiceRole.entities.AlgarveNews.update(existingMap[event.id].id, newsData);
        updated++;
      } else {
        await base44.asServiceRole.entities.AlgarveNews.create(newsData);
        created++;
      }
    }

    // Deactivate past events no longer in the feed
    const todayStr = now.toISOString().slice(0, 10);
    for (const old of existingNews) {
      if (old.date_from && old.date_from < todayStr && old.active) {
        await base44.asServiceRole.entities.AlgarveNews.update(old.id, { active: false });
      }
    }

    return Response.json({ success: true, created, updated, total: events.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});