/* =============================================================
   HARAMAIN · functions/complete.js
   Cloudflare Pages Function · TESTNET · sandbox:true

   Route:   POST /complete
   Health:  GET  /complete → returns JSON status

   CRITICAL: Always return HTTP 200
   Non-200 response = Pi SDK shows "Payment Expired"
============================================================= */

export async function onRequestGet(context) {
  const key = context.env.PI_API_KEY;
  return new Response(
    JSON.stringify({
      ok: true,
      service: "HARAMAIN complete.js",
      mode: "TESTNET · sandbox:true",
      pi_api_key_present: !!key,
      pi_api_key_prefix: key ? key.substring(0,8)+"..." : "MISSING"
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

  console.log("[HARAMAIN-TESTNET] /complete POST — TESTNET");

  try {
    const body = await context.request.json();
    const paymentId = body.paymentId;
    const txid = body.txid;

    console.log("[HARAMAIN-TESTNET] paymentId:", paymentId, "txid:", txid);

    if (!paymentId) {
      return new Response(JSON.stringify({ completed:false, error:"missing paymentId" }), { status:200, headers:CORS });
    }
    if (!txid) {
      return new Response(JSON.stringify({ completed:true, skipped:true, message:"waiting for txid" }), { status:200, headers:CORS });
    }

    const PI_API_KEY = context.env.PI_API_KEY;
    if (!PI_API_KEY) {
      console.error("[HARAMAIN-TESTNET] PI_API_KEY missing");
      return new Response(JSON.stringify({ completed:true, skipped:true, error:"PI_API_KEY missing" }), { status:200, headers:CORS });
    }

    const res = await fetch("https://api.minepi.com/v2/payments/"+paymentId+"/complete", {
      method: "POST",
      headers: { "Authorization":"Key "+PI_API_KEY, "Content-Type":"application/json" },
      body: JSON.stringify({ txid:txid })
    });
    const text = await res.text();
    console.log("[HARAMAIN-TESTNET] Complete:", res.status, text);

    return new Response(
      JSON.stringify({ completed:res.ok, pi_status:res.status, response:text }),
      { status:200, headers:CORS }  /* ALWAYS 200 */
    );

  } catch(err) {
    console.error("[HARAMAIN-TESTNET] complete error:", err.message);
    return new Response(JSON.stringify({ completed:false, error:err.message }), { status:200, headers:CORS });
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
