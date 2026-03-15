import { list } from "@vercel/blob";

export default async function handler(req, res) {
  try {
    const { blobs } = await list({ prefix: "settings", limit: 1 });
    if (!blobs.length) return res.status(200).json({});

    const response = await fetch(blobs[0].url);
    const theme = await response.json();
    return res.status(200).json({ theme });
  } catch (err) {
    console.error("Get settings error:", err);
    return res.status(200).json({});
  }
}
