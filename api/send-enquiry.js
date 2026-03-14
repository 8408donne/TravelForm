import { Resend } from "resend";

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const enquiry = req.body;
    const ownerEmail = enquiry.ownerEmail;

    if (!ownerEmail) return res.status(400).json({ error: "No owner email provided" });
    if (!process.env.RESEND_API_KEY) return res.status(500).json({ error: "RESEND_API_KEY not configured" });

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

    const typeName = (enquiry.bookingType || "holidays").charAt(0).toUpperCase() + (enquiry.bookingType || "holidays").slice(1);

    const html = `
      <h2>New ${escapeHtml(typeName)} Enquiry</h2>
      <p><strong>Name:</strong> ${escapeHtml(enquiry.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(enquiry.email || "")}</p>
      <p><strong>Phone:</strong> ${escapeHtml(enquiry.phone || "")}</p>
      ${typeSpecificHtml}
      <p><strong>Budget:</strong> ${escapeHtml(enquiry.budget || "")}</p>
      <p><strong>Notes:</strong><br/>${escapeHtml(enquiry.notes || "").replace(/\n/g, "<br/>")}</p>
    `;

    await resend.emails.send({
      from: process.env.FROM_EMAIL || "noreply@resend.dev",
      to: ownerEmail,
      replyTo: enquiry.email,
      subject: `New ${typeName} Enquiry from ${enquiry.name}`,
      html
    });

    return res.status(200).json({ ok: true, message: "Enquiry sent" });
  } catch (err) {
    console.error("Enquiry error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
