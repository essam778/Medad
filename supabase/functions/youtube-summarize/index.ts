import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('SITE_URL') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // ===== JWT CHECK =====
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized', success: false }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized', success: false }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
  // ===== END JWT CHECK =====

  try {
    const { text, url, type } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    
    let contentToSummarize = text;

    if (url && (url.includes('youtube.com') || url.includes('youtu.be'))) {
      const videoIdMatch = url.match(/(?:v=|\/|embed\/|shorts\/)([0-9A-Za-z_-]{11})/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;
      if (!videoId) throw new Error("رابط غير صالح.");

      try {
          const legacyRes = await fetch(`https://video.google.com/timedtext?type=list&v=${videoId}`);
          const legacyXml = await legacyRes.text();
          if (legacyXml.includes('track')) {
              const langMatch = legacyXml.match(/lang_code="([^"]+)"/);
              const lang = legacyXml.includes('lang_code="ar"') ? 'ar' : (langMatch ? langMatch[1] : 'en');
              const tRes = await fetch(`https://video.google.com/timedtext?lang=${lang}&v=${videoId}`);
              contentToSummarize = await tRes.text();
          }
      } catch (e) { console.log("Legacy failed"); }

      if (!contentToSummarize) {
          const ytResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: { 
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
              'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+412; VISITOR_INFO1_LIVE=f7p9p9p9p9; ',
              'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
            }
          });
          const html = await ytResponse.text();
          
          const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
          if (playerResponseMatch) {
              const playerResponse = JSON.parse(playerResponseMatch[1]);
              const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
              if (tracks.length > 0) {
                  const track = tracks.find(t => t.languageCode === 'ar') || tracks.find(t => t.languageCode === 'en') || tracks[0];
                  const tRes = await fetch(track.baseUrl);
                  contentToSummarize = await tRes.text();
              }
          }
      }

      if (!contentToSummarize) {
          throw new Error("يوتيوب يرفض إعطاء النص حالياً. يرجى تجربة فيديو آخر أو نسخ النص يدوياً.");
      }

      contentToSummarize = contentToSummarize.replace(/<[^>]*>?/gm, ' ').replace(/&amp;#39;/g, "'").replace(/\s+/g, ' ').trim();
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: `حول النص التالي لمقال عربي احترافي بصيغة JSON: { "title": "...", "article": "..." }. النص: ${contentToSummarize.slice(0, 12000)}` }] }] })
    });

    const data = await response.json();
    const result = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim());
    return new Response(JSON.stringify({ ...result, success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, success: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})