/* ═══════════════════════════════════════════════════════════════════════
   hammadshow — Cloudflare Worker: Stream Proxy (CORS fix for HLS/VOD)
   من برمجة وتطوير المهندس محمد حماد

   المشكلة: باقات Xtream Codes بترجع بيانات player_api.php بهيدرز CORS
   سليمة، لكن سيرفر البث نفسه (اللي بيقدم .m3u8 و .ts والأفلام) غالبًا
   من غيرها. المتصفح بيرفض طلبات hls.js بصمت -> "networkError manifestLoadError".

   الحل: هذا الـ Worker بيعمل proxy لأي رابط بث، ويضيف هيدرز CORS،
   وبيعيد كتابة ملف m3u8 عشان السيجمنتات كمان تعدي من نفس الـ proxy.

   ═══════ خطوات النشر (٢ دقيقة) ═══════
   1) https://dash.cloudflare.com -> Workers & Pages -> Create -> Create Worker
   2) امسح الكود الافتراضي والصق هذا الملف كامل -> Deploy
   3) هيديك رابط زي: https://hammadshow-proxy.<اسمك>.workers.dev
   4) افتح شاشة إعدادات hammadshow (اضغط مطول على شعار H+) والصق
      الرابط ده في حقل "رابط البروكسي (اختياري)"
   ═══════════════════════════════════════════════════════════════════════ */

export default {
  async fetch(request) {
    const reqUrl = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    const target = reqUrl.searchParams.get("u");
    if (!target) {
      return new Response("Missing 'u' parameter", { status: 400, headers: corsHeaders() });
    }

    let targetUrl;
    try {
      targetUrl = new URL(target);
    } catch (e) {
      return new Response("Invalid target URL", { status: 400, headers: corsHeaders() });
    }
    if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
      return new Response("Unsupported protocol", { status: 400, headers: corsHeaders() });
    }

    // Forward Range header for seeking support on VOD (mp4)
    const upstreamHeaders = new Headers();
    const range = request.headers.get("range");
    if (range) upstreamHeaders.set("range", range);
    upstreamHeaders.set("user-agent", "Mozilla/5.0 (hammadshow)");

    let upstream;
    try {
      upstream = await fetch(targetUrl.toString(), { headers: upstreamHeaders });
    } catch (e) {
      return new Response("Upstream fetch failed: " + e.message, { status: 502, headers: corsHeaders() });
    }

    const contentType = upstream.headers.get("content-type") || "";
    const isM3U8 =
      targetUrl.pathname.toLowerCase().endsWith(".m3u8") ||
      contentType.includes("mpegurl") ||
      contentType.includes("x-mpegurl");

    const respHeaders = corsHeaders();
    // Preserve useful upstream headers
    ["content-length", "accept-ranges", "content-range", "last-modified", "etag"].forEach((h) => {
      const v = upstream.headers.get(h);
      if (v) respHeaders.set(h, v);
    });

    if (isM3U8) {
      const text = await upstream.text();
      const base = targetUrl.origin + targetUrl.pathname.substring(0, targetUrl.pathname.lastIndexOf("/") + 1);
      const proxyBase = reqUrl.origin + reqUrl.pathname;
      const rewritten = text
        .split("\n")
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return line;
          if (trimmed.startsWith("#")) {
            // rewrite URI="..." inside tags like #EXT-X-KEY or #EXT-X-MAP
            return trimmed.replace(/URI="([^"]+)"/, (m, uri) => {
              let abs;
              try {
                abs = new URL(uri, base).toString();
              } catch (e) {
                return m;
              }
              return `URI="${proxyBase}?u=${encodeURIComponent(abs)}"`;
            });
          }
          let abs;
          try {
            abs = new URL(trimmed, base).toString();
          } catch (e) {
            return line;
          }
          return `${proxyBase}?u=${encodeURIComponent(abs)}`;
        })
        .join("\n");
      respHeaders.set("content-type", "application/vnd.apple.mpegurl");
      return new Response(rewritten, { status: upstream.status, headers: respHeaders });
    }

    respHeaders.set("content-type", contentType || "application/octet-stream");
    return new Response(upstream.body, { status: upstream.status, headers: respHeaders });
  },
};

function corsHeaders() {
  return new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Expose-Headers": "*",
    "Cache-Control": "no-store",
  });
}
