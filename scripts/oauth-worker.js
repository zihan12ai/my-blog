/**
 * Decap CMS GitHub OAuth 代理 —— Cloudflare Worker
 * 同窗口顶层重定向模式（不依赖 window.opener，最稳）
 * 流程：admin 点登录(弹窗) → /auth 跳 GitHub → /callback 换 token
 *      → 顶层跳转到 admin?token=xxx，由 admin 页 boot 脚本写入 localStorage
 */

const CLIENT_ID = "Ov23lid0l1IcyVaVljGL";
const CLIENT_SECRET = "c9a7b6cc7d1bcd78b27c045e278de8c3c813f51e";
const SITE = "https://suanlilog.com";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors() });
    }

    // /auth → GitHub 授权页
    if (url.pathname === "/auth") {
      const redirect = `${url.origin}/callback`;
      const gh = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirect)}&scope=repo,user&state=${rand()}`;
      return Response.redirect(gh, 302);
    }

    // /callback → 换 token → 顶层跳回 admin 带 token
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      let token = "";
      let err = "";
      try {
        const tokRes = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: { "Accept": "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code }),
        });
        const data = await tokRes.json();
        token = data.access_token || "";
        if (!token) err = JSON.stringify(data);
      } catch (e) {
        err = String(e);
      }

      if (!token) {
        return new Response(`登录失败：${err}`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }

      // 顶层重定向：把 token 通过 URL 带回 admin 页（admin boot 脚本会接管）
      // 同时也 postMessage 兼容弹窗模式（格式：原始 token）
      const script =
        'try{if(window.opener){window.opener.postMessage("authorization:github:success:' + token + '","*");}}catch(e){}' +
        'setTimeout(function(){try{window.top.location.href="' + SITE + '/admin/?token=' + token + '";}catch(e){window.location.href="' + SITE + '/admin/?token=' + token + '";}},100);';
      const html = '<!DOCTYPE html><p>登录成功，正在返回…</p><scr' + 'ipt>' + script + '</scr' + 'ipt>';
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    return new Response("Decap OAuth proxy. Use /auth", { headers: cors() });
  },
};

function cors() {
  return {
    "Access-Control-Allow-Origin": SITE,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };
}
function rand() {
  return Math.random().toString(36).slice(2);
}
