import React, { useEffect, useState } from "react";
import AdminPanel from "./admin/AdminPanel";
import { UK_AIRPORTS } from "./data/airports";
import { WORLD_AIRPORTS } from "./data/worldAirports";
import { DESTINATIONS } from "./data/destinations";
import { CRUISE_PORTS } from "./data/cruisePorts";
import { CRUISE_LINERS } from "./data/cruiseLiners";
import { CRUISE_SHIPS, ROOM_TYPES } from "./data/cruiseShips";

export default function App() {
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem("travelform_theme");
    return storedTheme ? JSON.parse(storedTheme) : {
      accent: "#ff7a59",
      cardBg: "rgba(255,255,255,0.96)",
      font: "Segoe UI, system-ui, -apple-system, sans-serif",
      logo: ""
    };
  });

  const [ownerEmail, setOwnerEmail] = useState(() => localStorage.getItem("travelform_owner_email") || "");
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showAdminDot] = useState(true);

  const [form, setForm] = useState({
    bookingType: "holidays",
    name: "",
    email: "",
    phone: "",
    departureAirport: "",
    arrivalAirport: "",
    allowNearbyAirports: false,
    destination: "",
    boardBasis: "",
    departurePort: "",
    cruiseLiner: "",
    ship: "",
    sailingDate: "",
    cruiseLength: "",
    roomType: "",
    eventLocation: "",
    eventDate: "",
    eventType: "",
    eventTypeOther: "",
    rooms: 1,
    roomDetails: [{ adults: 1, children: 0, childrenAges: [] }],
    dateFrom: "",
    dateTo: "",
    budget: "",
    notes: ""
  });

  const [airportSuggestions, setAirportSuggestions] = useState([]);
  const [arrivalSuggestions, setArrivalSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [portSuggestions, setPortSuggestions] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());




  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showCalendar && !e.target.closest('.date-range-container')) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showCalendar]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "rooms") {
      const numRooms = Math.max(1, parseInt(value) || 1);
      setForm((p) => {
        const existing = p.roomDetails || [];
        const roomDetails = Array.from({ length: numRooms }, (_, i) =>
          existing[i] || { adults: 1, children: 0, childrenAges: [] }
        );
        return { ...p, rooms: numRooms, roomDetails };
      });
    } else if (name === "departureAirport") {
      setForm((p) => ({ ...p, [name]: value }));
      if (value.length >= 2) {
        const filtered = UK_AIRPORTS.filter((airport) =>
          airport.code.toUpperCase().includes(value.toUpperCase()) ||
          airport.city.toUpperCase().includes(value.toUpperCase()) ||
          airport.name.toUpperCase().includes(value.toUpperCase())
        );
        setAirportSuggestions(filtered);
      } else {
        setAirportSuggestions([]);
      }
    } else if (name === "arrivalAirport") {
      setForm((p) => ({ ...p, [name]: value }));
      if (value.length >= 2) {
        const filtered = WORLD_AIRPORTS.filter((airport) =>
          airport.code.toUpperCase().includes(value.toUpperCase()) ||
          airport.city.toUpperCase().includes(value.toUpperCase()) ||
          airport.name.toUpperCase().includes(value.toUpperCase())
        );
        setArrivalSuggestions(filtered);
      } else {
        setArrivalSuggestions([]);
      }
    } else if (name === "departurePort") {
      setForm((p) => ({ ...p, [name]: value }));
      if (value.length >= 2) {
        const filtered = CRUISE_PORTS.filter((port) =>
          port.name.toUpperCase().includes(value.toUpperCase()) ||
          port.country.toUpperCase().includes(value.toUpperCase())
        );
        setPortSuggestions(filtered);
      } else {
        setPortSuggestions([]);
      }
    } else if (name === "destination") {
      setForm((p) => ({ ...p, [name]: value }));
      if (value.length >= 2) {
        const query = value.toUpperCase();
        
        // Filter destinations: prioritize starts-with matches
        const startsWithCity = DESTINATIONS.filter(d => d.city.toUpperCase().startsWith(query));
        const startsWithRegion = DESTINATIONS.filter(d => d.region.toUpperCase().startsWith(query));
        const containsCity = DESTINATIONS.filter(d => d.city.toUpperCase().includes(query) && !d.city.toUpperCase().startsWith(query));
        const containsRegion = DESTINATIONS.filter(d => d.region.toUpperCase().includes(query) && !d.region.toUpperCase().startsWith(query));
        
        // Combine and remove duplicates
        const filtered = [...startsWithCity, ...startsWithRegion, ...containsCity, ...containsRegion]
          .filter((dest, index, self) => 
            index === self.findIndex(d => d.city === dest.city && d.region === dest.region)
          )
          .slice(0, 10); // Limit to 10 results
        
        setDestinationSuggestions(filtered);
      } else {
        setDestinationSuggestions([]);
      }
    } else if (type === "checkbox") {
      setForm((p) => ({ ...p, [name]: checked }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const handleAirportSelect = (airport) => {
    setForm((p) => ({ ...p, departureAirport: `${airport.name}, ${airport.city} (${airport.code})` }));
    setAirportSuggestions([]);
  };

  const handleArrivalSelect = (airport) => {
    setForm((p) => ({ ...p, arrivalAirport: `${airport.name}, ${airport.city} (${airport.code})` }));
    setArrivalSuggestions([]);
  };

  const handlePortSelect = (port) => {
    setForm((p) => ({ ...p, departurePort: `${port.name}, ${port.country}` }));
    setPortSuggestions([]);
  };

  const handleDestinationSelect = (dest) => {
    // If city and region are the same, only show city and country
    const displayText = dest.city === dest.region 
      ? `${dest.city}, ${dest.country}` 
      : `${dest.city}, ${dest.region}, ${dest.country}`;
    setForm((p) => ({ ...p, destination: displayText }));
    setDestinationSuggestions([]);
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateSelect = (day) => {
    const selectedDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day).toISOString().split('T')[0];
    if (!form.dateFrom || (form.dateFrom && form.dateTo)) {
      setForm((p) => ({ ...p, dateFrom: selectedDate, dateTo: "" }));
    } else {
      const from = new Date(form.dateFrom);
      const to = new Date(selectedDate);
      if (to < from) {
        setForm((p) => ({ ...p, dateFrom: selectedDate, dateTo: "" }));
      } else {
        setForm((p) => ({ ...p, dateTo: selectedDate }));
        setShowCalendar(false);
      }
    }
  };

  const isDateInRange = (day) => {
    if (!form.dateFrom || !form.dateTo) return false;
    const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    const from = new Date(form.dateFrom);
    const to = new Date(form.dateTo);
    return date >= from && date <= to;
  };

  const isDateSelected = (day) => {
    const dateStr = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day).toISOString().split('T')[0];
    return dateStr === form.dateFrom || dateStr === form.dateTo;
  };

  const calculateNights = () => {
    if (!form.dateFrom || !form.dateTo) return 0;
    const from = new Date(form.dateFrom);
    const to = new Date(form.dateTo);
    const diffTime = to - from;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleClearDates = () => {
    setForm((p) => ({ ...p, dateFrom: "", dateTo: "" }));
  };

  const handleRoomChange = (roomIndex, field, value) => {
    setForm((p) => {
      const roomDetails = [...p.roomDetails];
      const room = { ...roomDetails[roomIndex] };
      if (field === "children") {
        const num = parseInt(value) || 0;
        room.children = num;
        room.childrenAges = Array(Math.max(0, num)).fill("");
      } else {
        room[field] = parseInt(value) || 0;
      }
      roomDetails[roomIndex] = room;
      return { ...p, roomDetails };
    });
  };

  const handleChildAgeChange = (roomIndex, childIndex, value) => {
    setForm((p) => {
      const roomDetails = [...p.roomDetails];
      const room = { ...roomDetails[roomIndex] };
      const ages = [...room.childrenAges];
      ages[childIndex] = value;
      room.childrenAges = ages;
      roomDetails[roomIndex] = room;
      return { ...p, roomDetails };
    });
  };

  const submit = async (e) => {
    e.preventDefault();

    // Validate that at least email or phone is provided
    if (!form.email && !form.phone) {
      alert("Please provide either an email address or phone number.");
      return;
    }

    if (!ownerEmail) { alert("This form is not configured yet. Please set your email in the admin panel."); return; 
    }

    const payload = { 
      ...form, 
      ownerEmail,
      roomDetails: form.roomDetails,
      nights: calculateNights()
    };
  
    try {
      const res = await fetch("/api/send-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Thank you — your enquiry has been sent.");
        setForm({
          bookingType: "holidays",
          name: "",
          email: "",
          phone: "",
          departureAirport: "",
          arrivalAirport: "",
          allowNearbyAirports: false,
          destination: "",
          boardBasis: "",
          departurePort: "",
          cruiseLiner: "",
          ship: "",
          sailingDate: "",
          cruiseLength: "",
          roomType: "",
          eventLocation: "",
          eventDate: "",
          eventType: "",
          eventTypeOther: "",
          rooms: 1,
          roomDetails: [{ adults: 1, children: 0, childrenAges: [] }],
          dateFrom: "",
          dateTo: "",
          budget: "",
          notes: ""
        });
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Error response:", res.status, errorData);
        alert(`Error: ${errorData.error || "There was an error sending your enquiry. Please try again."}`);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: Unable to connect to the server. Please check your connection and try again.");
    }
  };

  return (
    <div
      className="page"
      style={{
        fontFamily: theme.font
      }}
    >
      {theme.logo && <img src={theme.logo} alt="logo" className="logo" />}
        <h1 className="title" style={{ color: theme.accent }}>Holiday Enquiry</h1>
        <p className="subtitle">Tell us what you’re dreaming of and we’ll come back with ideas.</p>

        <form onSubmit={submit} className="form">
          <label>Full name</label>
          <input name="name" value={form.name} onChange={handleChange} required placeholder="Jane Smith" />

          <label>Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" />

          <label>Phone number</label>
          <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="07123 456789" />

          <label>Booking type</label>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "8px" }}>
            <label style={{ display: "flex", alignItems: "center", fontWeight: "normal", gap: "6px" }}>
              <input
                type="radio"
                name="bookingType"
                value="holidays"
                checked={form.bookingType === "holidays"}
                onChange={handleChange}
              />
              Holidays
            </label>
            <label style={{ display: "flex", alignItems: "center", fontWeight: "normal", gap: "6px" }}>
              <input
                type="radio"
                name="bookingType"
                value="flights"
                checked={form.bookingType === "flights"}
                onChange={handleChange}
              />
              Flights
            </label>
            <label style={{ display: "flex", alignItems: "center", fontWeight: "normal", gap: "6px" }}>
              <input
                type="radio"
                name="bookingType"
                value="cruise"
                checked={form.bookingType === "cruise"}
                onChange={handleChange}
              />
              Cruise
            </label>
            <label style={{ display: "flex", alignItems: "center", fontWeight: "normal", gap: "6px" }}>
              <input
                type="radio"
                name="bookingType"
                value="events"
                checked={form.bookingType === "events"}
                onChange={handleChange}
              />
              Events
            </label>
          </div>

          {form.bookingType === "holidays" && (
            <>
              <label>Departure airport</label>
              <div className="airport-wrapper">
                <input
                  name="departureAirport"
                  value={form.departureAirport}
                  onChange={handleChange}
                  required
                  placeholder="e.g. London LHR (min 2 chars)"
                />
                {airportSuggestions.length > 0 && (
                  <div className="airport-suggestions">
                    {airportSuggestions.map((airport) => (
                      <div
                        key={airport.code}
                        className="airport-item"
                        onClick={() => handleAirportSelect(airport)}
                      >
                        <strong>{airport.code}</strong> - {airport.name}, {airport.city}, {airport.country}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ marginTop: "8px" }}>
                <label style={{ display: "flex", alignItems: "center", fontWeight: "normal", gap: "8px" }}>
                  <input
                    type="checkbox"
                    name="allowNearbyAirports"
                    checked={form.allowNearbyAirports}
                    onChange={handleChange}
                  />
                  Allow nearby airports
                </label>
              </div>

              <label>Destination</label>
              <div className="airport-wrapper">
                <input
                  name="destination"
                  value={form.destination}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Greek islands (min 2 chars)"
                />
                {destinationSuggestions.length > 0 && (
                  <div className="airport-suggestions">
                    {destinationSuggestions.map((dest, idx) => (
                      <div
                        key={`${dest.city}-${dest.region}-${idx}`}
                        className="airport-item"
                        onClick={() => handleDestinationSelect(dest)}
                      >
                        {dest.city === dest.region ? (
                          <><strong>{dest.city}</strong>, {dest.country}</>
                        ) : (
                          <><strong>{dest.city}</strong>, {dest.region}, {dest.country}</>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label>Board basis</label>
              <select name="boardBasis" value={form.boardBasis} onChange={handleChange} required>
                <option value="">Select board basis</option>
                <option value="Room Only">Room Only</option>
                <option value="Bed & Breakfast">Bed & Breakfast</option>
                <option value="Half Board">Half Board</option>
                <option value="Full Board">Full Board</option>
                <option value="All Inclusive">All Inclusive</option>
              </select>
            </>
          )}

          {form.bookingType === "flights" && (
            <>
              <label>Departure airport</label>
              <div className="airport-wrapper">
                <input
                  name="departureAirport"
                  value={form.departureAirport}
                  onChange={handleChange}
                  required
                  placeholder="e.g. London LHR (min 2 chars)"
                />
                {airportSuggestions.length > 0 && (
                  <div className="airport-suggestions">
                    {airportSuggestions.map((airport) => (
                      <div
                        key={airport.code}
                        className="airport-item"
                        onClick={() => handleAirportSelect(airport)}
                      >
                        <strong>{airport.code}</strong> - {airport.name}, {airport.city}, {airport.country}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label>Arrival airport</label>
              <div className="airport-wrapper">
                <input
                  name="arrivalAirport"
                  value={form.arrivalAirport}
                  onChange={handleChange}
                  required
                  placeholder="e.g. New York JFK (min 2 chars)"
                />
                {arrivalSuggestions.length > 0 && (
                  <div className="airport-suggestions">
                    {arrivalSuggestions.map((airport) => (
                      <div
                        key={airport.code}
                        className="airport-item"
                        onClick={() => handleArrivalSelect(airport)}
                      >
                        <strong>{airport.code}</strong> - {airport.name}, {airport.city}, {airport.country}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {form.bookingType === "cruise" && (
            <>
              <label>Destination</label>
              <div className="airport-wrapper">
                <input
                  name="destination"
                  value={form.destination}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Mediterranean (min 2 chars)"
                />
                {destinationSuggestions.length > 0 && (
                  <div className="airport-suggestions">
                    {destinationSuggestions.map((dest, idx) => (
                      <div
                        key={`${dest.city}-${dest.region}-${idx}`}
                        className="airport-item"
                        onClick={() => handleDestinationSelect(dest)}
                      >
                        {dest.city === dest.region ? (
                          <><strong>{dest.city}</strong>, {dest.country}</>
                        ) : (
                          <><strong>{dest.city}</strong>, {dest.region}, {dest.country}</>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label>Departure port</label>
              <div className="airport-wrapper">
                <input
                  name="departurePort"
                  value={form.departurePort}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Southampton (min 2 chars)"
                />
                {portSuggestions.length > 0 && (
                  <div className="airport-suggestions">
                    {portSuggestions.map((port, idx) => (
                      <div
                        key={idx}
                        className="airport-item"
                        onClick={() => handlePortSelect(port)}
                      >
                        <strong>{port.name}</strong>, {port.country}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label>Cruise liner</label>
              <select name="cruiseLiner" value={form.cruiseLiner} onChange={handleChange} required>
                <option value="">Select cruise liner</option>
                <option value="Any">Any</option>
                {CRUISE_LINERS.map((liner) => (
                  <option key={liner} value={liner}>{liner}</option>
                ))}
              </select>

              <label>Ship</label>
              <select name="ship" value={form.ship} onChange={handleChange} required>
                <option value="">Select ship</option>
                <option value="Any">Any</option>
                {form.cruiseLiner && form.cruiseLiner !== "Any" && CRUISE_SHIPS[form.cruiseLiner] && CRUISE_SHIPS[form.cruiseLiner].map((ship) => (
                  <option key={ship} value={ship}>{ship}</option>
                ))}
              </select>

              <label>Sailing date</label>
              <input name="sailingDate" value={form.sailingDate} onChange={handleChange} required placeholder="e.g. May-2026" />

              <label>Length</label>
              <select name="cruiseLength" value={form.cruiseLength} onChange={handleChange} required>
                <option value="">Select cruise length</option>
                <option value="1-3 days">1-3 days</option>
                <option value="4-6 days">4-6 days</option>
                <option value="7-9 days">7-9 days</option>
                <option value="10-13 days">10-13 days</option>
                <option value="14 and more days">14 and more days</option>
                <option value="30 and more days">30 and more days</option>
              </select>

              <label>Room type</label>
              <select name="roomType" value={form.roomType} onChange={handleChange} required>
                <option value="">Select room type</option>
                <option value="Any">Any</option>
                {ROOM_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </>
          )}

          {form.bookingType === "events" && (
            <>
              <label>Event location</label>
              <input name="eventLocation" value={form.eventLocation} onChange={handleChange} required placeholder="e.g. London, Wembley Stadium" />

              <label>Event date</label>
              <input name="eventDate" value={form.eventDate} onChange={handleChange} required placeholder="e.g. 15th June 2026" />

              <label>Type of event</label>
              <select name="eventType" value={form.eventType} onChange={handleChange} required>
                <option value="">Select event type</option>
                <option value="Concert">Concert</option>
                <option value="Festival">Festival</option>
                <option value="Sporting Event">Sporting Event</option>
                <option value="Theatre">Theatre</option>
                <option value="Other">Other</option>
              </select>

              {form.eventType === "Other" && (
                <>
                  <label>Please specify</label>
                  <input name="eventTypeOther" value={form.eventTypeOther} onChange={handleChange} required placeholder="e.g. Exhibition" />
                </>
              )}
            </>
          )}

          {(form.bookingType === "holidays" || form.bookingType === "cruise") && (
            <div>
              <label>Number of rooms</label>
              <input type="number" min="1" max="9" name="rooms" value={form.rooms} onChange={handleChange} />
            </div>
          )}

          {form.roomDetails.map((room, roomIndex) => (
            <div key={roomIndex}>
              {form.rooms > 1 && <label style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "4px" }}>Room {roomIndex + 1}</label>}
              <div className="row">
                <div>
                  <label>Adults</label>
                  <input type="number" min="1" value={room.adults} onChange={(e) => handleRoomChange(roomIndex, "adults", e.target.value)} />
                </div>
                <div>
                  <label>Children</label>
                  <input type="number" min="0" value={room.children} onChange={(e) => handleRoomChange(roomIndex, "children", e.target.value)} />
                </div>
              </div>
              {room.children > 0 && (
                <div className="children-ages">
                  <label>Children's ages</label>
                  <div className="ages-row">
                    {Array.from({ length: room.children }).map((_, childIndex) => (
                      <input
                        key={childIndex}
                        type="number"
                        min="0"
                        max="18"
                        placeholder={`Child ${childIndex + 1} age`}
                        value={room.childrenAges[childIndex] || ""}
                        onChange={(e) => handleChildAgeChange(roomIndex, childIndex, e.target.value)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {(form.bookingType === "holidays" || form.bookingType === "flights") && (
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <label>Preferred dates</label>
                <div className="date-range-container">
                  <input
                    type="text"
                    readOnly
                    value={form.dateFrom && form.dateTo ? `${form.dateFrom} to ${form.dateTo}` : form.dateFrom ? `From: ${form.dateFrom}` : "Select dates"}
                    onClick={() => setShowCalendar(!showCalendar)}
                    placeholder="Click to select dates"
                    className="date-range-input"
                  />
                  {showCalendar && (
                    <div className="calendar-popup">
                      <div className="calendar-header">
                        <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}>←</button>
                        <span>{calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                        <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}>→</button>
                      </div>
                      {form.dateFrom && (
                        <div style={{ padding: "8px", textAlign: "center", borderBottom: "1px solid #e5e7eb" }}>
                          <button type="button" onClick={handleClearDates} style={{ background: "#ef4444", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "0.9rem" }}>Clear dates</button>
                        </div>
                      )}
                      <div className="calendar-weekdays">
                        <div>Sun</div>
                        <div>Mon</div>
                        <div>Tue</div>
                        <div>Wed</div>
                        <div>Thu</div>
                        <div>Fri</div>
                        <div>Sat</div>
                      </div>
                      <div className="calendar-days">
                        {Array.from({ length: getFirstDayOfMonth(calendarMonth) }).map((_, i) => (
                          <div key={`empty-${i}`} className="calendar-day empty"></div>
                        ))}
                        {Array.from({ length: getDaysInMonth(calendarMonth) }).map((_, i) => {
                          const day = i + 1;
                          return (
                            <button
                              key={day}
                              type="button"
                              className={`calendar-day ${isDateInRange(day) ? 'in-range' : ''} ${isDateSelected(day) ? 'selected' : ''}`}
                              onClick={() => handleDateSelect(day)}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {form.dateFrom && form.dateTo && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.9rem", fontWeight: "600" }}>Nights</label>
                  <div className="nights-display">
                    <div className="nights-number">{calculateNights()}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          <label>Approximate budget</label>
          <input name="budget" value={form.budget} onChange={handleChange} required placeholder="e.g. £1,500 total" />

          <label>Anything else we should know?</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows="4" placeholder="Holiday type, excursion, park tickets, must‑haves..." />

          <button type="submit" className="button" style={{ background: theme.accent }}>Send enquiry</button>
        </form>

      {showAdminDot && (
        <button
          aria-label="admin"
          className="admin-dot"
          onClick={() => {
            // reveal admin panel modal
            setIsAdminUnlocked(true);
          }}
          title="Admin"
        />
      )}

      {isAdminUnlocked && (
        <AdminPanel
          onClose={() => setIsAdminUnlocked(false)}
          theme={theme}
          setTheme={setTheme}
          ownerEmail={ownerEmail}
          setOwnerEmail={setOwnerEmail}
        />
      )}
    </div>
  );
}
