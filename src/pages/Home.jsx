import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errorMessage } from "../api";
import { useAuth } from "../context/AuthContext";
import { Field, Notice, Spinner } from "../components/UI";
import { toLocalDateTimeInput } from "../utils/date";

const rideCards = [
  { type: "MINI", name: "City Mini", description: "Smart rides for everyday plans.", icon: "↗", capacity: "3 seats", accent: "card-green" },
  { type: "SEDAN", name: "Comfort Sedan", description: "A little more room. A lot more ease.", icon: "◒", capacity: "4 seats", accent: "card-white" },
  { type: "SUV", name: "Group SUV", description: "Room for your people and your bags.", icon: "⌁", capacity: "6 seats", accent: "card-yellow" },
  { type: "PREMIUM", name: "Premium", description: "Make the journey feel like an occasion.", icon: "✳", capacity: "4 seats", accent: "card-dark" },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ pickupLocation: "", dropLocation: "", distanceKm: "10", bookingDateTime: "" });
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/cabs/available")
      .then(({ data }) => setTypes([...new Set(data.map((cab) => cab.cabType))]))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  function search(event) {
    event.preventDefault();
    const query = new URLSearchParams(Object.entries(form).filter(([, value]) => value));
    navigate(`/book?${query}`);
  }

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> YOUR CITY, YOUR WAY</span>
          <h1>Good rides.<br /><span>Good days.</span></h1>
          <p>Wherever you're headed, get there with a little more comfort and a lot less hassle.</p>
          <div className="hero-links"><a href="#rides">Explore our rides <span>↓</span></a><span>✦ &nbsp;Always a better way</span></div>
          <div className="hero-stats"><div><strong>04</strong><small>RIDE TYPES</small></div><i /><div><strong>01</strong><small>SERVER FARE QUOTE</small></div><i /><div><strong>YOU</strong><small>PICK YOUR TIME</small></div></div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="sun-disc" /><div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="hero-note note-top"><span>✳</span><div><b>Take the scenic route</b><small>We'll get you there</small></div></div>
          <div className="hero-car"><div className="car-window" /><div className="car-door" /><span className="wheel wheel-left" /><span className="wheel wheel-right" /><span className="car-spark">✦</span></div>
          <div className="hero-note note-bottom"><span className="note-pin">↗</span><div><b>Made for the moment</b><small>Your city is waiting</small></div></div>
          <span className="art-caption">01 / THE EVERYDAY ESCAPE</span>
        </div>
      </section>

      <section id="book" className="booking-wrap">
        <form className="booking-card" onSubmit={search}>
          <div className="booking-heading"><div><span className="eyebrow">LET'S GET YOU THERE</span><h2>Where to next?</h2></div><span className="booking-icon">↗</span></div>
          <Notice>{error}</Notice>
          <div className="booking-fields">
            <Field label="Pick-up point" placeholder="Where should we meet you?" value={form.pickupLocation} onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })} required maxLength={180} />
            <Field label="Drop-off point" placeholder="Where are you heading?" value={form.dropLocation} onChange={(e) => setForm({ ...form, dropLocation: e.target.value })} required maxLength={180} />
            <Field label="Distance (km)" type="number" min="0.1" max="1000" step="0.1" value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: e.target.value })} required />
            <Field label="When" type="datetime-local" value={form.bookingDateTime} min={toLocalDateTimeInput(new Date())} onChange={(e) => setForm({ ...form, bookingDateTime: e.target.value })} required />
          </div>
          {loading ? <Spinner label="Checking available rides..." /> : (
            <div className="booking-submit"><span>{types.length ? `${types.length} ride ${types.length === 1 ? "type" : "types"} ready to go` : "Check back soon for available rides"}</span><button className="button primary" type="submit" disabled={!types.length}>Find my ride <span>↗</span></button></div>
          )}
          {!user && <p className="form-footnote">You'll be asked to log in before confirming your ride.</p>}
        </form>
      </section>

      <section className="trust-row"><span>GOOD PEOPLE. BETTER RIDES.</span><div><span>✳ &nbsp;Book in a few taps</span><span>✳ &nbsp;Upfront fare estimate</span><span>✳ &nbsp;Your ride, your time</span></div></section>

      <section id="rides" className="section rides-section">
        <div className="section-heading"><div><span className="eyebrow">FIND YOUR FIT</span><h2>A ride for every kind<br />of <em>day.</em></h2></div><p>Solo errands, big plans, or somewhere in between. There's a seat with your name on it.</p></div>
        <div className="ride-grid">
          {rideCards.map((ride, index) => (
            <article key={ride.type} className={`ride-card ${ride.accent}`}>
              <div className="ride-card-top"><span>0{index + 1} / 04</span><span>{ride.icon}</span></div>
              <div className="ride-illustration"><div className="mini-car"><i /><b /><b /></div><span className="illustration-star">✳</span></div>
              <div className="ride-info"><div><h3>{ride.name}</h3><span>{ride.capacity}</span></div><p>{ride.description}</p><Link to={user ? "/book" : "/register"}>Choose this ride <span>↗</span></Link></div>
            </article>
          ))}
        </div>
      </section>

      <section className="how-section">
        <div className="how-intro"><span className="eyebrow">THE GOOD PART IS, IT'S SIMPLE</span><h2>Three steps.<br />Then <em>you're off.</em></h2></div>
        <div className="steps">
          <article><span>01</span><div className="step-icon">⌖</div><h3>Pick your places</h3><p>Tell us where you're starting and where you're going. The rest is on us.</p></article>
          <article><span>02</span><div className="step-icon">✳</div><h3>Find your ride</h3><p>See available cars, meet your driver, and know your estimated fare before you go.</p></article>
          <article><span>03</span><div className="step-icon">↗</div><h3>Enjoy the way</h3><p>Settle in, take a breath, and let someone else handle the getting-there part.</p></article>
        </div>
      </section>

      <section className="cta-section"><div className="cta-art" aria-hidden="true"><div className="cta-circle">✳</div><span>YOUR NEXT<br />GOOD DAY</span></div><div><span className="eyebrow">THE CITY IS CALLING</span><h2>Let's make a<br /><em>little day of it.</em></h2><p>Your next ride is closer than you think.</p><Link className="button dark-button" to={user ? "/book" : "/register"}>Let's go <span>↗</span></Link></div></section>
    </main>
  );
}
