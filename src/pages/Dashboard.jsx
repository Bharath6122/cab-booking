import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../api";
import { useAuth } from "../context/AuthContext";
import { EmptyState, Notice, Spinner, StatusPill } from "../components/UI";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/bookings/my")
      .then(({ data }) => setBookings(data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const active = bookings.filter((booking) => ["PENDING", "CONFIRMED", "IN_PROGRESS"].includes(booking.status));
  const spent = bookings.filter((booking) => booking.status === "COMPLETED")
    .reduce((sum, booking) => sum + booking.estimatedFare, 0);

  return (
    <main className="app-page">
      <section className="dashboard-welcome"><div><span className="eyebrow">YOUR CABBY SPACE</span><h1>Hey, {user?.fullName?.split(" ")[0] || "there"}<span className="brand-period">.</span></h1><p>Here's what's happening with your rides.</p></div><Link className="button primary" to="/book">Book a ride <span>↗</span></Link></section>
      <Notice>{error}</Notice>
      {loading ? <Spinner label="Loading your dashboard..." /> : (
        <>
          <div className="metric-grid">
            <article className="metric-card metric-highlight"><span>UPCOMING RIDES</span><strong>{active.length.toString().padStart(2, "0")}</strong><small>Trips waiting for you</small><span className="metric-symbol">↗</span></article>
            <article className="metric-card"><span>COMPLETED RIDES</span><strong>{bookings.filter((b) => b.status === "COMPLETED").length.toString().padStart(2, "0")}</strong><small>Good places, good memories</small><span className="metric-symbol">✳</span></article>
            <article className="metric-card"><span>RIDE SPEND</span><strong>{currency.format(spent)}</strong><small>On completed trips</small><span className="metric-symbol">₹</span></article>
          </div>
          <section className="content-card">
            <div className="content-card-heading"><div><span className="eyebrow">THE LATEST</span><h2>Your recent rides</h2></div><Link className="text-link" to="/bookings">All rides <span>↗</span></Link></div>
            {bookings.length ? <BookingTable bookings={bookings.slice(0, 5)} /> : <EmptyState title="Your next ride is waiting" action="Book your first ride" to="/book">When you're ready to go, we'll be right here.</EmptyState>}
          </section>
        </>
      )}
    </main>
  );
}

export function BookingTable({ bookings, onCancel }) {
  return (
    <div className="table-scroll"><table className="data-table"><thead><tr><th>RIDE</th><th>DATE</th><th>VEHICLE</th><th>FARE</th><th>STATUS</th><th /></tr></thead><tbody>
      {bookings.map((booking) => <tr key={booking.id}>
        <td><b>{booking.pickupLocation}</b><span className="table-sub">to {booking.dropLocation}</span></td>
        <td>{new Date(booking.bookingDateTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
        <td>{booking.cabName}<span className="table-sub">{booking.driverName}</span></td>
        <td>{currency.format(booking.estimatedFare)}</td>
        <td><StatusPill status={booking.status} /></td>
        <td>{onCancel && ["PENDING", "CONFIRMED"].includes(booking.status) && <button className="table-action" onClick={() => onCancel(booking.id)}>Cancel</button>}</td>
      </tr>)}
    </tbody></table></div>
  );
}
