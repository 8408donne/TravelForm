import express from "express";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
const envFile = ".env.local";
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, "utf-8");
  envContent.split("\n").forEach(line => {
    const [key, value] = line.split("=");
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
  console.log("✓ Environment variables loaded from .env.local");
}

const app = express();
app.use(express.json());

// Serve static frontend in production
const distPath = path.join(__dirname, "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.join(__dirname, "admin-data.json");
const enquiriesFile = path.join(__dirname, "enquiries.json");

// Load or initialize data
function loadData() {
  if (fs.existsSync(dataFile)) {
    return JSON.parse(fs.readFileSync(dataFile, "utf-8"));
  }
  return { passwordHash: null, settings: {} };
}

function saveData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// Load or initialize enquiries
function loadEnquiries() {
  if (fs.existsSync(enquiriesFile)) {
    return JSON.parse(fs.readFileSync(enquiriesFile, "utf-8"));
  }
  return [];
}

function saveEnquiries(enquiries) {
  fs.writeFileSync(enquiriesFile, JSON.stringify(enquiries, null, 2));
}

// Setup endpoint - create password
app.post("/api/admin/setup", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password too short" });
    }

    const data = loadData();
    if (data.passwordHash) {
      return res.status(400).json({ error: "Owner already set" });
    }

    const hash = await bcrypt.hash(password, 10);
    data.passwordHash = hash;
    saveData(data);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Setup error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Auth endpoint - verify password
app.post("/api/admin/auth", async (req, res) => {
  try {
    const { password } = req.body;
    const data = loadData();

    if (!data.passwordHash) {
      return res.status(400).json({ authenticated: false, message: "Password not set up yet" });
    }

    const match = await bcrypt.compare(password, data.passwordHash);
    if (match) {
      return res.status(200).json({ authenticated: true });
    }
    return res.status(401).json({ authenticated: false, message: "Invalid password" });
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).json({ authenticated: false, message: "Server error" });
  }
});

// Get settings
app.get("/api/admin/get-settings", (req, res) => {
  const data = loadData();
  res.json(data.settings || {});
});

// Save settings
app.post("/api/admin/save-settings", (req, res) => {
  try {
    const data = loadData();
    data.settings = req.body;
    saveData(data);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Send enquiry
app.post("/api/send-enquiry", async (req, res) => {
  try {
    const enquiry = {
      ...req.body,
      submittedAt: new Date().toISOString(),
      id: Date.now()
    };

    // Save enquiry
    const enquiries = loadEnquiries();
    enquiries.push(enquiry);
    saveEnquiries(enquiries);
    
    console.log("✓ Enquiry saved:", enquiry.id, enquiry.name, enquiry.email);

    // Get owner email
    const data = loadData();
    const ownerEmail = data.settings?.ownerEmail;

    // Try to send email if owner email is set and we have Resend API key
    if (ownerEmail && process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        const roomDetailsHtml = (enquiry.roomDetails || []).map((room, i) => {
          const label = (enquiry.roomDetails || []).length > 1 ? `<strong>Room ${i + 1}:</strong> ` : "";
          let html = `<p>${label}<strong>Adults:</strong> ${room.adults}, <strong>Children:</strong> ${room.children}</p>`;
          if (room.childrenAges?.length) html += `<p><strong>Children's Ages:</strong> ${room.childrenAges.join(", ")}</p>`;
          return html;
        }).join("");

        let typeSpecificHtml = "";

        if (enquiry.bookingType === "holidays") {
          typeSpecificHtml = `
            <p><strong>Departure Airport:</strong> ${escapeHtml(enquiry.departureAirport || "")}</p>
            <p><strong>Allow Nearby Airports:</strong> ${enquiry.allowNearbyAirports ? "Yes" : "No"}</p>
            <p><strong>Destination:</strong> ${escapeHtml(enquiry.destination || "")}</p>
            <p><strong>Board Basis:</strong> ${escapeHtml(enquiry.boardBasis || "")}</p>
            <p><strong>Rooms:</strong> ${enquiry.rooms || 1}</p>
            ${roomDetailsHtml}
            <p><strong>Dates:</strong> ${escapeHtml(enquiry.dateFrom || "")} to ${escapeHtml(enquiry.dateTo || "")}</p>
            <p><strong>Nights:</strong> ${enquiry.nights || ""}</p>
          `;
        } else if (enquiry.bookingType === "flights") {
          typeSpecificHtml = `
            <p><strong>Departure Airport:</strong> ${escapeHtml(enquiry.departureAirport || "")}</p>
            <p><strong>Arrival Airport:</strong> ${escapeHtml(enquiry.arrivalAirport || "")}</p>
            ${roomDetailsHtml}
            <p><strong>Dates:</strong> ${escapeHtml(enquiry.dateFrom || "")} to ${escapeHtml(enquiry.dateTo || "")}</p>
            <p><strong>Nights:</strong> ${enquiry.nights || ""}</p>
          `;
        } else if (enquiry.bookingType === "cruise") {
          typeSpecificHtml = `
            <p><strong>Destination:</strong> ${escapeHtml(enquiry.destination || "")}</p>
            <p><strong>Departure Port:</strong> ${escapeHtml(enquiry.departurePort || "")}</p>
            <p><strong>Cruise Liner:</strong> ${escapeHtml(enquiry.cruiseLiner || "")}</p>
            <p><strong>Ship:</strong> ${escapeHtml(enquiry.ship || "")}</p>
            <p><strong>Sailing Date:</strong> ${escapeHtml(enquiry.sailingDate || "")}</p>
            <p><strong>Length:</strong> ${escapeHtml(enquiry.cruiseLength || "")}</p>
            <p><strong>Room Type:</strong> ${escapeHtml(enquiry.roomType || "")}</p>
            <p><strong>Rooms:</strong> ${enquiry.rooms || 1}</p>
            ${roomDetailsHtml}
          `;
        } else if (enquiry.bookingType === "events") {
          typeSpecificHtml = `
            <p><strong>Event Location:</strong> ${escapeHtml(enquiry.eventLocation || "")}</p>
            <p><strong>Event Date:</strong> ${escapeHtml(enquiry.eventDate || "")}</p>
            <p><strong>Event Type:</strong> ${escapeHtml(enquiry.eventType === "Other" ? enquiry.eventTypeOther || "Other" : enquiry.eventType || "")}</p>
            ${roomDetailsHtml}
          `;
        }

        const html = `
          <h2>New ${escapeHtml((enquiry.bookingType || "holidays").charAt(0).toUpperCase() + (enquiry.bookingType || "holidays").slice(1))} Enquiry</h2>
          <p><strong>Name:</strong> ${escapeHtml(enquiry.name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(enquiry.email || "")}</p>
          <p><strong>Phone:</strong> ${escapeHtml(enquiry.phone || "")}</p>
          ${typeSpecificHtml}
          <p><strong>Budget:</strong> ${escapeHtml(enquiry.budget || "")}</p>
          <p><strong>Notes:</strong><br/>${escapeHtml(enquiry.notes || "").replace(/\n/g, "<br/>")}</p>
        `;

        const result = await resend.emails.send({
          from: process.env.FROM_EMAIL || "noreply@resend.dev",
          to: ownerEmail,
          replyTo: enquiry.email,
          subject: `New ${(enquiry.bookingType || "holidays").charAt(0).toUpperCase() + (enquiry.bookingType || "holidays").slice(1)} Enquiry from ${enquiry.name}`,
          html
        });

        console.log("✓ Email sent to:", ownerEmail, "response:", JSON.stringify(result));
      } catch (emailErr) {
        console.log("ℹ Email send failed (enquiry saved locally):", emailErr.message || emailErr);
      }
    } else {
      console.log("ℹ No owner email configured or Resend not set up");
      console.log("→ Enquiry saved locally. To send emails, set RESEND_API_KEY and configure owner email in admin panel.");
    }

    // Admin helper: endpoint to resend a saved enquiry by id (for debugging)
    // POST /api/admin/resend-enquiry { id: 123 }

    return res.status(200).json({ ok: true, message: "Enquiry received" });
  } catch (err) {
    console.error("Enquiry error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Resend a saved enquiry (admin helper)
app.post("/api/admin/resend-enquiry", async (req, res) => {
  try {
    const { id } = req.body || {};
    const enquiries = loadEnquiries();
    const enquiry = id ? enquiries.find((e) => e.id === id) : enquiries[enquiries.length - 1];
    if (!enquiry) return res.status(404).json({ error: "Enquiry not found" });

    const data = loadData();
    const ownerEmail = data.settings?.ownerEmail;
    if (!ownerEmail) return res.status(400).json({ error: "Owner email not configured" });
    if (!process.env.RESEND_API_KEY) return res.status(400).json({ error: "RESEND_API_KEY not configured" });

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const html = `
      <h2>Resent Travel Enquiry</h2>
      <p><strong>Name:</strong> ${escapeHtml(enquiry.name)}</p>
      <p><strong>From:</strong> ${escapeHtml(enquiry.email)}</p>
      <p><strong>Destination:</strong> ${escapeHtml(enquiry.destination || "")}</p>
      <p><strong>Dates:</strong> ${escapeHtml(enquiry.dateFrom || "")} to ${escapeHtml(enquiry.dateTo || "")}</p>
      <p><strong>Adults:</strong> ${enquiry.adults || ""}, <strong>Children:</strong> ${enquiry.children || ""}</p>
      <p><strong>Notes:</strong><br/>${escapeHtml(enquiry.notes || "").replace(/\n/g, "<br/>")}</p>
    `;

    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL || "noreply@resend.dev",
      to: ownerEmail,
      subject: `Resent TravelForm Enquiry from ${enquiry.name}`,
      html
    });

    console.log("Resend result:", JSON.stringify(result));
    return res.json({ ok: true, result });
  } catch (err) {
    console.error("Resend error:", err);
    return res.status(500).json({ error: "Failed to resend" });
  }
});

// Catch-all: serve index.html for client-side routing
if (fs.existsSync(distPath)) {
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
