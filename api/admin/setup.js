import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password too short" });
  }

  if (process.env.ADMIN_PASSWORD_HASH) {
    return res.status(400).json({ error: "Owner already set" });
  }

  // Generate hash for the user to add as env var
  const hash = await bcrypt.hash(password, 10);
  console.log("Generated ADMIN_PASSWORD_HASH:", hash);
  return res.status(200).json({ ok: true, hash, message: "Add this hash as ADMIN_PASSWORD_HASH in your Vercel environment variables." });
}
