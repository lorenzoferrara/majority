const crypto = require("node:crypto");

const SESSION_COOKIE = "majority_session";
const SESSION_MAX_AGE_MS = Number(process.env.APP_SESSION_MAX_AGE_HOURS ?? 24 * 7) * 60 * 60 * 1000;

function getPassphrase() {
  return process.env.APP_PASSPHRASE || process.env.VITE_APP_PASSPHRASE || "";
}

function getSessionSecret() {
  return process.env.APP_SESSION_SECRET || process.env.SESSION_SECRET || getPassphrase();
}

function parseCookies(req) {
  const raw = req.headers?.cookie;
  if (!raw) return {};

  return Object.fromEntries(
    raw.split(";").map((part) => {
      const index = part.indexOf("=");
      if (index === -1) return [part.trim(), ""];
      return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
    })
  );
}

function sign(payload) {
  return crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function serializeCookie(name, value, maxAgeMs) {
  const secure = process.env.NODE_ENV === "production";
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.floor(maxAgeMs / 1000)}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

function setSessionCookie(res, user) {
  const payload = Buffer.from(
    JSON.stringify({
      name: user.name,
      expiresAt: Date.now() + SESSION_MAX_AGE_MS,
    })
  ).toString("base64url");
  const value = `${payload}.${sign(payload)}`;
  res.setHeader("Set-Cookie", serializeCookie(SESSION_COOKIE, value, SESSION_MAX_AGE_MS));
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", serializeCookie(SESSION_COOKIE, "", 0));
}

function getSession(req) {
  const cookieValue = parseCookies(req)[SESSION_COOKIE];
  if (!cookieValue) return null;

  const [payload, signature] = cookieValue.split(".");
  if (!payload || !signature) return null;
  if (sign(payload) !== signature) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!session?.name || !session?.expiresAt) return null;
    if (session.expiresAt <= Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

function requireAuth(req, res) {
  const session = getSession(req);
  if (!session) {
    clearSessionCookie(res);
    res.status(401).json({ error: "Authentication required" });
    return null;
  }

  req.auth = { name: session.name, expiresAt: session.expiresAt };
  return req.auth;
}

module.exports = {
  SESSION_COOKIE,
  clearSessionCookie,
  getPassphrase,
  getSession,
  requireAuth,
  setSessionCookie,
};