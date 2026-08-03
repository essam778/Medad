import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_URL") || "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

function extractMeta(html: string, property: string): string | null {
  const match = html.match(
    new RegExp(
      `<meta\\s+[^>]*?(?:property|name)=["']${property}["'][^>]*?content=["']([^"']+)["']`,
      "i",
    ),
  );
  return match ? match[1] : null;
}

function extractTags(html: string): string[] {
  const tags: string[] = [];
  const regex =
    /<meta\s+[^>]*?(?:property|name)=["']article:tag["'][^>]*?content=["']([^"']+)["']/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    tags.push(m[1]);
  }
  if (tags.length === 0) {
    const canonical = extractMeta(html, "og:url") || "";
    const pathParts = canonical.split("/").filter(Boolean);
    const last = pathParts[pathParts.length - 1];
    if (last && last !== canonical) tags.push(last);
  }
  return tags.slice(0, 5);
}

function extractArticleText(html: string): string {
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    return articleMatch[1]
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  const bodyText = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return bodyText.slice(0, 15000);
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  // ===== JWT CHECK =====
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Unauthorized", success: false }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized", success: false }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
  // ===== END JWT CHECK =====

  try {
    const { url } = await req.json();
    if (!url || !url.includes("medium.com")) {
      throw new Error("يرجى إدخال رابط مقال صحيح من Medium.com");
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");

    // Use freedium.cfd to bypass Medium's anti-bot protection
    const proxyUrl = "https://freedium.cfd/" + url;

    const htmlRes = await fetch(proxyUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
      },
    });
    const html = await htmlRes.text();

    const title =
      extractMeta(html, "og:title") || extractMeta(html, "twitter:title") || "";
    const coverImage =
      extractMeta(html, "og:image") || extractMeta(html, "twitter:image") || "";
    const description =
      extractMeta(html, "og:description") ||
      extractMeta(html, "twitter:description") ||
      "";
    const tags = extractTags(html);
    const articleText = extractArticleText(html);

    if (!articleText || articleText.length < 50) {
      throw new Error("لم نتمكن من استخراج المحتوى من هذا الرابط");
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `أنت كاتب محتوى عربي. استخرج ونظف النص التالي من HTML وأعده كمقال عربي احترافي بصيغة JSON:\n{\n  "title": "..."\n  "content": "<p>...</p><h2>...</h2><p>...</p>"\n  "excerpt": "..."\n  "tags": ["tag1", "tag2"]\n}\n\nالمقال الأصلي:\nالعنوان المستخرج: ${title}\nالوصف: ${description}\n\nالنص: ${articleText.slice(0, 12000)}`,
                },
              ],
            },
          ],
        }),
      },
    );

    const geminiData = await geminiRes.json();
    let result;
    try {
      result = JSON.parse(
        geminiData.candidates[0].content.parts[0].text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim(),
      );
    } catch {
      result = {
        title: title || "مستورد من Medium",
        content: `<p>${articleText.slice(0, 5000)}</p>`,
        excerpt: description,
        tags: tags,
      };
    }

    return new Response(
      JSON.stringify({
        ...result,
        cover_image_url: coverImage,
        original_url: url,
        tags: [...new Set([...tags, ...(result.tags || [])])],
        success: true,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
