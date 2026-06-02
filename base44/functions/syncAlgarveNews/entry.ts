import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow admin user OR internal automation
    const authHeader = req.headers.get('authorization') || '';
    const internalSecret = Deno.env.get('INTERNAL_AUTOMATION_SECRET');
    const isAutomation = internalSecret && authHeader.includes(internalSecret);

    let authorized = isAutomation;
    if (!authorized) {
      const user = await base44.auth.me().catch(() => null);
      authorized = user?.role === 'admin';
    }
    if (!authorized) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Generate 3 multilingual news/tips about Algarve via LLM with internet
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a tourism content writer for the Algarve region in Portugal. 
Today is ${today}. 
Generate exactly 3 current, relevant and useful news items or tourist tips for visitors to the Algarve. 
Topics can include: upcoming local events, beach tips, gastronomy, cultural highlights, nature, activities, practical travel info.
Each item must be translated into all 6 languages: Portuguese (pt), English (en), Spanish (es), French (fr), German (de), Dutch (nl).
Keep titles concise (max 80 chars) and descriptions helpful (max 200 chars).
For category use one of: festival, show, cultural, sports, gastronomy, promo, other.
For location use a specific Algarve city or just "Algarve".`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          news: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                pt: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' } }, required: ['title'] },
                en: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' } }, required: ['title'] },
                es: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' } }, required: ['title'] },
                fr: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' } }, required: ['title'] },
                de: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' } }, required: ['title'] },
                nl: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' } }, required: ['title'] },
                category: { type: 'string' },
                location: { type: 'string' },
                date_from: { type: 'string' },
                external_link: { type: 'string' }
              }
            }
          }
        }
      }
    });

    // Delete old manual news (older than 2 days)
    const oldNews = await base44.asServiceRole.entities.AlgarveNews.filter({ data_source: 'manual' });
    const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    let deleted = 0;
    for (const item of oldNews) {
      if (new Date(item.created_date) < cutoff) {
        await base44.asServiceRole.entities.AlgarveNews.delete(item.id);
        deleted++;
      }
    }

    // Create new news items for each language
    const langs = ['pt', 'en', 'es', 'fr', 'de', 'nl'];
    let created = 0;
    for (const newsItem of result.news || []) {
      for (const lang of langs) {
        const langData = newsItem[lang];
        if (!langData?.title) continue;
        await base44.asServiceRole.entities.AlgarveNews.create({
          title: langData.title,
          description: langData.description || '',
          type: 'promo',
          category: newsItem.category || 'other',
          location: newsItem.location || 'Algarve',
          date_from: newsItem.date_from || today,
          external_link: newsItem.external_link || '',
          data_source: 'manual',
          lang,
          active: true,
          priority: 2,
        });
        created++;
      }
    }

    return Response.json({ success: true, created, deleted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});