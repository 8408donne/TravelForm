import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { password } = req.body;
  const storedHash = process.env.ADMIN_PASSWORD_HASH;

  if (!storedHash) {
    return res.status(400).json({ authenticated: false, message: "Admin password not configured. Set ADMIN_PASSWORD_HASH env var." });
  }

  const match = await bcrypt.compare(password, storedHash);
  if (match) {
    return res.status(200).json({ authenticated: true });
  }
  return res.status(401).json({ authenticated: false, message: "Invalid password" });
}
