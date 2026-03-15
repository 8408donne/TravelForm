import { put } from "@vercel/blob";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { theme } = req.body;
    if (!theme) return res.status(400).json({ error: "No theme provided" });

    let logoUrl = theme.logo || "";

    // If logo is a base64 data URL, upload it to Blob storage
    if (logoUrl.startsWith("data:")) {
      const match = logoUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        const contentType = match[1];
        const ext = contentType.split("/")[1];
        const buffer = Buffer.from(match[2], "base64");
        const blob = await put(`logo.${ext}`, buffer, {
          access: "public",
          contentType,
          addRandomSuffix: false,
        });
        logoUrl = blob.url;
      }
    }

    // Save theme settings (with blob URL instead of base64)
    const settings = { ...theme, logo: logoUrl };
    await put("settings.json", JSON.stringify(settings), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    });

    return res.status(200).json({ ok: true, logo: logoUrl });
  } catch (err) {
    console.error("Save settings error:", err);
    return res.status(500).json({ error: "Failed to save settings" });
  }
}
