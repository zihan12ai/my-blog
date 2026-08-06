/**
 * Decap CMS GitHub OAuth 代理 —— Cloudflare Worker
 * 同窗口顶层重定向模式（不依赖 window.opener，最稳）
 * 流程：admin 点登录(弹窗) → /auth 跳 GitHub → /callback 换 token
 *      → 顶层跳转到 admin/#token=xxx，由 admin 页 boot 脚本写入 localStorage
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const clientId = env.GITHUB_CLIENT_ID;
    const clientSecret = env.GITHUB_CLIENT_SECRET;
    const site = env.SITE_URL || "https://suanlilog.com";

    if (!clientId || !clientSecret) {
      return new Response("Worker configuration is incomplete.", { status: 500 });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors(site) });
    }

    // /auth → GitHub 授权页
    if (url.pathname === "/auth") {
      const redirect = `${url.origin}/callback`;
      const state = crypto.randomUUID();
      const gh = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirect)}&scope=repo,user&state=${encodeURIComponent(state)}`;
      return new Response(null, {
        status: 302,
        headers: {
          Location: gh,
          "Set-Cookie": `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/callback; Max-Age=600`,
        },
      });
    }

    // /callback → 换 token → 顶层跳回 admin 带 token
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const expectedState = cookie(request.headers.get("Cookie"), "oauth_state");
      if (!code || !state || !expectedState || state !== expectedState) {
        return new Response("登录校验失败，请关闭窗口后重新登录。", {
          status: 400,
          headers: { "Content-Type": "text/plain; charset=utf-8", "Set-Cookie": clearStateCookie() },
        });
      }
      let token = "";
      let err = "";
      try {
        const tokRes = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: { "Accept": "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
        });
        const data = await tokRes.json();
        token = data.access_token || "";
        if (!token) err = JSON.stringify(data);
      } catch (e) {
        err = String(e);
      }

      if (!token) {
        return new Response(`登录失败：${err}`, {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Set-Cookie": clearStateCookie() },
        });
      }

      // fragment 不会发给 Netlify，且不会进入 Referer；admin boot 脚本会立即取走并清除它。
      const target = `${site}/admin/#token=${encodeURIComponent(token)}`;
      const script = `window.location.replace(${JSON.stringify(target)});`;
      const html = '<!DOCTYPE html><p>登录成功，正在返回…</p><scr' + 'ipt>' + script + '</scr' + 'ipt>';
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8", "Set-Cookie": clearStateCookie() },
      });
    }

    return new Response("Decap OAuth proxy. Use /auth", { headers: cors(site) });
  },
};

function cors(site) {
  return {
    "Access-Control-Allow-Origin": site,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };
}
function cookie(header, name) {
  return (header || "").split(";").map(part => part.trim()).find(part => part.startsWith(`${name}=`))?.slice(name.length + 1) || "";
}
function clearStateCookie() {
  return "oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/callback; Max-Age=0";
}
