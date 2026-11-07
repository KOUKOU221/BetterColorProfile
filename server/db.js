/**
 * Better Color Profile - Multi-Engine Database & Storage Layer
 * Supports:
 *  1. Local persistent JSON store (.data/licenses.json)
 *  2. Vercel KV / Upstash Redis (KV_REST_API_URL & KV_REST_API_TOKEN or REDIS_URL)
 *  3. External Whop API auto-sync
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", ".data");
const DB_FILE = path.join(DATA_DIR, "licenses.json");
const ALERTS_FILE = path.join(DATA_DIR, "alerts.json");

// Ensure data directory exists for local persistence
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  // Read-only filesystem (e.g. Vercel serverless lambda)
}

// In-memory cache for speed and read-only environments
let memoryStore = {
  licenses: {},
  alerts: [],
  otps: {},
};

// Seed default sample/test licenses
function seedDefaultLicenses() {
  const seedKeys = [
    {
      key: "mem_svxTbrq6dJiOeR",
      email: "alroufa21@gmail.com",
      plan: "Lifetime Admin Pro",
      status: "ACTIVE",
      hwid: null,
      machine_name: null,
      created_at: "2026-11-06T19:00:00.000Z",
      last_seen_at: null,
      note: "Admin / Creator Lifetime Key",
    },
    {
      key: "BCP-PRO-2026-LIFETIME-001",
      email: "koukou221@admin.bcp",
      plan: "Pro License",
      status: "ACTIVE",
      hwid: null,
      machine_name: null,
      created_at: new Date().toISOString(),
      last_seen_at: null,
      note: "Master Dev Key",
    },
    {
      key: "BCP-DEMO-TEST-KEY-4491",
      email: "demo@bettercolorprofile.com",
      plan: "Pro License",
      status: "ACTIVE",
      hwid: null,
      machine_name: null,
      created_at: new Date().toISOString(),
      last_seen_at: null,
      note: "Public demo test key",
    },
  ];

  for (const item of seedKeys) {
    if (!memoryStore.licenses[item.key]) {
      memoryStore.licenses[item.key] = item;
    }
  }
}

// Load data from disk if available
function loadLocalData() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      memoryStore.licenses = JSON.parse(raw);
    }
  } catch (e) {
    // Fallback to memory
  }

  try {
    if (fs.existsSync(ALERTS_FILE)) {
      const raw = fs.readFileSync(ALERTS_FILE, "utf-8");
      memoryStore.alerts = JSON.parse(raw);
    }
  } catch (e) {
    // Fallback to memory
  }

  seedDefaultLicenses();
}

// Save data to disk if writable
function saveLocalData() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryStore.licenses, null, 2), "utf-8");
    fs.writeFileSync(ALERTS_FILE, JSON.stringify(memoryStore.alerts, null, 2), "utf-8");
  } catch (e) {
    // In serverless read-only environments, in-memory state persists across warm lambda invokes
  }
}

// Initialize local data
loadLocalData();

// Vercel KV REST Helper (if env vars are present)
async function kvFetch(cmd, ...args) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;

  try {
    const res = await fetch(`${url}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([cmd, ...args]),
    });
    if (res.ok) {
      const data = await res.json();
      return data.result;
    }
  } catch (e) {
    // Fallback to memory
  }
  return null;
}

// Public Database API
module.exports = {
  // Find license by key or email
  async getLicense(key) {
    if (!key) return null;
    const cleanKey = key.trim();

    // Check Vercel KV if available
    const kvData = await kvFetch("GET", `bcp:lic:${cleanKey}`);
    if (kvData) {
      try {
        return typeof kvData === "string" ? JSON.parse(kvData) : kvData;
      } catch (e) {}
    }

    // Direct match
    if (memoryStore.licenses[cleanKey]) {
      return memoryStore.licenses[cleanKey];
    }

    // Email match (returns primary/first license)
    if (cleanKey.includes("@")) {
      const list = await this.getLicensesByEmail(cleanKey);
      return list.length > 0 ? list[0] : null;
    }

    return null;
  },

  // Find all licenses associated with an email
  async getLicensesByEmail(email) {
    if (!email) return [];
    const cleanEmail = email.trim().toLowerCase();
    const results = [];
    const seenKeys = new Set();

    // 1. In-memory licenses
    for (const k in memoryStore.licenses) {
      const lic = memoryStore.licenses[k];
      if ((lic.email || "").toLowerCase() === cleanEmail) {
        if (!seenKeys.has(lic.key)) {
          seenKeys.add(lic.key);
          results.push(lic);
        }
      }
    }

    // 2. Vercel KV email index
    const kvEmailList = await kvFetch("GET", `bcp:email:${cleanEmail}`);
    if (kvEmailList) {
      try {
        const keys = Array.isArray(kvEmailList) ? kvEmailList : JSON.parse(kvEmailList);
        for (const k of keys) {
          if (!seenKeys.has(k)) {
            const lic = await this.getLicense(k);
            if (lic) {
              seenKeys.add(lic.key);
              results.push(lic);
            }
          }
        }
      } catch (e) {}
    }

    return results;
  },

  // Save / Update license
  async saveLicense(license) {
    if (!license || !license.key) return;
    const cleanKey = license.key.trim();
    memoryStore.licenses[cleanKey] = license;

    // Persist to Vercel KV if configured
    await kvFetch("SET", `bcp:lic:${cleanKey}`, JSON.stringify(license));

    // Update email index in KV if email exists
    if (license.email && license.email.includes("@")) {
      const cleanEmail = license.email.trim().toLowerCase();
      try {
        let existing = await kvFetch("GET", `bcp:email:${cleanEmail}`);
        let keyList = [];
        if (existing) {
          keyList = Array.isArray(existing) ? existing : JSON.parse(existing);
        }
        if (!keyList.includes(cleanKey)) {
          keyList.push(cleanKey);
          await kvFetch("SET", `bcp:email:${cleanEmail}`, JSON.stringify(keyList));
        }
      } catch (e) {}
    }

    saveLocalData();
    return license;
  },

  // Get all licenses
  async getAllLicenses() {
    return Object.values(memoryStore.licenses);
  },

  // Record exploit / concurrent collision alert
  async recordAlert(alert) {
    alert.id = "alt_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
    alert.timestamp = new Date().toISOString();
    memoryStore.alerts.unshift(alert);
    if (memoryStore.alerts.length > 100) memoryStore.alerts.pop();

    saveLocalData();
    return alert;
  },

  // Get alerts
  async getAlerts() {
    return memoryStore.alerts;
  },

  // OTP Storage
  async setOtp(email, code, expiresMs = 15 * 60 * 1000) {
    const cleanEmail = email.toLowerCase().trim();
    memoryStore.otps[cleanEmail] = {
      code: String(code).trim(),
      expires_at: Date.now() + expiresMs,
    };
  },

  async verifyOtp(email, code) {
    const cleanEmail = email.toLowerCase().trim();
    const entry = memoryStore.otps[cleanEmail];
    if (!entry) return false;

    if (Date.now() > entry.expires_at) {
      delete memoryStore.otps[cleanEmail];
      return false;
    }

    if (entry.code === String(code).trim()) {
      delete memoryStore.otps[cleanEmail];
      return true;
    }

    return false;
  },

  // Generate unique formatted license key
  generateKey() {
    const part = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BCP-${part()}-${part()}-${part()}-${part()}`;
  },
};
