const { setSessionCookie } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name } = req.body ?? {};
  if (!name?.trim()) {
    return res.status(400).json({ error: "Name is required" });
  }

  const user = { name: name.trim() };
  setSessionCookie(res, user);
  return res.status(200).json({ user });
};
