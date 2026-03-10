import React, { useEffect, useState } from "react";
import AdminPanel from "./admin/AdminPanel";
import { UK_AIRPORTS, DESTINATIONS } from "./data/airports";

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
    name: "",
    email: "",
    departureAirport: "",
    allowNearbyAirports: false,
    destination: "",
    adults: 1,
    children: 0,
    childrenAges: [],
    dateFrom: "",
    dateTo: "",
    budget: "",
    notes: ""
  });

  const [airportSuggestions, setAirportSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
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
    if (name === "children") {
      const numChildren = parseInt(value) || 0;
      const ages = Array(Math.max(0, numChildren)).fill("");
      setForm((p) => ({ ...p, [name]: numChildren, childrenAges: ages }));
    } else if (name === "departureAirport") {
      setForm((p) => ({ ...p, [name]: value }));
      if (value.length >= 3) {
        const filtered = UK_AIRPORTS.filter((airport) =>
          airport.code.toUpperCase().includes(value.toUpperCase()) ||
          airport.city.toUpperCase().includes(value.toUpperCase()) ||
          airport.name.toUpperCase().includes(value.toUpperCase())
        );
        setAirportSuggestions(filtered);
      } else {
        setAirportSuggestions([]);
      }
    } else if (name === "destination") {
      setForm((p) => ({ ...p, [name]: value }));
      if (value.length >= 3) {
        const filtered = DESTINATIONS.filter((dest) =>
          dest.toUpperCase().includes(value.toUpperCase())
        );
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

  const handleDestinationSelect = (destination) => {
    setForm((p) => ({ ...p, destination }));
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

  const handleChildAgeChange = (index, value) => {
    setForm((p) => {
      const updatedAges = [...p.childrenAges];
      updatedAges[index] = value;
      return { ...p, childrenAges: updatedAges };
    });
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!ownerEmail) { alert("This form is not configured yet. Please set your email in the admin panel."); return; 
    }

    const payload = { 
      ...form, 
      ownerEmail,
      childrensAges: form.childrenAges,
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
          name: "",
          email: "",
          departureAirport: "",
          allowNearbyAirports: false,
          destination: "",
          adults: 1,
          children: 0,
          childrenAges: [],
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
          <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" />

          <label>Departure airport</label>
          <div className="airport-wrapper">
            <input
              name="departureAirport"
              value={form.departureAirport}
              onChange={handleChange}
              placeholder="e.g. London LHR (min 3 chars)"
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
              placeholder="e.g. Greek islands (min 3 chars)"
            />
            {destinationSuggestions.length > 0 && (
              <div className="airport-suggestions">
                {destinationSuggestions.map((dest) => (
                  <div
                    key={dest}
                    className="airport-item"
                    onClick={() => handleDestinationSelect(dest)}
                  >
                    {dest}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="row">
            <div>
              <label>Number of adults</label>
              <input type="number" min="1" name="adults" value={form.adults} onChange={handleChange} />
            </div>
            <div>
              <label>Number of children</label>
              <input type="number" min="0" name="children" value={form.children} onChange={handleChange} />
            </div>
          </div>

          {form.children > 0 && (
            <div className="children-ages">
              <label>Children's ages</label>
              <div className="ages-row">
                {Array.from({ length: form.children }).map((_, index) => (
                  <input
                    key={index}
                    type="number"
                    min="0"
                    max="18"
                    placeholder={`Child ${index + 1} age`}
                    value={form.childrenAges[index] || ""}
                    onChange={(e) => handleChildAgeChange(index, e.target.value)}
                  />
                ))}
              </div>
            </div>
          )}

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

          <label>Approximate budget</label>
          <input name="budget" value={form.budget} onChange={handleChange} placeholder="e.g. £1,500 total" />

          <label>Anything else we should know?</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows="4" placeholder="Holiday type, excursion, park tickets, must‑haves..." />

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
