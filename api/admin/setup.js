import bcrypt from "bcryptjs";
import { put, list } from "@vercel/blob";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  // Check if password already exists
  const { blobs } = await list({ prefix: "admin-hash", limit: 1 });
  if (blobs.length) {
    return res.status(400).json({ error: "Owner already set" });
  }

  const hash = await bcrypt.hash(password, 10);
  await put("admin-hash.txt", hash, {
    access: "public",
    contentType: "text/plain",
    addRandomSuffix: false,
  });

  return res.status(200).json({ ok: true });
}
