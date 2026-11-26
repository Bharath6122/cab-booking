import { useCallback, useEffect, useState } from "react";
import api, { errorMessage } from "../api";
import { Button, EmptyState, Field, Notice, SelectField, Spinner, StatusPill } from "../components/UI";
import { BookingTable } from "./Dashboard";

const TABS = ["Overview", "Bookings", "Cabs", "Drivers", "Users"];
const CURRENCY = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function Admin() {
  const [tab, setTab] = useState("Overview");
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [cabs, setCabs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      if (tab === "Overview") {
        const [dashboard, allBookings] = await Promise.all([api.get("/admin/dashboard/stats"), api.get("/bookings")]);
        setStats(dashboard.data);
        setBookings(allBookings.data);
      } else if (tab === "Bookings") {
        const { data } = await api.get("/bookings");
        setBookings(data);
      } else if (tab === "Cabs") {
        const [cabData, driverData] = await Promise.all([api.get("/cabs"), api.get("/drivers")]);
        setCabs(cabData.data);
        setDrivers(driverData.data);
      } else if (tab === "Drivers") {
        const { data } = await api.get("/drivers");
        setDrivers(data);
      } else {
        const { data } = await api.get("/users?page=0&size=100");
        setUsers(data.content || []);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  return (
    <main className="app-page admin-page">
      <div className="dashboard-welcome"><div><span className="eyebrow">THE CABBY CONTROL ROOM</span><h1>Admin space<span className="brand-period">.</span></h1><p>Keep every ride running smoothly.</p></div><span className="admin-badge">✳ &nbsp;ADMIN</span></div>
      <div className="admin-tabs" role="tablist">{TABS.map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)} role="tab" aria-selected={tab === item}>{item}</button>)}</div>
      <Notice>{error}</Notice>
      {loading ? <Spinner label="Loading the admin workspace..." /> : <>
        {tab === "Overview" && stats && <Overview stats={stats} bookings={bookings} />}
        {tab === "Bookings" && <AdminBookings bookings={bookings} refresh={load} />}
        {tab === "Cabs" && <CabManagement cabs={cabs} drivers={drivers} refresh={load} />}
        {tab === "Drivers" && <DriverManagement drivers={drivers} refresh={load} />}
        {tab === "Users" && <UserManagement users={users} refresh={load} />}
      </>}
    </main>
  );
}

function Overview({ stats, bookings }) {
  const items = [
    ["TOTAL USERS", stats.totalUsers, "↗"], ["TOTAL DRIVERS", stats.totalDrivers, "✳"],
    ["TOTAL CABS", stats.totalCabs, "⌁"], ["TOTAL BOOKINGS", stats.totalBookings, "◒"],
    ["COMPLETED RIDES", stats.completedRides, "✓"], ["CANCELLED RIDES", stats.cancelledRides, "×"],
  ];
  return <>
    <div className="metric-grid admin-metrics">{items.map(([label, value, icon]) => <article className="metric-card" key={label}><span>{label}</span><strong>{value}</strong><small>{label === "TOTAL CABS" ? `${stats.availableCabs} available now` : label === "TOTAL DRIVERS" ? `${stats.availableDrivers} available now` : "All-time count"}</small><span className="metric-symbol">{icon}</span></article>)}</div>
    <div className="content-card admin-revenue"><span className="eyebrow">COMPLETED RIDE REVENUE</span><strong>{CURRENCY.format(stats.revenue || 0)}</strong><small>Based on completed booking fares</small></div>
    <section className="content-card"><div className="content-card-heading"><div><span className="eyebrow">THE PULSE</span><h2>Recent bookings</h2></div></div>{bookings.length ? <BookingTable bookings={bookings.slice(0, 8)} /> : <EmptyState title="No rides to report yet">Your booking activity will show up here.</EmptyState>}</section>
  </>;
}

function AdminBookings({ bookings, refresh }) {
  const [error, setError] = useState("");
  async function changeStatus(id, status) {
    setError("");
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    }
  }
  return <section className="content-card"><div className="content-card-heading"><div><span className="eyebrow">RIDE OPERATIONS</span><h2>Bookings</h2></div></div><Notice>{error}</Notice><div className="table-scroll"><table className="data-table"><thead><tr><th>REFERENCE / CUSTOMER</th><th>ROUTE</th><th>FARE</th><th>STATUS</th><th>UPDATE STATUS</th></tr></thead><tbody>{bookings.map((booking) => <tr key={booking.id}><td><b>{booking.bookingReference}</b><span className="table-sub">{booking.customerName}</span></td><td>{booking.pickupLocation}<span className="table-sub">to {booking.dropLocation}</span></td><td>{CURRENCY.format(booking.estimatedFare)}</td><td><StatusPill status={booking.status} /></td><td><select className="table-select" aria-label={`Set status for ${booking.bookingReference}`} value="" onChange={(e) => e.target.value && changeStatus(booking.id, e.target.value)}><option value="">Change...</option>{nextStatuses(booking.status).map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></td></tr>)}</tbody></table></div></section>;
}

function nextStatuses(status) {
  return ({ PENDING: ["CONFIRMED", "CANCELLED"], CONFIRMED: ["IN_PROGRESS", "CANCELLED"], IN_PROGRESS: ["COMPLETED"], COMPLETED: [], CANCELLED: [] })[status] || [];
}

function CabManagement({ cabs, drivers, refresh }) {
  const blank = { cabName: "", cabType: "MINI", registrationNumber: "", seatingCapacity: 4, pricePerKm: 15, status: "AVAILABLE", assignedDriverId: "" };
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function edit(cab) {
    setEditing(cab.id);
    setForm({ cabName: cab.cabName, cabType: cab.cabType, registrationNumber: cab.registrationNumber, seatingCapacity: cab.seatingCapacity, pricePerKm: cab.pricePerKm, status: cab.status, assignedDriverId: String(cab.assignedDriverId || "") });
    document.getElementById("cab-editor")?.scrollIntoView({ behavior: "smooth" });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const body = { ...form, assignedDriverId: Number(form.assignedDriverId), seatingCapacity: Number(form.seatingCapacity), pricePerKm: Number(form.pricePerKm) };
      if (editing) await api.put(`/cabs/${editing}`, body);
      else await api.post("/cabs", body);
      setForm(blank);
      setEditing(null);
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this cab?")) return;
    setError("");
    try {
      await api.delete(`/cabs/${id}`);
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return <div className="management-layout"><section className="content-card"><div className="content-card-heading"><div><span className="eyebrow">THE FLEET</span><h2>Cabs</h2></div></div><Notice>{error}</Notice><div className="table-scroll"><table className="data-table"><thead><tr><th>VEHICLE</th><th>TYPE / RATE</th><th>DRIVER</th><th>STATUS</th><th /></tr></thead><tbody>{cabs.map((cab) => <tr key={cab.id}><td><b>{cab.cabName}</b><span className="table-sub">{cab.registrationNumber}</span></td><td>{cab.cabType}<span className="table-sub">₹{cab.pricePerKm}/km</span></td><td>{cab.driverName || "—"}</td><td><StatusPill status={cab.status} /></td><td><button className="table-action" onClick={() => edit(cab)}>Edit</button><button className="table-action danger-link" onClick={() => remove(cab.id)}>Delete</button></td></tr>)}</tbody></table></div></section>
    <section id="cab-editor" className="content-card editor-card"><div className="content-card-heading"><div><span className="eyebrow">{editing ? "UPDATE VEHICLE" : "ADD TO THE FLEET"}</span><h2>{editing ? "Edit cab" : "New cab"}</h2></div></div><Notice>{error}</Notice><form className="editor-form" onSubmit={submit}><Field label="Cab name" value={form.cabName} onChange={(e) => setForm({ ...form, cabName: e.target.value })} required /><SelectField label="Cab type" value={form.cabType} onChange={(e) => setForm({ ...form, cabType: e.target.value })}>{["MINI", "SEDAN", "SUV", "PREMIUM"].map((v) => <option key={v}>{v}</option>)}</SelectField><Field label="Registration number" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} required /><Field label="Seats" type="number" min="1" max="12" value={form.seatingCapacity} onChange={(e) => setForm({ ...form, seatingCapacity: e.target.value })} required /><Field label="Price per km (₹)" type="number" min="0.01" step="0.01" value={form.pricePerKm} onChange={(e) => setForm({ ...form, pricePerKm: e.target.value })} required /><SelectField label="Assigned driver" value={form.assignedDriverId} onChange={(e) => setForm({ ...form, assignedDriverId: e.target.value })} required><option value="">Choose driver</option>{drivers.filter((driver) => driver.status === "AVAILABLE" || String(driver.id) === form.assignedDriverId).map((driver) => <option key={driver.id} value={driver.id}>{driver.fullName} · {driver.status}</option>)}</SelectField><SelectField label="Vehicle status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{["AVAILABLE", "MAINTENANCE"].map((v) => <option key={v}>{v}</option>)}</SelectField><div className="editor-actions"><Button type="submit" disabled={busy}>{busy ? "Saving..." : editing ? "Save changes" : "Add cab"}</Button>{editing && <Button type="button" variant="subtle" onClick={() => { setEditing(null); setForm(blank); }}>Cancel</Button>}</div></form></section></div>;
}

function DriverManagement({ drivers, refresh }) {
  const blank = { fullName: "", phone: "", licenseNumber: "", experienceYears: 0, status: "AVAILABLE" };
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = { ...form, experienceYears: Number(form.experienceYears) };
      if (editing) await api.put(`/drivers/${editing}`, body);
      else await api.post("/drivers", body);
      setForm(blank);
      setEditing(null);
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(driver) {
    if (!window.confirm(`Delete ${driver.fullName}?`)) return;
    setError("");
    try {
      await api.delete(`/drivers/${driver.id}`);
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return <div className="management-layout"><section className="content-card"><div className="content-card-heading"><div><span className="eyebrow">THE PEOPLE BEHIND THE WHEEL</span><h2>Drivers</h2></div></div><Notice>{error}</Notice><div className="table-scroll"><table className="data-table"><thead><tr><th>DRIVER</th><th>LICENSE</th><th>EXPERIENCE</th><th>STATUS</th><th /></tr></thead><tbody>{drivers.map((driver) => <tr key={driver.id}><td><b>{driver.fullName}</b><span className="table-sub">{driver.phone}</span></td><td>{driver.licenseNumber}</td><td>{driver.experienceYears} years</td><td><StatusPill status={driver.status} /></td><td><button className="table-action" onClick={() => { setEditing(driver.id); setForm({ fullName: driver.fullName, phone: driver.phone, licenseNumber: driver.licenseNumber, experienceYears: driver.experienceYears, status: driver.status }); }}>Edit</button><button className="table-action danger-link" onClick={() => remove(driver)}>Delete</button></td></tr>)}</tbody></table></div></section>
    <section className="content-card editor-card"><div className="content-card-heading"><div><span className="eyebrow">{editing ? "UPDATE PROFILE" : "WELCOME ABOARD"}</span><h2>{editing ? "Edit driver" : "New driver"}</h2></div></div><Notice>{error}</Notice><form className="editor-form" onSubmit={submit}><Field label="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /><Field label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /><Field label="License number" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} required /><Field label="Experience (years)" type="number" min="0" max="60" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} required /><SelectField label="Availability" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{["AVAILABLE", "INACTIVE"].map((v) => <option key={v}>{v}</option>)}</SelectField><div className="editor-actions"><Button type="submit" disabled={busy}>{busy ? "Saving..." : editing ? "Save changes" : "Add driver"}</Button>{editing && <Button type="button" variant="subtle" onClick={() => { setEditing(null); setForm(blank); }}>Cancel</Button>}</div></form></section></div>;
}

function UserManagement({ users, refresh }) {
  const [error, setError] = useState("");
  async function remove(user) {
    if (!window.confirm(`Delete ${user.fullName}?`)) return;
    setError("");
    try {
      await api.delete(`/users/${user.id}`);
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    }
  }
  return <section className="content-card"><div className="content-card-heading"><div><span className="eyebrow">YOUR COMMUNITY</span><h2>Users</h2></div></div><Notice>{error}</Notice>{users.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>NAME</th><th>EMAIL</th><th>PHONE</th><th>ROLE</th><th>JOINED</th><th /></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><b>{user.fullName}</b></td><td>{user.email}</td><td>{user.phone}</td><td><StatusPill status={user.role} /></td><td>{new Date(user.createdAt).toLocaleDateString("en-IN")}</td><td>{user.role !== "ROLE_ADMIN" && <button className="table-action danger-link" onClick={() => remove(user)}>Delete</button>}</td></tr>)}</tbody></table></div> : <EmptyState title="No users found">New riders will appear here.</EmptyState>}</section>;
}
