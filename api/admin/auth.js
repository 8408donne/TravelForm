import bcrypt from "bcryptjs";
import { list } from "@vercel/blob";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { password } = req.body;

  // Try Blob first, then fall back to env var
  let storedHash = null;
  try {
    const { blobs } = await list({ prefix: "admin-hash", limit: 1 });
    if (blobs.length) {
      const response = await fetch(blobs[0].url);
      storedHash = await response.text();
    }
  } catch (e) { /* ignore */ }

  if (!storedHash) storedHash = process.env.ADMIN_PASSWORD_HASH;
  if (!storedHash) {
    return res.status(400).json({ authenticated: false, needsSetup: true, message: "No admin password set. Please create one." });
  }

  const match = await bcrypt.compare(password, storedHash);
  if (match) {
    return res.status(200).json({ authenticated: true });
  }
  return res.status(401).json({ authenticated: false, message: "Invalid password" });
}
