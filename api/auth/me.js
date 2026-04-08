const { requireAuth } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = requireAuth(req, res);
  if (!auth) return;

  return res.status(200).json({ user: { name: auth.name }, expiresAt: auth.expiresAt });
};