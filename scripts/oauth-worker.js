/**
 * Decap CMS GitHub OAuth 代理 —— Cloudflare Worker
 * 部署步骤见 README「OAuth 代理部署」一节
 */

const CLIENT_ID = "Ov23lid0l1IcyVaVljGL";
const CLIENT_SECRET = "c9a7b6cc7d1bcd78b27c045e278de8c3c813f51e";
const ORIGIN = "https://suanlilog.com";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // CORS 预检
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors() });
    }

    // 第一步：CMS 跳到这里拿 GitHub 授权 URL
    if (url.pathname === "/auth") {
      const redirect = `${url.origin}/callback`;
      const gh = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirect)}&scope=repo,user&state=${rand()}`;
      return Response.redirect(gh, 302);
    }

    // 第二步：GitHub 回调带 code，用 code 换 token
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      const tokRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code }),
      });
      const data = await tokRes.json();
      const token = data.access_token;
      if (!token) {
        const err = JSON.stringify(data);
        return new Response(`换 token 失败: ${err}`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
      // Decap CMS 3.x 要求的 postMessage 格式：JSON 含 token + provider
      const msg = JSON.stringify({ token, provider: "github" });
      const html = '<!DOCTYPE html><p>登录完成，可关闭此页。</p><scr' + 'ipt>' +
        'window.opener.postMessage("authorization:github:success:' + msg.replace(/"/g, "&quot;") + '", "*");' +
        'window.close();' +
        '</scr' + 'ipt>';
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    return new Response("Decap OAuth proxy. Use /auth", { headers: cors() });
  },
};

function cors() {
  return {
    "Access-Control-Allow-Origin": ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };
}
function rand() {
  return Math.random().toString(36).slice(2);
}
