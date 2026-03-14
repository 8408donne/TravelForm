import React, { useState } from "react";

export default function AdminPanel({ onClose, theme, setTheme, ownerEmail, setOwnerEmail }) {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [creatingPassword, setCreatingPassword] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setTheme(t => ({ ...t, logo: event.target?.result }));
    };
    reader.readAsDataURL(file);
  };

  const tryAuth = async () => {
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (res.ok && data.authenticated) {
      setIsAuthenticated(true);
      // load settings
      const s = await fetch("/api/admin/get-settings").then(r => r.json());
      if (s?.theme) setTheme((t) => ({ ...t, ...s.theme }));
      if (s?.ownerEmail) setOwnerEmail(s.ownerEmail);
    } else {
      alert(data?.message || "Invalid password");
    }
  };

  const createPassword = async () => {
    if (!password) return alert("Enter a password to protect your admin panel.");
    setCreatingPassword(true);
    const res = await fetch("/api/admin/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    setCreatingPassword(false);
    if (res.ok) {
      alert("Password created. You are now the owner.");
      setIsAuthenticated(true);
    } else {
      alert("Could not create password.");
    }
  };

  const saveSettings = async () => {
    if (!ownerEmail) {
      alert("Please enter an email address.");
      return;
    }
    
    try {
      // Save to backend
      await fetch("/api/admin/save-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, ownerEmail })
      });
      
      // Also save to localStorage for quick access
      localStorage.setItem("travelform_owner_email", ownerEmail);
      localStorage.setItem("travelform_theme", JSON.stringify(theme));
      
      alert("Settings saved.");
    } catch (error) {
      alert("Error saving settings. Please try again.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="panel">
        <h3>Owner Login or Setup</h3>
        <p>Create a new password to become the owner or enter your existing password.</p>

        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        <div className="panel-actions">
          <button onClick={tryAuth} className="btn">Unlock</button>
          <button onClick={createPassword} className="btn secondary">{creatingPassword ? "Creating..." : "Create password"}</button>
          <button onClick={onClose} className="btn ghost">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <h3>Customise TravelForm</h3>

      <label>Title</label>
      <input value={theme.title || ""} onChange={(e) => setTheme((t) => ({ ...t, title: e.target.value }))} placeholder="Holiday Enquiry" />

      <label>Subtitle</label>
      <input value={theme.subtitle || ""} onChange={(e) => setTheme((t) => ({ ...t, subtitle: e.target.value }))} placeholder="Tell us what you're dreaming of..." />

      <label>Logo</label>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {theme.logo && <small style={{color: '#666'}}>✓ Logo uploaded</small>}

      <label>Accent Colour</label>
      <input type="color" value={theme.accent} onChange={(e) => setTheme((t) => ({ ...t, accent: e.target.value }))} />

      <label>Font Family</label>
      <select value={theme.font} onChange={(e) => setTheme((t) => ({ ...t, font: e.target.value }))}>
        <option value='Segoe UI, system-ui, -apple-system, sans-serif'>Segoe UI</option>
        <option value='Poppins, system-ui, -apple-system, sans-serif'>Poppins</option>
        <option value='Montserrat, system-ui, -apple-system, sans-serif'>Montserrat</option>
        <option value='Arial, system-ui, -apple-system, sans-serif'>Arial</option>
        <option value='Inter, system-ui, -apple-system, sans-serif'>Inter</option>
        <option value='Roboto, system-ui, -apple-system, sans-serif'>Roboto</option>
        <option value='Open Sans, system-ui, -apple-system, sans-serif'>Open Sans</option>
        <option value='Lato, system-ui, -apple-system, sans-serif'>Lato</option>
        <option value='Nunito, system-ui, -apple-system, sans-serif'>Nunito</option>
        <option value='Raleway, system-ui, -apple-system, sans-serif'>Raleway</option>
        <option value='Playfair Display, Georgia, serif'>Playfair Display</option>
        <option value='Merriweather, Georgia, serif'>Merriweather</option>
        <option value='Quicksand, system-ui, -apple-system, sans-serif'>Quicksand</option>
        <option value='DM Sans, system-ui, -apple-system, sans-serif'>DM Sans</option>
        <option value='Source Sans 3, system-ui, -apple-system, sans-serif'>Source Sans</option>
        <option value='Georgia, serif'>Georgia</option>
      </select>

      <label>Owner Email</label>
      <input value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="owner@example.com" />

      <div className="panel-actions">
        <button onClick={saveSettings} className="btn">Save</button>
        <button onClick={onClose} className="btn ghost">Close</button>
      </div>
    </div>
  );
}
