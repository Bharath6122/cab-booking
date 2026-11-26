import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import api, { errorMessage } from "../api";
import { useAuth } from "../context/AuthContext";
import { BookingTable } from "./Dashboard";
import { Button, EmptyState, Field, Notice, SelectField, Spinner } from "../components/UI";
import { toLocalDateTimeInput } from "../utils/date";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function BookRide() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [form, setForm] = useState({
    pickupLocation: search.get("pickupLocation") || "",
    dropLocation: search.get("dropLocation") || "",
    distanceKm: search.get("distanceKm") || "10",
    bookingDateTime: search.get("bookingDateTime") || toLocalDateTimeInput(new Date(Date.now() + 3600000)),
    cabType: search.get("cabType") || "",
    cabId: "",
  });
  const [cabs, setCabs] = useState([]);
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selectedCab = useMemo(() => cabs.find((cab) => String(cab.id) === form.cabId), [cabs, form.cabId]);

  useEffect(() => {
    if (!selectedCab || Number(form.distanceKm) < 0.1) {
      setQuote(null);
      return;
    }
    let active = true;
    setQuoteLoading(true);
    api.get("/fares/estimate", { params: { cabId: selectedCab.id, distanceKm: form.distanceKm } })
      .then(({ data }) => { if (active) setQuote(data); })
      .catch(() => { if (active) setQuote(null); })
      .finally(() => { if (active) setQuoteLoading(false); });
    return () => { active = false; };
  }, [selectedCab, form.distanceKm]);

  useEffect(() => {
    api.get("/cabs/available")
      .then(({ data }) => {
        setCabs(data);
        const preferred = search.get("cabType");
        const first = data.find((cab) => cab.cabType === preferred) || data[0];
        if (first) setForm((current) => ({ ...current, cabType: current.cabType || first.cabType, cabId: current.cabId || String(first.id) }));
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [search]);

  const types = [...new Set(cabs.map((cab) => cab.cabType))];
  const visibleCabs = cabs.filter((cab) => !form.cabType || cab.cabType === form.cabType);

  async function submit(event) {
    event.preventDefault();
    if (!user) {
      navigate("/login", { state: { from: { pathname: "/book" } } });
      return;
    }
    if (!form.cabId) {
      setError("Choose an available ride before continuing.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/bookings", {
        cabId: Number(form.cabId),
        pickupLocation: form.pickupLocation,
        dropLocation: form.dropLocation,
        distanceKm: Number(form.distanceKm),
        bookingDateTime: form.bookingDateTime,
      });
      navigate(`/booking/${data.id}`, { state: { booking: data } });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-page booking-page">
      <Link to="/" className="back-link">← Back home</Link>
      <div className="page-heading"><span className="eyebrow">A GOOD RIDE STARTS HERE</span><h1>Book your ride<span className="brand-period">.</span></h1><p>Pick your places, choose your ride, and we'll take it from here.</p></div>
      <form className="booking-layout" onSubmit={submit}>
        <section className="content-card trip-form">
          <div className="content-card-heading"><div><span className="eyebrow">YOUR JOURNEY</span><h2>Where are we headed?</h2></div></div>
          <Notice>{error}</Notice>
          <div className="form-grid">
            <Field label="Pick-up point" placeholder="Address or landmark" maxLength={180} value={form.pickupLocation} onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })} required />
            <Field label="Drop-off point" placeholder="Where to?" maxLength={180} value={form.dropLocation} onChange={(e) => setForm({ ...form, dropLocation: e.target.value })} required />
            <Field label="Estimated distance (km)" type="number" min="0.1" max="1000" step="0.1" value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: e.target.value })} required />
            <Field label="Pick-up time" type="datetime-local" min={toLocalDateTimeInput(new Date())} value={form.bookingDateTime} onChange={(e) => setForm({ ...form, bookingDateTime: e.target.value })} required />
          </div>
          <div className="content-card-heading ride-choice-heading"><div><span className="eyebrow">YOUR KIND OF RIDE</span><h2>Find your fit</h2></div></div>
          {loading ? <Spinner label="Finding available rides..." /> : cabs.length === 0 ? <EmptyState title="No rides available right now">Please check back soon or try another time.</EmptyState> : <>
            <SelectField label="Ride type" value={form.cabType} onChange={(e) => {
              const next = cabs.filter((cab) => cab.cabType === e.target.value);
              setForm({ ...form, cabType: e.target.value, cabId: String(next[0]?.id || "") });
            }}>
              {types.map((type) => <option key={type} value={type}>{type}</option>)}
            </SelectField>
            <div className="cab-options">{visibleCabs.map((cab) => (
              <button type="button" className={`cab-option ${form.cabId === String(cab.id) ? "selected" : ""}`} key={cab.id} onClick={() => setForm({ ...form, cabId: String(cab.id) })}>
                <span className="cab-option-icon">↗</span><span className="cab-option-info"><b>{cab.cabName}</b><small>{cab.cabType} · {cab.seatingCapacity} seats · {cab.driverName}</small></span><span className="cab-option-price">{currency.format(100 + Number(form.distanceKm || 0) * cab.pricePerKm)}<small>estimate</small></span>
              </button>
            ))}</div>
          </>}
        </section>
        <aside className="booking-summary">
          <span className="eyebrow">YOUR RIDE, YOUR WAY</span><h2>Looking good.</h2>
          <div className="summary-route"><span className="route-dot start" /><div><small>PICK-UP</small><b>{form.pickupLocation || "Your starting point"}</b></div></div>
          <div className="route-line" />
          <div className="summary-route"><span className="route-dot end" /><div><small>DROP-OFF</small><b>{form.dropLocation || "Your destination"}</b></div></div>
          <div className="summary-divider" />
          <div className="summary-row"><span>Your ride</span><b>{selectedCab?.cabName || "Choose a ride"}</b></div>
          <div className="summary-row"><span>Distance</span><b>{form.distanceKm || "0"} km</b></div>
          <div className="summary-row fare-row"><span>Estimated fare</span><b>{quoteLoading ? "Checking..." : quote ? currency.format(quote.estimatedFare) : "—"}</b></div>
          <p className="summary-note">Fare estimate from the server: base fare + distance × cab rate. The server recalculates the total when you book.</p>
          <Button type="submit" className="full-button" disabled={busy || loading || !cabs.length}>{busy ? "Confirming your ride..." : user ? "Confirm booking" : "Log in to book"} <span>↗</span></Button>
          {!user && <p className="summary-note">Already have an account? <Link to="/login">Log in here.</Link></p>}
        </aside>
      </form>
    </main>
  );
}

export function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      const { data } = await api.get("/bookings/my");
      setBookings(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function cancel(id) {
    if (!window.confirm("Cancel this ride?")) return;
    setError("");
    try {
      await api.patch(`/bookings/${id}/cancel`);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <main className="app-page">
      <div className="page-heading"><span className="eyebrow">YOUR TRAVEL STORY</span><h1>My rides<span className="brand-period">.</span></h1><p>Every trip, in one place. Here's to where you're going.</p></div>
      <Notice>{error}</Notice>
      {loading ? <Spinner label="Loading your rides..." /> : bookings.length
        ? <section className="content-card"><BookingTable bookings={bookings} onCancel={cancel} /></section>
        : <section className="content-card"><EmptyState title="No rides just yet" action="Find your first ride" to="/book">The next time you need to get somewhere, we've got you.</EmptyState></section>}
    </main>
  );
}

export function BookingConfirmation() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!id) {
      setError("We couldn't find that booking.");
      return;
    }
    api.get(`/bookings/${id}`)
      .then(({ data }) => setBooking(data))
      .catch((err) => setError(errorMessage(err)));
  }, [id]);

  if (error) return <main className="app-page"><Notice>{error}</Notice><Link className="button" to="/bookings">Back to rides</Link></main>;
  if (!booking) return <Spinner label="Loading booking details..." />;

  return <main className="app-page confirmation-page"><div className="confirmation-icon">✓</div><span className="eyebrow">ALL SET. LET'S GO.</span><h1>Your ride is <em>booked.</em></h1><p className="confirmation-lede">We've got the details sorted. Your driver and ride will be ready when you are.</p><div className="confirmation-card">
    <div className="confirmation-reference"><span>BOOKING REFERENCE</span><b>{booking.bookingReference}</b></div>
    <div className="confirmation-details"><div><small>FROM</small><b>{booking.pickupLocation}</b></div><span>↓</span><div><small>TO</small><b>{booking.dropLocation}</b></div></div>
    <div className="summary-row"><span>Ride</span><b>{booking.cabName} · {booking.cabType}</b></div>
    <div className="summary-row"><span>Driver</span><b>{booking.driverName}</b></div>
    <div className="summary-row"><span>When</span><b>{new Date(booking.bookingDateTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</b></div>
    <div className="summary-row fare-row"><span>Estimated fare</span><b>{currency.format(booking.estimatedFare)}</b></div>
  </div><div className="confirmation-actions"><Link className="button primary" to="/bookings">See my rides</Link><button className="button" onClick={() => navigate("/")}>Back home</button></div></main>;
}

export function BookingDetails() {
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const { id } = useParams();
  useEffect(() => {
    api.get(`/bookings/${id}`)
      .then(({ data }) => setBooking(data))
      .catch((err) => setError(errorMessage(err)));
  }, [id]);
  if (error) return <main className="app-page"><Notice>{error}</Notice></main>;
  if (!booking) return <Spinner label="Loading booking details..." />;
  return <main className="app-page"><div className="page-heading"><span className="eyebrow">{booking.bookingReference}</span><h1>Ride details<span className="brand-period">.</span></h1></div><section className="content-card"><div className="content-card-heading"><h2>{booking.pickupLocation} → {booking.dropLocation}</h2><span className="status">{booking.status.replaceAll("_", " ")}</span></div><p>{booking.cabName} with {booking.driverName}</p><p>{new Date(booking.bookingDateTime).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}</p><h3>{currency.format(booking.estimatedFare)}</h3><Link className="button" to="/bookings">Back to my rides</Link></section></main>;
}

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ fullName: user?.fullName || "", phone: user?.phone || "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      const { data } = await api.put("/auth/me", form);
      setUser(data);
      setSuccess("Your profile has been updated.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return <main className="app-page"><div className="page-heading"><span className="eyebrow">YOUR DETAILS</span><h1>My profile<span className="brand-period">.</span></h1><p>Keep your details up to date for smoother rides.</p></div><section className="content-card profile-card"><Notice>{error}</Notice><Notice kind="success">{success}</Notice><form className="auth-form" onSubmit={submit}><Field label="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required maxLength={100} /><Field label="Email address" type="email" value={user?.email || ""} readOnly /><Field label="Phone number" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /><Button type="submit" disabled={busy}>{busy ? "Saving..." : "Save changes"}</Button></form></section></main>;
}
