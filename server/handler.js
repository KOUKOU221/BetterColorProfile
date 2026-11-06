/**
 * Better Color Profile - Unified API Request Handler
 * Handles license verification, heartbeats, anti-exploit detection, key recovery OTP, and admin endpoints.
 */

const crypto = require("crypto");
const db = require("./db");

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "bcp_admin_2026_secure";
const JWT_SECRET = process.env.JWT_SECRET || "bcp_secret_session_token_key_2026";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const WHOP_API_KEY = process.env.WHOP_API_KEY || "apik_A7SIk5YjdIL2T_C7175694_C_7e6c757dc22b603868ed7404ed254b31cbd17886abed2768b5db07ee8f1dd4";
const WHOP_PRODUCT_ID = "prod_mL7apgdSCn59Y";

// Simple Token Generator & Verifier
function generateAdminToken() {
  const payload = { role: "admin", exp: Date.now() + 24 * 60 * 60 * 1000 };
  const str = Buffer.from(JSON.stringify(payload)).toString("base64");
  const sig = crypto.createHmac("sha256", JWT_SECRET).update(str).digest("hex");
  return `${str}.${sig}`;
}

function verifyAdminToken(token) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [str, sig] = parts;
  const expectedSig = crypto.createHmac("sha256", JWT_SECRET).update(str).digest("hex");
  if (sig !== expectedSig) return false;
  try {
    const payload = JSON.parse(Buffer.from(str, "base64").toString("utf-8"));
    return payload.exp > Date.now();
  } catch (e) {
    return false;
  }
}

// Send Email Helper (Resend API & Brevo API supported)
async function sendEmail({ to, subject, html, text }) {
  const resendKey = process.env.RESEND_API_KEY || "";
  const brevoKey = process.env.BREVO_API_KEY || "";

  if (!resendKey && !brevoKey) {
    return {
      ok: false,
      error: "Email delivery service is not configured on the server. Please add RESEND_API_KEY to your Vercel Environment Variables.",
    };
  }

  // 1. Resend API
  if (resendKey) {
    try {
      const fromEmail = process.env.RESEND_FROM || "Better Color Profile <onboarding@resend.dev>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html,
          text,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        console.log(`[Email Sent via Resend to ${to}]: ID ${data.id || "OK"}`);
        return { ok: true, id: data.id };
      } else {
        console.error(`[Resend Error]:`, data);
        return { ok: false, error: data.message || "Email provider rejected message." };
      }
    } catch (e) {
      console.error(`[Resend Exception]:`, e.message || e);
      return { ok: false, error: "Network error contacting email service." };
    }
  }

  // 2. Brevo API (Sendinblue)
  if (brevoKey) {
    try {
      const fromEmail = process.env.BREVO_FROM || "noreply@bettercolorprofile.com";
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: { name: "Better Color Profile", email: fromEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        console.log(`[Email Sent via Brevo to ${to}]: ID ${data.messageId || "OK"}`);
        return { ok: true, id: data.messageId };
      } else {
        console.error(`[Brevo Error]:`, data);
        return { ok: false, error: data.message || "Brevo email dispatch failed." };
      }
    } catch (e) {
      console.error(`[Brevo Exception]:`, e.message || e);
      return { ok: false, error: "Network error contacting Brevo service." };
    }
  }

  return { ok: false, error: "Email delivery failed." };
}

// Parse JSON body helper
async function getJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

// Send JSON Response Helper
function sendJson(res, data, status = 200) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.end(JSON.stringify(data));
}

// Main Request Handler
async function handleApiRequest(req, res) {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.end();
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  let pathname = urlObj.pathname;

  // Normalize path
  if (!pathname.startsWith("/api")) {
    pathname = "/api" + (pathname.startsWith("/") ? pathname : "/" + pathname);
  }

  // -------------------------------------------------------------
  // 1. LICENSE VERIFICATION: /api/license/verify, /api/verify
  // -------------------------------------------------------------
  if (pathname === "/api/license/verify" || pathname === "/api/verify" || pathname === "/api/verify-license") {
    if (req.method !== "POST" && req.method !== "GET") {
      return sendJson(res, { success: false, error: "Method not allowed" }, 405);
    }

    const body = await getJsonBody(req);
    const key = (body.key || body.license_key || urlObj.searchParams.get("key") || "").trim();
    const hwid = (body.hwid || urlObj.searchParams.get("hwid") || "").trim();
    const machineName = (body.machine_name || urlObj.searchParams.get("machine_name") || "Windows PC").trim();
    const transfer = body.transfer === true || body.transfer === "true" || urlObj.searchParams.get("transfer") === "true";

    if (!key) {
      return sendJson(res, { success: false, valid: false, error: "License key is required." }, 400);
    }

    let lic = await db.getLicense(key);

    // If not found locally, query Whop API fallback
    if (!lic && (key.startsWith("mem_") || key.includes("@"))) {
      lic = await syncWhopLicense(key);
    }

    if (!lic) {
      return sendJson(res, {
        success: true,
        valid: false,
        error: "Invalid license key or unregistered email. Please check your credentials.",
      }, 200);
    }

    // Ban Check
    if ((lic.status || "").toUpperCase() === "BANNED") {
      return sendJson(res, {
        success: true,
        valid: false,
        status: "banned",
        error: lic.ban_reason || "This license key has been deactivated by administrator.",
      }, 200);
    }

    // Single Device HWID Lock
    const nowIso = new Date().toISOString();
    if (hwid) {
      if (!lic.hwid) {
        // First binding
        lic.hwid = hwid;
        lic.machine_name = machineName;
        lic.activated_at = nowIso;
        lic.last_seen_at = nowIso;
        await db.saveLicense(lic);
      } else if (lic.hwid !== hwid) {
        if (transfer) {
          // Rebind to new device
          lic.hwid = hwid;
          lic.machine_name = machineName;
          lic.transferred_at = nowIso;
          lic.last_seen_at = nowIso;
          await db.saveLicense(lic);
        } else {
          // Detect simultaneous use attempt
          const lastPing = lic.last_seen_at ? new Date(lic.last_seen_at).getTime() : 0;
          if (Date.now() - lastPing < 10 * 60 * 1000) {
            await db.recordAlert({
              key: lic.key,
              email: lic.email,
              active_hwid: lic.hwid,
              incoming_hwid: hwid,
            });
          }

          return sendJson(res, {
            success: true,
            valid: false,
            status: "device_mismatch",
            can_transfer: true,
            error: "This license is currently active on another PC. Would you like to transfer your license to this PC?",
          }, 200);
        }
      } else {
        // Same device ping
        lic.last_seen_at = nowIso;
        lic.machine_name = machineName;
        await db.saveLicense(lic);
      }
    }

    return sendJson(res, {
      success: true,
      valid: true,
      status: "active",
      plan_title: lic.plan || "Pro License",
      user_email: lic.email || key,
      membership_id: lic.key,
      is_trial: false,
      manage_url: "https://whop.com/billing",
      verified_at: nowIso,
    }, 200);
  }

  // -------------------------------------------------------------
  // 2. PERIODIC BACKGROUND HEARTBEAT & ANTI-EXPLOIT COLLISION LOCK:
  //    /api/license/heartbeat
  // -------------------------------------------------------------
  if (pathname === "/api/license/heartbeat") {
    if (req.method !== "POST") return sendJson(res, { error: "Method not allowed" }, 405);
    const body = await getJsonBody(req);
    const key = (body.key || "").trim();
    const hwid = (body.hwid || "").trim();
    const machineName = (body.machine_name || "").trim();

    if (!key) return sendJson(res, { success: false, error: "Key required" }, 400);

    const lic = await db.getLicense(key);
    if (!lic) {
      return sendJson(res, { success: false, valid: false, status: "REVOKED", error: "License not found" }, 200);
    }

    if ((lic.status || "").toUpperCase() === "BANNED") {
      return sendJson(res, {
        success: false,
        valid: false,
        status: "BANNED",
        error: lic.ban_reason || "License is deactivated.",
      }, 200);
    }

    // STRICT ANTI-EXPLOIT: Concurrent use detection
    if (lic.hwid && hwid && lic.hwid !== hwid) {
      // Two distinct computers are actively heartbeat-pinging with the same key!
      lic.status = "BANNED";
      lic.ban_reason = "Concurrent multi-device exploit detected (Key used on 2 devices simultaneously)";
      await db.saveLicense(lic);

      await db.recordAlert({
        key: lic.key,
        email: lic.email,
        active_hwid: lic.hwid,
        incoming_hwid: hwid,
      });

      return sendJson(res, {
        success: false,
        valid: false,
        status: "CONCURRENT_USE_DETECTED",
        error: "Simultaneous usage on 2 devices detected. This license has been permanently locked.",
      }, 200);
    }

    // Valid heartbeat ping
    lic.last_seen_at = new Date().toISOString();
    if (machineName) lic.machine_name = machineName;
    await db.saveLicense(lic);

    return sendJson(res, { success: true, valid: true, status: "active" }, 200);
  }

  // -------------------------------------------------------------
  // 3. KEY RECOVERY: /api/license/recover/request-otp
  // -------------------------------------------------------------
  if (pathname === "/api/license/recover/request-otp") {
    if (req.method !== "POST") return sendJson(res, { error: "Method not allowed" }, 405);
    const body = await getJsonBody(req);
    const email = (body.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return sendJson(res, { success: false, error: "Valid email address is required." }, 400);
    }

    let lic = await db.getLicense(email);
    if (!lic) {
      // Whop email sync fallback
      lic = await syncWhopLicense(email);
    }

    if (!lic) {
      return sendJson(res, {
        success: false,
        error: "No active Better Color Profile license found associated with this email address.",
      }, 404);
    }

    // Generate 6-Digit confirmation code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.setOtp(email, otp);

    // Dispatch email directly to customer inbox
    const emailResult = await sendEmail({
      to: email,
      subject: "Better Color Profile - Your License Recovery Code",
      text: `Your Better Color Profile 6-digit confirmation code is: ${otp}\n\nEnter this code on the website to reveal your license key.\n\nThis code expires in 15 minutes.`,
      html: `
        <div style="font-family:sans-serif; background:#0F1117; color:#FFFFFF; padding:28px; border-radius:12px; max-width:520px;">
          <h2 style="color:#F59E0B; margin-top:0;">Better Color Profile</h2>
          <p>You requested to recover your license key. Here is your 6-digit confirmation code:</p>
          <div style="background:#161922; border:1px solid #F59E0B; border-radius:8px; padding:16px; font-size:32px; font-weight:bold; letter-spacing:8px; text-align:center; color:#F59E0B; font-family:monospace;">
            ${otp}
          </div>
          <p style="font-size:12px; color:#94A3B8; margin-top:16px;">This code expires in 15 minutes. If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (!emailResult.ok) {
      return sendJson(res, {
        success: false,
        error: emailResult.error || "Failed to dispatch confirmation email. Please check server configuration.",
      }, 500);
    }

    return sendJson(res, {
      success: true,
      message: "Confirmation code sent to your email inbox.",
    }, 200);
  }

  // -------------------------------------------------------------
  // 4. KEY RECOVERY VERIFY: /api/license/recover/verify-otp
  // -------------------------------------------------------------
  if (pathname === "/api/license/recover/verify-otp") {
    if (req.method !== "POST") return sendJson(res, { error: "Method not allowed" }, 405);
    const body = await getJsonBody(req);
    const email = (body.email || "").trim().toLowerCase();
    const code = (body.code || "").trim();

    if (!email || !code) {
      return sendJson(res, { success: false, error: "Email and confirmation code are required." }, 400);
    }

    const isValid = await db.verifyOtp(email, code);
    if (!isValid) {
      return sendJson(res, {
        success: false,
        error: "Invalid or expired confirmation code. Please request a new code.",
      }, 400);
    }

    const lic = await db.getLicense(email);
    if (!lic) {
      return sendJson(res, { success: false, error: "License not found." }, 404);
    }

    // Send backup copy to customer's email
    sendEmail({
      to: email,
      subject: "Better Color Profile - License Key Backup",
      text: `Your license key: ${lic.key}\n\nPaste this key directly into the Better Color Profile application.\nNote: Each license permits usage on 1 device at a time.`,
      html: `
        <div style="font-family:sans-serif; background:#0F1117; color:#FFFFFF; padding:28px; border-radius:12px; max-width:520px;">
          <h2 style="color:#F59E0B; margin-top:0;">Your License Key</h2>
          <p>Here is your recovered Better Color Profile license key:</p>
          <div style="background:#161922; border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:14px; font-size:16px; font-weight:bold; color:#FBBF24; font-family:monospace; word-break:break-all;">
            ${lic.key}
          </div>
          <p style="font-size:12px; color:#94A3B8; margin-top:16px;"><b>Note:</b> Each key permits usage on 1 device at a time. Paste this key into the app to activate.</p>
        </div>
      `,
    }).catch(() => null);

    return sendJson(res, {
      success: true,
      key: lic.key,
      email: lic.email,
      plan: lic.plan || "Pro License",
    }, 200);
  }

  // -------------------------------------------------------------
  // 5. ADMIN AUTHENTICATION: /api/admin/login
  // -------------------------------------------------------------
  if (pathname === "/api/admin/login") {
    if (req.method !== "POST") return sendJson(res, { error: "Method not allowed" }, 405);
    const body = await getJsonBody(req);
    const password = (body.password || "").trim();

    if (password === ADMIN_PASSWORD) {
      const token = generateAdminToken();
      return sendJson(res, { success: true, token }, 200);
    }

    return sendJson(res, { success: false, error: "Invalid master password." }, 401);
  }

  // Verify Admin Token for Protected Admin Endpoints
  if (pathname.startsWith("/api/admin/")) {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!verifyAdminToken(token)) {
      return sendJson(res, { success: false, error: "Unauthorized access. Invalid or expired admin token." }, 403);
    }

    // GET /api/admin/licenses
    if (pathname === "/api/admin/licenses" && req.method === "GET") {
      const licenses = await db.getAllLicenses();
      const alerts = await db.getAlerts();
      return sendJson(res, {
        success: true,
        licenses,
        stats: {
          total_licenses: licenses.length,
          active_seats: licenses.filter((l) => l.hwid && l.status !== "BANNED").length,
          banned_keys: licenses.filter((l) => (l.status || "").toUpperCase() === "BANNED").length,
          concurrent_exploits: alerts.length,
        },
      }, 200);
    }

    // POST /api/admin/ban
    if (pathname === "/api/admin/ban" && req.method === "POST") {
      const body = await getJsonBody(req);
      const key = (body.key || "").trim();
      const reason = (body.reason || "Administrative ban").trim();

      const lic = await db.getLicense(key);
      if (!lic) return sendJson(res, { success: false, error: "License not found" }, 404);

      lic.status = "BANNED";
      lic.ban_reason = reason;
      lic.banned_at = new Date().toISOString();
      await db.saveLicense(lic);

      return sendJson(res, { success: true, message: `License ${key} banned.` }, 200);
    }

    // POST /api/admin/unban
    if (pathname === "/api/admin/unban" && req.method === "POST") {
      const body = await getJsonBody(req);
      const key = (body.key || "").trim();

      const lic = await db.getLicense(key);
      if (!lic) return sendJson(res, { success: false, error: "License not found" }, 404);

      lic.status = "ACTIVE";
      delete lic.ban_reason;
      delete lic.banned_at;
      await db.saveLicense(lic);

      return sendJson(res, { success: true, message: `License ${key} restored.` }, 200);
    }

    // POST /api/admin/reset-hwid
    if (pathname === "/api/admin/reset-hwid" && req.method === "POST") {
      const body = await getJsonBody(req);
      const key = (body.key || "").trim();

      const lic = await db.getLicense(key);
      if (!lic) return sendJson(res, { success: false, error: "License not found" }, 404);

      lic.hwid = null;
      lic.machine_name = null;
      lic.last_seen_at = null;
      await db.saveLicense(lic);

      return sendJson(res, { success: true, message: `HWID cleared for ${key}.` }, 200);
    }

    // POST /api/admin/create-key
    if (pathname === "/api/admin/create-key" && req.method === "POST") {
      const body = await getJsonBody(req);
      const email = (body.email || "").trim();
      const plan = (body.plan || "Pro License").trim();
      const note = (body.note || "").trim();

      const newKey = db.generateKey();
      const license = {
        key: newKey,
        email: email || null,
        plan,
        note,
        status: "ACTIVE",
        hwid: null,
        machine_name: null,
        created_at: new Date().toISOString(),
        last_seen_at: null,
      };

      await db.saveLicense(license);
      return sendJson(res, { success: true, key: newKey }, 200);
    }

    // GET /api/admin/alerts
    if (pathname === "/api/admin/alerts" && req.method === "GET") {
      const alerts = await db.getAlerts();
      return sendJson(res, { success: true, alerts }, 200);
    }
  }

  // -------------------------------------------------------------
  // 6. FEEDBACK API: /api/feedback
  // -------------------------------------------------------------
  if (pathname === "/api/feedback" && req.method === "POST") {
    const body = await getJsonBody(req);
    const title = (body.title || "").trim();
    const message = (body.message || "").trim();
    const email = (body.email || "").trim();

    if (!title || !message) {
      return sendJson(res, { success: false, error: "Title and message are required." }, 400);
    }

    sendEmail({
      to: "alroufa21@gmail.com",
      subject: `[BCP Feedback] ${title}`,
      text: `From: ${email}\n\nTitle: ${title}\n\nMessage:\n${message}`,
    }).catch(() => null);

    return sendJson(res, { success: true, message: "Feedback delivered." }, 200);
  }

  return sendJson(res, { error: "Not found", path: pathname }, 404);
}

// Whop API Sync Helper
async function syncWhopLicense(keyOrEmail) {
  try {
    const isEmail = keyOrEmail.includes("@");
    const targetUrl = isEmail
      ? `https://api.whop.com/api/v1/members?account_id=biz_uA6wYzQXtOBKuu`
      : `https://api.whop.com/api/v1/memberships/${encodeURIComponent(keyOrEmail)}`;

    const res = await fetch(targetUrl, {
      headers: {
        Authorization: `Bearer ${WHOP_API_KEY}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) return null;
    const data = await res.json();

    let membership = null;
    if (isEmail) {
      const members = data.data || [];
      const member = members.find((m) => (m.email || "").toLowerCase() === keyOrEmail.toLowerCase());
      if (!member) return null;

      const memRes = await fetch(`https://api.whop.com/api/v1/memberships?member_id=${encodeURIComponent(member.id)}`, {
        headers: { Authorization: `Bearer ${WHOP_API_KEY}`, Accept: "application/json" },
      });
      if (!memRes.ok) return null;
      const memData = await memRes.json();
      membership = (memData.data || []).find((m) => (m.product?.id || m.product_id) === WHOP_PRODUCT_ID);
    } else {
      membership = data;
    }

    if (!membership) return null;

    const newLic = {
      key: membership.id || keyOrEmail,
      email: membership.user?.email || (isEmail ? keyOrEmail : null),
      plan: membership.plan?.title || "Pro License",
      status: (membership.status || "").toLowerCase() === "active" ? "ACTIVE" : (membership.status || "ACTIVE").toUpperCase(),
      hwid: membership.metadata?.hwid || null,
      machine_name: null,
      created_at: new Date().toISOString(),
      last_seen_at: null,
      note: "Synced from Whop",
    };

    await db.saveLicense(newLic);
    return newLic;
  } catch (e) {
    return null;
  }
}

module.exports = { handleApiRequest };
