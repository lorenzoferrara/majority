const { getPassphrase, setSessionCookie } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, passphrase } = req.body ?? {};
  if (!name?.trim() || !passphrase) {
    return res.status(400).json({ error: "Name and passphrase are required" });
  }

  const expectedPassphrase = getPassphrase();
  if (!expectedPassphrase || passphrase !== expectedPassphrase) {
    return res.status(401).json({ error: "Wrong passphrase" });
  }

  const user = { name: name.trim() };
  setSessionCookie(res, user);
  return res.status(200).json({ user });
};