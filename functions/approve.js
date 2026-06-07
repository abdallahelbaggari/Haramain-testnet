/* =============================================================
   HARAMAIN · functions/approve.js
   Cloudflare Pages Function · TESTNET · sandbox:true

   Route:   POST /approve
   Health:  GET  /approve  → returns JSON status

   PI_API_KEY → Cloudflare Dashboard → Settings →
                Environment Variables → Add Secret
============================================================= */

export async function onRequestGet(context) {
  const key = context.env.PI_API_KEY;
  return new Response(
    JSON.stringify({
      ok: true,
      service: "HARAMAIN approve.js",
      mode: "TESTNET · sandbox:true",
      pi_api_key_present: !!key,
      pi_api_key_prefix: key ? key.substring(0,8)+"..." : "MISSING — add to Cloudflare"
    }),
    { status:200, headers:{ "Content-Type":"application/json","Access-Control-Allow-Origin":"*" }}
  );
}

export async function onRequestPost(context) {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  console.log("[HARAMAIN-TESTNET] /approve POST — TESTNET");

  try {
    /* Parse body */
    let paymentId = null;
    try {
      const body = await context.request.json();
      paymentId = body.paymentId || null;
    } catch(e) {
      return new Response(JSON.stringify({ approved:true, step:"body_parse_error" }), { status:200, headers:CORS });
    }

    if (!paymentId) {
      return new Response(JSON.stringify({ approved:true, step:"no_payment_id" }), { status:200, headers:CORS });
    }

    const PI_API_KEY = context.env.PI_API_KEY;
    if (!PI_API_KEY) {
      console.error("[HARAMAIN-TESTNET] PI_API_KEY missing");
      return new Response(JSON.stringify({ approved:true, step:"no_api_key" }), { status:200, headers:CORS });
    }

    console.log("[HARAMAIN-TESTNET] Approving paymentId:", paymentId);

    /* GET current state (for logging) */
    try {
      const getRes = await fetch("https://api.minepi.com/v2/payments/"+paymentId, {
        headers: { "Authorization":"Key "+PI_API_KEY }
      });
      console.log("[HARAMAIN-TESTNET] GET state:", getRes.status, await getRes.text());
    } catch(e) { console.error("[HARAMAIN-TESTNET] GET error:", e.message); }

    /* POST approve */
    const res = await fetch("https://api.minepi.com/v2/payments/"+paymentId+"/approve", {
      method: "POST",
      headers: { "Authorization":"Key "+PI_API_KEY, "Content-Type":"application/json" },
      body: JSON.stringify({})
    });
    const raw = await res.text();
    console.log("[HARAMAIN-TESTNET] Approve:", res.status, raw);

    /* ALWAYS return 200 — non-200 causes "Payment Expired" in Pi SDK */
    return new Response(
      JSON.stringify({ approved:true, pi_status:res.status, pi_response:raw }),
      { status:200, headers:CORS }
    );

  } catch(err) {
    console.error("[HARAMAIN-TESTNET] approve error:", err.message);
    return new Response(JSON.stringify({ approved:true, error:err.message }), { status:200, headers:CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status:200,
    headers:{
      "Access-Control-Allow-Origin":"*",
      "Access-Control-Allow-Methods":"POST,GET,OPTIONS",
      "Access-Control-Allow-Headers":"Content-Type"
    }
  });
}
